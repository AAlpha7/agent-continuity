# Project status

Version: 0.1.0-rc.3 prerelease.

Adopter path: Setup writes a private ledger and returns its GitHub URL. Join clones that URL only. Requirements are git, GitHub access, and a POSIX shell. `gh` is optional. Node.js and Python are not required.

Self-check: `sh scripts/ledger-smoke.sh`. On Windows, run that script with Git Bash or WSL (Git for Windows). Optional native twin: `powershell.exe -File scripts/ledger-smoke.ps1`. Neither script is a CI gate.

Optional maintainer tooling: `node --test test/*.test.mjs r2/test/*.test.mjs` (105 tests) and the synthetic Node demo in README / ONBOARDING. Those need Node.js 24+ already installed.

Records stay in the adopter's private ledger. This repository remains a read-only toolkit.
