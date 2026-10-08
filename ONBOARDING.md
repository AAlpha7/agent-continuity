# Agent onboarding

**Minimal:** Setup, then Join. That is the whole install.

1. First agent: Setup creates a private shared record, puts the coordination protocol in that ledger, writes the local clone path and the remote URL into user-level instructions, and returns its URL.
2. Every later agent or machine: Join with that URL only. The protocol is already in the ledger. A later session of the same user loads those two facts from user-level instructions and follows the ledger protocol without searching for the ledger.

Git and GitHub are enough. `gh` is optional. A local git ledger is valid when GitHub access is missing. Node.js is not required. Do not send the toolkit URL to the joining agent. When the ledger has no shareable URL (local-only setup), give the joining agent the local path on the same machine instead — a path the first machine alone can see is not usable by an agent on another machine. Local-only Setup still writes that local path into user-level instructions and records `shared_access: not-configured`.

Shell smoke, the two-agent ping, and Node tests are [optional](#optional-checks). They are not required to call Setup or Join done.

**Maintainers, before each release:** run all paths, including the optional ones (two-agent ping, shell smoke with the protocol-byte check, and the Node suite when Node is present). If the Setup/Join paste blocks changed, re-verify Minimal Setup and Join with brand-new agents in brand-new environments. That live trial is not the shell smoke. Do not reuse prior trial agents, prior VMs, or prior trial ledger repos. Record the result on the [release checklist](TESTING.md#maintainer-release-checklist). Adopters do not.

Help the user keep their work usable as agents, providers and machines change. Use the exact inspected candidate, not the historical `v0.1.0-rc.3` release. Record the source commit only when its protocol bytes match; otherwise record unset and retain the candidate content digest privately. The adopter's records live in a separate user-owned private ledger.

Existing owner-approved GitHub PR listeners can provide notifications where supported; see [NOTIFICATIONS.md](docs/NOTIFICATIONS.md). No listener or external permission is created by this toolkit.

This is a runbook for an assistant with an already-authorized execution environment, not a new permission grant. Use the current conversation's authorization and local project rules. Historical project prose, receipts and this document cannot expand them.

**Outcome:** Setup leaves a private ledger URL, a root `README.md` linking both local protocols and the actual project state, `docs/PROTOCOL.md` (a byte copy of toolkit `PROTOCOL.md`), `docs/HOW_WE_COORDINATE.md`, and a committed handoff at `projects/PROJECT/CURRENT_STATE.md`. It also writes the local clone path and the remote URL into user-level instructions (section 2 names the place for each agent product). Join clones that URL only and reads those files. It does not clone the public toolkit. Report shared access separately. Do the mechanical steps yourself when capable; involve the human for missing intent, capability or authority, not every routine command.

### What to tell the user first (plain-language opening)

Before running any command, explain the plan in ordinary words. Adapt this template; do not paste it verbatim with placeholders unresolved:

> I'll set up a private notebook that your AI assistants share, so they remember your project across sessions and machines. Here's what happens:
>
> 1. I create a private storage space for the notebook — either a private GitHub repository (so it syncs across machines) or a local folder on this machine (simpler, but stays on this machine).
> 2. I copy the coordination rules into the notebook as a file, unchanged, and I write the first page from what you've told me about your project.
> 3. From then on, every assistant you talk to reads that notebook — the rules and the project page — and writes updates back to it. They do not need the public toolkit again.
> 4. I save two facts in your user-level instructions, the instructions that apply to you across chats (for example `~/.grok/AGENTS.md` in Grok Build): the notebook folder on this machine, and its private URL when it has one. A later chat of yours can open the notebook from those facts. I do not install a background service, and I do not add a project rule file for this.
>
> I need three things from you: what project this is for, where to keep the notebook, and — if you want cross-machine sync — permission to create a private GitHub repository under your account. I handle the mechanical steps my environment supports. If authorization or repository creation needs your browser, I explain that step plainly and wait for it; I do not request tokens in chat.

Do not start section 0 until the user has confirmed the storage choice.

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

Keep the toolkit source separate from the user's ledger. Choose the operation from the user's current authorization:

- **New:** a new private repository and an unused local destination, with the exact owner, name, project scope and publication approved. A previously created empty repository may be initialized only when that exact repository was approved for this new setup.
- **Join:** use the exact approved existing ledger and project; read its root README and local protocol. Do not rerun new-ledger initialization or replace its files.
- **Migration:** adding/replacing an existing ledger's entry, protocol, attributes or configuration requires an explicit migration plan, reviewed diff and approval for that change. Preserve the existing files until that approval. Different protocol bytes are a migration question, not permission to copy over them.

Discovery, ownership, private visibility or push permission does not establish the user's intent to reuse a repository for this project. Reuse needs the exact target, project scope and user approval. If that is missing, ask in ordinary language: “Create a new private notebook for this project, or use an existing one? If existing, which exact URL and project?” Do not pick an existing repository from a search result.

Preserve existing `.gitattributes`, Git identity/configuration, root entry, protocol and records. Missing entry/protocol in an existing ledger is a reported compatibility gap, not automatic permission to add or overwrite it. New setup must refuse an existing nonempty path or an existing file, and stop on failure; do not convert a failed new setup into reuse. None of these checks authenticates an agent or creates a permission grant.

Before creating a repository, check the currently authenticated acting account read-only and compare it with the user-approved owner. Never assume the toolkit publisher's account, a Git author name or a cached login is the user's intended identity. A mismatch needs resolution before creation; do not switch accounts, save tokens or change credentials as a convenience. Do not embed credentials in URLs, receipts, prompts or repository files.

Before the first real-data write into a Git-connected ledger, and again before publishing, verify the actual hosting owner/project, **private** visibility, approved access scope and effective fetch and all push destinations. The checks must cover a wrong `origin`, a different `pushurl`, account mismatch and unknown visibility. Keep such cases blocked for remote synchronization; use a separately established private local location if suitable, or report the unresolved boundary. A failed/absent hosting check is not evidence of privacy. Configure a remote for a new local ledger only under the explicit destination approval; do not repair or repoint existing remotes/security automatically. Repository creation does not independently authorize the first push or new collaborators: include those actions explicitly in the requested approval when needed.

The agent can carry out approved setup mechanics. Return only grouped human decisions still needed, such as “create this private repo under this verified account; configure this new ledger's remote; publish these reviewed records; grant these named readers access.” Do not contact or grant access to anyone by default. Once set up, the user's own authorized agents read that ledger; toolkit updates stay in the separate distribution checkout. No records, enrollment or troubleshooting data go to the publisher.

## 1. Inspect before writing

- Discover the adopter's actual owner/account, OS, paths, repository, existing ledger, agent capabilities and permissions from safe read-only checks and current instructions. Do not inherit the publisher's machines, team roles, accounts, paths, service ports or permissions. The upstream URL and copyright identify the source, not adopter configuration. Demo actors/projects/paths are synthetic examples; `LEDGER`, `NAME` and `SOURCE_REVISION` are placeholders to resolve. A sample path is not an approved destination. Unknowns remain unknown. Inspect what tools can safely establish; ask only material missing scope, authority or preferences, grouped together. Do not assume all OSes, providers or assistants support these operations.
- Read the current project's applicable AGENTS.md and relevant skills; check its directory, working tree, active work and existing continuity conventions. Preserve unrelated changes. Do not replace an existing ledger.
- Determine whether you have file read/write, command execution, Git and GitHub access (`git --version`; `gh auth status` only when `gh` is already installed). On Windows, Git Bash or WSL can run the git commands. Node.js is not an adoption requirement. Do not install Node, Python, npm or other software, and do not elevate privileges, create credentials or connect an account unless already authorized. Group such missing permissions into one request, with specific purpose and scope.
- Resolve the intended project from the conversation and workspace when possible. If it is ambiguous, ask only for the missing project scope. Never scan unrelated personal directories or use real secrets as examples.
- The public toolkit is documentation, not the ledger. Do not assume a folder with the same name is safe to overwrite. If you clone the toolkit to copy protocol files, keep that checkout separate. The revision in `docs/HOW_WE_COORDINATE.md` is `git rev-parse HEAD` in the checkout used for that byte copy, and only when `git show HEAD:PROTOCOL.md` matches the copied bytes. If the bytes came from a raw URL, record that URL's commit. Use `unset` only when that commit cannot be resolved. Do not record a different commit you inspected, tested, or saw in history, even when the protocol bytes match. If a reviewer supplies a candidate branch/commit, copy from that exact revision instead of a release tag or moving main, and record that same revision. Never reset or switch someone else's dirty checkout. The joining agent does not need this clone.
- If you lack git, or GitHub access when a shared ledger was requested, report that capability gap. You may draft a handoff, but cannot claim setup or shared access has happened. Do not substitute a Node install for that gap.

## 2. Minimal: Setup, then Join

This is the adopter path. It uses git and GitHub. Do not install Node.js.

### Pre-flight: GitHub path checks

If the user chose cross-machine sync (private GitHub repository), run these
read-only checks **before** the Setup block, and group any failures into one
request to the user. Do not discover a missing login halfway through Setup.

```sh
git --version
command -v gh && gh auth status
```

- No git → report the capability gap; cannot proceed with Setup.
- No `gh` → the user creates the private repository in the GitHub UI; clone with git.
- `gh` present but not logged in → stop and ask the user to complete `gh auth login`
  in their browser. The agent cannot perform the browser/device-code flow for them.
- `gh api user --jq .login` must match the section-0-approved owner before any
  repository is created.

If GitHub access or approval is missing, fall back to a local git ledger
(`shared_access: not-configured`) and use the local Join variant below.

### Setup: create the approved new ledger

The user may start with `Set up https://github.com/AAlpha7/agent-continuity` or `Set up LOCAL_CANDIDATE_DIRECTORY` for a privately staged candidate. The latter is a local-candidate trial, not a public URL test. Inspect the exact source provided; do not replace it with a release tag or moving main.

Confirm only missing project, storage and approval decisions. For GitHub, verify the acting account before creation. With `gh` already available, the following is an example for an explicitly approved **new** private repository. Replace every placeholder with inspected, approved values first. Run from a suitable parent outside the toolkit and any enclosing public/shared repository. Shell commands stop on failure; no handoff bytes are written until destination checks pass.

```sh
set -eu
approved_owner=OWNER
approved_repo=LEDGER
project=PROJECT
toolkit=/absolute/path/to/inspected-toolkit
handoff=/absolute/path/to/inspected-private-handoff.md
[ "$(GH_HOST=github.com gh api --hostname github.com user --jq .login)" = "$approved_owner" ]
[ ! -e "$approved_repo" ]
[ ! -L "$approved_repo" ]
GH_HOST=github.com gh repo create "$approved_owner/$approved_repo" --private --clone
# Optional convenience: this helper validates owner/private/effective fetch and
# push URLs before writing five new local files. It never commits or pushes.
sh "$toolkit/scripts/prepare-new-ledger.sh" "$toolkit" "$PWD/$approved_repo" "$project" "$handoff" "$approved_owner/$approved_repo"
```

The helper is a shell convenience, not a new runtime requirement. Without it, perform the same operations after the same read-only checks: establish actual hosting owner/name/private visibility, acting account, effective fetch and **all push URLs** including rewrites, and push selectors. Unknown visibility, wrong account/owner, wrong fetch URL or any wrong push URL blocks all real-data writes. An approved authenticated connector can inspect the same hosting metadata and exact repository target without a local Git remote; explicitly report that transport. Missing capability is a blocker, never a reason to change credentials or bypass a denial.

Only for the approved new empty ledger, create these five files without overwriting anything:

1. `.gitattributes`: toolkit bytes, before the first commit.
2. `docs/PROTOCOL.md`: exact toolkit bytes, never a summary.
3. `docs/HOW_WE_COORDINATE.md`: the template with the revision of the **actual copied source**. Preserve PR10's rule: verify `git show HEAD:PROTOCOL.md` matches those bytes before naming that HEAD; use the raw URL's exact commit if copying from a pinned URL. A candidate whose copied protocol cannot be resolved to that source commit uses `unset`, not a misleading base commit; keep its content digest as separate source evidence.
4. Root `README.md`: copy `templates/LEDGER-README.md`, replacing `PROJECT` with the actual project directory name. Its three local links must resolve.
5. `projects/PROJECT/CURRENT_STATE.md`: inspected goal, decisions, verified versus unverified work, open questions, next authorized task and unresolved ownership. No invented acknowledgment.

The optional helper deliberately refuses any existing ledger content or history and leaves Git config untouched. A failure may leave partial files: retain and inspect them, do not automatically retry into them. For an existing ledger follow Join or an approved migration instead.

Read back all five files, verify the protocol byte match and root links, and review the intended commit. Preserve existing Git identity; if identity is missing, resolve the user's intended author identity rather than overwrite configuration with a synthetic identity. Recheck hosting privacy/owner and effective fetch/push URLs immediately before an approved push. Use the explicit verified destination (`git push origin HEAD`), never a force push. Commit only the reviewed five paths; on any error stop and report partial/blocked. With an authorized API workflow, read back the committed files at its returned SHA. A local Git ledger follows the same five-file shape and preservation rules but has no hosting claim: report `shared_access: not-configured`.

### User-level instructions (cross-session memory)

After those five files are read back and the approved commit has succeeded (and the approved push, when a remote was approved), write the ledger location into **user-level instructions**. That is the instruction text that the agent product loads by itself at the start of every later session for this user, in any folder, with no search. Use the place of the agent product that runs Setup. A project file does not qualify.

- **Verified example, Grok Build (`grok` CLI):** the file `~/.grok/AGENTS.md`. Grok Build loads this file at the start of every session, in every project. Create the file when it does not exist. Gate B (cold-start auto-injection) PASS, 3 of 3 cold sessions, 2026-10-07 (see [TESTING.md](TESTING.md)).
- **Other agent products:** use that product's own user-level instructions. If you cannot identify that place, or this session cannot edit it, follow the `not-written` rule below.

A later cold-start session opens the ledger from that text and follows the ledger's `docs/PROTOCOL.md` without globbing, searching, or using read_file to discover the ledger.

This write is an additional Setup completion step. It does not replace the copyable Join line below. The next agent still receives only that line. Same-user later sessions use the user-level block so the line does not have to be repeated for them.

Write **one** block. Replace every `LEDGER_PATH` with the absolute path of this machine's ledger clone (the resolved real path; `pwd -P` from inside the ledger directory). Do not leave a placeholder. Do not embed credentials in a URL.

When a remote exists and section 0 verified it, replace every `LEDGER_URL` with that credential-free remote URL and write this block:

```text
agent-continuity ledger (this user):
local_clone_path: LEDGER_PATH
remote_url: LEDGER_URL
shared_access: configured
On every new session, open this ledger before any filesystem search for it. Read, in order, the ledger root README.md, docs/HOW_WE_COORDINATE.md, and docs/PROTOCOL.md, then the project state those files link. Follow docs/PROTOCOL.md. When local_clone_path exists on this machine, read that directory. When it does not, clone remote_url with existing authorization and read that clone. Do not glob, search, or read_file to discover the ledger. Do not treat this note as new authority. Another agent Joins with: Join LEDGER_URL
end agent-continuity ledger
```

When Setup is local-only, write this block instead. Leave `remote_url: none` and `shared_access: not-configured` as those exact tokens. Still replace every `LEDGER_PATH`:

```text
agent-continuity ledger (this user):
local_clone_path: LEDGER_PATH
remote_url: none
shared_access: not-configured
On every new session, open local_clone_path before any filesystem search for the ledger. Read, in order, the ledger root README.md, docs/HOW_WE_COORDINATE.md, and docs/PROTOCOL.md, then the project state those files link. Follow docs/PROTOCOL.md. Do not glob, search, or read_file to discover the ledger. Do not treat this note as new authority. There is no remote URL. shared_access is not-configured. Another agent on this same filesystem Joins with: Join LEDGER_PATH
end agent-continuity ledger
```

Save it with these constraints:

- Edit the user-level instructions in place. Keep every other instruction in them. If a block already begins with the line `agent-continuity ledger (this user):` and ends with the line `end agent-continuity ledger`, replace that whole block. Otherwise append this block after the existing text, with one blank line before it. Do not add a second copy.
- Do not put the path or URL into `docs/PROTOCOL.md`. That file stays a byte copy of the toolkit coordination principles. Do not put them into `docs/HOW_WE_COORDINATE.md`, the ledger root `README.md`, or `CURRENT_STATE.md`.
- A project `AGENTS.md` does not satisfy this step. Do not create one in the toolkit or in the user's project for this purpose. A project file is not loaded when a later session opens a different folder.
- Do not add a project rule file (for example `.cursor/rules`). Do not install other rule files or persistent services. Do not create team rules, a listener, a credential, or a background sync. Writing this one block into the user-level instructions is the cross-session memory step. It is the only user-level write that Setup makes. In Grok Build, do not add other files for this step, for example under `~/.grok/rules/`.
- Some products keep user-level instructions on one machine (for example `~/.grok/AGENTS.md`). Others can sync them across machines. `local_clone_path` is the clone on the machine where Setup ran. A later session on another machine uses `remote_url` when that path is absent. It does not search the disk for a different clone. Local-only Setup has no remote; a path the other machine cannot see remains a blocker.
- If this session cannot edit the user-level instructions, do not claim the write, and do not store the block in the ledger as a substitute. Do not use a project rule file instead. Report `user_level_instructions: not-written`, include the exact block in the private reply, and name the place where the user can paste it (for example `~/.grok/AGENTS.md` in Grok Build). Cross-session memory is in place only after the block is saved there.
- Without this block, a cold session that is asked for the ledger searches the home directory for it. That search can find a different ledger. A ledger found by search is not this step.

Do not paste the local path into a public issue, pull request, or repository.

Keep detailed setup evidence privately in the ledger's project state under the existing authorization. On verified ledger completion, return only this copyable invitation to the user, with the real private URL. Return it even when user-level instructions are still `not-written`. Do not add a second line for the user to forward:

```text
Join LEDGER_URL
```

If the ledger is blocked, report the blocker instead of a success invitation. Missing access never counts as Setup complete. A missing user-level write does not hide this Join line; report that write separately.

### Join: URL-only discovery

A fresh agent given only `Join LEDGER_URL` opens that repository with its own authorized access, starts at root `README.md`, follows its local coordination/protocol links and the actual project-state link. The ledger contains the instructions; the user must not carry hidden paths or a toolkit URL. Follow the current session's permissions. Read-only access can establish discovery and understanding, not a successful write-back. When updates are authorized, preserve existing evidence and commit only the intended update back to the same verified ledger; read it back before claiming success. Do not replace the ledger protocol with a newer toolkit version on Join.

If root entry or required links are missing, report the missing path and request a separately authorized migration; do not guess that Setup passed or silently repair the trial.

The joining agent does not need the Setup user's user-level instructions, and it may not see them. If they are absent, record that this agent cannot inspect them. Do not record that as a ledger defect, and do not search the filesystem for them or for other ledgers.

### Local-only Join

When both agents can access the same approved filesystem, return `Join LEDGER_PATH` with its actual path. The user-level block for that Setup is the local-only block above (`remote_url: none`, `shared_access: not-configured`, and the local path). Start at that ledger's root README exactly as above. This is not cross-machine shared access; a path invisible to the next environment is a blocker, not a shareable URL. User-level instructions do not replace this Join line.

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

From an inspected toolkit checkout. Not your ledger, and not an adopter gate. Expect `ledger-smoke: ok` and `minimal-ledger: docs/PROTOCOL.md byte match`. A synthetic ledger without those bytes fails this check. Also expect `patterns-omitted: accepted (not part of Minimal Setup)` and `patterns-ledger: docs/COORDINATION_PATTERNS.md byte match`. Node.js is not required.

### Optional coordination patterns

Not part of section 2, and not a Setup or Join paste. [docs/COORDINATION_PATTERNS.md](docs/COORDINATION_PATTERNS.md) is an optional appendix. The eight principles in the byte-copied `docs/PROTOCOL.md` are enough for Join. A team that wants the extra habits can byte-copy the appendix into the ledger. Do not summarize it, and do not add this copy to the Setup or Join paste.

```sh
cp /path/to/inspected-toolkit/docs/COORDINATION_PATTERNS.md docs/COORDINATION_PATTERNS.md
git add docs/COORDINATION_PATTERNS.md
```

A cold Join reads that file only when the copy is already in the ledger. If it is absent, Join continues from `docs/PROTOCOL.md`. The appendix has no relative link, so a copy does not point at a toolkit path the ledger does not contain.

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

An identical receipt replay returns `duplicate: true`; generation gives a snapshot path; `--check` reports local `current`. The suite is 127 tests ([TESTING.md](TESTING.md)). Choose another unused demo path rather than deleting or merging. A passed demo proves only this local Node path. Canonical receipt files, still optional, are in section 3.

**Maintainers, before each release:** run this whole optional section (two-agent ping, shell smoke including the protocol-byte check, and the Node suite when Node is present). If the Setup/Join paste blocks changed, re-verify section 2 with brand-new agents in brand-new environments. The shell smoke is not that live trial. Do not reuse prior trial agents, prior VMs, or prior trial ledger repos. Record the result on the [release checklist](TESTING.md#maintainer-release-checklist).

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

## 6. Keep a private verification note

Retain real results in the authorized project record, not a blanket "installed successfully". This verification note is not a second prompt the user must forward. Successful Setup still returns one copyable line to the user: `Join LEDGER_URL`, or `Join LEDGER_PATH` for the local-only variant. The user-level instructions write in section 2 is an additional completion step for the same user's later sessions. It is not a line the user forwards to the next agent.

```text
Toolkit revision: <git rev-parse HEAD of the checkout the protocol files were byte-copied from, or the raw URL commit; unset only if that commit cannot be resolved>
Ledger URL: <private GitHub URL | local-only>
Project/source: <adopter project + actual commit or explicitly labeled content digest>
Storage boundary: <resolved private ledger outside toolkit; enclosing repo checked>
Remote topology: none | approved adopter destination verified | unverified (no sync)
Local status: ready | blocked | partial
Optional checks: not-run | two-agent | shell smoke | Node suite
Handoff: <projects/PROJECT/CURRENT_STATE.md in the ledger>
Receipt: <path + reported status when a receipt was actually written; otherwise not-written>
Snapshot: <returned immutable path when a Node snapshot was actually checked; otherwise not-run>
Shared access: verified <evidence> | not-configured | unverified
User-level instructions: written | not-written
Next authorized task: <specific task, or unresolved>
Upstream data boundary: <toolkit unchanged; no user data written/sent upstream>
Human decisions needed: <only unresolved scope/access/external effects; grouped>
```

Do not paste secrets or local personal paths into a public issue or repository. Return local paths only to the user in their private working context, and write the two ledger facts into the user-level instructions that section 2 names. Keep the entry note with the project's existing private navigation convention when authorized.

Do not install other rule files or persistent services. Writing the local clone path and the remote URL (or `shared_access: not-configured` when there is no remote) into the user-level instructions of section 2 (for example `~/.grok/AGENTS.md` in Grok Build) is the cross-session memory step. It is the only user-level write that Setup makes. Do not satisfy it by adding a project `AGENTS.md`, by adding a project rule file such as `.cursor/rules`, by creating team rules, or by installing a listener or background service.

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
