#!/bin/sh
# Optional synthetic ledger check. Maintainers run it before release; adopters may skip.
# Requires: git, a POSIX shell, and sha256sum, shasum, or openssl.
# Does not require Node.js, Python, gh, or a network.
#
# On Windows, run this same file with Git Bash or WSL (Git for Windows).
# Optional native Windows shell: scripts/ledger-smoke.ps1
#
# The script writes a temporary ledger, commits it, and clones with
# core.autocrlf=true. It checks the sample receipt, handoff bytes,
# history SHA-256, and the single-writer lock shape documented in
# r2/WIRE.md and r2/ONBOARDING.md. It then builds a synthetic Minimal
# ledger in the current documented shape (attributes and handoff only)
# and requires docs/PROTOCOL.md to byte-match toolkit PROTOCOL.md.
# It does not create a remote.
# This is not a CI adopter gate. Node.js is not required.

set -eu

work=
hooks=
emptycfg=

die() {
  printf '%s\n' "ledger-smoke: $*" >&2
  exit 1
}

on_exit() {
  rc=$1
  if [ -n "$work" ]; then
    if [ "$rc" -ne 0 ] || [ "${SMOKE_KEEP:-}" = "1" ]; then
      printf '%s\n' "ledger-smoke: kept $work" >&2
    else
      rm -rf "$work"
    fi
  fi
  exit "$rc"
}
trap 'on_exit $?' EXIT

hash_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  elif command -v openssl >/dev/null 2>&1; then
    openssl dgst -sha256 "$1" | awk '{print $NF}'
  else
    die "need sha256sum, shasum, or openssl"
  fi
}

json_string() {
  # $1 file, $2 key. Values written by this script contain no quotes.
  sed -n "s/.*\"$2\": \"\\([^\"]*\\)\".*/\\1/p" "$1" | awk 'NR==1 { print; exit }'
}

is_sha256() {
  printf '%s\n' "$1" | awk 'BEGIN { ok = 0 } /^[a-f0-9]{64}$/ { ok = 1 } END { exit ok ? 0 : 1 }'
}

# 0 when ledger/docs/PROTOCOL.md is a byte copy of toolkit PROTOCOL.md.
# A missing file and a paraphrase both fail. Not a Node check.
protocol_bytes_match() {
  ledger=$1
  [ -f "$ledger/docs/PROTOCOL.md" ] || return 1
  cmp -s "$toolkit/PROTOCOL.md" "$ledger/docs/PROTOCOL.md"
}

command -v git >/dev/null 2>&1 || die "git is required"
command -v mktemp >/dev/null 2>&1 || die "mktemp is required"

script_dir=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
toolkit=$(CDPATH= cd -- "$script_dir/.." && pwd)
[ -f "$toolkit/.gitattributes" ] || die "missing $toolkit/.gitattributes"
[ -f "$toolkit/PROTOCOL.md" ] || die "missing $toolkit/PROTOCOL.md"

work=$(mktemp -d "${TMPDIR:-/tmp}/ledger-smoke.XXXXXX")
hooks=$work/empty-hooks
emptycfg=$work/empty-gitconfig
ledger=$work/ledger
clone=$work/clone
project=$ledger/projects/smoke-project
v2=$project/coordination-v2
handoff=$work/handoff.md
mkdir -m 700 "$hooks"
: > "$emptycfg"

export GIT_CONFIG_NOSYSTEM=1
export GIT_CONFIG_GLOBAL=$emptycfg

gitc() {
  git \
    -c "core.hooksPath=$hooks" \
    -c "core.excludesFile=$emptycfg" \
    -c init.defaultBranch=main \
    -c core.autocrlf=true \
    -c protocol.file.allow=always \
    -c user.name='Synthetic Smoke' \
    -c user.email=smoke@invalid \
    -c commit.gpgsign=false \
    "$@"
}

umask 077
mkdir -m 700 "$ledger"
mkdir -m 700 -p "$project/history" "$project/receipts" "$v2"
cp "$toolkit/.gitattributes" "$ledger/.gitattributes"

{
  printf '%s\n' \
    '# Synthetic smoke handoff' \
    'Project goal: exercise the local ledger file protocol without a language runtime.' \
    'Verified work: none; this file is synthetic.' \
    'Reported but unverified: none.' \
    'Open questions: none.' \
    'Next authorized task: none; smoke only.' \
    'Unresolved ownership: none.' \
    'Source reference: SHA-256 of these exact bytes, labeled a handoff-content digest, not a Git revision or authenticated origin.'
  printf '%s\r\n' 'Literal CRLF kept for the clone check.'
} > "$handoff"

