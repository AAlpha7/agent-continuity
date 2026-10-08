# 2026-10-07 — User-level ledger paths at Setup

Minimal Setup now has an additional completion step. After the private ledger exists, the first agent writes two facts into user-level instructions, the text the agent product loads at the start of every session for this user (for example `~/.grok/AGENTS.md` in Grok Build): the local clone path on this machine, and the remote URL when a remote exists. Local-only Setup records `shared_access: not-configured` and still writes the local path.

The copyable `Join LEDGER_URL` / `Join LEDGER_PATH` line is unchanged and is still what the next agent receives. The user-level write is for the same user's later sessions. It is not a project `AGENTS.md`, and it is not another rule file or a persistent service. `PROTOCOL.md` is unchanged. The ledger protocol stays a byte copy of those coordination principles and does not store the private paths.

The step is product-neutral. Grok Build is the verified example: its user-level instructions file is `~/.grok/AGENTS.md`. Gate B (cold-start auto-injection) passed there on 2026-10-07, 3 of 3 cold sessions, plus a control session that did not know the ledger (see `TESTING.md`). Cursor cold-start verification is not done yet; the only run used a cloud agent test environment that could not save User Rules. That is a limit of that test environment.

This change was split from closed pull request #13. The two user-level blocks are the same text that was tested.
