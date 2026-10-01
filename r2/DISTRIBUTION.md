# A new recipient must be able to obtain the toolkit

A commit string is not a distribution. Before calling an adopter ledger ready for another agent, its root README must identify an **accessible exact toolkit source**, the supported workflow and all commands/docs required to finish it. A path on the first agent's machine, a commit absent from the named repository, or "ask the coordinator for the tools" does not meet this contract.

## Required ledger-side entry

The adopter's approved ledger records:

1. Exact toolkit source commit and immutable accessible distribution location; never silently fall back to a different public version.
2. Package SHA-256 and the standalone bootstrap script's SHA-256, the inspected ledger checkpoint and provenance/trust limitations. Hashes verify bytes; an attacker able to rewrite the ledger can rewrite its manifest too. Use the user-approved repository/access/source boundary, not a self-declared identity in a package.
3. A direct link to the runbook, supported source/docs entry paths, actual commands with clearly labelled placeholders and the distinction between inspected project revision and toolkit revision.
4. No dependence on another machine's local paths, hidden parent messages, credentials or undeclared setup scripts. A recipient with the approved repository access must be able to obtain every required file before task closeout.

Use either an independently accessible approved pinned source or the **source-only package** below. Do not require the user to solve routine tooling steps the agent can inspect and perform within existing authority. If the agent cannot access/run the chosen tools, report that actual capability gap without claiming canonical completion.

## Source-only package option

An explicitly approved private ledger may carry immutable tool distribution at `.continuity/toolkit-pack.json`, a byte-identical copy of `r2/bootstrap-toolkit.mjs` at `.continuity/bootstrap-toolkit.mjs`, and `.continuity/BOOTSTRAP.md` with the package/script digests and exact source commit. This is distribution data; real project records still stay outside any executable toolkit checkout. No original `.git` history, operator-control state, secrets, private review logs or unrelated task data belong in the package.

The distributor exports **tracked Git blob bytes at the declared commit**, not a dirty working tree, and verifies each file's size, SHA-256 and Git blob SHA against that source. Source metadata records the original tree as a provenance assertion; the package is not a signed attestation or independent proof of ownership. Include required runtime files, license, docs, fixtures and tests. Keep test-specific ledger data out of the generic source. Do not add CI or execute external install scripts.

A new recipient first reads the root README and BOOTSTRAP instructions, inspects the standalone bootstrap, and checks its digest using an available standard hashing tool. Then, with actual resolved paths and the recorded package digest:

```text
node LEDGER/.continuity/bootstrap-toolkit.mjs LEDGER NEW_TOOLKIT_DIRECTORY EXPECTED_PACKAGE_SHA256
```

The parent of `NEW_TOOLKIT_DIRECTORY` must exist and the new directory must be outside the ledger and absent. The bootstrap verifies the entire package before writing, rejects traversal/aliases/duplicate or reserved paths, preserves original bytes, writes no `.git`, and runs **none** of the extracted code. It does not use the network or configure a remote. Readback hashes do not certify that code is safe; inspect it before running. On partial I/O failure retain the new directory for diagnosis rather than retrying over it.

After extraction, read `ONBOARDING.md`, `GUIDE.md`, `RECEIPT-SCHEMA.md`, `PROTOCOL.md` and, where appropriate, `r2/ONBOARDING.md`. Run the declared tests, then the workflow from those docs. The ordinary rc.2 receipt/snapshot commands are:

```text
node --test TOOLKIT/test/*.test.mjs
node TOOLKIT/scripts/agent-receipt.mjs LEDGER NEW_RECEIPT_INPUT_FILE
node TOOLKIT/scripts/agent-receipt.mjs LEDGER SAME_UNCHANGED_RECEIPT_INPUT_FILE
node TOOLKIT/scripts/build-continuity-snapshot.mjs LEDGER PROJECT
node TOOLKIT/scripts/build-continuity-snapshot.mjs LEDGER PROJECT --check
```

The repeated receipt call deliberately verifies exact replay with the same unique ID/fields; it is not permission to reuse a prior agent's ID or change its report. Prepare the input from the documented schema, with the current agent's declared label, actual inspected source revision, accurate checks/evidence and unresolved limits. Toolkit revision and inspected work revision are different facts. Do not fabricate passed tests/completion to populate a receipt.

Review original records and current artifact state before acting: another agent may already have completed the content task while canonical closeout remains blocked. Preserve earlier reports, history and byte hashes. Update coordinator facts only within the authorized scope, then generate/check the corresponding snapshot. A green local snapshot does not prove remote freshness or independent identity. Synchronization remains an explicit approved action to the adopter's verified private destination.

## Git ownership/access failures

Use a supported existing execution identity when the sandbox and host Git owners differ. Do not silence ownership checks with `safe.directory`, change security settings, extract tokens or claim a clone worked when it failed. An already authorized GitHub contents/tree/blob API can be used to read exact pinned bytes when Git is unavailable; verify completeness and hashes, preserve first failures, and report which transport actually worked. API access is not permission to change accounts, expand scope or publish upstream. This package extractor itself needs no Git checkout or hidden machine path.

Acceptance is a fresh workspace obtaining everything from the approved ledger/source entry alone, verifying bytes and running the documented canonical workflow. Earlier failed trials stay evidence. A successful builder-side extraction is supporting validation, not a substitute for the independent recipient trial.
