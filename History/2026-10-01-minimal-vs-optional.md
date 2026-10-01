# 2026-10-01 — Minimal vs Optional adopter path

Adopters finish at Setup, then Join. That is the whole install.

- README, README.zh-CN, and ONBOARDING now keep the paste block to Setup and Join. Shell smoke, the two-agent ping, and the Node suite moved under Optional. They are not required to call Setup or Join done.
- Optional quick protocol check: two directions, one round each. The short paste prompt is in those docs and in TESTING.md.
- Maintainers, before each release, run every optional path (two-agent ping, shell smoke, Node suite when Node is present). If the Setup/Join paste changed, they re-verify Minimal Setup and Join with brand-new agents, environments, and ledger repos, and record the result on the TESTING.md release checklist.
- Script header comments no longer call `scripts/ledger-smoke.sh` an adopter self-check. Behavior is unchanged. Version is unchanged.
