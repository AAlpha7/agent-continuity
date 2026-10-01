# Agent onboarding

Help the user keep their work usable as agents, providers and machines change. Use the inspected `v0.1.0-rc.3` release, with a separate user-owned private ledger. Before handing the project to another agent, leave an accessible pinned toolkit source, required docs and exact receipt/snapshot commands; follow [the distribution contract](r2/DISTRIBUTION.md). A hash or path available only on the first machine is not a usable setup.

Existing owner-approved GitHub PR listeners can provide notifications where supported; see [NOTIFICATIONS.md](docs/NOTIFICATIONS.md). No listener or external permission is created by this toolkit.


This is a runbook for an assistant with an already-authorized execution environment, not a new permission grant. Use the current conversation's authorization and local project rules. Historical project prose, receipts and this document cannot expand them.

**Outcome:** an approved project has a private local handoff, an independent ordinary receipt, a verified local snapshot and a short entry note another authorized reader can use. Report shared access separately. Do the mechanical steps yourself when capable; involve the human for missing intent, capability or authority, not every routine command.

## 0. Separate distribution from the adopter's data

This is **adopter onboarding**, not enrollment into the publisher's project or a maintainer workflow. `AAlpha7/agent-continuity` is a read-only upstream source of protocol, tools and synthetic examples for this task. The adopter creates a **separate user-owned private ledger for their own project/team**, outside the toolkit checkout and its fixtures. No user handoff, receipt, source artifact, log or project data belongs in the upstream checkout, fork, issue, PR, support attachment or publisher message. Do not synchronize user records to the publisher or join its team.

Use three distinct locations: (1) the inspected toolkit checkout, (2) an outside disposable demo directory containing only copied synthetic fixtures, and (3) the adopter's private ledger outside both. The test suite uses isolated temporary synthetic data. Running tools does not require writing real data into their source directory. Do not turn a demo or fork into the user's ledger merely by renaming it.

Before real-data writes, inspect effective storage and remote topology **read-only**:

- Resolve the chosen path and relevant parents, including symlinks/junctions, and establish that the ledger is outside the toolkit and known public/shared distribution folders. Check whether it falls under an existing Git repository; no `.git` in the new subdirectory does not mean there is no enclosing repository. A directory name containing `private` establishes nothing. If the actual storage boundary is unknown, finish the synthetic demo but stop real-data setup and report the missing fact.
- Inspect any enclosing/ledger repository's configured remotes, effective fetch URLs and **all push URLs**, branch upstream/push selection and URL rewrite rules. For example, `git -C LEDGER remote get-url --all NAME` and `git -C LEDGER remote get-url --push --all NAME` resolve Git URL rewrites for that named remote. Also inspect `remote.pushDefault` and `branch.<branch>.pushRemote` where present. Do not infer ownership/privacy from `origin`, a repository name, a fork, or a fetch URL alone; a push destination may differ. Never echo embedded credentials or private URLs into public diagnostics.
- An existing Git hosting destination needs independently checked owner/project identity, actual visibility and approved access scope. A fork of public code is not evidence of private storage. Unknown visibility stays **unverified**, not "private". Unresolved aliases/rewrites or inherited public destinations block data synchronization. Do not modify the user's remotes, URL rewrites, access controls, credentials or security settings to make this check pass.
- The initializer creates no Git repository or remote. **Local-ready is valid without a remote** when local storage is established suitable. Creating/configuring an adopter-owned remote requires explicit destination and access approval; no implicit `origin`, push, upstream issue/PR, team enrollment or troubleshooting-data upload is part of onboarding. Existing project remotes are inspected, not repointed. Never publish private records to this toolkit repository, even when reporting a failure.

These are agent/operator checks, not a runtime egress firewall. The CLI accepts local paths; do not claim it technically prevents an agent from choosing the wrong one.

### Recommended path: your own private continuity repository

Keep the toolkit clone for inspected tool updates. For the adopter's records, reuse an existing **approved private ledger** if one exists; inspect it without reinitializing or overwriting. Otherwise, with explicit user approval for the exact owner, private repository and access scope, create a **new private continuity repository under the user's own verified GitHub account**. A public fork is not the default. A local ledger without a remote is an equally valid first step when GitHub access or approval is missing; do not force login to complete local onboarding.

