# 2026-10-01 — Shell and git self-check

Adopter Setup and Join stay on git and GitHub, plus a POSIX shell. `gh` stays optional. Node.js is not required.

- Added `scripts/ledger-smoke.sh`. It builds a temporary ledger, writes a canonical sample receipt and handoff, commits, clones with `core.autocrlf=true`, and checks hashes, the expected files, and the empty exclusive `writer.lock` sentinel.
- Documented Windows as Git Bash or WSL running that same script. Added optional `scripts/ledger-smoke.ps1` for a native Windows shell. It does not require Node. POSIX mode `0600` is checked by the shell script, and by the PowerShell twin only when the OS is not Windows.
- README, README.zh-CN, ONBOARDING, and TESTING now lead with Setup, the private ledger URL, and Join. `node --test` and the Node demo are marked optional maintainer commands and are not a CI adopter gate.
- The optional Node demo copies `fixtures` into a destination that does not already exist, so Node.js 24.14 `fs.cp` does not raise `ERR_FS_CP_EEXIST`.
