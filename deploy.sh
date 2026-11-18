#!/usr/bin/env bash
# Layero docs → bucket layero-docs in Selectel ru-6 (since 14.10, T-20261013-6; YC with CDN before).
# Аналог frontend/landing/deploy.sh, но рекурсивная синхронизация (Docusaurus build).
set -euo pipefail

cd "$(dirname "$0")"

BUCKET="${BUCKET:-layero-docs}"

BUILD_DIR="${BUILD_DIR:-build}"


if [[ ! -d "$BUILD_DIR" ]]; then
  echo "==> Building Docusaurus (locales: ru + en)"
  npm ci
  npm run build
fi

content_type() {
  case "$1" in
    *.html) echo "text/html; charset=utf-8" ;;
    *.css)  echo "text/css; charset=utf-8" ;;
    *.js|*.mjs) echo "application/javascript; charset=utf-8" ;;
    *.json) echo "application/json" ;;
    *.svg)  echo "image/svg+xml" ;;
    *.png)  echo "image/png" ;;
    *.jpg|*.jpeg) echo "image/jpeg" ;;
    *.webp) echo "image/webp" ;;
    *.ico)  echo "image/x-icon" ;;
    *.woff) echo "font/woff" ;;
    *.woff2) echo "font/woff2" ;;
    *.xml)  echo "application/xml" ;;
    *.md)   echo "text/markdown; charset=utf-8" ;;
    *.txt|*.map) echo "text/plain; charset=utf-8" ;;
    *)      echo "application/octet-stream" ;;
  esac
}