Before creating a repository, check the currently authenticated acting account read-only and compare it with the user-approved owner. Never assume the toolkit publisher's account, a Git author name or a cached login is the user's intended identity. A mismatch needs resolution before creation; do not switch accounts, save tokens or change credentials as a convenience. Do not embed credentials in URLs, receipts, prompts or repository files.

Before the first real-data write into a Git-connected ledger, and again before publishing, verify the actual hosting owner/project, **private** visibility, approved access scope and effective fetch and all push destinations. The checks must cover a wrong `origin`, a different `pushurl`, account mismatch and unknown visibility. Keep such cases blocked for remote synchronization; use a separately established private local location if suitable, or report the unresolved boundary. A failed/absent hosting check is not evidence of privacy. Configure a remote for a new local ledger only under the explicit destination approval; do not repair or repoint existing remotes/security automatically. Repository creation does not independently authorize the first push or new collaborators: include those actions explicitly in the requested approval when needed.

The agent can carry out approved setup mechanics. Return only grouped human decisions still needed, such as “create this private repo under this verified account; configure this new ledger's remote; publish these reviewed records; grant these named readers access.” Do not contact or grant access to anyone by default. Once set up, the user's own authorized agents read that ledger; toolkit updates stay in the separate distribution checkout. No records, enrollment or troubleshooting data go to the publisher.

## 1. Inspect before writing

- Discover the adopter's actual owner/account, OS, paths, repository, existing ledger, agent capabilities and permissions from safe read-only checks and current instructions. Do not inherit the publisher's machines, team roles, accounts, paths, service ports or permissions. The upstream URL and copyright identify the source, not adopter configuration. Demo actors/projects/paths are synthetic examples; `LEDGER`, `NAME` and `SOURCE_REVISION` are placeholders to resolve. A sample path is not an approved destination. Unknowns remain unknown. Inspect what tools can safely establish; ask only material missing scope, authority or preferences, grouped together. Do not assume all OSes, providers or assistants support these operations.
- Read the current project's applicable AGENTS.md and relevant skills; check its directory, working tree, active work and existing continuity conventions. Preserve unrelated changes. Do not replace an existing ledger.
- Determine whether you have file read/write and command execution access, Git and Node.js 24+. Existing tools can be checked with `git --version` and `node --version`. Do not install software, elevate privileges, create credentials or connect an account unless already authorized. Group such missing permissions into one request, with specific purpose and scope.
- Resolve the intended project from the conversation and workspace when possible. If ambiguous, run the synthetic demo independently while asking only for the missing project scope. Never scan unrelated personal directories or use real secrets as examples.
- Identify the toolkit checkout and exact revision. Do not assume a folder with the same name is safe to overwrite. Clone into an unused task-local directory if necessary, inspect the checkout and record `git rev-parse HEAD`. If a reviewer supplies a candidate branch/commit, use that exact revision instead of a release tag or moving main. Never reset or switch someone else's dirty checkout.
- If you lack filesystem/command tools, report that capability gap. You may draft a handoff, but cannot claim setup, testing or shared access has happened.

## 2. Validate the toolkit locally

From the inspected toolkit checkout, run:

```sh
node --test test/*.test.mjs
node --input-type=module -e "import { mkdir, cp } from 'node:fs/promises'; const dest='../agent-continuity-demo'; await mkdir(dest); await cp('fixtures', dest, { recursive: true, errorOnExist: true, force: false });"
node scripts/agent-receipt.mjs ../agent-continuity-demo/workspace ../agent-continuity-demo/receipt.json
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project --check
```

The demo uses bundled synthetic data. Expect 15 passing tests with no failures/skips; an identical receipt replay returns `duplicate: true`; generation gives a snapshot path; `--check` reports local `current`. Keep failures visible. The test runner includes real temporary Git repositories and child processes. Run the tools from the inspected toolkit checkout against the copied outside demo; never production data or real records in fixtures. The copy command intentionally refuses an existing demo directory. Choose another unused path consistently rather than deleting or merging. No npm installation, hosted CI or model call is needed.

