# Second publish target: the same file under the same key and headers in Selectel ru-6.
# Sourced by deploy.sh. Does nothing without SELECTEL_S3_ACCESS_KEY, so a runner
# that has no key publishes exactly as before.
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

# Call last: the first target is already live, so a failure here must be seen, not swallowed.
selectel_report() {
  selectel_enabled || { echo "==> Selectel: ключа нет, вторая точка публикации пропущена"; return 0; }
  local sent failed
  sent=$(grep -c '^ok$' "$SELECTEL_OUTCOMES" || true); failed=$(grep -c '^fail$' "$SELECTEL_OUTCOMES" || true)
  rm -f "$SELECTEL_OUTCOMES"
  echo "==> Selectel: выложено $sent, отказов $failed"
  [ "$failed" -eq 0 ] && [ "$sent" -gt 0 ]
}
