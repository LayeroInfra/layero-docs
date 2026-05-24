#!/usr/bin/env bash
# Layero docs → s3://layero-docs/ + YC CDN purge.
# Аналог frontend/landing/deploy.sh, но рекурсивная синхронизация (Docusaurus build).
set -euo pipefail

cd "$(dirname "$0")"

BUCKET="${BUCKET:-layero-docs}"
BUILD_DIR="${BUILD_DIR:-build}"

CDN_RESOURCE_ID="${CDN_RESOURCE_ID:-$(yc cdn resource list --format json 2>/dev/null \
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
    *.txt|*.map) echo "text/plain; charset=utf-8" ;;
    *)      echo "application/octet-stream" ;;
  esac
}

cache_control() {
  case "$1" in
    *.html|*.xml) echo "no-cache" ;;
    assets/*) echo "public, max-age=31536000, immutable" ;;
    *)        echo "public, max-age=3600" ;;
  esac
}

echo "==> Uploading $BUILD_DIR to s3://$BUCKET/"
cd "$BUILD_DIR"
find . -type f | while read -r path; do
  key="${path#./}"
  ct=$(content_type "$key")
  cc=$(cache_control "$key")
  yc storage s3 cp "$key" "s3://$BUCKET/$key" \
    --content-type "$ct" \
    --cache-control "$cc" >/dev/null
  echo "  $key  ($ct)"
done
cd - >/dev/null

if [[ -n "$CDN_RESOURCE_ID" ]]; then
  echo "==> Purging CDN cache (resource $CDN_RESOURCE_ID)"
  yc cdn cache purge --resource-id "$CDN_RESOURCE_ID" --path '/*' >/dev/null || true
else
  echo "==> CDN resource not found yet — skipping cache purge (first deploy?)"
fi

# IndexNow — мгновенное уведомление Яндекса и Bing об обновлённых URL.
# Shared key между layero.ru и docs.layero.ru. Key-файл лежит в static/ и
# копируется в build/ самим Docusaurus, поэтому отдельно его загружать не надо.
# Ошибки игнорируем — внешний сервис не должен ронять деплой.
INDEXNOW_KEY="305edf9b810aa739d9d8f7f022d960b2"
echo "==> Pinging IndexNow (Yandex + Bing)"
python3 - <<PY || true
import json, re, urllib.request, urllib.error
key  = "${INDEXNOW_KEY}"
host = "docs.layero.ru"
sitemap = open("${BUILD_DIR}/sitemap.xml", encoding="utf-8").read()
urls = re.findall(r"<loc>([^<]+)</loc>", sitemap)
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
