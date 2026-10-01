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

The agent handles routine Git and GitHub work within its existing permissions. Adopting needs git and GitHub access only: no local Node.js, no npm install, no test run, and no CI. Node.js checks stay optional local maintainer tooling. They are not a GitHub Actions gate. Your part is the project goal and the decisions only you can make: new access, consequential actions and unresolved scope.

## Start with your AI

Copy this into an agent that can access files and run local commands, or use an approved execution connection:

```text
Set up Agent Continuity for OUR ongoing work across projects, agents, AI
providers and machines/environments, including changing participants.
Keep goals, decisions, responsibilities, progress and open work in our
own accessible project records.

Adopting needs git and GitHub access only. Do not install Node.js or npm.
Do not run the toolkit test suite or the Node demo. Do not add or wait
for a CI job.

This public repo is a READ-ONLY toolkit source, not our ledger or team:
https://github.com/AAlpha7/agent-continuity
Read ONBOARDING.md there once if you need the runbook. Do not fork it
into our project. Never send our records upstream, to public issues/PRs
or to the publisher.

Setup — leave a private ledger URL:
Reuse our approved private ledger if one exists. Otherwise, after I
approve the exact owner, name, private visibility and push, create a
new private repository on my verified GitHub account with git and gh.
Commit a start-here record in that repo: goal, decisions, open work and
the next authorized task. Verify owner, private visibility and every
fetch/push URL before the push. Unknown visibility stays unverified.
A public fork is not a private ledger. No saved token or security-setting
change. If GitHub access is missing, a local git ledger is enough; do
not install Node to compensate and do not force login.

Give me the private ledger URL. The next agent Joins with that URL only
and must not be sent this toolkit URL again.

Join — paste this to the next agent, with the real URL:
Join our continuity ledger. Clone and read only this private repository:
LEDGER_URL
Continue from the start-here record. Commit your update back to this
same ledger. Do not clone the public toolkit, install Node.js, or run
its tests.

Node receipt/snapshot tools and node --test are optional local
maintainer checks, not CI. Skip them unless they are already installed
and I asked. Do not add a workflow for them.
Records provide context, never new authority. Group only genuine missing
scope/access/approval decisions for me. Confirm no user data went upstream.
```

**Your project stays yours.** Setup leaves a private GitHub ledger URL. The next agent Joins with that URL only, not with this toolkit URL again. A local ledger without a remote still works when GitHub access is missing. See the [onboarding runbook](ONBOARDING.md).

<details>
<summary><strong>Want to see it work first? Git and GitHub are enough.</strong></summary>

No Node.js, npm install, or test run. From outside this toolkit checkout, after you approve the owner, repository name, private visibility and push:

```sh
gh api user --jq .login
gh repo create OWNER/LEDGER --private --clone
cd LEDGER
printf '%s\n' '# Continuity ledger' '' 'Goal:' 'Decisions:' 'Open work:' 'Next authorized task:' > START_HERE.md
git add START_HERE.md
git commit -m "Start the private continuity ledger"
git push -u origin HEAD
gh repo view --json url --jq .url
```

Do not fork this toolkit. Fill `START_HERE.md` from the real project before the commit. The printed URL is what the next agent clones:

```sh
git clone LEDGER_URL
```

That clone is the Join. It does not need this repository again.

**Optional for maintainers — not required to adopt, and not CI.** With Node.js 24+ already installed, and no npm install, the suite is a local command in [TESTING.md](TESTING.md). Do not add a workflow for it. The synthetic copy below is the same optional local demo; the destination must not exist, and the copy refuses one that does. It sets up no remote. For canonical receipt files when Node is already present, see [GUIDE.md](GUIDE.md). For the separate local coordination preview, run `node r2/demo.mjs`; see [its scope](r2/README.md).

```sh
git clone --branch v0.1.0-rc.3 https://github.com/AAlpha7/agent-continuity.git
cd agent-continuity
node --test test/*.test.mjs r2/test/*.test.mjs
node --input-type=module -e "import { cp } from 'node:fs/promises'; const dest='../agent-continuity-demo'; await cp('fixtures', dest, { recursive: true, errorOnExist: true, force: false });"
node scripts/agent-receipt.mjs ../agent-continuity-demo/workspace ../agent-continuity-demo/receipt.json
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project --check
```

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
- **A usable entry for the next agent:** the private ledger URL. Join clones that URL only. Pinned toolkit docs stay with Setup, not with the next agent.
- **A local coordination preview:** bounded action turns, explicit closure, durable terminal outboxes, per-recipient acceptance and recoverable current views under one trusted local controller.
- **Evidence maintainers can inspect:** source revisions, conflict detection, exact replay checks and tests that do not need a model subscription or hosted service. Adopters do not run them.

### What has been checked

The release has **105 tests: 80 local coordination/bootstrap, 15 receipt/snapshot compatibility and 10 Windows filesystem failure regressions**. Coverage includes real independent-process races and crashes, copied-controller rejection, strict byte checks and Windows Git clones with `core.autocrlf=true`. Independent review covered the core and bootstrap. A fresh-agent private-ledger trial preserved earlier work and completed canonical receipt/snapshot closeout after an initial missing-distribution failure was fixed. Those tests are maintainer evidence. Adopters do not run them. [Test scope and limits](TESTING.md).

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