history_sha=$(hash_file "$handoff")
is_sha256 "$history_sha" || die "history hash is not 64 lowercase hex: $history_sha"

cp "$handoff" "$project/CURRENT_STATE.md"
cp "$handoff" "$project/history/original.md"
cmp -s "$project/CURRENT_STATE.md" "$project/history/original.md" || die "handoff copies differ"

printf '%s\n' \
  '{' \
  '  "schema": 1,' \
  '  "history": "history/original.md",' \
  "  \"history_sha256\": \"$history_sha\"," \
  "  \"source_revision\": \"$history_sha\"," \
  '  "facts": [' \
  '    "Synthetic shell smoke; no members admitted and no permission granted."' \
  '  ]' \
  '}' \
  > "$project/snapshot-input.json"

receipt=$project/receipts/smoke-receipt-0001.json
printf '%s\n' \
  '{' \
  '  "schema": 1,' \
  '  "kind": "agent-receipt",' \
  '  "id": "smoke-receipt-0001",' \
  '  "project": "smoke-project",' \
  '  "actor_declared": "smoke-operator",' \
  '  "task_id": "shell-git-smoke",' \
  '  "status": "received",' \
  '  "at": "2000-01-01T00:00:00.000Z",' \
  "  \"source_revision\": \"$history_sha\"," \
  '  "summary": "Synthetic shell smoke acknowledgment; no permission requested or granted.",' \
  '  "evidence": [' \
  '    "projects/smoke-project/history/original.md"' \
  '  ],' \
  '  "authorization": "ordinary-record-not-approval"' \
  '}' \
  > "$receipt"

tr -d '\r' < "$receipt" > "$work/receipt-nocr"
cmp -s "$receipt" "$work/receipt-nocr" || die "receipt must be LF-only canonical JSON"

recorded_history=$(json_string "$project/snapshot-input.json" history_sha256)
recorded_source=$(json_string "$receipt" source_revision)
[ "$recorded_history" = "$history_sha" ] || die "snapshot history_sha256 mismatch"
[ "$recorded_source" = "$history_sha" ] || die "receipt source_revision mismatch"
cmp -s "$project/history/original.md" "$handoff" || die "archived history bytes differ"
got_history=$(hash_file "$project/history/original.md")
[ "$got_history" = "$history_sha" ] || die "archived history hash mismatch"
grep -F '"authorization": "ordinary-record-not-approval"' "$receipt" >/dev/null || die "receipt missing ordinary-record authorization"

# Documented v2 single-writer lock: empty exclusive sentinel, mode 0600.
# coordination-v2/.gitignore lists writer.lock and .pending-* so the lock
# is not project memory. Do not store a PID or age in the lock.
printf '%s\n' 'writer.lock' '.pending-*' > "$v2/.gitignore"
printf '%s\n' \
  '.gitattributes text eol=lf' \
  '.gitignore text eol=lf' \
  'journal/** -text' \
  > "$v2/.gitattributes"

lock=$v2/writer.lock
(set -C; : > "$lock") || die "could not create writer.lock"
if (set -C; : > "$lock") 2>/dev/null; then
  die "second exclusive create of writer.lock succeeded"
fi
[ -f "$lock" ] && [ ! -L "$lock" ] && [ ! -s "$lock" ] || die "writer.lock must be an empty non-symlink file"
perms=$(ls -l "$lock" | awk '{print $1}')
links=$(ls -l "$lock" | awk '{print $2}')
case $perms in
  -rw-------*) ;;
  *) die "writer.lock mode is $perms; expected 0600 (-rw-------)" ;;
esac
[ "$links" = "1" ] || die "writer.lock link count is $links; expected 1"

: > "$v2/.pending-smoke"

if ! gitc -C "$ledger" init --template= >"$work/git-out" 2>&1; then
  cat "$work/git-out" >&2
  die "git init failed"
fi
if ! gitc -C "$ledger" check-ignore -q -- projects/smoke-project/coordination-v2/writer.lock; then
  die "writer.lock is not ignored"
