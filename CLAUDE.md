# CLAUDE.md — agent-continuity

Entry point for Claude Code (CLI, desktop, or the GitHub Action) in this repo.

## Before you start
- This repo is Lance's open-source project. Work is coordinated in his private ledger **AAlpha7/codex-continuity** (project `agent-continuity`).
- Read the ledger first when you can reach it: `AGENTS.md` → `INDEX.md` → `PROTOCOL.md` → `projects/agent-continuity/CURRENT_STATE.md`.
- The task you were given (issue / `@claude` comment) is the scope. Don't widen it.

## Rules
- Open a PR; never merge, tag, release, or publish. Lance merges.
- No repo writes Mon–Fri 09:00–18:00 Pacific (the Action enforces this too).
- Gates that always need Lance's yes: email, posting to X, purchases, destructive deletes, making anything public.
- `PROTOCOL.md` is copied byte-for-byte into users' ledgers — change it only when the task says so, and call it out in the PR.
- Never commit secrets or tokens.
- Acceptance bar for every agent PR (L1–L5 gates, review packet, /correct loop): [`docs/acceptance-standard.md`](docs/acceptance-standard.md).

## After you finish
- In the PR description: what changed, how you verified it, what's left.
- If you have ledger access, append your own dated section to `projects/agent-continuity/CURRENT_STATE.md` and update `machines/claude/CURRENT.md`. Never edit other agents' sections.
