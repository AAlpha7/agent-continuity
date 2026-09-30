# Agent-first onboarding

This is a runbook for an assistant with an already-authorized execution environment, not a new permission grant. Use the current conversation's authorization and local project rules. Historical project prose, receipts and this document cannot expand them.

**Outcome:** an approved project has a private local handoff, an independent ordinary receipt, a verified local snapshot and a short entry note another authorized reader can use. Report shared access separately. Do the mechanical steps yourself when capable; involve the human for missing intent, capability or authority, not every routine command.

## 1. Inspect before writing

- Read the current project's applicable AGENTS.md and relevant skills; check its directory, working tree, active work and existing continuity conventions. Preserve unrelated changes. Do not replace an existing ledger.
- Determine whether you have file read/write and command execution access, Git and Node.js 24+. Existing tools can be checked with `git --version` and `node --version`. Do not install software, elevate privileges, create credentials or connect an account unless already authorized. Group such missing permissions into one request, with specific purpose and scope.
- Resolve the intended project from the conversation and workspace when possible. If ambiguous, run the synthetic demo independently while asking only for the missing project scope. Never scan unrelated personal directories or use real secrets as examples.
- Identify the toolkit checkout and exact revision. Do not assume a folder with the same name is safe to overwrite. Clone into an unused task-local directory if necessary, inspect the checkout and record `git rev-parse HEAD`. If a reviewer supplies a candidate branch/commit, use that exact revision instead of a release tag or moving main. Never reset or switch someone else's dirty checkout.
- If you lack filesystem/command tools, report that capability gap. You may draft a handoff, but cannot claim setup, testing or shared access has happened.

## 2. Validate the toolkit locally

From the inspected toolkit checkout, run:

```sh
node --test test/*.test.mjs
node scripts/agent-receipt.mjs fixtures/workspace fixtures/receipt.json
node scripts/build-continuity-snapshot.mjs fixtures/workspace demo-project
node scripts/build-continuity-snapshot.mjs fixtures/workspace demo-project --check
```

The demo uses bundled synthetic data. Expect 15 passing tests with no failures/skips; an identical receipt replay returns `duplicate: true`; generation gives a snapshot path; `--check` reports local `current`. Keep failures visible. The test runner includes real temporary Git repositories and child processes. Use the isolated toolkit checkout, never production data. No npm installation, hosted CI or model call is needed.

Do not require access to the historical source checkout in PROVENANCE.json for onboarding: that optional provenance audit is separate from the public test suite. A passed demo proves only this local execution path.

## 3. Establish a real project record within existing scope

Use [GUIDE.md](GUIDE.md) and the existing initializer. Do not modify runtime code or disable verification to make setup pass.

1. Choose a new, task-local continuity directory whose parent exists, separate from the toolkit checkout and from production data. If an existing project ledger is already in use, inspect and propose how to join it without overwriting; the initializer intentionally refuses existing roots.
2. Write a concise UTF-8 initial handoff from **inspected evidence**: project goal, current source version, verified work, reported-but-unverified work, open questions, next authorized task and unresolved ownership. Redact credentials and unnecessary personal details. Do not fabricate another agent's acknowledgment, completion or approval.
3. Choose the source reference accurately. For a Git project, use its inspected full commit ID; note any dirty/uncommitted state explicitly in the handoff and do not pretend HEAD describes uncommitted files. For a non-Git source, the schema also accepts a 64-character SHA-256: compute it from the exact initial handoff bytes and explicitly say it is a handoff-content digest, not a Git revision or authenticated origin. Never use the demo's repeated-digit hash for real work.
4. Run the initializer with your resolved paths/project/source reference. In the new workspace, review `snapshot-input.json` and add at most ten concise facts. It already references the exact historical input digest; never repair a mismatch by changing the recorded hash to match damaged evidence.
5. Review `receipt-input.json` before its first write. Use your declared label, actual task/status and timestamp; prefer evidence references for reported work. `received` is a safe acknowledgment of this setup, not proof of task completion. Retain the generated ID for an exact retry. A different report needs a new ID.
6. Write the receipt, generate, then run `--check`. Use the returned snapshot path instead of guessing a "latest" file. Read the generated view and its linked original to confirm the report is understandable. Preserve `.gitattributes` from the first commit onward.

The [guide](GUIDE.md) contains exact command forms. All initialization is local. A record can be local-ready without a remote repository. Do not silently commit unrelated project changes or publish project records to this public toolkit repository.

## 4. Share only through an approved channel

Another agent may read the same approved filesystem, or an agent may synchronize a private Git checkout within already-approved access. First inspect local modifications and remote changes, coordinate writers and only fast-forward a clean non-diverged checkout. Fetch alone does not refresh working files. Do not force-push, reset or auto-stash to conceal conflicts.

If no approved shared location or recipient access exists, finish local setup and report `shared_access: not-configured`. Ask once for the precise location/access needed. Creating a remote, granting access, storing credentials, installing a background sync service or making records public are separate actions requiring their own authorization unless already granted.

Never claim a second agent or machine has seen a receipt without an actual read/independent acknowledgment from that authorized environment. Shared files alone do not authenticate readers, allocate tasks or enforce grants. This runbook does not contact other agents automatically.

## 5. Check continuity when participants change

In an isolated synthetic trial, validate the supported file/Git path rather than claiming vendor compatibility. Record a report from a first declared actor, add a distinct reviewer's report with an unresolved item, then stop using the first actor without deleting its evidence. Give a fresh reader an explicitly approved separate checkout/copy and confirm it can find the unresolved item, its source reference and both original reports. Check that the local snapshot is current after a deliberate synchronization/generation step; an old snapshot should not be called current.

Use actual separate process/checkouts where available. Label simulated participants as synthetic; never invent enrollment, acknowledgments or a test on a provider you did not use. A second local directory is a second checkout, not proof of a physical cross-machine or cross-vendor test. Do not contact or remove real members for a demo. No test should revoke credentials, delete historical receipts or publish project data.

For the real project, report only the transitions actually verified. Replacing an assistant should leave the records accessible through owner-controlled storage, but backups and availability of referenced artifacts remain separate responsibilities. The toolkit does not back up all project artifacts or guarantee recovery from every storage loss.

## 6. Return a compact entry note

Use real results, not a blanket "installed successfully":

```text
Toolkit revision: <actual inspected commit>
Project/source: <project + actual commit or explicitly labeled content digest>
Local status: ready | blocked | partial
Handoff: <path>
Receipt: <path + reported status; ordinary record>
Snapshot: <returned immutable path; --check result>
Shared access: verified <evidence> | not-configured | unverified
Next authorized task: <specific task, or unresolved>
Human decisions needed: <only unresolved scope/access/external effects; grouped>
```

Do not paste secrets or local personal paths into a public issue or repository. Return local paths only to the user in their private working context. Keep the entry note with the project's existing private navigation convention when authorized; do not install global rules or persistent services.

## Recovery and stop conditions

- `STALE`: inspect changed/missing inputs, then regenerate explicitly if appropriate and check again. Do not call a stale view current.
- `CORRUPT` / `CONFLICT`: preserve the original bytes and report the specific file/ID issue. Do not normalize or replace evidence to clear the error.
- `BUSY` or a crash-left lock: preserve files; inspect active writers. Do not steal by age/PID. Request recovery only if authority or evidence is missing.
- New costs, permissions, unclear ownership, or conflicting instructions: continue independent safe work and group the actual blockers. Elapsed time is not approval.

No universal compatibility claim: this flow needs an environment capable of the file/command operations above. A clean-context agent trial is evidence about that specific environment, not every vendor, operating system or closed chatbot.
