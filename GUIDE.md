# Project setup and provenance

[Back to README](README.md)

## Initialize your own local project

Use a trusted local OS operator. This procedure stores reports; it neither authenticates agents nor grants actions. Do not enter credentials into a handoff or receipt.

1. Prepare your own UTF-8 `initial-handoff.md`. Preserve its original bytes, including BOM and CRLF if present. Select a new workspace path whose parent already exists; the example refuses to overwrite an existing directory.
2. Identify the full source revision you have independently reviewed (40 or 64 lowercase hex characters). Merely having a correctly shaped revision is not verification or approval. Replace `SOURCE_REVISION` below with it.

```
node examples/init-project.mjs ./my-workspace my-project ./initial-handoff.md SOURCE_REVISION
```

The example validates UTF-8 before creating the workspace, copies the exact handoff into `projects/my-project/CURRENT_STATE.md` and `history/original.md`, and writes `snapshot-input.json` with the SHA-256 of those original history bytes and an initially empty `facts` array. It also copies the evidence-preserving `.gitattributes` and creates `receipt-input.json` with a new ordinary receipt ID. No key or credential is created. If a later I/O error leaves a partial workspace, inspect and preserve it; do not blindly rerun or delete it.

3. Review `snapshot-input.json`. Add at most ten concise reported facts (at most 240 UTF-16 code units each). Keep `history` and `history_sha256` bound to the original archived bytes; never change a digest merely to hide a mismatch. Edit `receipt-input.json` before first use: set the declared actor, task, status, summary and optional evidence references accurately. This is a self-declared report, not an authenticated identity. Keep the timestamp as an exact ISO UTC string.
4. Record the receipt, generate a snapshot, then check without generating:

```
node scripts/agent-receipt.mjs ./my-workspace ./my-workspace/receipt-input.json
node scripts/build-continuity-snapshot.mjs ./my-workspace my-project
node scripts/build-continuity-snapshot.mjs ./my-workspace my-project --check
```

The snapshot command returns its immutable path. `--check` verifies the expected view for the current local inputs; it does not write, synchronize, publish or establish remote freshness. Run generation first: `--check` can report STALE if the view is missing or inputs changed. Inspect new inputs, then explicitly generate and check again. CORRUPT/CONFLICT are investigation failures, not permission to overwrite evidence. An identical receipt retry uses the same ID and exact fields; a new report needs a new unique ID and timestamp. Never reuse an ID with changed content.

5. For Git storage, include `.gitattributes` in the **first commit**, before anyone clones. Ordinary code, configuration and documentation use LF. `history/`, `receipts/`, `snapshots/` and `CURRENT_STATE.md` are byte-preserved (`-text`) because hashes/canonical comparisons depend on their exact contents. Keep these rules in every newly initialized workspace. Adding them after Git has already rewritten evidence cannot recover the original bytes: restore from a verified original, never normalize evidence to make checks pass.

No remote is configured automatically. Commit/publish/synchronize only through your separately approved workflow. A clean `--check` means local consistency, not verified membership or approval.

## Independently verify extraction provenance

`PROVENANCE.json` distinguishes the SHA-256 of the exact Git blob contents from optional working-checkout bytes. Git's blob object ID is recorded separately. Exports are derived from raw `git show COMMIT:PATH` stdout using the explicit ordered transformations; no workspace-byte hash is presented as a commit hash. With authorized access to the source checkout, run:

```
node tools/verify-provenance.mjs SOURCE_CHECKOUT
```

This reads locally only, verifies all five source blobs and reconstructs each exported file byte-for-byte. It does not fetch a repository, execute source code, establish authorship or resolve license rights. New example/tools/tests/docs are candidate-specific additions, not covered by the five-file extraction manifest; their bytes are inventoried by `MANIFEST.json`.

