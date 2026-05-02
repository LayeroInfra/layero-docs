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

echo "Done. https://docs.layero.ru/"
