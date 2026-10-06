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
# r2/WIRE.md and r2/ONBOARDING.md. It also rejects a synthetic Minimal
# ledger that lacks docs/PROTOCOL.md byte-matching toolkit PROTOCOL.md,
# including a paraphrase, and accepts one that has that byte copy.
# The recorded toolkit revision must be the commit those bytes came
# from (git rev-parse HEAD in this checkout, matching git show
# HEAD:PROTOCOL.md). Relative markdown links in the copied files must
# resolve inside the synthetic ledger.
# Each MANIFEST.json size and SHA-256 must match the blob at HEAD
# (git cat-file). It does not create a remote.
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
  protocol_ledger=$1
  [ -f "$protocol_ledger/docs/PROTOCOL.md" ] || return 1
  cmp -s "$toolkit/PROTOCOL.md" "$protocol_ledger/docs/PROTOCOL.md"
}

# Relative markdown links in a file Setup copied must resolve to a file
# inside the ledger. http(s), mailto, and other schemes, plus #anchors,
# are not ledger-relative. $1 is the ledger root, $2 is the path inside it.
copied_markdown_links_resolve() {
  ledger_root=$1
  rel=$2
  dir=$(dirname "$rel")
  awk -v dir="$dir" '
    function resolve(base, relpath,   n, i, parts, out, k, seg, built) {
      k = 0
      n = split(base, parts, "/")
      for (i = 1; i <= n; i++) {
        if (parts[i] == "" || parts[i] == ".") continue
        k++
        out[k] = parts[i]
      }
      n = split(relpath, parts, "/")
      for (i = 1; i <= n; i++) {
        seg = parts[i]
        if (seg == "" || seg == ".") continue
        if (seg == "..") {
          if (k <= 0) return ""
          k--
          continue
        }
        k++
        out[k] = seg
      }
      built = ""
      for (i = 1; i <= k; i++) {
        if (i > 1) built = built "/"
        built = built out[i]
      }
      return built
    }
    function consider(target) {
      sub(/[[:space:]].*/, "", target)
      if (target ~ /^[A-Za-z][A-Za-z0-9+.-]*:/) return
      if (target ~ /^#/) return
      sub(/[#?].*/, "", target)
      if (target == "") return
      print resolve(dir, target)
    }
    {
      line = $0
      while (match(line, /\]\([^)]*\)/)) {
        target = substr(line, RSTART + 2, RLENGTH - 3)
        consider(target)
        line = substr(line, RSTART + RLENGTH)
      }
      if (match($0, /^\[[^]]+\]:[[:space:]]+/)) {
        target = $0
        sub(/^\[[^]]+\]:[[:space:]]+/, "", target)
        consider(target)
      }
    }
  ' "$ledger_root/$rel" > "$work/link-targets"
  link_error=
  while IFS= read -r resolved; do
    if [ -z "$resolved" ]; then
      link_error="relative link in $rel escapes the ledger"
      return 1
    fi
    if [ ! -f "$ledger_root/$resolved" ]; then
      link_error="relative link in $rel dangles: $resolved"
      return 1
    fi
  done < "$work/link-targets"
}

require_copied_links() {
  if ! copied_markdown_links_resolve "$1" "$2"; then
    die "$link_error"
  fi
}

