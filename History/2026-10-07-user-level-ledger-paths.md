# 2026-10-07 — User-level ledger paths at Setup

Minimal Setup now has an additional completion step. After the private ledger exists, the first agent writes two facts into user-level instructions (Cursor User Rules, or `~/.grok/AGENTS.md` in Grok Build): the local clone path on this machine, and the remote URL when a remote exists. Local-only Setup records `shared_access: not-configured` and still writes the local path.

The copyable `Join LEDGER_URL` / `Join LEDGER_PATH` line is unchanged and is still what the next agent receives. The user-level write is for the same user's later sessions. It is not a project `AGENTS.md`, and it is not installing global rules or a persistent service. `PROTOCOL.md` is unchanged. The ledger protocol stays a byte copy of those coordination principles and does not store the private paths.

Grok Build cold-start verification passed on 2026-10-07 (three of three cold sessions, plus a control; see `TESTING.md`). Cursor is a known product gap: a Cursor cloud agent cannot edit User Rules, a human must paste the block, and Cursor cold-start verification is not done.
