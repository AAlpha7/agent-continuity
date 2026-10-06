#!/bin/sh
# Optional shell convenience for an already approved NEW, empty ledger clone.
# Creates only local entry files; never creates a repository, commits, or pushes.
set -eu
fail() { echo "prepare-new-ledger: $1" >&2; exit 1; }
[ "$#" = 5 ] || fail 'usage: TOOLKIT EMPTY_LEDGER PROJECT HANDOFF APPROVED_OWNER/REPO'
toolkit=$(cd "$1" && pwd -P) || exit 1
ledger=$(cd "$2" && pwd -P) || exit 1
project=$3
handoff=$4
target=$5
case $project in ''|*[!A-Za-z0-9_-]*) fail 'invalid project directory name';; esac
case $target in */*) owner=${target%%/*}; repo=${target#*/};; *) fail 'expected owner/repository';; esac
case $owner/$repo in *[!A-Za-z0-9_./-]*) fail 'invalid repository identity';; esac
case $owner in ''|.|..) fail 'invalid owner';; esac
case $repo in ''|.|..|*/*) fail 'invalid repository';; esac
case $ledger/ in "$toolkit/"*) fail 'ledger must be outside toolkit';; esac
[ ! -L "$2" ] || fail 'ledger alias requires separate inspection'
[ -d "$ledger/.git" ] && [ ! -L "$ledger/.git" ] || fail 'expected a newly cloned Git directory'
[ "$(git -C "$ledger" rev-parse --show-toplevel)" = "$ledger" ] || fail 'unexpected enclosing repository'
# Any existing content belongs to the user; this helper cannot reuse or migrate it.
for entry in "$ledger"/.[!.]* "$ledger"/..?* "$ledger"/*; do
  [ -e "$entry" ] || [ -L "$entry" ] || continue
  [ "$entry" = "$ledger/.git" ] || fail 'ledger is not empty; preserve it and use Join or an approved migration'
done
if git -C "$ledger" rev-parse --verify HEAD >/dev/null 2>&1; then fail 'ledger already has history'; fi
[ -z "$(git -C "$ledger" for-each-ref --format='%(refname)')" ] || fail 'ledger already has refs/history'
[ -f "$handoff" ] && [ ! -L "$handoff" ] || fail 'expected inspected handoff file'
for path in .gitattributes PROTOCOL.md templates/HOW_WE_COORDINATE.md templates/LEDGER-README.md; do
  [ -f "$toolkit/$path" ] && [ ! -L "$toolkit/$path" ] || fail 'missing regular toolkit input'
done
[ "$(GH_HOST=github.com gh api --hostname github.com user --jq .login)" = "$owner" ] || fail 'acting account mismatch'
observed=$(GH_HOST=github.com gh repo view "https://github.com/$target" --json owner,name,visibility --jq '[.owner.login,.name,.visibility] | @tsv') || fail 'hosting verification unavailable'
[ "$observed" = "$(printf '%s\t%s\tPRIVATE' "$owner" "$repo")" ] || fail 'owner/name/private visibility mismatch'
[ "$(git -C "$ledger" remote)" = origin ] || fail 'unexpected remotes'
check_urls() {
  [ -n "$1" ] || fail 'empty remote URL'
  printf '%s\n' "$1" | while IFS= read -r url; do
    case $url in "https://github.com/$target"|"https://github.com/$target.git"|"git@github.com:$target.git") :;; *) fail 'unapproved effective remote URL';; esac
  done
}
check_urls "$(git -C "$ledger" remote get-url --all origin)"
check_urls "$(git -C "$ledger" remote get-url --push --all origin)"
# Publishing uses explicit origin, but unexplained selectors are still a stop.
for key in remote.pushDefault "branch.$(git -C "$ledger" symbolic-ref --short HEAD).pushRemote"; do
  value=$(git -C "$ledger" config --get "$key" || true)
  [ -z "$value" ] || [ "$value" = origin ] || fail 'unapproved push selector'
done
revision=unset
if git -C "$toolkit" rev-parse --verify HEAD >/dev/null 2>&1 &&
   git -C "$toolkit" show HEAD:PROTOCOL.md | cmp -s - "$toolkit/PROTOCOL.md"; then
  revision=$(git -C "$toolkit" rev-parse HEAD)
fi
# All destination checks precede real-data writes. No Git config is changed.
# Exclusive creates preserve a colliding file; errors stop and leave partial work for inspection.
umask 077
set -C
cat "$toolkit/.gitattributes" > "$ledger/.gitattributes"
mkdir "$ledger/docs" "$ledger/projects"
mkdir "$ledger/projects/$project"
cat "$toolkit/PROTOCOL.md" > "$ledger/docs/PROTOCOL.md"
sed "s/<commit or unset>/$revision/" "$toolkit/templates/HOW_WE_COORDINATE.md" > "$ledger/docs/HOW_WE_COORDINATE.md"
sed "s/PROJECT/$project/g" "$toolkit/templates/LEDGER-README.md" > "$ledger/README.md"
cat "$handoff" > "$ledger/projects/$project/CURRENT_STATE.md"
cmp -s "$toolkit/PROTOCOL.md" "$ledger/docs/PROTOCOL.md" || fail 'protocol bytes differ'
for path in docs/HOW_WE_COORDINATE.md docs/PROTOCOL.md "projects/$project/CURRENT_STATE.md"; do
  grep -F "]($path)" "$ledger/README.md" >/dev/null || fail 'root link missing'
  [ -f "$ledger/$path" ] || fail 'root link target missing'
done
printf '%s\n' 'prepare-new-ledger: local files ready; review and recheck destination before an authorized commit/push'
