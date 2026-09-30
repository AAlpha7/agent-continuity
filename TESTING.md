# Candidate 0.1.0-rc.2 validation

MIT-licensed release candidate, not stable GA or an identity-security certification.

Run `node --test test/*.test.mjs` with an existing Node 24+ and Git installation. No npm install, external fetch, paid API, remote member or server is used. Latest local run: **15 tests passed, 0 failed, 0 skipped** (Windows, Node 24.11.1).

- Twelve receipt/snapshot/byte-integrity tests include independent processes, a killed lock holder, legacy concurrent append preservation and strict UTF-8 checks.
- A real Git test copies this package into an isolated directory, initializes and commits it locally, then creates a fresh clone with `core.autocrlf=true`. It compares every payload file's SHA-256 before/after, successfully replays the bundled receipt, generates/checks the snapshot and requires a clean working tree.
- That clone also executes all twelve receipt/snapshot tests in a separate runner. The test clears only the inherited Node test-runner marker and asserts the child actually reports 12 passed, zero failed/skipped; a silently skipped child cannot count as success.
- Two initializer tests cover a new project's BOM/CRLF byte preservation and history digest, receipt/generation/check workflow, refusal to overwrite an existing directory and rejection of invalid UTF-8 before creation.

Negative control: in a separate temporary copy, removing only `.gitattributes` makes the fresh-clone byte-identity assertion fail. No fixture evidence was edited to make the regression pass.

`node tools/verify-provenance.mjs SOURCE_CHECKOUT` independently verified five source Git blobs and all declared transformations. Workspace hashes are optional observations and are not compared as commit evidence. The four extracted runtime files retain identical exported bytes from the previous candidate; changes are packaging, provenance, documentation, new initializer/verifier examples and regression tests.

Production Linux/filesystem behavior, power-loss durability, hostile same-account tampering, authenticated membership and distributed ownership are not verified. The extracted rc2 candidate passed independent review; release-only documentation and licensing changes are separately checked. Passing tests and byte hashes do not grant execution authority, ownership or redistribution rights.
