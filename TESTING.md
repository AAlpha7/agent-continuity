# What to run

**Optional for adopters. Required for maintainers on each release.**

Adopters finish at Minimal Setup, then Join ([ONBOARDING.md](ONBOARDING.md)). Nothing on this page is an adopter gate. Do not require the two-agent ping, the shell smoke, or the Node suite to call Setup or Join done.

## Maintainer release checklist

Before each release or deploy, maintainers run **all** paths, including the optional ones:

1. Two-agent ping, using the prompt below: A writes for B and B replies; then B writes for A and A replies.
2. Shell smoke: `sh scripts/ledger-smoke.sh`. On Windows, Git Bash or WSL. `scripts/ledger-smoke.ps1` is the native twin. Every run includes the automated Minimal ledger shape check: `.gitattributes`, `docs/PROTOCOL.md` as a byte copy of toolkit `PROTOCOL.md`, `docs/HOW_WE_COORDINATE.md`, and `projects/PROJECT/CURRENT_STATE.md`. This shape check is part of the smoke. It is not an adopter gate, and it does not replace the live cold Join check below.
3. Node suite, when Node.js 24+ is available: the command under [Optional Node suite](#optional-node-suite). Do not install Node to satisfy this checklist item, and do not make Node an adopter gate.

If the Setup/Join paste blocks changed, also re-verify Minimal Setup and Join with brand-new agents, brand-new environments, and brand-new ledgers. Do not reuse prior trial agents, prior VMs, or prior trial ledger repos. Cold Join literacy is part of that re-verify:

- Do not give the Join agent the public toolkit URL.
- The Join agent must show that it used `docs/PROTOCOL.md` and `docs/HOW_WE_COORDINATE.md`, or fail if either file is missing, and that it updated `CURRENT_STATE.md` according to those rules.
- PASS requires the ledger to contain `docs/PROTOCOL.md` (the real protocol copy) and `docs/HOW_WE_COORDINATE.md` after Setup, and the Join update to follow that protocol without cloning the toolkit.

Record that result with the optional-path runs. The automated shape check in item 2 still runs on every maintainer release, including when this live trial is not repeated.

Users do not run this checklist.

### Recorded run: 2026-10-01 Minimal Setup→Join re-verify

2026-10-01, about 13:07–13:14 PT (America/Los_Angeles). Setup/Join paste blocks changed in PR #4. Merged tip before this verify: `c9973b0e391aab56fab6dafa005dd92f84759e4a`. Toolkit tip used at Setup: `583aa8f84ae1321cb9c5bfa5da512e84a3507682`, after PR #5 also merged.

Brand-new agents in brand-new environments:

- Agent A Setup: `bc-35d362fd-92fb-5db4-977a-c9afb2fb95f5`
- Agent B Join: `bc-d8cd3d33-cf74-5e40-8800-64355d877a22`

New private ledger (`private: true`; not a toolkit fork): https://github.com/AAlpha7/ac-fresh-setup-20261001-f40a68

Project handoff: `projects/fresh-verify/CURRENT_STATE.md`

- Setup local status: `partial`. The Cursor App/`gh` bot could not push the private repo. The AAlpha7 user integration created the repo and wrote the handoff. Remote `main` tip after Setup: `12875ad7076211910be0b464f20215423c2005f3`.
- Join local status: `ready`. Join commit `90fee23281646f870b78e01058a1caefef755e66` on `main`, via the AAlpha7 user integration Contents API, after `git clone` with App credentials failed (repository not found).
- Optional checks: not run. This run was a Minimal-only re-verify after the paste change.

Result: Minimal Setup→Join PASS, with a credential quirk (App credentials versus the AAlpha7 user integration).

That run predates the ledger-local protocol copy. Do not treat the run above as evidence for `docs/PROTOCOL.md` or cold Join literacy.

### Recorded run: 2026-10-01 Minimal Setup→Join + cold Join literacy

2026-10-01 (America/Los_Angeles). Re-verify after the HOW_WE_COORDINATE paste change. Toolkit branch tip used: `cursor/ledger-local-protocol-8638` @ `168018e2cd7f03961a2620841d228e3684f16303`.

Brand-new agents:

- Agent A Setup: `bc-251285cd-7ef4-5770-b346-f9f5e2055210`
- Agent B Join: `bc-8aee6c2f-7abc-54e2-a735-5a68dd60ea6f`

New private ledger (private; not a fork): https://github.com/AAlpha7/ac-fresh-setup-20261001-protocol-6379

Project handoff: `projects/protocol-verify/CURRENT_STATE.md`

- Setup left `docs/PROTOCOL.md` (byte match SHA-256 `bd34e245aa82cdf42ac1e190ec330c601d66318ac967bf7461f89305b12ef225`), `docs/HOW_WE_COORDINATE.md`, `.gitattributes`, and `CURRENT_STATE`. Tip after Setup cleanup: `65661bb30c815573f3c13f6ebc0f15dbb441d900`.
- Join commit `f3507489b009534cf43ea7775635fb5c79d80b1d` via `git push`. Join used the ledger `PROTOCOL` and `HOW_WE_COORDINATE`, and did not clone the public toolkit.
- Smoke on the PR branch (Themis box): `ledger-smoke: ok` and `minimal-ledger: docs/PROTOCOL.md byte match`.

Result: Minimal Setup→Join + cold Join literacy PASS.

## Optional quick protocol check

Two directions, one round each. Paste this to agents that already share the ledger:

```text
Optional protocol check on LEDGER_URL. Not part of setup.
Round 1: Agent A writes a short note for Agent B on the ledger. Agent B replies there.
Round 2: Agent B writes a short note for Agent A on the ledger. Agent A replies there.
One round each way. Then stop.
```

## Optional shell smoke

From an inspected toolkit checkout. Requires git and a POSIX shell, plus `sha256sum`, `shasum`, or `openssl`. Does not require Node.js, Python, `gh`, or a network. Adopters may skip it. Maintainers run it before release. It is not the private ledger.

```sh
sh scripts/ledger-smoke.sh
```

On Windows, run that same script in Git Bash or WSL from Git for Windows. Optional native Windows shell, still with git and no Node:

```powershell
powershell.exe -File scripts/ledger-smoke.ps1
```

Expect `ledger-smoke: ok`. The script:

- creates a temporary ledger and deletes it on success (`SMOKE_KEEP=1` retains it)
- writes a canonical sample `agent-receipt` and the same handoff bytes at `CURRENT_STATE.md` and `history/original.md`
- records `history_sha256` and `source_revision` as the SHA-256 of those bytes, and checks both after a `core.autocrlf=true` clone
- commits `.gitattributes`, the handoff, `snapshot-input.json`, the receipt, and the v2 `.gitattributes` / `.gitignore`
- checks the single-writer lock documented in [r2/WIRE.md](r2/WIRE.md) and [r2/ONBOARDING.md](r2/ONBOARDING.md): an empty exclusive-create sentinel at `projects/<project>/coordination-v2/writer.lock`, with no PID or age payload; the POSIX script also requires mode `0600` and link count 1; a second create must fail; `.gitignore` is exactly `writer.lock` and `.pending-*`; the lock is not in the commit or the clone
- builds a second temporary ledger the way Minimal Setup does: `.gitattributes`, `docs/PROTOCOL.md` as a byte copy of toolkit `PROTOCOL.md`, `docs/HOW_WE_COORDINATE.md` from `templates/HOW_WE_COORDINATE.md` with the revision line set to `unset`, and `projects/PROJECT/CURRENT_STATE.md` with the documented handoff fields. It commits those four paths, clones with `core.autocrlf=true`, and checks `docs/PROTOCOL.md` still byte-matches the toolkit file. This shape check runs every time the smoke runs. It is not an adopter gate.

The PowerShell twin performs the same file, hash, ignore and clone checks. It asserts mode `0600` only when `$env:OS` is not `Windows_NT`, because Windows has no POSIX mode bits. Exclusive create and the empty sentinel are checked on Windows too.

This smoke is optional for adopters and required for maintainers before release. It is not an adopter gate, and it is not the private ledger. Do not add a workflow that makes it, the PowerShell twin, or the Node demo an onboarding requirement.

Minimal Setup, then Join, is the adopter path. See [ONBOARDING.md](ONBOARDING.md).

## Optional Node suite

Run from an inspected checkout when Node.js 24+ and Git are already installed:

```sh
node --test test/*.test.mjs r2/test/*.test.mjs
```

No npm install, model call, remote participant, hosted CI or service is needed. Adopters may skip this. Maintainers run it before release when Node is available. Do not install Node so an adopter can run it, and do not make it an adopter gate. The suites contain **105 top-level tests: 15 original receipt/snapshot tests, 80 local coordination/bootstrap tests and 10 Windows lock/replacement failure regressions**. Tested environment: Windows, Node.js 24.11.1 and Git 2.45.2.windows.1. Passing tests supports these specific checks, not universal platform compatibility.

The optional synthetic demo copies fixtures into a directory that does not yet exist. Do not `mkdir` that destination first: on Node.js 24.14 and later, `fs.cp` with `errorOnExist: true` then fails with `ERR_FS_CP_EEXIST`.

```sh
node --input-type=module -e "import { cp } from 'node:fs/promises'; const dest='../agent-continuity-demo'; await cp('fixtures', dest, { recursive: true, errorOnExist: true, force: false });"
```

## Local test coverage

- Independent processes race one receipt, one action guard, the last available turn and closure. Tests kill owned child processes at selected commit boundaries and retain the recovery intent.
- A copied control directory cannot become a second writer against the same ledger. The original control binding and one ledger-local lock prevent the reproduced duplicate-controller fork.
- Closure plus immutable bytes and per-recipient terminal outboxes commit together. Local acceptance plus closed state and projection invalidation commit together. Publication, local acceptance and participant-reported receipt remain different facts.
- Action versions/recipient/source permissions, bounded budgets, expired keys, unknown effects, scoped setup reconciliation and concrete cleanup evidence fail closed where tested. Real resource creation/deletion is not performed.
- Strict UTF-8, original BOM/CRLF bytes, corrupt evidence, concurrent legacy appends and exact receipt replays are covered. A real `core.autocrlf=true` Git clone compares payload hashes; its separate 12-test subprocess must genuinely pass. New R2 journal files have their own byte-preserving attributes.
- Bootstrap rejects wrong hashes, path traversal, case collisions, missing docs and overwrites. A full source-package extraction preserves all files; its extracted receipt writer, replay and snapshot generation/check were exercised against synthetic data.

The [local case matrix](r2/ACCEPTANCE.md) distinguishes actual processes from synthetic accounts, clocks, event labels and provider results. The controller does not run a real external effect provider or verify remote identity.

## Independent review and fresh-agent trial

Earlier independent review identified controller/setup defects. After correction, review reran the **75 coordination/regression tests plus 15 legacy tests** successfully. A separate bootstrap review verified **56 candidate source files and 5 focused bootstrap tests** without a blocking finding. Release preparation added one runtime reliability fix in `lib/safe-files.mjs` and ten regression tests: bounded Windows `EPERM` retries during exclusive lock acquisition and atomic replacement. All other reviewed runtime files retain their bytes. Exact transformations and release file inventories are recorded in the provenance and manifests.

A real fresh-agent trial used an approved private GitHub ledger with synthetic work. The first recipient recovered the project decision and completed the content task, but canonical closeout correctly stopped because the pinned toolkit/docs were unavailable. That failure was retained. The distribution contract was corrected with a source-only package, complete docs and byte verification; a subsequently fresh recipient completed canonical receipt/snapshot closeout. This is evidence for the tested agent-mediated GitHub record workflow. It is not a claim of independently authenticated remote executors or universal vendor support.

Configured, owner-approved **OpenAI dot and Grok Bot GitHub PR event notifications** were also tested. Listener support, authorization and actual fetched records still need verification per setup. See [NOTIFICATIONS.md](docs/NOTIFICATIONS.md). No delivery SLA follows from those tests.

## Release-preparation failures and corrections

The first combined run passed 94/95 and failed while opening a writer lock with Windows `EPERM`. Eight independent processes then reproduced 14 `EPERM` failures in 8,000 attempts. A lock-only correction exposed a second transient `EPERM` during atomic replacement of a controller anchor (100/101 tests). Both original failures were retained; a later isolated pass was not treated as a fix.

The final correction retries only these Windows `EPERM` operations within bounded waits. It never steals a lock, deletes the destination to force replacement, changes permissions or executes without a successful exclusive open. Persistent `EPERM` remains an error; other permission errors fail immediately. Ten isolated-process, deterministic fault-injection tests cover recovery, deadlines, untouched destinations and immutable no-clobber publication. The corrected combined suite passed **105/105**.

An independent 8-process × 1,000-attempt lock stress check of the actual patch recorded 7,999 successes, one `BUSY` timeout, zero `EPERM` failures and zero exclusive-sentinel overlaps. A five-second lock wait has no fairness guarantee: sustained contention may legitimately return `BUSY`. The exact Windows kernel cause was not traced; evidence establishes the reproduced error and bounded recovery behavior, not a universal filesystem guarantee.

## Limits

No certification of abrupt power-loss durability, network filesystems, malicious same-account writers, physical multi-host fencing, signatures/revocation services, independent per-agent credentials, every closed chatbot or automatic chat-window restoration is made. Local hash consistency does not establish remote freshness, truth or permission. A shared GitHub account is one hosting identity, not proof of separate AI identities.

Historical extraction provenance remains in [PROVENANCE.json](PROVENANCE.json). Its optional source-checkout verifier needs authorized access to that historical source; public tests and onboarding do not. [MANIFEST.json](MANIFEST.json) inventories this release's distributed bytes, while uploaded ZIP checksums apply to the named release asset, not GitHub's separately generated archives.
