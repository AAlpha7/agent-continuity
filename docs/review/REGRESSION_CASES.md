# Regression cases — agent-continuity

Bugs that got past review, from real pull requests in this repo. Before you approve a PR or accept a change, check whether the diff could bring any of these back. Add a row when a PR is reverted, fixed forward, or returned by Lance. Only real cases go here, each with its evidence.

Sources: PR bodies and comments on GitHub, and `git log` on `main`. Nothing has been reverted on `main`: `git log -i --grep=revert` is empty. The repo has no GitHub review threads, so the evidence below comes from PR bodies.

| # | PR that missed it | Bug that was missed | Where it was | Caught or fixed by | Check now |
|---|---|---|---|---|---|
| 1 | #9 | `PROTOCOL.md` linked `[R2 local preview](r2/WIRE.md)`. Once byte-copied into a ledger as `docs/PROTOCOL.md`, that link went nowhere. | `PROTOCOL.md` (link text now at `PROTOCOL.md:13`) | #10, fix-forward | `require_copied_links`, `scripts/ledger-smoke.sh:160`, `:491-492` |
| 2 | #9 | The Setup text let the toolkit revision line record whatever commit had been inspected instead of the commit the bytes were copied from. A cold Join trial recorded `c6b0b5c` where the copy came from `8b335f2`. | `templates/HOW_WE_COORDINATE.md:20-29`, Setup text in `README.md`, `README.zh-CN.md`, `ONBOARDING.md` (now `ONBOARDING.md:76`) | #10, fix-forward | `minimal-revision` check and the `git rev-parse HEAD` grep, `scripts/ledger-smoke.sh:432-440`, `:665` |
| 3 | #9 and earlier (#7's body says `MANIFEST.json` "was already behind the last doc commit") | `MANIFEST.json` had 13 stale size and SHA-256 rows, `PROTOCOL.md` among them. | `MANIFEST.json` | #10 regenerated it; #12 added the coverage test | `test/manifests.test.mjs:10-16`, `scripts/ledger-smoke.sh:166-221` |
| 4 | #9 / #10 (Minimal ledger shape) | A fresh agent holding only the ledger URL found no root entry, because the Minimal ledger had no root `README.md`. | Minimal Setup file list in `ONBOARDING.md`; the fix added `templates/LEDGER-README.md` and `scripts/prepare-new-ledger.sh` | #12, fix-forward | `scripts/ledger-smoke.sh:471`, `test/onboarding-safety.test.mjs` |
| 5 | Setup text on `main` up to `e8d3afc` (#10) | Setup could create, write and push before checking account, owner, private visibility and the effective remote. At `e8d3afc`, `ONBOARDING.md:101` ran `gh repo create … --clone`; the commit and `git push -u origin HEAD` followed at `:122-123`. | `ONBOARDING.md`, Setup block | #12, fix-forward | `ONBOARDING.md:83` pre-flight, `ONBOARDING.md:138` recheck before push, `test/onboarding-safety.test.mjs` |
| 6 | #13 (closed unmerged, replaced by #14) | Cursor User Rules was written up as *the* user-level instructions surface, and Cursor cold-start was never verified. In the Grok Build Gate B run, a session took the "Cursor User Rules" wording from the ledger's `docs/HOW_WE_COORDINATE.md` and named the wrong source. | #13 branch, `templates/HOW_WE_COORDINATE.md` and the "User-level instructions" section of `ONBOARDING.md` | #14, which made the step product-neutral and names `~/.grok/AGENTS.md` as the verified example | `templates/HOW_WE_COORDINATE.md:17`, `ONBOARDING.md:140` |
| 7 | Before PR history (tag `v0.1.0-rc.3`); #1 was folded into #3 | The synthetic demo ran `mkdir` on the destination and then `fs.cp(..., {errorOnExist: true})`. On Node.js 24.14 and later that throws `ERR_FS_CP_EEXIST`. | Demo one-liner in `README.md` and `ONBOARDING.md` | #3, fix-forward (carries #1) | `TESTING.md:181` |

## Not from a PR: direct pushes to `main`

These commits never went through a pull request, but they broke a check, so they belong in the same list.

- `2f5e18a` (`CLAUDE.md`), `2f3e9fb` (`.github/workflows/claude.yml`) and `53c2d0c` (`docs/acceptance-standard.md`) each added a file without adding it to `MANIFEST.json`. As a result, `node --test test/manifests.test.mjs` fails on `main` at `53c2d0c` with "MANIFEST.json coverage". The shell smoke still prints `manifest: 78 HEAD blobs match`, because it checks only the rows that are listed. This is case 3 again. Not fixed as of this file.

## How to use this list

For each case, ask whether the diff touches the "Where it was" path or the "Check now" mechanism. If it does, quote the check's output in the review. If the PR weakens or removes that check, that is an `Important` finding.
