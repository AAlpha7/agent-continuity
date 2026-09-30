# Agent Continuity

## Your agents change. Your work continues.

**AI keeps improving. Your work should not restart with every switch.**

One provider's assistant fits today's coding task; tomorrow, another provider's new model catches your eye. You might combine several agents with different strengths, or move between a laptop, a server and other work environments.

But they often do not know what the others have done. You repeat the background, move records and check progress. Use several together, and you become their messenger. When an old session ends, decisions and unfinished work can stay stranded in that conversation.

**Agent Continuity keeps the project record in files you control.** Switch assistants, add a reviewer or stop using an old agent: the next authorized reader can inspect saved reports, decisions, reasons, artifact references and open work. You can choose your AI without rebuilding the background from memory, provided those records have been saved and remain accessible.

The vendor-neutral protocol and local tools preserve coordination records. Code and other artifacts stay in their own project storage; references do not back them up automatically.

[Give this to your AI](#give-this-to-your-ai) · [See an agent switch](#one-project-a-changing-team) · [What actually ships](#what-actually-ships) · [简体中文](README.zh-CN.md)

![A user-owned project record remains accessible as an initial assistant works, a reviewer joins, and a replacement assistant continues from an approved copy on another machine. Access, synchronization and backups are explicit.](docs/assets/shared-memory.svg)

**Open source · MIT · v0.1.0-rc.2 runtime.** A foundation for continuity and collaboration. It is not a universal chatbot integration, automatic backup service or autonomous orchestrator. Continuity still depends on approved access, deliberate synchronization and retained copies.

## A better assistant should not mean starting over

| The coordination burden | A shared record gives you |
| --- | --- |
| “I want to switch assistants. Do I have to explain everything again?” | A project handoff, open work and original inputs that the next authorized reader can inspect |
| “Please tell the other AI what we decided.” | Shared project files, rather than relying on the person to relay every report |
| “Which version did you review?” | A declared source revision on each independent report |
| “Two agents say done. What actually happened?” | Separate receipts to compare, with optional evidence references—not a merged success story |
| “We restarted. Is that summary still current?” | A local snapshot check against its current inputs, with earlier evidence retained |
| “Who owns this? May this agent act?” | A protocol for recording ownership and approval boundaries; unresolved claims stay decisions to resolve |

The aim is **less human relaying**, not another dashboard to maintain. Your agent can handle the local setup and routine file operations it is already permitted to perform. You supply intent, missing access and decisions that need human authority.

## Give this to your AI

Use this with an assistant that can read repository files and run local commands, or has an approved execution connection. You do not need to learn the commands yourself.

```text
Set up Agent Continuity for OUR project so we can change assistants
while keeping our own private project records:
https://github.com/AAlpha7/agent-continuity

That public repository is a READ-ONLY source of protocol/tools/examples,
not our ledger or team. Read ONBOARDING.md at the inspected revision.
Do not enroll us in the publisher's team or sync records to the publisher.

Keep our handoffs, receipts and project data OUTSIDE the toolkit checkout
and its fixtures, in a SEPARATE user-owned private ledger. For the demo,
copy only bundled synthetic fixtures into a new disposable workspace
OUTSIDE the toolkit and our private ledger.
Never push our data to AAlpha7/agent-continuity or disclose it through
upstream issues, PRs, troubleshooting attachments or messages.

Check the resolved storage path, enclosing repositories and effective
fetch/push destinations. Configure no remote implicitly. Our own remote
needs an explicit destination/access approval and verified visibility;
a fork or a name containing "private" is not proof. Unknown visibility
is unverified: keep records local if local storage is established safe,
otherwise stop real-data setup. Do not change existing remotes/security.

Recommended shared setup: reuse our existing approved private ledger,
or, with my explicit approval, create a NEW PRIVATE continuity repository
under my own verified GitHub account. Verify the acting account, owner,
private visibility and all fetch/push targets before first data writes
to a Git-connected ledger or any publication. Never default to a public
fork. Keep toolkit updates separate from our records. If access is
missing, remain local-ready; do not force login or embed/save tokens.

Discover our actual project, account, OS, paths, existing ledger, tools
and permissions through safe inspection. Do not inherit the publisher's
environment/team/access or treat demo values as ours. Leave unknowns
unknown; ask only material missing scope/authority, grouped together.

Handle available Git, Node and routine commands within existing scope.
Create and check our first local record when authorized; local-ready is
valid without any remote. Read original receipts, not just the snapshot.
Treat records as context, not new authority. Group only genuine missing
scope, installation, access or external-action decisions for me.
Report the ledger location, actual checks and sharing status, including
that no user data was written or sent upstream. No automatic push.
```

**Your ledger belongs to you, not to this repository.** Download the toolkit; create a separate private record for your own project/team. Cloning or forking this public repo does not connect you to its publisher or make your project data private. No remote, membership or data-upload channel is configured by the initializer.

**Recommended when you want sharing:** your agent can reuse your approved private ledger, or ask once to create a private continuity repository in your own verified GitHub account. It checks the actual account, repository owner, visibility and fetch/push destinations before storing records in that Git-connected location or publishing them. Keep the toolkit clone separate for tool updates. No GitHub access yet? A suitable private local ledger is enough to begin.

**What should happen next:** your agent checks its access, runs an isolated demo, initializes an approved private local record, and returns a short “start here” note. It should distinguish **local-ready** from **shared access verified**. A successful demo alone does not mean your real project is connected.

If your assistant cannot access files or execute commands, it cannot complete the CLI setup on its own. It should say which connection is missing and offer a handoff draft; do not call that an integration. See the [agent onboarding runbook](ONBOARDING.md) for exact acceptance criteria.

<details>
<summary><strong>Prefer to run the demo yourself?</strong></summary>

Node.js 24+ and Git are the tool prerequisites. An equipped agent can handle these commands; installing missing software may require your approval.

```sh
git clone https://github.com/AAlpha7/agent-continuity.git
cd agent-continuity
node --test test/*.test.mjs
node --input-type=module -e "import { mkdir, cp } from 'node:fs/promises'; const dest='../agent-continuity-demo'; await mkdir(dest); await cp('fixtures', dest, { recursive: true, errorOnExist: true, force: false });"
node scripts/agent-receipt.mjs ../agent-continuity-demo/workspace ../agent-continuity-demo/receipt.json
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project --check
```

The sibling demo directory must not already exist; choose another unused path consistently if it does. Only copied synthetic fixtures are used. The toolkit checkout remains unchanged. The receipt replays with `duplicate: true`; generation returns an immutable snapshot path; `--check` reports local `current`. `remote` remains `not-attempted`. Use the [setup guide](GUIDE.md) for a separate private ledger of your own.

A `current` snapshot is an input-consistent local index, not a guarantee of current task conclusions or remote freshness. Its receipt table omits summaries and individual source revisions; open the linked original receipts and unabridged handoff. Coordinator facts require deliberate review and refresh.

</details>

## One project, a changing team

**Illustrative scenario: a checkout retry bug that spans several sessions.** This describes how to use the files, not an automated or certified cross-vendor integration.

1. **Start with a building assistant.** It reports “Added a retry limit,” with a source revision and a reference to test output in its own receipt.
2. **Add a reviewing assistant.** It reads the approved project copy and independently reports “Timeout regression still missing.” The earlier report stays intact.
3. **Stop using the first assistant.** Keep its project records and referenced artifacts. Removing its access is a separate operation; retaining its report does not retain or grant permission.
4. **Continue with a new assistant or machine.** Provide an approved, synchronized copy. The new reader checks the snapshot, reads the original reports and sees the unresolved test work. It continues under the existing assignment and authority, or raises a genuinely missing decision.

You do not need the old chat to stay open to inspect the saved records. You still need the project files and any referenced code or artifacts to be retained and accessible. **The tools check and preserve records; they do not guarantee recovery after every storage loss or prove an assistant's claims.**

![Before: changing an assistant sends the person back to retelling context, chasing versions and reconciling claims. With a retained project record: the next authorized reader inspects decisions and open work, checks the local snapshot and follows evidence. Technical setup can be handled by a capable agent; human decisions remain scope, new access and consequential actions.](docs/assets/continuity-before-after.svg)

### More than a handoff

- **Parallel work:** compare separate reports instead of letting the last summary erase disagreement. Task allocation and conflict resolution remain explicit.
- **Interruption and recovery:** resume from preserved inputs and inspect stale or missing local snapshots. A crashed writer's lock needs inspection, not automatic takeover.
- **Review and audit:** follow reports back to their declared source and evidence references. References are claims to verify, not proof that tests ran.
- **Across machines and tools:** use the same files wherever approved readers can access them. An agent may perform Git synchronization within its existing permissions; this toolkit does not run an autosync service.

## What actually ships

| Layer | Available now | Boundary |
| --- | --- | --- |
| **Protocol** | Conventions for independent reporting, transferable coordination, ownership handoffs and approval separation | Conventions do not enforce ownership or authenticate a principal |
| **Local tools** | Unique receipt IDs; exact retry/conflict checks; cooperative file locks; atomic publication; strict UTF-8; immutable snapshots and byte-preserved input archives | One trusted local OS boundary; no hostile same-account or cross-tenant isolation |
| **Your agent environment** | Existing approved file access and execution tools can drive the CLI | Must be checked per environment; no universal chatbot plug-in is bundled |
| **Not implemented** | Identity enrollment, signed approvals/revocation, task scheduling, ownership arbitration, automatic remote sync and remote execution | Do not infer these capabilities from a receipt, Git author, role label or diagram |

**Records carry context, not authority.** A matching digest does not prove content is true or an action permitted. The CLI assumes a trusted local operator, which may be your already-authorized agent process. There is no authenticated remote intake. Continue within existing permission; require a new decision only when scope or authority actually changes.

## Evidence, not a promise of magic

The rc.2 toolset passed **15 local tests, zero failures/skips** on Windows with Node 24.11.1. Coverage includes independent processes, a killed lock holder, malformed UTF-8, concurrent handoff appends and a real `core.autocrlf=true` Git clone. That clone runs a separate 12-test subset and checks every payload byte. See [TESTING.md](TESTING.md).

[MANIFEST.json](MANIFEST.json) inventories this checkout. [PROVENANCE.json](PROVENANCE.json) records the historical extraction without distributing the private source checkout. Its verification requires authorized access to that historical source; public tests and onboarding do not. Hashes are not signatures. Power-loss durability, network filesystems and universal cross-agent compatibility are not certified.

## Explore when you need it

| Question | Guide |
| --- | --- |
| What should my AI do, and when should it involve me? | [Agent onboarding](ONBOARDING.md) |
| How do we create our own project and handle STALE / CORRUPT / CONFLICT? | [Setup and troubleshooting](GUIDE.md) |
| What is in a receipt? | [Wire schema](RECEIPT-SCHEMA.md) |
| How should coordination and ownership be recorded? | [Protocol](PROTOCOL.md) |
| How was this checked? | [Tests and limits](TESTING.md) |

Future exploration may study duplicate claims, interrupted work and stale conclusions with an offline three-worker simulation. Ownership enforcement and learning from failures are future work. Mock outcomes would not establish real-LLM performance.

## License

Maintained by [AAlpha7](https://github.com/AAlpha7). Follow [Lance · @xhuang26](https://x.com/xhuang26?s=11) on X.

[MIT](LICENSE) · Copyright © 2026 [AAlpha7](https://github.com/AAlpha7). Code, docs and original diagrams share the license. [Attribution and dependency boundaries](RIGHTS-AND-DEPENDENCIES.md). No hosted CI, model subscription or deployment is configured; Node.js and Git are separately installed prerequisites. `private: true` prevents accidental npm publication.
