# Project status

Version: 0.1.0-rc.3 prerelease.

Adopter path (Minimal): Setup creates a private shared record and puts the coordination protocol in that ledger (`docs/PROTOCOL.md`, a byte copy of toolkit `PROTOCOL.md`, plus the short entry `docs/HOW_WE_COORDINATE.md` and `projects/PROJECT/CURRENT_STATE.md`). Every later agent or machine Joins with that URL only and does not clone the public toolkit. Git and GitHub are enough. `gh` is optional. Node.js is not required. Shell smoke, the two-agent ping, and the Node suite are not part of done.

Optional, never a gate: the short two-agent prompt in README / ONBOARDING / TESTING; `sh scripts/ledger-smoke.sh` (Windows: Git Bash or WSL; native twin `scripts/ledger-smoke.ps1`); the 105-test Node suite and demo when Node.js 24+ is already installed.

Maintainers, before each release: run all optional paths (two-agent ping, shell smoke including the protocol-byte check, Node suite when Node is present). If the Setup/Join paste changed, re-verify Minimal Setup and Join with brand-new agents, environments, and ledger repos. That live trial is separate from the shell smoke. Record the result on the release checklist in TESTING.md. Adopters do not.

Records stay in the adopter's private ledger. This repository remains a read-only toolkit.
