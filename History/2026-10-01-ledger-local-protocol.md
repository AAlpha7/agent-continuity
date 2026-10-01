# 2026-10-01 — Ledger-local protocol for Minimal Join

A cold Join that only has the private ledger URL could not learn how to coordinate. `PROTOCOL.md` stayed in the public toolkit, and Minimal Setup no longer pinned a toolkit distribution.

- Setup now copies toolkit `PROTOCOL.md` to ledger `docs/PROTOCOL.md` (same bytes), copies `templates/HOW_WE_COORDINATE.md` to `docs/HOW_WE_COORDINATE.md`, and still commits `.gitattributes` plus `projects/PROJECT/CURRENT_STATE.md`.
- Join clones the ledger only, reads the short entry and `docs/PROTOCOL.md`, then the handoff, and commits back. It does not clone the public toolkit.
- `scripts/ledger-smoke.sh` and `scripts/ledger-smoke.ps1` build that Minimal shape and require `docs/PROTOCOL.md` to byte-match the toolkit file. Node is still not an adopter gate.
- Cold Join literacy for a live agent trial is on the TESTING.md maintainer checklist. The 2026-10-01 Setup→Join re-verify predates this paste change.

Re-verify after HOW_WE_COORDINATE paste change: pending.