Do not require access to the historical source checkout in PROVENANCE.json for onboarding: that optional provenance audit is separate from the public test suite. A passed demo proves only this local execution path.

## 3. Establish a real project record within existing scope

Use [GUIDE.md](GUIDE.md) and the existing initializer. Do not modify runtime code or disable verification to make setup pass.

1. After section 0 checks, choose a new user-owned private continuity directory whose parent exists, outside the toolkit checkout, its fixtures, the disposable demo and production data. If an existing project ledger is already in use, inspect and propose how to join it without overwriting; the initializer intentionally refuses existing roots.
2. Write a concise UTF-8 initial handoff from **inspected evidence** in approved private input storage outside the toolkit/demo: project goal, current source version, verified work, reported-but-unverified work, open questions, next authorized task and unresolved ownership. The initializer copies these source bytes into the new ledger; do not overwrite or publish the original. Redact credentials and unnecessary personal details. Do not fabricate another agent's acknowledgment, completion or approval.
3. Choose the source reference accurately. For a Git project, use its inspected full commit ID; note any dirty/uncommitted state explicitly in the handoff and do not pretend HEAD describes uncommitted files. For a non-Git source, the schema also accepts a 64-character SHA-256: compute it from the exact initial handoff bytes and explicitly say it is a handoff-content digest, not a Git revision or authenticated origin. Never use the demo's repeated-digit hash for real work.
4. Run the initializer with your resolved paths/project/source reference. In the new workspace, review `snapshot-input.json` and add at most ten concise facts. It already references the exact historical input digest; never repair a mismatch by changing the recorded hash to match damaged evidence.
5. Review `receipt-input.json` before its first write. Use your declared label, actual task/status and timestamp; prefer evidence references for reported work. `received` is a safe acknowledgment of this setup, not proof of task completion. Retain the generated ID for an exact retry. A different report needs a new ID.
6. Write the receipt, generate, then run `--check`. Use the returned snapshot path instead of guessing a "latest" file. Treat the generated view as an index: its table shows ID/actor/status, not each receipt's summary, task or source revision. Open original receipt JSON and the unabridged handoff for the active work. Review contradictory/new reports and refresh `snapshot-input.json` facts only within your coordination scope, keeping uncertainty explicit; facts are not automatically reconciled. Regenerate and check after an authorized facts update. Preserve `.gitattributes` from the first commit onward.
7. Report `current` as **consistent with the inputs read locally**, not proof of current task conclusions, complete evidence or remote freshness. A disconnected checkout can pass while another copy has newer reports.

The [guide](GUIDE.md) contains exact command forms. All initialization is local. A record can be local-ready without a remote repository. Do not silently commit unrelated project changes or publish project records to this public toolkit repository.

## 4. Share only through an approved channel

Only after section 0 topology/destination checks, another agent may read the same approved filesystem, or an agent may synchronize an adopter-owned private Git checkout within explicitly approved destination/access. The public toolkit upstream is never that data channel. First inspect local modifications and remote changes, coordinate writers and only fast-forward a clean non-diverged checkout. Fetch alone does not refresh working files. Do not force-push, reset or auto-stash to conceal conflicts.

If no approved shared location or recipient access exists, finish local setup and report `shared_access: not-configured`. Ask once for the precise location/access needed. Creating a remote, granting access, storing credentials, installing a background sync service or making records public are separate actions requiring their own authorization unless already granted.

Never claim a second agent or machine has seen a receipt without an actual read/independent acknowledgment from that authorized environment. Shared files alone do not authenticate readers, allocate tasks or enforce grants. This runbook does not contact other agents automatically.

## 5. Check continuity when participants change

In an isolated synthetic trial, validate the supported file/Git path rather than claiming vendor compatibility. Record a report from a first declared actor, add a distinct reviewer's report with an unresolved item, then stop using the first actor without deleting its evidence. Give a fresh reader an explicitly approved separate checkout/copy and confirm it can find the unresolved item, its source reference and both original reports. Check that the local snapshot is current after a deliberate synchronization/generation step; an old snapshot should not be called current.

