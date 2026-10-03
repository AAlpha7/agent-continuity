# 2026-10-01 — Fresh Minimal Setup→Join re-verify

Maintainer record of a Minimal-only re-verify after the PR #4 Setup/Join paste change. Optional checks were not run. Full facts are on the [release checklist](../TESTING.md#maintainer-release-checklist).

- Window: 2026-10-01, about 13:07–13:14 PT. Toolkit tip at Setup: `583aa8f84ae1321cb9c5bfa5da512e84a3507682` (PR #5 merged; tip before verify was `c9973b0e391aab56fab6dafa005dd92f84759e4a`).
- Brand-new agents and environments: Setup `[private trial agent ID omitted]`, Join `[private trial agent ID omitted]`.
- Private ledger [private trial ledger URL omitted] (`private: true`; not a toolkit fork). Handoff `projects/PROJECT/CURRENT_STATE.md`.
- Setup `partial` (App/`gh` bot could not push; user integration wrote `[private trial commit ID omitted]`). Join `ready` (`[private trial commit ID omitted]` on `main` via the user integration Contents API, after App `git clone` returned repository not found).
- Result: Minimal Setup→Join PASS, with an App-versus-user-integration credential quirk.
