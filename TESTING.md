# What rc.3 has been checked against

Run from an inspected checkout with Node.js 24+ and Git available:

```sh
node --test test/*.test.mjs r2/test/*.test.mjs
```

No npm install, model call, remote participant, hosted CI or service is needed. The suites contain **105 top-level tests: 15 original receipt/snapshot tests, 80 local coordination/bootstrap tests and 10 Windows lock/replacement failure regressions**. Tested environment: Windows, Node.js 24.11.1 and Git 2.45.2.windows.1. Passing tests supports these specific checks, not universal platform compatibility.

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
