# 2026-10-01 — Fresh Minimal Setup→Join re-verify

Maintainer record of a Minimal-only re-verify after the PR #4 Setup/Join paste change. Optional checks were not run. Full facts are on the [release checklist](../TESTING.md#maintainer-release-checklist).

- Window: 2026-10-01, about 13:07–13:14 PT. Toolkit tip at Setup: `583aa8f84ae1321cb9c5bfa5da512e84a3507682` (PR #5 merged; tip before verify was `c9973b0e391aab56fab6dafa005dd92f84759e4a`).
- Brand-new agents and environments: Setup `bc-35d362fd-92fb-5db4-977a-c9afb2fb95f5`, Join `bc-d8cd3d33-cf74-5e40-8800-64355d877a22`.
- Private ledger https://github.com/AAlpha7/ac-fresh-setup-20261001-f40a68 (`private: true`; not a toolkit fork). Handoff `projects/fresh-verify/CURRENT_STATE.md`.
- Setup `partial` (App/`gh` bot could not push; user integration wrote `12875ad7076211910be0b464f20215423c2005f3`). Join `ready` (`90fee23281646f870b78e01058a1caefef755e66` on `main` via the user integration Contents API, after App `git clone` returned repository not found).
- Result: Minimal Setup→Join PASS, with an App-versus-user-integration credential quirk.
