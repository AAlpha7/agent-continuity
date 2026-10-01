# Project status

Version: 0.1.0-rc.3 prerelease.

Adopter path (Minimal): Setup creates a private ledger and returns its URL. Every later agent or machine Joins with that URL only. Git and GitHub are enough. `gh` is optional. Node.js is not required. Shell smoke, the two-agent ping, and the Node suite are not part of done.

Optional, never a gate: the short two-agent prompt in README / ONBOARDING / TESTING; `sh scripts/ledger-smoke.sh` (Windows: Git Bash or WSL; native twin `scripts/ledger-smoke.ps1`); the 105-test Node suite and demo when Node.js 24+ is already installed.

Maintainers, before each release: run all optional paths (two-agent ping, shell smoke, Node suite when Node is present). If the Setup/Join paste changed, re-verify Minimal Setup and Join with brand-new agents, environments, and ledger repos. Record the result on the release checklist in TESTING.md. Adopters do not.

Records stay in the adopter's private ledger. This repository remains a read-only toolkit.
