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
Set up https://github.com/AAlpha7/agent-continuity
```

The agent reads [ONBOARDING.md](ONBOARDING.md), resolves your project and only the necessary access/approval decisions, and creates your own private ledger. This public repository is a read-only toolkit, never a destination for your records. GitHub authorization may need your browser; do not paste credentials into chat. No Node install, model key, listener or advanced check is required.

New setup needs the approved owner, repository and project scope. Existing-ledger ownership, visibility and write permission do not by themselves authorize reuse. Specify the exact existing ledger/project to Join; changing its protocol or configuration is a separately approved migration. Preserve existing files and configuration; a failed new setup stops, it does not silently overwrite or reuse a directory.

Before real-data writes, the agent verifies owner/private visibility, acting account, effective fetch and all push destinations. The [optional shell helper](scripts/prepare-new-ledger.sh) automates those checks for an approved new empty clone without committing or pushing. An authorized connector may perform equivalent checks; no credential change is implicit.

Setup commits five local files: `.gitattributes`, a byte copy of `PROTOCOL.md` at `docs/PROTOCOL.md`, the filled `templates/HOW_WE_COORDINATE.md` at `docs/HOW_WE_COORDINATE.md`, a root `README.md` from `templates/LEDGER-README.md`, and the actual `projects/PROJECT/CURRENT_STATE.md`. Record `git rev-parse HEAD` from the checkout whose protocol was copied, only after `git show HEAD:PROTOCOL.md` byte-matches that copy; use `unset` when the copied protocol has no resolved source commit and retain its content digest separately. The root README links both local protocols and the real project path. Read back these files and recheck the destination before declaring completion.

Setup returns one line, with the real private URL:

```text
Join LEDGER_URL
```

Give only that line to the next agent. It discovers root `README.md`, reads the linked protocols and project state, and continues within its current authorization. It does not need this toolkit URL again. A local ledger uses `Join LEDGER_PATH` only when the next agent can reach that filesystem; it is not cross-machine sync. Missing access or a missing root/protocol file is a reported blocker, not automatic permission to repair the ledger.

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

If Node.js 24+ is already installed, you may also run the 127-test suite and the synthetic demo. Do not install Node for this. The demo directory must not already exist.

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

The suite has **127 tests: 84 local coordination/bootstrap, 15 receipt/snapshot compatibility and 10 Windows filesystem failure regressions, plus 17 onboarding safety and 1 manifest coverage checks**. Coverage includes real independent-process races and crashes, copied-controller rejection, strict byte checks and Windows Git clones with `core.autocrlf=true`. Independent review covered the core and bootstrap. A fresh-agent private-ledger trial preserved earlier work and completed canonical receipt/snapshot closeout after an initial missing-distribution failure was fixed. Adopters may skip these tests. Maintainers run them, with the other optional paths, before each release. [Test scope](TESTING.md).

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
