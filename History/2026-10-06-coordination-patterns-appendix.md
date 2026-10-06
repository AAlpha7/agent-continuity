# 2026-10-06 — Optional coordination patterns appendix

Added `docs/COORDINATION_PATTERNS.md` as an optional appendix. It is marked "Optional appendix; not part of Minimal Setup/Join." The eight principles in `PROTOCOL.md` are unchanged, plus one pointer sentence that names the appendix and says a ledger may omit it. That sentence is not a markdown link, so the byte-copied `docs/PROTOCOL.md` still has no relative link that leaves a Minimal ledger.

The appendix is not copied by the Setup or Join paste blocks in `README.md`, `README.zh-CN.md`, or `ONBOARDING.md`. Those paste blocks were left unchanged, so no fresh Setup then cold Join literacy re-verify was run. A team that wants a cold joiner to read the habits from the ledger alone can byte-copy the file to `docs/COORDINATION_PATTERNS.md` as an extra step, outside those paste blocks. The file has no relative markdown link.

`scripts/ledger-smoke.sh` and `scripts/ledger-smoke.ps1` still require the `PROTOCOL.md` byte copy. They accept a Minimal ledger that omits the appendix. A helper that requires the patterns copy rejects a missing file and a paraphrase, and a synthetic ledger that byte-copies the appendix passes, including after a `core.autocrlf=true` clone. A dangling relative link in that copy is rejected.
