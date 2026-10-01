# Project setup and provenance

[Back to README](README.md)

The adopter path does not use this page. Setup, the private ledger URL, and Join are in [ONBOARDING.md](ONBOARDING.md). The self-check is `sh scripts/ledger-smoke.sh` ([TESTING.md](TESTING.md)). The steps below are the optional Node.js 24+ initializer for maintainers who already have Node installed.

## Initialize your own local project

Use a trusted local OS operator. This procedure stores reports; it neither authenticates agents nor grants actions. The public upstream distributes tools/examples only; it is not the adopter's ledger or team. Before real-data writes, complete the [storage and remote checks](ONBOARDING.md#0-separate-distribution-from-the-adopters-data). Use a separate user-owned private ledger outside the toolkit checkout and fixtures; do not push records upstream or include them in issues, PRs or troubleshooting messages. No remote is created implicitly. Do not enter credentials into a handoff or receipt.

1. Prepare your own UTF-8 `../my-private-handoff.md` in approved private input storage outside the toolkit and demo. This source input remains there; the initializer retains an exact copy inside the new ledger. Preserve its original bytes, including BOM and CRLF if present. Select a new workspace path whose parent already exists; the example refuses to overwrite an existing directory.
2. Identify the full source revision you have independently reviewed (40 or 64 lowercase hex characters). Merely having a correctly shaped revision is not verification or approval. Replace `SOURCE_REVISION` below with it. The examples run from the toolkit checkout but target a separate sibling ledger; resolve and inspect both paths first. Sibling paths are illustrative, not proof that the enclosing storage is private.

```
node examples/init-project.mjs ../my-private-ledger my-project ../my-private-handoff.md SOURCE_REVISION
```

The example validates UTF-8 before creating the workspace, copies the exact handoff into `projects/my-project/CURRENT_STATE.md` and `history/original.md`, and writes `snapshot-input.json` with the SHA-256 of those original history bytes and an initially empty `facts` array. It also copies the evidence-preserving `.gitattributes` and creates `receipt-input.json` with a new ordinary receipt ID. No key or credential is created. If a later I/O error leaves a partial workspace, inspect and preserve it; do not blindly rerun or delete it.

3. Review `snapshot-input.json`. Add at most ten concise reported facts (at most 240 UTF-16 code units each). Keep `history` and `history_sha256` bound to the original archived bytes; never change a digest merely to hide a mismatch. Edit `receipt-input.json` before first use: set the declared actor, task, status, summary and optional evidence references accurately. This is a self-declared report, not an authenticated identity. Review new/contradictory original receipts when maintaining coordinator facts; a snapshot does not automatically reconcile those facts. Keep the timestamp as an exact ISO UTC string.
4. Record the receipt, generate a snapshot, then check without generating:

```
node scripts/agent-receipt.mjs ../my-private-ledger ../my-private-ledger/receipt-input.json
node scripts/build-continuity-snapshot.mjs ../my-private-ledger my-project
node scripts/build-continuity-snapshot.mjs ../my-private-ledger my-project --check
```

The snapshot command returns its immutable path. Its receipt table omits summaries and per-receipt source revisions: open the original receipt JSON and full handoff for those details. `current` means local input consistency; coordinator facts can lag and a disconnected copy can miss remote updates. `--check` verifies the expected view for the current local inputs; it does not write, synchronize, publish or establish remote freshness. Run generation first: `--check` can report STALE if the view is missing or inputs changed. Inspect new inputs, then explicitly generate and check again. CORRUPT/CONFLICT are investigation failures, not permission to overwrite evidence. An identical receipt retry uses the same ID and exact fields; a new report needs a new unique ID and timestamp. Never reuse an ID with changed content.

5. For Git storage, include `.gitattributes` in the **first commit**, before anyone clones. Ordinary code, configuration and documentation use LF. `history/`, `receipts/`, `snapshots/` and `CURRENT_STATE.md` are byte-preserved (`-text`) because hashes/canonical comparisons depend on their exact contents. Keep these rules in every newly initialized workspace. Adding them after Git has already rewritten evidence cannot recover the original bytes: restore from a verified original, never normalize evidence to make checks pass.

No remote is configured automatically; local-ready requires no remote. A user-owned remote requires explicit destination/access approval and verified effective fetch/push targets and visibility. A public fork is not a private ledger; unknown visibility remains unverified. Do not alter existing remotes or security settings. Do not publish records to the public toolkit or publisher team. Commit/synchronize only through the adopter's separately approved private workflow. A clean `--check` means local consistency, not verified membership or approval.

For sharing, the recommended path is an existing approved private ledger or a new private continuity repository in the user's own verified GitHub account, under explicit creation/destination/access approval. Follow the [account and destination procedure](ONBOARDING.md#recommended-path-your-own-private-continuity-repository) before creating or connecting it. Verify the acting account, owner, private visibility and all effective fetch/push URLs before real-data writes into a Git-connected ledger or publication. A wrong account/origin/pushurl or unknown visibility blocks sync; no automatic credential change, remote repair, push or reader enrollment is authorized by these examples. Toolkit updates remain separate from the user's records.

## Independently verify extraction provenance

`PROVENANCE.json` distinguishes the SHA-256 of the exact Git blob contents from optional working-checkout bytes. Git's blob object ID is recorded separately. Exports are derived from raw `git show COMMIT:PATH` stdout using the explicit ordered transformations; no workspace-byte hash is presented as a commit hash. With authorized access to the source checkout, run:

```
node tools/verify-provenance.mjs SOURCE_CHECKOUT
```

This reads locally only, verifies all five source blobs and reconstructs each exported file byte-for-byte. It does not fetch a repository, execute source code, establish authorship or resolve license rights. New example/tools/tests/docs are candidate-specific additions, not covered by the five-file extraction manifest; their bytes are inventoried by `MANIFEST.json`.
