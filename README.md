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

The agent handles routine Git, Node and file work within its existing permissions. Your part is the project goal and the decisions only you can make: new access, consequential actions and unresolved scope.

## Start with your AI

Copy this into an agent that can access files and run local commands, or use an approved execution connection:

```text
Set up Agent Continuity for OUR ongoing work across projects, agents, AI
providers and machines/environments, including changing participants.
Keep goals, decisions, responsibilities, progress and open work in our
own accessible project records. Use the inspected v0.1.0-rc.3 toolkit:
https://github.com/AAlpha7/agent-continuity

Discover our actual project, OS, paths, existing ledger, account, tools
and permissions. Do not inherit the publisher's setup or demo identities.
Read ONBOARDING.md and r2/DISTRIBUTION.md at the pinned version.

This public repo is a READ-ONLY toolkit source, not our ledger or team.
Keep our records in a SEPARATE user-owned private ledger outside the
toolkit and fixtures. Run synthetic demos in another disposable directory.
Never send our records upstream, to public issues/PRs or to the publisher.

Reuse our approved private ledger. If sharing needs a new private repo,
use my own verified GitHub account only with the required approval.
Verify actual owner, private visibility and all fetch/push destinations
before connected-ledger writes or sync. A public fork is not a private
ledger. Unknown access stays unverified; local-ready is a valid start.
No implicit remote, automatic push, saved token or security-setting change.

Handle routine authorized setup yourself. Pin an accessible tool version
and leave a start-here entry with the tools, docs and commands a NEW agent
can actually obtain. Do not depend on your machine or hidden chat context.
Record and check our first receipt/snapshot; read original evidence too.
Use existing approved notification tools if suitable; ask before adding
subscriptions/access. Records provide context, never new authority.

Group only genuine missing scope/access/approval decisions for me.
Report where our ledger is, the source version, actual checks, sharing
status and what the next agent should do. Confirm no user data went upstream.
```

**Your project stays yours.** An approved private GitHub repository is a useful shared home; a suitable private local ledger also works. Your agent should leave a usable entry point for the next agent, not merely a commit hash that only its own machine can access. See the [onboarding runbook](ONBOARDING.md) and [tool distribution contract](r2/DISTRIBUTION.md).

<details>
<summary><strong>Want to see it work first? Run the synthetic example.</strong></summary>

With Node.js 24+ and Git available, from an inspected toolkit checkout:

```sh
git clone --branch v0.1.0-rc.3 https://github.com/AAlpha7/agent-continuity.git
cd agent-continuity
node --test test/*.test.mjs
node --input-type=module -e "import { mkdir, cp } from 'node:fs/promises'; const dest='../agent-continuity-demo'; await mkdir(dest); await cp('fixtures', dest, { recursive: true, errorOnExist: true, force: false });"
node scripts/agent-receipt.mjs ../agent-continuity-demo/workspace ../agent-continuity-demo/receipt.json
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project --check
```

The new demo directory must not exist. The example copies only synthetic data outside the toolkit, replays a receipt and checks a local snapshot. It sets up no remote. For your own project, use [GUIDE.md](GUIDE.md). For the separate local coordination preview, run `node r2/demo.mjs`; see [its scope](r2/README.md).

</details>

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
- **A usable entry for the next agent:** pinned tools/docs, an optional source-only package and a verifier that extracts outside the ledger without executing package code.
- **A local coordination preview:** bounded action turns, explicit closure, durable terminal outboxes, per-recipient acceptance and recoverable current views under one trusted local controller.
- **Evidence you can inspect:** source revisions, conflict detection, exact replay checks and tests you can run without a model subscription or hosted service.

### What has been checked

The release has **105 tests: 80 local coordination/bootstrap, 15 receipt/snapshot compatibility and 10 Windows filesystem failure regressions**. Coverage includes real independent-process races and crashes, copied-controller rejection, strict byte checks and Windows Git clones with `core.autocrlf=true`. Independent review covered the core and bootstrap. A fresh-agent private-ledger trial preserved earlier work and completed canonical receipt/snapshot closeout after an initial missing-distribution failure was fixed. [Test scope and limits](TESTING.md).

### Where the boundaries are

Saved records and referenced artifacts must remain accessible; references do not automatically back up the artifacts. A snapshot can be locally consistent while remote updates or coordinator facts are stale—read original reports and synchronize deliberately.

Actor labels, Git authors and matching hashes do not authenticate an agent, prove a claim or grant permission. The local controller is not a remote execution/identity service or a distributed ownership system. There is no universal hidden memory, automatic distributed orchestration or always-on backup service. This release does not restore a vendor's chat window, auto-connect every closed chatbot, install an autosync service or guarantee delivery. Access changes and controller takeover remain explicit, separately reviewed operations.

## Go deeper when you need to

| Need | Read |
| --- | --- |
| Set up your own ledger | [Agent onboarding](ONBOARDING.md) · [Project guide](GUIDE.md) |
| Let a fresh agent obtain the tools | [Distribution and bootstrap](r2/DISTRIBUTION.md) |
| Understand receipts and collaboration | [Receipt schema](RECEIPT-SCHEMA.md) · [Protocol](PROTOCOL.md) |
| Try bounded local coordination | [R2 preview](r2/README.md) · [Wire contract](r2/WIRE.md) |
| Inspect tests and file integrity | [TESTING.md](TESTING.md) · [MANIFEST.json](MANIFEST.json) |

## License and author

[MIT](LICENSE) · Copyright © 2026 [AAlpha7](https://github.com/AAlpha7). Maintained by AAlpha7; follow [Lance · @xhuang26](https://x.com/xhuang26?s=11).

Code, docs and original project diagrams are MIT. Product marks remain their owners' property; their use is referential, not endorsement. [Rights and dependencies](RIGHTS-AND-DEPENDENCIES.md). No hosted CI, paid model service or deployment is configured.