cache_control() {
  case "$1" in
    *.html|*.xml|*.md|*.txt) echo "no-cache" ;;
    assets/*) echo "public, max-age=31536000, immutable" ;;
    *)        echo "public, max-age=3600" ;;
  esac
}

# llms.txt собирается из УЖЕ СОБРАННОГО сайта, отдельно для каждой локали.
# Статическим файлом это сделать нельзя: Docusaurus копирует static/ в сборку
# каждой локали, и один и тот же текст оказывается и на /llms.txt, и на
# /en/llms.txt. Ровно так 28.07 русский файл попал на английский адрес.
echo "==> Generating llms.txt (ru + en)"
python3 scripts/gen-llms.py --build "$BUILD_DIR"

# Каждая страница — ещё и как Markdown по тому же адресу с `.md` на конце
# (`/cli/agents.md`), плюс sitemap.md со списком страниц. Это для агентов:
# HTML страницы весит сотни килобайт, исходник — единицы. Тоже из УЖЕ
# СОБРАННОГО: маршрут сверяется с index.html, чтобы не отдавать текст
# страницы, которой на сайте нет.
echo "==> Exporting pages as Markdown (ru + en)"
python3 scripts/export-md.py --build "$BUILD_DIR"

# Идентификатор сборки уезжает вместе с ней: по нему проверка ПОСЛЕ выкатки
# отличает «сайт жив» от «выложено то, что мы собрали». Без него шаг Verify
# зеленел на прежнем содержимом.
BUILD_ID="${BUILD_ID:-$(git rev-parse --short HEAD 2>/dev/null || date -u +%Y%m%dT%H%M%SZ)}"
printf '%s\n' "$BUILD_ID" > "$BUILD_DIR/build-id.txt"

# shellcheck source=scripts/selectel-publish.sh
source "$(dirname "${BASH_SOURCE[0]}")/scripts/selectel-publish.sh"

selectel_enabled || { echo "✘ SELECTEL_S3_ACCESS_KEY/SELECTEL_S3_SECRET_KEY не заданы — выкладывать некуда" >&2; exit 1; }
# ── Заливка ──────────────────────────────────────────────────────────────────
#
# До 18.11.2026 здесь по одному, подряд перезаливались ВСЕ файлы сборки
# (663 штуки) — заливка занимала 4–11 минут из 15 у всей выкатки, при том что
# сборка шла 30 секунд. Теперь:
#
#  1. Сверка с бакетом. ETag объекта, залитого одним PUT, — это MD5 тела
#     (проверено на docs.layero.ru). Совпал с MD5 локального файла — файл уже
#     лежит байт в байт, повторно не шлём. Список получить не вышло — шлём всё:
#     пропустить файл можно только по доказательству, что он на месте.
#  2. Параллельно: UPLOAD_JOBS запросов разом (по умолчанию 8).
#  3. Порядок: сначала всё, кроме страниц, потом страницы, build-id.txt —
#     последним. Новая страница не должна попасть к читателю раньше скриптов
#     и картинок, на которые ссылается, а Verify смотрит на build-id.txt.
#
# ⚠️ Сверка смотрит только на содержимое. Если поменялись правила
# content_type/cache_control выше, неизменённые файлы останутся со старыми
# заголовками — тогда FORCE_FULL_UPLOAD=1 перезальёт всё.
UPLOAD_JOBS="${UPLOAD_JOBS:-8}"
FORCE_FULL_UPLOAD="${FORCE_FULL_UPLOAD:-0}"

remote_etags="$(mktemp)"
if [[ "$FORCE_FULL_UPLOAD" == 1 ]]; then
  echo "==> FORCE_FULL_UPLOAD=1 — заливаю все файлы"
  : > "$remote_etags"
elif selectel_list_etags "$BUCKET" > "$remote_etags"; then
  echo "==> В бакете объектов: $(wc -l < "$remote_etags" | tr -d ' ')"
else
  echo "==> Список бакета не получен — заливаю все файлы"
  : > "$remote_etags"
fi

assets_list="$(mktemp)"; pages_list="$(mktemp)"
# Печатает план, а в файлы кладёт ключи через NUL: сначала ассеты, затем страницы.
BUILD_DIR="$BUILD_DIR" REMOTE="$remote_etags" ASSETS="$assets_list" PAGES="$pages_list" python3 - <<'PY'
import hashlib, os
build, remote_path = os.environ["BUILD_DIR"], os.environ["REMOTE"]
remote = {}
with open(remote_path, encoding="utf-8") as f:
    for line in f:
        key, _, etag = line.rstrip("\n").partition("\t")
        remote[key] = etag
PAGE_EXT = (".html", ".xml", ".md", ".txt")
assets, pages, same = [], [], 0
for root, _, files in os.walk(build):
    for name in files:
        path = os.path.join(root, name)
        key = os.path.relpath(path, build).replace(os.sep, "/")
        if key == "build-id.txt":
            continue  # всегда, последним — отдельно
        with open(path, "rb") as fh:
            md5 = hashlib.md5(fh.read()).hexdigest()
        if remote.get(key) == md5:
            same += 1
            continue
        (pages if key.endswith(PAGE_EXT) else assets).append(key)
for out, keys in ((os.environ["ASSETS"], assets), (os.environ["PAGES"], pages)):
    with open(out, "wb") as fh:
        fh.write(b"".join(k.encode() + b"\0" for k in sorted(keys)))
print(f"==> План: ассетов {len(assets)}, страниц {len(pages)}, без изменений {same}")
PY

upload_one() {
  selectel_put "$1" "$BUCKET" "$1" "$(content_type "$1")" "$(cache_control "$1")"
}
export -f upload_one selectel_put selectel_enabled _selectel_path _selectel_curl content_type cache_control
export BUCKET SELECTEL_S3_ENDPOINT SELECTEL_S3_ACCESS_KEY SELECTEL_S3_SECRET_KEY SELECTEL_OUTCOMES

echo "==> Заливаю в Selectel: $BUCKET (параллельно: $UPLOAD_JOBS)"
upload_started=$(date +%s)
cd "$BUILD_DIR"
for list in "$assets_list" "$pages_list"; do
  if [[ -s "$list" ]]; then
    xargs -0 -n 1 -P "$UPLOAD_JOBS" bash -c 'upload_one "$1"' _ < "$list"
  fi
done
upload_one build-id.txt
cd - >/dev/null
rm -f "$remote_etags" "$assets_list" "$pages_list"

uploaded=$(grep -c '^ok$' "$SELECTEL_OUTCOMES" || true)
failed=$(grep -c '^fail$' "$SELECTEL_OUTCOMES" || true)
echo "==> Выложено файлов: $uploaded, отказов: $failed, за $(( $(date +%s) - upload_started )) с"
if (( failed > 0 )); then
  echo "✘ выкатка НЕ состоялась: $failed файлов не залилось (см. выше)." >&2
  exit 1
fi
if (( uploaded == 0 )); then
  echo "✘ не залито ни одного файла — даже build-id.txt?" >&2
  exit 1
fi

# Доказательство, не обещание: читаем обратно то, что только что положили.
# Любая проверка выше опирается на поведение чужой утилиты; эта — на факт.
echo "==> Сверяю выложенное: build-id.txt"
probe=$(mktemp)
_selectel_curl -o "$probe" "$SELECTEL_S3_ENDPOINT/$BUCKET/build-id.txt" 2>/dev/null || true
if [[ "$(tr -d '[:space:]' < "$probe")" != "$BUILD_ID" ]]; then
  echo "✘ в бакете НЕ эта сборка: ждали $BUILD_ID, лежит «$(tr -d '[:space:]' < "$probe")»" >&2
  rm -f "$probe"
  exit 1
fi
rm -f "$probe"

# IndexNow — мгновенное уведомление Яндекса и Bing об обновлённых URL.
# Shared key между layero.ru и docs.layero.ru. Key-файл лежит в static/ и
# копируется в build/ самим Docusaurus, поэтому отдельно его загружать не надо.
# Ошибки игнорируем — внешний сервис не должен ронять деплой.
INDEXNOW_KEY="305edf9b810aa739d9d8f7f022d960b2"
echo "==> Pinging IndexNow (Yandex + Bing)"
# 🚨 Разделитель В КАВЫЧКАХ, а ключ — переменной окружения. Без кавычек
# оболочка разбирает ТЕЛО скрипта Python: обратные кавычки в комментарии
# (`lat > cyr`) исполнялись как команда, печатали «lat: command not found» и
# оставляли в корне репозитория пустой файл `cyr` — на каждой выкатке.
INDEXNOW_KEY="$INDEXNOW_KEY" BUILD_DIR="$BUILD_DIR" python3 - <<'PY' || true
import json, os, re, urllib.parse, urllib.request, urllib.error
key  = os.environ["INDEXNOW_KEY"]
host = "docs.layero.ru"
# Docusaurus с i18n кладёт ОТДЕЛЬНЫЙ sitemap в каждую локаль: build/sitemap.xml
# (ru) и build/en/sitemap.xml. Долгое время отправлялся только первый, и
# 56 английских страниц не попадали в IndexNow вообще — при том, что именно
# английская документация нужна международным краулерам.
#
# НО: локаль en переведена частично. Docusaurus для непереведённой страницы
# отдаёт русский текст по английскому адресу (штатный fallback). Пушить такое
# в IndexNow нельзя: IndexNow — это заявка «страница готова, приходите», а мы
# заявляли бы дубль русской страницы с заголовком hreflang=en-US. Поэтому
# английские адреса фильтруются по фактическому языку СОБРАННОГО html.
# Проверка самонастраивающаяся: по мере перевода страницы начинают попадать
# в пуш сами, без правки этого скрипта.
BUILD = os.environ["BUILD_DIR"]

def is_english(url: str) -> bool:
    # Адрес из карты сайта процентно-закодирован, а файл на диске лежит с
    # именем в UTF-8: страницы разделов зовутся /en/category/тарифы-и-оплата.
    # Без unquote os.path.exists не находил их, и ВСЕ ШЕСТЬ английских
    # страниц-разделов молча выпадали из пуша — при этом лог называл их
    # «непереведёнными». Именно эти страницы краулеры используют как хабы.
    rel = urllib.parse.unquote(url.replace("https://docs.layero.ru/", "")).strip("/")
    for candidate in (os.path.join(BUILD, rel, "index.html"),
                      os.path.join(BUILD, rel + ".html")):
        if os.path.exists(candidate):
            html = open(candidate, encoding="utf-8", errors="ignore").read()
            m = re.search(r"<article.*?</article>", html, re.S)
            text = re.sub(r"<[^>]+>", " ", m.group(0) if m else "")
            cyr = sum(1 for c in text if "а" <= c.lower() <= "я")
            lat = sum(1 for c in text if "a" <= c.lower() <= "z")
            # Критерий — «страница НЕ русская», а не «латиницы больше».
            # Прежнее `lat > cyr` на служебных страницах без <article>
            # (/en/search, /en/blog/archive, /en/blog/authors) давало 0 > 0,
            # то есть «ложь», и они тоже выпадали из пуша.
            return cyr <= lat
    return False  # файла нет — не рискуем

urls = []
for rel in ("sitemap.xml", "en/sitemap.xml"):
    path = os.path.join(BUILD, rel)
    if not os.path.exists(path):
        print(f"  WARN: {path} отсутствует — локаль пропущена")
        continue
    found = re.findall(r"<loc>([^<]+)</loc>", open(path, encoding="utf-8").read())
    if rel.startswith("en/"):
        kept = [u for u in found if is_english(u)]
        # Исключённые печатаем поимённо. Прежняя строка называла их
        # «непереведёнными», ничего не проверяя, — и десять адресов, из них
        # шесть страниц-разделов, годами выпадали под правдоподобной подписью.
        dropped = [u for u in found if u not in set(kept)]
        print(f"  {rel}: {len(kept)} из {len(found)} URL")
        for u in dropped:
            print(f"    не отправлен: {urllib.parse.unquote(u)}")
        found = kept
    else:
        print(f"  {rel}: {len(found)} URL")
    urls.extend(found)
urls = list(dict.fromkeys(urls))
payload = json.dumps({
    "host": host,
    "key": key,
    "keyLocation": f"https://{host}/{key}.txt",
    "urlList": urls,
}).encode("utf-8")
for endpoint in ("https://api.indexnow.org/IndexNow", "https://yandex.com/indexnow"):
    req = urllib.request.Request(
        endpoint, data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        r = urllib.request.urlopen(req, timeout=15)
        print(f"  {endpoint}: HTTP {r.status} ({len(urls)} URLs)")
    except urllib.error.HTTPError as e:
        print(f"  {endpoint}: HTTP {e.code} {e.reason}")
    except Exception as e:
        print(f"  {endpoint}: {type(e).__name__}: {e}")
PY

echo "Done. https://docs.layero.ru/"

selectel_report >/dev/null || true   # счёт уже сверен выше; здесь только убираем временный файл