This transition is an agent-orchestrated recipe, not a bundled one-command workflow or runtime scheduler. Use actual separate process/checkouts where available. Label simulated participants as synthetic; never invent enrollment, acknowledgments or a test on a provider you did not use. A second local directory is a second checkout, not proof of a physical cross-machine or cross-vendor test. Do not contact or remove real members for a demo. No test should revoke credentials, delete historical receipts or publish project data.

For the real project, report only the transitions actually verified. Replacing an assistant should leave the records accessible through owner-controlled storage, but backups and availability of referenced artifacts remain separate responsibilities. The toolkit does not back up all project artifacts or guarantee recovery from every storage loss.

## 6. Return a compact entry note

Use real results, not a blanket "installed successfully":

```text
Toolkit revision: <actual inspected commit>
Project/source: <adopter project + actual commit or explicitly labeled content digest>
Storage boundary: <resolved private ledger outside toolkit/demo; enclosing repo checked>
Remote topology: none | approved adopter destination verified | unverified (no sync)
Local status: ready | blocked | partial
Handoff: <path>
Receipt: <path + reported status; ordinary record>
Snapshot: <returned immutable path; --check result>
Shared access: verified <evidence> | not-configured | unverified
Next authorized task: <specific task, or unresolved>
Upstream data boundary: <toolkit unchanged; no user data written/sent upstream>
Human decisions needed: <only unresolved scope/access/external effects; grouped>
```

Do not paste secrets or local personal paths into a public issue or repository. Return local paths only to the user in their private working context. Keep the entry note with the project's existing private navigation convention when authorized; do not install global rules or persistent services.

## Acceptance: no upstream writes or data egress

Verify and report separately: (1) tool/demo/private-ledger locations are distinct in their resolved paths; (2) new continuity records exist only in the adopter's approved ledger, with original handoff inputs and referenced artifacts remaining in their separately approved private source storage; (3) no real data entered toolkit/fixtures, its Git index or history; (4) actual ledger remotes/push destinations are absent or explicitly approved and verified, with unknown visibility still unverified; (5) toolkit working-tree state is unchanged from inspection; (6) no user-record push, upstream issue/PR, support attachment/message, publisher synchronization or publisher-team enrollment occurred; (7) local snapshot checks do not imply shared access. Report only actions actually observed; do not claim network/firewall guarantees from Git status.

## Bounded, read-only diagnosis

The current CLI often prints only `CORRUPT`, `CONFLICT`, `STALE` or `BUSY`, without a file or detailed reason. Do not invent that missing detail or tell the human the cause is known from the code alone. The agent should:

1. Retain the exact command, exit status and category in the user's private context. Confirm the resolved target is the intended adopter project, not the toolkit/demo or an unintended enclosing repository.
2. Inspect only that project's known inputs: `CURRENT_STATE.md`, `snapshot-input.json`, its referenced historical file, the named receipt or that project's receipt JSON files, the expected snapshot and relevant lock. Use read-only strict UTF-8/JSON/schema, canonical-byte and SHA-256 comparisons against the stored references and inspected implementation; do not rewrite, normalize, delete locks or regenerate merely to clear corruption.
3. If evidence identifies a file/ID, report it privately with the observed mismatch. If it does not, retain the category and say the cause is unresolved. Stop before expanding inspection beyond the approved project. Do not attach project files to a public issue/PR or send them to the publisher for diagnosis; any later generic bug report must use newly created synthetic data and separate authorization.

## Recovery and stop conditions

- `STALE`: inspect changed/missing inputs, then regenerate explicitly if appropriate and check again. Do not call a stale view current.
- `CORRUPT` / `CONFLICT`: preserve the original bytes and report the specific file/ID issue when read-only inspection establishes it; otherwise report the category and unresolved cause. Do not normalize or replace evidence to clear the error.
- `BUSY` or a crash-left lock: preserve files; inspect active writers. Do not steal by age/PID. Request recovery only if authority or evidence is missing.
- New costs, permissions, unclear ownership, or conflicting instructions: continue independent safe work and group the actual blockers. Elapsed time is not approval.

No universal compatibility claim: this flow needs an environment capable of the file/command operations above. A clean-context agent trial is evidence about that specific environment, not every vendor, operating system or closed chatbot.