# Each listed MANIFEST.json size and SHA-256 must match the blob at HEAD.
# Reads the committed manifest, not a dirty working-tree copy.
manifest_matches_head() {
  git -C "$toolkit" cat-file blob HEAD:MANIFEST.json > "$work/manifest.json" || die "could not read HEAD:MANIFEST.json"
  grep -F '"algorithm": "sha256"' "$work/manifest.json" >/dev/null || die "MANIFEST algorithm is not sha256"
  if ! awk '
    function unquote(s) {
      sub(/^[^:]*:[[:space:]]*"/, "", s)
      sub(/",?[[:space:]]*$/, "", s)
      return s
    }
    /"path"[[:space:]]*:/ {
      path = unquote($0)
      next
    }
    /"bytes"[[:space:]]*:/ {
      bytes = $0
      sub(/^[^:]*:[[:space:]]*/, "", bytes)
      sub(/,?[[:space:]]*$/, "", bytes)
      next
    }
    /"sha256"[[:space:]]*:/ {
      sha = unquote($0)
      if (path == "" || bytes == "" || sha == "") exit 2
      printf "%s\t%s\t%s\n", path, bytes, sha
      path = ""
      bytes = ""
      sha = ""
    }
  ' "$work/manifest.json" > "$work/manifest-rows"; then
    die "could not parse MANIFEST.json"
  fi
  path_count=$(grep -c '"path"' "$work/manifest.json" || true)
  manifest_listed=$(awk 'NF { n++ } END { print n + 0 }' "$work/manifest-rows")
  [ "$path_count" = "$manifest_listed" ] || die "MANIFEST path count $path_count != parsed rows $manifest_listed"
  [ "$manifest_listed" -gt 0 ] || die "MANIFEST lists no files"
  while IFS=$(printf '\t') read -r path bytes sha; do
    [ -n "$path" ] || continue
    case $path in
      /*|*'..'*|*'\\'*) die "MANIFEST path is not a safe relative path: $path" ;;
    esac
    case $path in
      *[!A-Za-z0-9._/-]*) die "MANIFEST path is not a safe relative path: $path" ;;
    esac
    is_sha256 "$sha" || die "MANIFEST sha256 is not 64 lowercase hex for $path"
    case $bytes in
      ''|*[!0-9]*) die "MANIFEST bytes is not a number for $path" ;;
    esac
    if ! git -C "$toolkit" cat-file -e "HEAD:$path" >/dev/null 2>&1; then
      die "MANIFEST path is not in HEAD: $path"
    fi
    got_size=$(git -C "$toolkit" cat-file -s "HEAD:$path") || die "could not size HEAD:$path"
    [ "$got_size" = "$bytes" ] || die "MANIFEST bytes $bytes != HEAD blob $got_size for $path"
    git -C "$toolkit" cat-file blob "HEAD:$path" > "$work/manifest-blob" || die "could not read HEAD:$path"
    got_sha=$(hash_file "$work/manifest-blob")
    [ "$got_sha" = "$sha" ] || die "MANIFEST sha256 mismatch for $path"
  done < "$work/manifest-rows"
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

manifest_matches_head

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

# Minimal shape. A ledger with only the old Setup files, and a ledger
# whose docs/PROTOCOL.md is a paraphrase, must fail the byte check.
# A ledger that copies toolkit PROTOCOL.md must pass, including after clone.
# A successful clone of the receipt ledger above is not this check.
printf '%s\n' "ledger-smoke: prior checks passed; checking Minimal protocol bytes"
[ -f "$toolkit/templates/HOW_WE_COORDINATE.md" ] || die "missing $toolkit/templates/HOW_WE_COORDINATE.md"
grep -F '<commit or unset>' "$toolkit/templates/HOW_WE_COORDINATE.md" >/dev/null || die "template missing revision token"
grep -F 'git rev-parse HEAD' "$toolkit/templates/HOW_WE_COORDINATE.md" >/dev/null || die "template does not name git rev-parse HEAD"
grep -F 'byte-copied' "$toolkit/templates/HOW_WE_COORDINATE.md" >/dev/null || die "template does not say the revision is the byte-copied commit"
grep -F 'docs/PROTOCOL.md' "$toolkit/templates/HOW_WE_COORDINATE.md" >/dev/null || die "template does not name docs/PROTOCOL.md"
grep -F 'CURRENT_STATE.md' "$toolkit/templates/HOW_WE_COORDINATE.md" >/dev/null || die "template does not name CURRENT_STATE.md"
for setup_doc in README.md ONBOARDING.md README.zh-CN.md; do
  grep -F 'git rev-parse HEAD' "$toolkit/$setup_doc" >/dev/null || die "$setup_doc does not name git rev-parse HEAD"
done
if cmp -s "$toolkit/PROTOCOL.md" "$toolkit/templates/HOW_WE_COORDINATE.md"; then
  die "short entry is a byte copy of PROTOCOL.md"
fi

gap=$work/minimal-gap
mkdir -m 700 -p "$gap/projects/PROJECT"
cp "$toolkit/.gitattributes" "$gap/.gitattributes"
printf '%s\n' \
  '# Synthetic Minimal handoff' \
  'Goal: old Minimal file set, with no protocol copy.' \
  > "$gap/projects/PROJECT/CURRENT_STATE.md"
if protocol_bytes_match "$gap"; then
  die "gap ledger byte-matched PROTOCOL.md; the missing-copy case was not exercised"
fi

paraphrase=$work/minimal-paraphrase
mkdir -m 700 -p "$paraphrase/docs"
printf '%s\n' \
  '# Coordination' \
  'Follow the protocol. Keep a shared record. Do not clone the toolkit.' \
  > "$paraphrase/docs/PROTOCOL.md"
if protocol_bytes_match "$paraphrase"; then
  die "paraphrase byte-matched toolkit PROTOCOL.md"
fi

minimal=$work/minimal
minimal_clone=$work/minimal-clone
mkdir -m 700 -p "$minimal/docs" "$minimal/projects/entry-demo"
cp "$toolkit/.gitattributes" "$minimal/.gitattributes"
cp "$toolkit/PROTOCOL.md" "$minimal/docs/PROTOCOL.md"
sed 's/PROJECT/entry-demo/g' "$toolkit/templates/LEDGER-README.md" > "$minimal/README.md"
# The revision is the commit in this checkout whose PROTOCOL.md blob was copied.
source_commit=$(git -C "$toolkit" rev-parse HEAD)
case $source_commit in
  ????????????????????????????????????????) ;;
  *) die "toolkit HEAD is not a full commit id: $source_commit" ;;
esac
printf '%s\n' "$source_commit" | awk 'BEGIN { ok = 0 } /^[0-9a-f]{40}$/ { ok = 1 } END { exit ok ? 0 : 1 }' || die "toolkit HEAD is not 40 lowercase hex: $source_commit"
git -C "$toolkit" -c core.autocrlf=false show "${source_commit}:PROTOCOL.md" > "$work/protocol-from-commit" || die "could not read PROTOCOL.md at toolkit HEAD $source_commit"
cmp -s "$work/protocol-from-commit" "$minimal/docs/PROTOCOL.md" || die "copied PROTOCOL.md is not the blob at toolkit HEAD $source_commit"
sed "s/<commit or unset>/$source_commit/" "$toolkit/templates/HOW_WE_COORDINATE.md" > "$minimal/docs/HOW_WE_COORDINATE.md"
cmp -s "$toolkit/PROTOCOL.md" "$minimal/docs/PROTOCOL.md" || die "docs/PROTOCOL.md is not a byte copy of toolkit PROTOCOL.md"
if grep -F '<commit or unset>' "$minimal/docs/HOW_WE_COORDINATE.md" >/dev/null; then
  die "HOW_WE_COORDINATE still has the unfilled revision token"
fi
recorded=$(sed -n 's/^Toolkit docs revision (optional): //p' "$minimal/docs/HOW_WE_COORDINATE.md")
[ "$recorded" = "$source_commit" ] || die "recorded toolkit revision '$recorded' != copy commit $source_commit"
if grep -F 'Toolkit docs revision (optional): unset' "$minimal/docs/HOW_WE_COORDINATE.md" >/dev/null; then
  die "recorded unset even though the copy commit resolved"
fi
require_copied_links "$minimal" .gitattributes
require_copied_links "$minimal" docs/PROTOCOL.md
require_copied_links "$minimal" docs/HOW_WE_COORDINATE.md
dangle=$work/dangle-ledger
mkdir -m 700 -p "$dangle/docs"
cp "$minimal/docs/PROTOCOL.md" "$dangle/docs/PROTOCOL.md"
printf '\n%s\n' 'See the [wire](r2/WIRE.md).' >> "$dangle/docs/PROTOCOL.md"
if copied_markdown_links_resolve "$dangle" docs/PROTOCOL.md; then
  die "dangling r2/WIRE.md link was accepted"
fi
printf '%s\n' \
  '# Synthetic minimal handoff' \
  'Goal: exercise Minimal ledger shape only.' \
  'Decisions: none.' \
  'Verified work: none. This file is synthetic.' \
  'Reported but unverified: none.' \
  'Open questions: none.' \
  'Next authorized task: none. Shape check only.' \
  'Unresolved ownership: none.' \
  > "$minimal/projects/entry-demo/CURRENT_STATE.md"
for field in Goal Decisions 'Verified work' 'Reported but unverified' 'Open questions' 'Next authorized task' 'Unresolved ownership'; do
  grep -F "$field" "$minimal/projects/entry-demo/CURRENT_STATE.md" >/dev/null || die "CURRENT_STATE missing $field"
done
require_copied_links "$minimal" README.md
if ! protocol_bytes_match "$minimal"; then
  die "minimal ledger lacks docs/PROTOCOL.md byte-matching the toolkit"
fi
if ! gitc -C "$minimal" init --template= >"$work/git-out" 2>&1; then
  cat "$work/git-out" >&2
  die "minimal git init failed"
fi
if ! gitc -C "$minimal" add -- \
  .gitattributes \
  README.md \
  docs/PROTOCOL.md \
  docs/HOW_WE_COORDINATE.md \
  projects/entry-demo/CURRENT_STATE.md \
  >"$work/git-out" 2>&1; then
  cat "$work/git-out" >&2
  die "minimal git add failed"
fi
if ! gitc -C "$minimal" commit -m "Synthetic minimal ledger" >"$work/git-out" 2>&1; then
  cat "$work/git-out" >&2
  die "minimal git commit failed"
fi
gitc -C "$minimal" ls-files > "$work/minimal-files"
cat > "$work/expected-minimal" <<'EOF'
.gitattributes
README.md
docs/HOW_WE_COORDINATE.md
docs/PROTOCOL.md
projects/entry-demo/CURRENT_STATE.md
EOF
while IFS= read -r rel; do
  [ -n "$rel" ] || continue
  if ! grep -F -x "$rel" "$work/minimal-files" >/dev/null; then
    die "missing minimal committed file: $rel"
  fi
done < "$work/expected-minimal"
minimal_count=$(awk 'NF { n++ } END { print n + 0 }' "$work/minimal-files")
minimal_expected=$(awk 'NF { n++ } END { print n + 0 }' "$work/expected-minimal")
[ "$minimal_count" = "$minimal_expected" ] || die "minimal committed file count $minimal_count != $minimal_expected"
if ! gitc clone --no-local --config core.autocrlf=true "$minimal" "$minimal_clone" >"$work/git-out" 2>&1; then
  cat "$work/git-out" >&2
  die "minimal git clone failed"
fi
while IFS= read -r rel; do
  [ -n "$rel" ] || continue
  cmp -s "$minimal/$rel" "$minimal_clone/$rel" || die "minimal clone byte mismatch: $rel"
done < "$work/minimal-files"
cmp -s "$toolkit/PROTOCOL.md" "$minimal_clone/docs/PROTOCOL.md" || die "cloned docs/PROTOCOL.md does not byte-match toolkit PROTOCOL.md"
clone_recorded=$(sed -n 's/^Toolkit docs revision (optional): //p' "$minimal_clone/docs/HOW_WE_COORDINATE.md")
[ "$clone_recorded" = "$source_commit" ] || die "cloned toolkit revision '$clone_recorded' != copy commit $source_commit"
require_copied_links "$minimal_clone" README.md
require_copied_links "$minimal_clone" docs/PROTOCOL.md
require_copied_links "$minimal_clone" docs/HOW_WE_COORDINATE.md

commit=$(gitc -C "$ledger" rev-parse HEAD)
printf '%s\n' \
  "ledger-smoke: ok" \
  "history_sha256: $history_sha" \
  "receipt_sha256: $receipt_sha" \
  "commit: $commit" \
  "clone: core.autocrlf=true byte match" \
  "writer.lock: empty exclusive sentinel mode 0600; not committed" \
  "minimal-gap: rejected (docs/PROTOCOL.md missing)" \
  "minimal-paraphrase: rejected (bytes differ)" \
  "minimal-ledger: docs/PROTOCOL.md byte match" \
  "minimal-revision: $source_commit matches copied PROTOCOL.md" \
  "manifest: $manifest_listed HEAD blobs match MANIFEST.json"
