# Publish target: Selectel ru-6, the only one since 14.10 (T-20261013-6; YC was the first
# target until then). Sourced by deploy.sh, which refuses to run without the key.
#
# curl signs the request itself (--aws-sigv4): the CI runner has no S3 client.
SELECTEL_S3_ENDPOINT="${SELECTEL_S3_ENDPOINT:-https://s3.ru-6.storage.selcloud.ru}"
# Outcomes go to a file, not to shell variables: one of the callers uploads from
# a `find | while` pipeline, whose body runs in a subshell and loses counters.
SELECTEL_OUTCOMES="$(mktemp)"

selectel_enabled() { [ -n "${SELECTEL_S3_ACCESS_KEY:-}" ] && [ -n "${SELECTEL_S3_SECRET_KEY:-}" ]; }

# The key is percent-encoded once, here; curl signs the path it is given.
# python3 is on every runner (the build itself needs it for llms.txt and checks).
_selectel_path() { python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe="/-_.~"))' "$1"; }

_selectel_curl() {
  curl -sS --fail-with-body --retry 4 --retry-all-errors --max-time 120 \
    --aws-sigv4 "aws:amz:ru-6:s3" --user "$SELECTEL_S3_ACCESS_KEY:$SELECTEL_S3_SECRET_KEY" "$@"
}

# selectel_put <file> <bucket> <key> <content-type> <cache-control>
selectel_put() {
  selectel_enabled || return 0
  if _selectel_curl -o /dev/null -T "$1" -H "Content-Type: $4" -H "Cache-Control: $5" \
       "$SELECTEL_S3_ENDPOINT/$2/$(_selectel_path "$3")" 2>/tmp/selectel-publish.err; then
    echo ok >> "$SELECTEL_OUTCOMES"
  else
    echo "  ✗ Selectel: $3: $(head -c 200 /tmp/selectel-publish.err)" >&2; echo fail >> "$SELECTEL_OUTCOMES"
  fi
}

# selectel_rm <bucket> <key>
selectel_rm() {
  selectel_enabled || return 0
  _selectel_curl -o /dev/null -X DELETE "$SELECTEL_S3_ENDPOINT/$1/$(_selectel_path "$2")" 2>/dev/null || echo "    (Selectel: rm $2 не прошёл)"
}

# selectel_list <bucket> [prefix] [delimiter] -> one key per line, common prefixes as "prefix:<p>"
selectel_list() {
  local token="" page
  while :; do
    page="$(_selectel_curl -G "$SELECTEL_S3_ENDPOINT/$1" --data-urlencode "list-type=2" \
            --data-urlencode "prefix=${2:-}" ${3:+--data-urlencode "delimiter=$3"} \
            ${token:+--data-urlencode "continuation-token=$token"})" || return 1
    page="$(printf '%s' "$page" | python3 -c '
import sys, xml.etree.ElementTree as E
r = E.fromstring(sys.stdin.read()); n = "{http://s3.amazonaws.com/doc/2006-03-01/}"
for c in r.findall(n + "Contents"): print(c.find(n + "Key").text)
for c in r.findall(n + "CommonPrefixes"): print("prefix:" + c.find(n + "Prefix").text)
t = r.findtext(n + "NextContinuationToken") if r.findtext(n + "IsTruncated") == "true" else ""
print("token:" + (t or ""))')" || return 1
    printf '%s\n' "$page" | grep -v '^token:' || true
    token="$(printf '%s\n' "$page" | sed -n 's/^token://p')"
    [ -n "$token" ] || break
  done
}

# Call last: a failure here must be seen, not swallowed.
selectel_report() {
  selectel_enabled || { echo "==> Selectel: ключа нет — публиковать некуда" >&2; return 1; }
  local sent failed
  sent=$(grep -c '^ok$' "$SELECTEL_OUTCOMES" || true); failed=$(grep -c '^fail$' "$SELECTEL_OUTCOMES" || true)
  rm -f "$SELECTEL_OUTCOMES"
  echo "==> Selectel: выложено $sent, отказов $failed"
  [ "$failed" -eq 0 ] && [ "$sent" -gt 0 ]
}
