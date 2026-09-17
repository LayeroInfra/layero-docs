#!/usr/bin/env bash
# Layero docs → s3://layero-docs/ + YC CDN purge.
# Аналог frontend/landing/deploy.sh, но рекурсивная синхронизация (Docusaurus build).
set -euo pipefail

cd "$(dirname "$0")"

BUCKET="${BUCKET:-layero-docs}"

# 🚨 ПРОФИЛЬ `yc` ПЕРЕДАЁТСЯ ЯВНО, и это не украшение. Раннеры всех
# репозиториев живут на одной VM под пользователем `layero`, то есть делят
# `$HOME` и список профилей: активный профиль в момент заливки мог поставить
# сосед. Workflow заводит отдельный `ci-docs` ровно поэтому — а скрипт до
# 18.08 звал `yc` без `--profile` и уходил под чужой личностью.
#
# Цена промаха измерена: 18.08 весь накопленный backlog пошёл разом на один
# узел, каждый PutObject ответил 403 AccessDenied, и выкатка отчиталась
# УСПЕХОМ, не выложив ни одного файла.
# ⚠️ `if`, а не `&&`: под `set -e` ложное условие последней команды роняет
# скрипт целиком — то есть локальный запуск без YC_PROFILE падал бы на ровном
# месте. И раскрытие через `${a[@]+…}`: на bash 3.2 пустой массив под `set -u`
# это «unbound variable».
YC_PROFILE="${YC_PROFILE:-}"
yc_args=()
if [[ -n "$YC_PROFILE" ]]; then
  yc_args=(--profile "$YC_PROFILE")
fi
yc_() { yc ${yc_args[@]+"${yc_args[@]}"} "$@"; }
BUILD_DIR="${BUILD_DIR:-build}"

CDN_RESOURCE_ID="${CDN_RESOURCE_ID:-$(yc_ cdn resource list --format json 2>/dev/null \
  | python3 -c "import json,sys; print(next((r['id'] for r in json.load(sys.stdin) if r.get('cname')=='docs.layero.ru'), ''))" 2>/dev/null || true)}"

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

echo "==> Uploading $BUILD_DIR to s3://$BUCKET/ (профиль: ${YC_PROFILE:-активный})"
cd "$BUILD_DIR"
failed=0
uploaded=0
# 🚨 Без конвейера: `find | while` уводит тело в подоболочку, и счётчик отказов
# оттуда не возвращается — ровно поэтому 403 на каждом файле оставался
# незамеченным, а выкатка зеленела.
while IFS= read -r -d '' path; do
  key="${path#./}"
  ct=$(content_type "$key")
  cc=$(cache_control "$key")
  # 🚨 КОД ВОЗВРАТА `yc storage s3 cp` ВРАТЬ УМЕЕТ. Проверено мутацией
  # 18.08: заливка в несуществующий бакет печатает «upload failed … NoSuchBucket»
  # и выходит с НУЛЁМ. То есть проверка «if yc …; then» ловит ровно ничего —
  # ровно поэтому 403 на каждом файле и оставался незамеченным. Судим по
  # выводу, а не по коду.
  out=$(yc_ storage s3 cp "$key" "s3://$BUCKET/$key" \
          --content-type "$ct" --cache-control "$cc" 2>&1) || true
  # ⚠️ Судим по ПОЛОЖИТЕЛЬНОМУ признаку: успешная заливка печатает
  # «upload: <файл> to s3://…». Чёрный список слов («error», «denied») здесь
  # не годится — путь `errors/index.html` попал бы в отказы, будучи залитым.
  case "$out" in
    upload:*) uploaded=$((uploaded + 1)) ;;
    *)  failed=$((failed + 1))
        echo "  ✘ $key: $(printf '%s' "$out" | head -1)" >&2 ;;
  esac
done < <(find . -type f -print0)
cd - >/dev/null

echo "==> Выложено файлов: $uploaded, отказов: $failed"
if (( failed > 0 )); then
  echo "✘ выкатка НЕ состоялась: $failed файлов не залилось (см. выше)." >&2
  echo "  Частая причина — чужой профиль yc: передайте YC_PROFILE." >&2
  exit 1
fi
if (( uploaded == 0 )); then
  echo "✘ не залито ни одного файла — сборки нет?" >&2
  exit 1
fi

# Доказательство, не обещание: читаем обратно то, что только что положили.
# Любая проверка выше опирается на поведение чужой утилиты; эта — на факт.
echo "==> Сверяю выложенное: build-id.txt"
probe=$(mktemp)
yc_ storage s3 cp "s3://$BUCKET/build-id.txt" "$probe" >/dev/null 2>&1 || true
if [[ "$(tr -d '[:space:]' < "$probe")" != "$BUILD_ID" ]]; then
  echo "✘ в бакете НЕ эта сборка: ждали $BUILD_ID, лежит «$(tr -d '[:space:]' < "$probe")»" >&2
  rm -f "$probe"
  exit 1
fi
rm -f "$probe"

if [[ -n "$CDN_RESOURCE_ID" ]]; then
  echo "==> Purging CDN cache (resource $CDN_RESOURCE_ID)"
  yc_ cdn cache purge --resource-id "$CDN_RESOURCE_ID" --path '/*' >/dev/null || true
else
  echo "==> CDN resource not found yet — skipping cache purge (first deploy?)"
fi

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