fi
if ! gitc -C "$ledger" check-ignore -q -- projects/smoke-project/coordination-v2/.pending-smoke; then
  die ".pending-* is not ignored"
fi
rm -f "$v2/.pending-smoke"

gitc -C "$ledger" add -A
if ! gitc -C "$ledger" commit -m "Synthetic smoke ledger" >"$work/git-out" 2>&1; then
  cat "$work/git-out" >&2
  die "git commit failed"
fi

gitc -C "$ledger" ls-files > "$work/actual-files"
cat > "$work/expected-files" <<'EOF'
.gitattributes
projects/smoke-project/CURRENT_STATE.md
projects/smoke-project/coordination-v2/.gitattributes
projects/smoke-project/coordination-v2/.gitignore
projects/smoke-project/history/original.md
projects/smoke-project/receipts/smoke-receipt-0001.json
projects/smoke-project/snapshot-input.json
EOF
while IFS= read -r rel; do
  [ -n "$rel" ] || continue
  if ! grep -F -x "$rel" "$work/actual-files" >/dev/null; then
    die "missing committed file: $rel"
  fi
done < "$work/expected-files"
actual_count=$(awk 'NF { n++ } END { print n + 0 }' "$work/actual-files")
expected_count=$(awk 'NF { n++ } END { print n + 0 }' "$work/expected-files")
[ "$actual_count" = "$expected_count" ] || die "committed file count $actual_count != $expected_count"
if gitc -C "$ledger" ls-files --error-unmatch projects/smoke-project/coordination-v2/writer.lock >/dev/null 2>&1; then
  die "writer.lock was committed"
fi
status=$(gitc -C "$ledger" status --porcelain)
[ -z "$status" ] || die "unexpected porcelain status: $status"

if ! gitc clone --no-local --config core.autocrlf=true "$ledger" "$clone" >"$work/git-out" 2>&1; then
  cat "$work/git-out" >&2
  die "git clone failed"
fi
clone_autocrlf=$(git -C "$clone" config --local core.autocrlf)
[ "$clone_autocrlf" = "true" ] || die "clone core.autocrlf is $clone_autocrlf"

while IFS= read -r rel; do
  [ -n "$rel" ] || continue
  cmp -s "$ledger/$rel" "$clone/$rel" || die "clone byte mismatch: $rel"
done < "$work/actual-files"

[ ! -e "$clone/projects/smoke-project/coordination-v2/writer.lock" ] || die "clone contains writer.lock"
clone_history=$(hash_file "$clone/projects/smoke-project/history/original.md")
[ "$clone_history" = "$history_sha" ] || die "clone history hash mismatch"
clone_state=$(hash_file "$clone/projects/smoke-project/CURRENT_STATE.md")
[ "$clone_state" = "$history_sha" ] || die "clone handoff hash mismatch"
receipt_sha=$(hash_file "$receipt")
is_sha256 "$receipt_sha" || die "receipt hash is not 64 lowercase hex"
clone_receipt=$(hash_file "$clone/projects/smoke-project/receipts/smoke-receipt-0001.json")
[ "$clone_receipt" = "$receipt_sha" ] || die "clone receipt hash mismatch"

# Current documented Minimal Setup copies only .gitattributes and the
# handoff. That ledger has no byte copy of PROTOCOL.md. This check must
# fail until Setup puts one there. A successful clone above is not enough.
printf '%s\n' "ledger-smoke: prior checks passed; checking Minimal protocol bytes"
gap=$work/minimal-gap
mkdir -m 700 -p "$gap/projects/PROJECT"
cp "$toolkit/.gitattributes" "$gap/.gitattributes"
printf '%s\n' \
  '# Synthetic Minimal handoff' \
  'Goal: current Minimal file set, with no protocol copy.' \
  > "$gap/projects/PROJECT/CURRENT_STATE.md"
if protocol_bytes_match "$gap"; then
  die "gap ledger byte-matched PROTOCOL.md; the missing-copy case was not exercised"
fi
die "minimal ledger lacks docs/PROTOCOL.md byte-matching the toolkit"

commit=$(gitc -C "$ledger" rev-parse HEAD)
printf '%s\n' \
  "ledger-smoke: ok" \
  "history_sha256: $history_sha" \
  "receipt_sha256: $receipt_sha" \
  "commit: $commit" \
  "clone: core.autocrlf=true byte match" \
  "writer.lock: empty exclusive sentinel mode 0600; not committed"
