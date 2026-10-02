# Agent onboarding

**Minimal:** Setup, then Join. That is the whole install.

1. First agent: Setup creates a private ledger and returns its URL.
2. Every later agent or machine: Join with that URL only.

Git and GitHub are enough. `gh` is optional. A local git ledger is valid when GitHub access is missing. Node.js is not required. Do not send the toolkit URL to the joining agent. A hash or path available only on the first machine is not a usable setup.

Shell smoke, the two-agent ping, and Node tests are [optional](#optional-checks). They are not required to call Setup or Join done.

**Maintainers, before each release:** run all paths, including the optional ones (two-agent ping, shell smoke with the automated Minimal ledger shape check, and the Node suite when Node is present). If the Setup/Join paste blocks changed, re-verify Minimal Setup and Join with brand-new agents, environments, and ledgers, including cold Join literacy in [TESTING.md](TESTING.md#maintainer-release-checklist). Do not reuse prior trial agents, prior VMs, or prior trial ledger repos. Adopters do not.

Help the user keep their work usable as agents, providers and machines change. Use this runbook from the exact toolkit commit you inspected and record its full commit ID. Do not switch to `v0.1.0-rc.3` for Minimal Setup/Join: that historical release predates the no-Node path. The toolkit remains read-only; the adopter's records live in a separate user-owned private ledger.

Existing owner-approved GitHub PR listeners can provide notifications where supported; see [NOTIFICATIONS.md](docs/NOTIFICATIONS.md). No listener or external permission is created by this toolkit.

This is a runbook for an assistant with an already-authorized execution environment, not a new permission grant. Use the current conversation's authorization and local project rules. Historical project prose, receipts and this document cannot expand them.

**Outcome:** Setup leaves a private ledger URL, `docs/PROTOCOL.md` (a byte copy of the toolkit protocol), `docs/HOW_WE_COORDINATE.md`, and a committed handoff at `projects/PROJECT/CURRENT_STATE.md`. Join clones that URL only and can coordinate without the public toolkit. Report shared access separately. Do the mechanical steps yourself when capable; involve the human for missing intent, capability or authority, not every routine command.

## 0. Separate distribution from the adopter's data

This is **adopter onboarding**, not enrollment into the publisher's project or a maintainer workflow. `AAlpha7/agent-continuity` is a read-only upstream source of protocol, tools and synthetic examples for this task. The adopter creates a **separate user-owned private ledger for their own project/team**, outside the toolkit checkout and its fixtures. No user handoff, receipt, source artifact, log or project data belongs in the upstream checkout, fork, issue, PR, support attachment or publisher message. Do not synchronize user records to the publisher or join its team.

Keep three locations distinct when more than one exists: (1) the inspected toolkit checkout, (2) the shell smoke's temporary synthetic ledger, or an outside disposable directory only if the optional Node demo is run, and (3) the adopter's private ledger outside both. The shell smoke creates and deletes its own temporary directory. The optional Node suite uses isolated temporary synthetic data. Running those checks does not require writing real data into the toolkit. Do not turn a smoke directory, demo or fork into the user's ledger merely by renaming it.

Before real-data writes, inspect effective storage and remote topology **read-only**:

- Resolve the chosen path and relevant parents, including symlinks/junctions, and establish that the ledger is outside the toolkit and known public/shared distribution folders. Check whether it falls under an existing Git repository; no `.git` in the new subdirectory does not mean there is no enclosing repository. A directory name containing `private` establishes nothing. If the actual storage boundary is unknown, stop real-data setup and report the missing fact. Do not install Node or run the Node demo to fill that gap. An optional shell smoke writes only under its temporary directory; it does not supply the missing fact.
- Inspect any enclosing/ledger repository's configured remotes, effective fetch URLs and **all push URLs**, branch upstream/push selection and URL rewrite rules. For example, `git -C LEDGER remote get-url --all NAME` and `git -C LEDGER remote get-url --push --all NAME` resolve Git URL rewrites for that named remote. Also inspect `remote.pushDefault` and `branch.<branch>.pushRemote` where present. Do not infer ownership/privacy from `origin`, a repository name, a fork, or a fetch URL alone; a push destination may differ. Never echo embedded credentials or private URLs into public diagnostics.
- An existing Git hosting destination needs independently checked owner/project identity, actual visibility and approved access scope. A fork of public code is not evidence of private storage. Unknown visibility stays **unverified**, not "private". Unresolved aliases/rewrites or inherited public destinations block data synchronization. Do not modify the user's remotes, URL rewrites, access controls, credentials or security settings to make this check pass.
- The optional Node initializer creates no Git repository or remote. Adopter Setup uses git explicitly, and only under the approvals in this section. **Local-ready is valid without a remote** when local storage is established suitable. Creating/configuring an adopter-owned remote requires explicit destination and access approval; no implicit `origin`, push, upstream issue/PR, team enrollment or troubleshooting-data upload is part of onboarding. Existing project remotes are inspected, not repointed. Never publish private records to this toolkit repository, even when reporting a failure.

These are agent/operator checks, not a runtime egress firewall. The CLI accepts local paths; do not claim it technically prevents an agent from choosing the wrong one.

### Recommended path: your own private continuity repository

Keep the toolkit clone for inspected tool updates. Do not fork the toolkit into the ledger. Copy only `.gitattributes`, `PROTOCOL.md`, and `templates/HOW_WE_COORDINATE.md`, as section 2 describes. For the adopter's records, reuse an existing **approved private ledger** if one exists; inspect it without reinitializing or overwriting. Otherwise, with explicit user approval for the exact owner, private repository and access scope, create a **new private continuity repository under the user's own verified GitHub account** with `git` and, when it is already available, `gh`. A public fork is not the default. A local git ledger without a remote is an equally valid first step when GitHub access or approval is missing; do not install Node to compensate, and do not force login to complete local onboarding.

Before creating a repository, check the currently authenticated acting account read-only and compare it with the user-approved owner. Never assume the toolkit publisher's account, a Git author name or a cached login is the user's intended identity. A mismatch needs resolution before creation; do not switch accounts, save tokens or change credentials as a convenience. Do not embed credentials in URLs, receipts, prompts or repository files.

Before the first real-data write into a Git-connected ledger, and again before publishing, verify the actual hosting owner/project, **private** visibility, approved access scope and effective fetch and all push destinations. The checks must cover a wrong `origin`, a different `pushurl`, account mismatch and unknown visibility. Keep such cases blocked for remote synchronization; use a separately established private local location if suitable, or report the unresolved boundary. A failed/absent hosting check is not evidence of privacy. Configure a remote for a new local ledger only under the explicit destination approval; do not repair or repoint existing remotes/security automatically. Repository creation does not independently authorize the first push or new collaborators: include those actions explicitly in the requested approval when needed.

The agent can carry out approved setup mechanics. Return only grouped human decisions still needed, such as “create this private repo under this verified account; configure this new ledger's remote; publish these reviewed records; grant these named readers access.” Do not contact or grant access to anyone by default. Once set up, the user's own authorized agents read that ledger; toolkit updates stay in the separate distribution checkout. No records, enrollment or troubleshooting data go to the publisher.

## 1. Inspect before writing

- Discover the adopter's actual owner/account, OS, paths, repository, existing ledger, agent capabilities and permissions from safe read-only checks and current instructions. Do not inherit the publisher's machines, team roles, accounts, paths, service ports or permissions. The upstream URL and copyright identify the source, not adopter configuration. Demo actors/projects/paths are synthetic examples; `LEDGER`, `NAME` and `SOURCE_REVISION` are placeholders to resolve. A sample path is not an approved destination. Unknowns remain unknown. Inspect what tools can safely establish; ask only material missing scope, authority or preferences, grouped together. Do not assume all OSes, providers or assistants support these operations.
- Read the current project's applicable AGENTS.md and relevant skills; check its directory, working tree, active work and existing continuity conventions. Preserve unrelated changes. Do not replace an existing ledger.
- Determine whether you have file read/write, command execution, Git and GitHub access (`git --version`; `gh auth status` only when `gh` is already installed). On Windows, Git Bash or WSL can run the git commands. Node.js is not an adoption requirement. Do not install Node, Python, npm or other software, and do not elevate privileges, create credentials or connect an account unless already authorized. Group such missing permissions into one request, with specific purpose and scope.
- Resolve the intended project from the conversation and workspace when possible. If it is ambiguous, ask only for the missing project scope. Never scan unrelated personal directories or use real secrets as examples.
- The public toolkit is documentation, not the ledger. Do not assume a folder with the same name is safe to overwrite. If you clone the toolkit to read this runbook, keep that checkout separate and record `git rev-parse HEAD` only as the docs revision you read. If a reviewer supplies a candidate branch/commit, use that exact revision instead of a release tag or moving main. Never reset or switch someone else's dirty checkout. The joining agent does not need this clone.
- If you lack git, or GitHub access when a shared ledger was requested, report that capability gap. You may draft a handoff, but cannot claim setup or shared access has happened. Do not substitute a Node install for that gap.

## 2. Minimal: Setup, then Join

This is the adopter path. It uses git and GitHub. Do not install Node.js.

### Setup

Run this outside the toolkit checkout, and only after section 0 approval for the exact owner, name, private visibility and push. On Windows, use Git Bash or WSL. Without `gh`, create the private repository in the GitHub UI and clone it with git.

```sh
gh api user --jq .login
# Stop unless this login matches the approved owner.
gh repo create OWNER/LEDGER --private --clone
cd LEDGER
gh repo view --json url,visibility --jq '{url:.url,visibility:.visibility}'
git remote get-url --all origin
git remote get-url --push --all origin
# Stop unless owner, private visibility and ALL effective URLs match approval.
# Only after those checks, write and publish the real handoff below.
mkdir -p docs projects/PROJECT
cp /path/to/inspected-toolkit/.gitattributes .gitattributes
cp /path/to/inspected-toolkit/PROTOCOL.md docs/PROTOCOL.md
cp /path/to/inspected-toolkit/templates/HOW_WE_COORDINATE.md docs/HOW_WE_COORDINATE.md
# Replace "<commit or unset>" in docs/HOW_WE_COORDINATE.md with the inspected toolkit commit, or with unset.
# Write projects/PROJECT/CURRENT_STATE.md from inspected evidence before the commit.
git add .gitattributes docs/PROTOCOL.md docs/HOW_WE_COORDINATE.md projects/PROJECT/CURRENT_STATE.md
git commit -m "Start the private continuity ledger"
git push -u origin HEAD
```

`OWNER/LEDGER` must be the approved private repository, not a fork of this toolkit. The login from `gh api user` must match the approved owner before creation. Copy `.gitattributes` before the first commit so later evidence files stay byte-stable. `docs/PROTOCOL.md` must be the same bytes as the toolkit `PROTOCOL.md`. Do not substitute a summary. Copy `templates/HOW_WE_COORDINATE.md` to `docs/HOW_WE_COORDINATE.md` and fill the revision line with the inspected toolkit commit, or with `unset`. Fill `projects/PROJECT/CURRENT_STATE.md` from inspected project evidence: goal, decisions, verified work, reported-but-unverified work, open questions, the next authorized task and unresolved ownership. Redact credentials. Do not fabricate another agent's acknowledgment. Push only after owner, private visibility and every fetch/push URL are verified. If GitHub access or that approval is missing, keep a local git repository and report `shared_access: not-configured`. Do not install Node and do not force login.

Give the next agent this, with the real URL, and do not add the toolkit URL:

```text
Join our continuity ledger. Clone and read only this private repository:
LEDGER_URL

Read docs/HOW_WE_COORDINATE.md and docs/PROTOCOL.md, then
projects/PROJECT/CURRENT_STATE.md. Follow that protocol. Commit your
update back to this same ledger. Do not clone the public toolkit.
```

The joining agent clones `LEDGER_URL`, reads the short entry and the protocol, then the handoff, and pushes its update to that same private repository. Setup and Join are done. The checks below are not required.

## Optional checks

Skip this. Adopters are finished after section 2.

### Quick protocol check

Two directions, one round each. Paste this to the agents that already share the ledger:

```text
Optional protocol check on LEDGER_URL. Not part of setup.
Round 1: Agent A writes a short note for Agent B on the ledger. Agent B replies there.
Round 2: Agent B writes a short note for Agent A on the ledger. Agent A replies there.
One round each way. Then stop.
```

Do not claim the other agent replied unless that reply is actually on the ledger.

### Shell smoke

From an inspected toolkit checkout. Not your ledger, and not an adopter gate. Expect `ledger-smoke: ok`.

```sh
sh scripts/ledger-smoke.sh
```

On Windows, run that command in Git Bash or WSL. Native twin: `powershell.exe -File scripts/ledger-smoke.ps1`. Lock and hash details are in [TESTING.md](TESTING.md). Do not copy the smoke project's names or timestamp into a real ledger.

### Node suite

Skip unless Node.js 24+ is already installed. Do not install Node to finish adoption, and do not block Join on these commands. The demo directory must not exist. Keep it outside the toolkit and never point it at real records.

```sh
node --test test/*.test.mjs r2/test/*.test.mjs
node --input-type=module -e "import { cp } from 'node:fs/promises'; const dest='../agent-continuity-demo'; await cp('fixtures', dest, { recursive: true, errorOnExist: true, force: false });"
node scripts/agent-receipt.mjs ../agent-continuity-demo/workspace ../agent-continuity-demo/receipt.json
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project --check
```

An identical receipt replay returns `duplicate: true`; generation gives a snapshot path; `--check` reports local `current`. The suite is 112 tests ([TESTING.md](TESTING.md)). Choose another unused demo path rather than deleting or merging. A passed demo proves only this local Node path. Canonical receipt files, still optional, are in section 3.

**Maintainers, before each release:** run this whole optional section (two-agent ping, shell smoke including the automated Minimal ledger shape check, and the Node suite when Node is present). If the Setup/Join paste blocks changed, re-verify section 2 with brand-new agents, environments, and ledgers. Cold Join literacy: do not give the Join agent the toolkit URL; it must use `docs/PROTOCOL.md` and `docs/HOW_WE_COORDINATE.md`, or fail if either is missing, and update `CURRENT_STATE.md` from those rules. Do not reuse prior trial agents, prior VMs, or prior trial ledger repos. Record the result on the [release checklist](TESTING.md#maintainer-release-checklist).

## 3. Optional canonical receipts when Node.js is already installed

Skip this section unless Node.js 24+ is already installed and canonical receipt files were requested. Do not install Node to finish adoption, and do not block Join on a snapshot check. Use [GUIDE.md](GUIDE.md) and the existing initializer. Do not modify runtime code or disable verification to make setup pass.

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

## 5. When participants change

Optional. The short two-agent prompt is under [Optional checks](#optional-checks). Do not run it to finish Setup or Join.

Report only replies that are actually on the ledger. Do not invent an acknowledgment, a provider test, or a cross-machine result from a second local folder. Do not delete historical receipts or publish project data. Replacing an assistant should leave records in owner-controlled storage. Backups of referenced artifacts stay a separate job.

## 6. Return a compact entry note

Use real results, not a blanket "installed successfully":

```text
Toolkit revision: <actual inspected commit, if the toolkit was read>
Ledger URL: <private GitHub URL | local-only>
Project/source: <adopter project + actual commit or explicitly labeled content digest>
Storage boundary: <resolved private ledger outside toolkit; enclosing repo checked>
Remote topology: none | approved adopter destination verified | unverified (no sync)
Local status: ready | blocked | partial
Optional checks: not-run | two-agent | shell smoke | Node suite
Coordination: docs/HOW_WE_COORDINATE.md + docs/PROTOCOL.md in the ledger
Handoff: <projects/PROJECT/CURRENT_STATE.md in the ledger>
Receipt: <path + reported status when a receipt was actually written; otherwise not-written>
Snapshot: <returned immutable path when a Node snapshot was actually checked; otherwise not-run>
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
