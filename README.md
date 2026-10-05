# Agent Continuity

## Your agents change. Your work continues.

**Change your AI. Change your team. Change your machine. Keep your work moving.**

One agent is better at coding. Another catches the mistake. Tomorrow's model is worth trying—and sometimes you switch machines too. But your agents often do not know what the others decided, built or left unfinished. You become the messenger: repeat the background, move the records, check the progress. Close an old session, and useful context can stay behind.

Agent Continuity is **user-owned continuity for ongoing AI-assisted work—across projects, AI teams, tools and machines.** Give each project a shared record that outlasts any one agent, provider or machine. Keep **goals, decisions, recorded responsibilities, progress, artifact references and unfinished actions in files you control**. Authorized participants can coordinate ongoing work from the same saved evidence—whether several agents work together, a role changes, an old agent leaves or you continue in another environment. Keep those records accessible to approved readers, and the project need not start over with every change.

[**Give this to your AI →**](#start-with-your-ai) · [See the workflow](#your-work-many-projects-changing-teams) · [简体中文](README.zh-CN.md)

![A durable user-owned project connects changing AI tools and machines. Decisions, progress and unfinished work remain in the project record while agents can be added, combined or replaced.](docs/assets/agent-continuity-launch.png)

*MIT · 0.1.0-rc.3 prerelease. Product icons illustrate the ecosystem; they are not a claim that every product has a tested integration. See [asset attribution](docs/assets/ATTRIBUTION.md).*

## Less retelling. More getting on with it.

| When you… | What the next agent can find |
| --- | --- |
| **Keep several projects moving** | Project-scoped decisions, progress and open tasks, without mixing their evidence or access |
| **Try a better model** | The saved decisions and reasons, instead of another long briefing |
| **Use several agents together** | Separate reports and source references, so disagreements stay visible |
| **Change machines or resume later** | Open work and retained evidence in an approved project copy |
| **Ask “is it really done?”** | The original receipt, checked revision and evidence to inspect—not just a merged success summary |

**Minimal — the whole install:**

The shared record is your private ledger. Setup puts the coordination protocol in that ledger. Every later agent Joins with the URL only.

1. First agent: **Setup**. It creates the private ledger, copies the protocol into it, and returns the URL.
2. Every later agent or machine: **Join** with that URL only. The protocol is already in the ledger.

Git and GitHub are enough. `gh` is optional. A local git ledger is fine when GitHub is missing. Node is not required.

The paste below is that path. [Further checks](#optional-checks) are optional. Setup and Join are done without them.

Your part is the project goal and the decisions only you can make: new access, consequential actions and unresolved scope.

## Start with your AI

Copy this into an agent that can access files and run local commands, or use an approved execution connection:

```text
Set up Agent Continuity for OUR ongoing work across projects, agents, AI
providers and machines/environments, including changing participants.
Keep goals, decisions, responsibilities, progress and open work in our
own accessible project records.

This public repo is a READ-ONLY toolkit source, not our ledger or team:
https://github.com/AAlpha7/agent-continuity
Read ONBOARDING.md there for the runbook. Do not fork it into our
project. Never send our records upstream, to public issues/PRs or to
the publisher.

Setup — leave a private ledger URL:
Reuse our approved private ledger if one exists. Otherwise, after I
approve the exact owner, name, private visibility and push, create a
new private repository on my verified GitHub account with git and,
if already available, gh. Before the first commit, copy into that
repo: the toolkit .gitattributes, PROTOCOL.md as docs/PROTOCOL.md
(same bytes, not a summary), and templates/HOW_WE_COORDINATE.md as
docs/HOW_WE_COORDINATE.md (fill the revision line, or unset). Commit
projects/PROJECT/CURRENT_STATE.md from inspected evidence: goal,
decisions, open work and the next authorized task. Verify owner,
private visibility and every fetch/push URL before the push. Unknown
visibility stays unverified. A public fork is not a private ledger.
No saved token or security-setting change. If GitHub access is
missing, a local git ledger is enough. Do not force login.

Give me the private ledger URL. The next agent Joins with that URL
only and must not be sent this toolkit URL again.

Join — paste this to the next agent, with the real URL:
Join our continuity ledger. Clone and read only this private repository:
LEDGER_URL
Read docs/HOW_WE_COORDINATE.md and docs/PROTOCOL.md, then
projects/PROJECT/CURRENT_STATE.md. Follow that protocol. Commit your
update back to this same ledger. Do not clone the public toolkit.

Records provide context, never new authority. Group only genuine missing
scope/access/approval decisions for me. Confirm no user data went upstream.
```

**Your project stays yours.** Setup leaves a private GitHub ledger URL with the protocol in that ledger. The next agent Joins with that URL only, not with this toolkit URL again. A local git ledger without a remote still works when GitHub access is missing. See the [onboarding runbook](ONBOARDING.md).

<details>
<summary><strong>Minimal commands: Setup, then Join.</strong></summary>

No Node.js. From outside this toolkit checkout, after you approve the owner, repository name, private visibility and push. On Windows, use Git Bash or WSL. `gh` is optional; without it, create the private repository in the GitHub UI and clone it with git.

```sh
gh api user --jq .login
gh repo create OWNER/LEDGER --private --clone
cd LEDGER
mkdir -p docs projects/PROJECT
cp /path/to/inspected-toolkit/.gitattributes .gitattributes
cp /path/to/inspected-toolkit/PROTOCOL.md docs/PROTOCOL.md
cp /path/to/inspected-toolkit/templates/HOW_WE_COORDINATE.md docs/HOW_WE_COORDINATE.md
# Replace "<commit or unset>" in docs/HOW_WE_COORDINATE.md with the inspected toolkit commit, or with unset.
# Write projects/PROJECT/CURRENT_STATE.md from the real project before committing.
git add .gitattributes docs/PROTOCOL.md docs/HOW_WE_COORDINATE.md projects/PROJECT/CURRENT_STATE.md
git commit -m "Start the private continuity ledger"
git push -u origin HEAD
gh repo view --json url,visibility --jq '{url:.url,visibility:.visibility}'
git remote get-url --all origin
git remote get-url --push --all origin
```

`OWNER/LEDGER` is the approved private repository, not a fork of this toolkit. The login from `gh api user` must match the approved owner before creation. Push only after owner, private visibility and every fetch/push URL are verified. The printed URL is what the next agent clones:

```sh
git clone LEDGER_URL
```

That clone is the Join. Read `docs/HOW_WE_COORDINATE.md` and `docs/PROTOCOL.md`, then `projects/PROJECT/CURRENT_STATE.md`. Commit updates back to the same ledger. Do not clone this public toolkit.

</details>

## Optional checks

Skip this section. Setup and Join are already done.

### Quick protocol check

Two directions, one round each. Paste this to the agents that already share the ledger:

```text
Optional protocol check on LEDGER_URL. Not part of setup.
Round 1: Agent A writes a short note for Agent B on the ledger. Agent B replies there.
Round 2: Agent B writes a short note for Agent A on the ledger. Agent A replies there.
One round each way. Then stop.
```

### Shell smoke and Node

From an inspected toolkit checkout:

```sh
sh scripts/ledger-smoke.sh
```

On Windows, run that script in Git Bash or WSL. Native twin, still optional: `powershell.exe -File scripts/ledger-smoke.ps1`. It uses temporary synthetic ledgers, not yours. Maintainers: the same command rejects a Minimal ledger that lacks a byte copy of `PROTOCOL.md`, and accepts one that has it. Adopters may skip it. Node.js is not required.

If Node.js 24+ is already installed, you may also run the 105-test suite and the synthetic demo. Do not install Node for this. The demo directory must not already exist.

```sh
node --test test/*.test.mjs r2/test/*.test.mjs
node --input-type=module -e "import { cp } from 'node:fs/promises'; const dest='../agent-continuity-demo'; await cp('fixtures', dest, { recursive: true, errorOnExist: true, force: false });"
node scripts/agent-receipt.mjs ../agent-continuity-demo/workspace ../agent-continuity-demo/receipt.json
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project --check
```

The copy stays outside the toolkit and sets up no remote. Receipt files: [GUIDE.md](GUIDE.md). Local coordination preview: `node r2/demo.mjs` ([scope](r2/README.md)). More detail: [TESTING.md](TESTING.md).

**Maintainers, before each release:** run every optional path — this two-agent ping, the shell smoke (including the protocol-byte check), and the Node suite when Node is present. If the Setup/Join paste changed, re-verify Minimal Setup and Join with brand-new agents in brand-new environments. The shell smoke is not that live trial. Do not reuse prior trial agents, prior VMs, or prior trial ledger repos. Record the result on the [release checklist](TESTING.md#maintainer-release-checklist). Adopters do not.

## Your work, many projects, changing teams

Keep a product build, a research thread and a planning project moving alongside each other. Each keeps its own goals, decisions, contributions and open work. Choose different agents for different strengths, add a reviewer, retire an old assistant or move to another machine; an approved reader starts from the saved record instead of another full briefing. A handoff is one moment in this ongoing collaboration.

Project/task scopes keep records organized; a portfolio overview can link to them. This is a file-based working agreement, not an automatic portfolio manager. Recorded responsibilities expose unresolved ownership; they do not enforce a distributed lease or grant permission.

**A small example:** a builder reports a retry fix and its source revision. A reviewer finds a missing timeout check. You try another assistant. It reads both original reports, keeps the disagreement visible, and works on that remaining check under your approved assignment. The old chat need not remain open for those saved records to be useful.

![Before: the person repeats context and relays updates between isolated chats. With Continuity: agents consult the user's project record, preserve independent evidence and leave the next step for the next authorized reader.](docs/assets/continuity-before-after.svg)

### Notifications when your setup supports them

**GitHub PR event notifications have been tested with OpenAI dot and Grok Bot in configured, owner-approved setups.** A supported listener can tell an agent that something changed; the agent then fetches the actual project record before continuing.

This is a tested setup, not a universal plug-in. Check each participant's actual listener/event support and authorization. This repository does not install a listener, create a subscription or promise instant delivery. Manual invocation and explicit synchronization remain valid when event support is unavailable. [Notification setup and evidence](docs/NOTIFICATIONS.md).

## What you get in rc.3

- **Project memory you own:** independent immutable receipts, byte-preserved handoffs and checked local snapshots.
- **A usable entry for the next agent:** the private ledger URL. Join clones that URL only and reads `docs/PROTOCOL.md`, `docs/HOW_WE_COORDINATE.md`, and `CURRENT_STATE.md`.
- **A local coordination preview:** bounded action turns, explicit closure, durable terminal outboxes, per-recipient acceptance and recoverable current views under one trusted local controller.
- **Evidence you can inspect later:** source revisions, conflict detection, exact replay checks and an optional Node suite. No model subscription or hosted service is required.

### What has been checked

The suite has **105 tests: 80 local coordination/bootstrap, 15 receipt/snapshot compatibility and 10 Windows filesystem failure regressions**. Coverage includes real independent-process races and crashes, copied-controller rejection, strict byte checks and Windows Git clones with `core.autocrlf=true`. Independent review covered the core and bootstrap. A fresh-agent private-ledger trial preserved earlier work and completed canonical receipt/snapshot closeout after an initial missing-distribution failure was fixed. Adopters may skip these tests. Maintainers run them, with the other optional paths, before each release. [Test scope](TESTING.md).

### Where the boundaries are

Saved records and referenced artifacts must remain accessible; references do not automatically back up the artifacts. A snapshot can be locally consistent while remote updates or coordinator facts are stale—read original reports and synchronize deliberately.

Actor labels, Git authors and matching hashes do not authenticate an agent, prove a claim or grant permission. The local controller is not a remote execution/identity service or a distributed ownership system. There is no universal hidden memory, automatic distributed orchestration or always-on backup service. This release does not restore a vendor's chat window, auto-connect every closed chatbot, install an autosync service or guarantee delivery. Access changes and controller takeover remain explicit, separately reviewed operations.

## Go deeper when you need to

| Need | Read |
| --- | --- |
| Set up your own ledger | [Agent onboarding](ONBOARDING.md) |
| Optional checks | [TESTING.md](TESTING.md) |
| Full toolkit and receipt bootstrap | [Distribution](r2/DISTRIBUTION.md) |
| Understand receipts and collaboration | [Receipt schema](RECEIPT-SCHEMA.md) · [Protocol](PROTOCOL.md) |
| Try bounded local coordination | [R2 preview](r2/README.md) · [Wire contract](r2/WIRE.md) |
| Inspect tests and file integrity | [TESTING.md](TESTING.md) · [MANIFEST.json](MANIFEST.json) |

Minimal Join does not use distribution. Setup already put `docs/HOW_WE_COORDINATE.md` and a byte copy of `PROTOCOL.md` in the private ledger.

## License and author

[MIT](LICENSE) · Copyright © 2026 [AAlpha7](https://github.com/AAlpha7). Maintained by AAlpha7; follow [Lance · @xhuang26](https://x.com/xhuang26?s=11).

Code, docs and original project diagrams are MIT. Product marks remain their owners' property; their use is referential, not endorsement. [Rights and dependencies](RIGHTS-AND-DEPENDENCIES.md). No hosted CI, paid model service or deployment is configured.
