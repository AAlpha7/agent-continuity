# Two fresh agents, one adopter-owned private ledger

This is the concrete next experiment plan, not an executed integration. The objective is that a user can change/add agents, keep their project records in their own private GitHub repository and have another authorized agent continue from those records. **Agent-mediated coordination through existing tools can meet that objective without building a new identity service or remote effect executor.** The R2 controller is an optional local durability component, not a prerequisite for every agent to read and contribute project memory.

## 1. Separate the two claims

| Trial | Evidence it can establish | Evidence it cannot establish |
| --- | --- | --- |
| Fresh A and B use public instructions and their existing authorized Git/GitHub tools to create/read/update the adopter's private ledger | Actual setup usability, cross-session context discovery, retained decisions/artifact references/open work, independent ordinary reports, safe destination handling | Per-agent cryptographic identity, automatic wake-up, distributed ownership or exactly-once remote effects |
| A designated local operator exercises the reviewed R2 controller against synthetic records | Single-controller action budget, terminal recovery, per-recipient local acceptance, guards and projections | Independent remote receipt or controller takeover merely because a Git copy exists |

Do not gate the first useful trial on implementing the second as a remote service. Also do not label an rc.2/manual collaboration result as a passed R2 remote-execution test.

## 2. Give the next agent an accessible pinned distribution

Pin an inspected public `v0.1.0-rc.3` commit or an independently approved source-only package. The ordinary receipt/snapshot workflow and local R2 preview are separate modes. A public source URL works only if it actually contains the requested revision; do not ask an agent to guess a missing private checkout.

Minimal Join does not use this section. Setup copies `PROTOCOL.md` into the ledger as `docs/PROTOCOL.md`, with `docs/HOW_WE_COORDINATE.md`, and a basic Join clones that ledger only. The full toolkit and receipt bootstrap still resolves tools through the [delivery contract](DISTRIBUTION.md). An approved package includes exact-byte hashes, a standalone bootstrap and complete commands. Extract it outside the ledger. A source commit string alone, the prior agent's local path or hidden chat hints are insufficient. Preserve first-run failures; fix the visible entry before restarting with a fresh participant.

## 3. Minimal actual trial

1. **Coordinator supplies only necessary task inputs:** pinned public toolkit URL/commit, synthetic project intent, the actual user-approved account/private-repository scope and each agent's authorized work. No copied chat memory, credentials, expected answer or hidden setup recipe. Keep the real account/destination in private task inputs, never as a universal default in protocol documentation.
2. **Fresh Agent A discovers its environment through existing tools.** Verify the acting GitHub account and permitted owner through a harmless authenticated read. Check the unused destination/name, actual private visibility and all effective fetch/push targets, including URL rewrites/enclosing repositories. Reuse the already approved creation authority; only a genuinely missing permission needs a grouped human decision. If access is unavailable, report local-ready or the actual connection block, not imaginary remote setup.
3. **A creates only the approved private test ledger**, separate from the public toolkit. Use synthetic records and unique files; retain original handoff bytes, decision reasons, artifact references, source revision and a meaningful unfinished check. Verify the remote object/commit after an explicitly authorized push. No public fork, upstream issue/PR, token copying, permission change, CI, listener or paid model is needed. Parent/coordinator owns this creation action; this implementation task does not execute it.
4. **Fresh Agent B receives the pinned public instructions and approved ledger destination/access/task only.** B discovers A's saved evidence through its own existing authorized tools, verifies the actual checkout/source and originals, identifies the unfinished check and carries out the authorized synthetic work. B adds its own unique ordinary receipt with evidence, unresolved limits and declared actor; it does not overwrite A's records or copy A's control directory. A repository write or Git author name is not new task authority.
5. **Coordinator records the result without coaching.** Compare A's and B's actual records, commit IDs, preserved original byte hashes, source references, first failures and actual user decisions. Ask B for status in its new session so the answer demonstrably comes from stored records, not observer-supplied facts. One designated coordinator can regenerate/check the snapshot after inspecting original records. A snapshot's local consistency is not remote freshness or factual truth.
6. **Exercise interruption/overlap honestly.** Re-read/retry one unchanged receipt and verify deduplication. Use unique files and normal Git parent/fast-forward checks for overlapping contributions; reject stale/conflicting writes and inspect/reconcile explicitly, never force-push or reset. Do not turn Git merge success into distributed task ownership. For ambiguous double claims, pause the overlapping action for the designated coordinator's decision while retaining both reports.

Acceptance: B can explain what was done, why, which source/artifact was examined, what remains and its own next authorized contribution from the ledger. Both participants report the actual owner/privacy/destinations, no upstream data egress, retained originals, duplicates/conflicts and real access limitations. Count distinct agents, sessions, operating systems and physical hosts accurately. Keep first-run evidence even if a later version fixes onboarding. A shared GitHub account proves at most that account's authenticated write, not which AI produced it.

## 4. Which adapters are actually needed?

| Capability | Minimal implementation or existing mechanism | New infrastructure needed now? |
| --- | --- | --- |
| Toolkit distribution | Existing public Git checkout pinned to an inspected rc.3 commit, or a verified source-only package | No new service; pin an accessible approved revision |
| Account/privacy/destination checks | Existing authorized GitHub app/CLI/API and Git remote/config inspection; unknown stays unverified | No new credentials or identity service; missing access is a block |
| Read/write ordinary project records | Existing Git/GitHub file APIs, unique canonical receipt files, expected parent SHA/non-force pushes, explicit reconciliation | No service; API-specific helper code is optional after actual capability discovery |
| Wake Agent B | One explicit test invocation by the coordinator; B then fetches original records | No webhook or scheduler; this is manual initiation, not automatic delivery |
| Ongoing automatic events later | An already supported/approved connector event can wake an agent, which still fetches original content; otherwise explicitly approved polling/manual checks | Only if automatic wake-up is required; inspect capabilities/permissions/cost before enabling |
| Per-recipient evidence | B's own ordinary receipt plus observed source/commit and actual authenticated hosting account | No recursive acknowledgment; report recipient-declared receipt, not independently authenticated per-agent R2 acceptance |
| Remote R2 authoritative intake | A narrowly reviewed mapping from actual ingress/account evidence to a preapproved issuer/project/action binding; shared credentials cannot distinguish A/B | **Not needed for agent-mediated memory.** Needed before automatically treating remote text as authoritative R2 commands |
| Remote R2 acceptance query | Read an approved recipient's durable acceptance record and bind exact record/digest/recipient/endpoint | Only for verified automated recipient acceptance; otherwise unknown/report-only |
| Controller ownership/takeover | Keep one controller on its original approved host/path; remote copies inspect only | No takeover for the memory trial. Distributed execution would need a separate fencing design |
| Workbench/chat refresh | Each agent reads original records when asked; an external current-status adapter only with specific scope | No production integration required for the trial; historical chat is never rewritten |

Use the **pinned distribution and agent-mediated onboarding/test path** in this release with the participants’ actual existing tool capabilities. It is not a new authentication server, credential store or always-on transport. Any future helper must be tested against the actual available GitHub interface; the synthetic destination validator is not a live hosting adapter.

## 5. Remaining decisions and operational boundaries

Use any existing explicit repository-creation/access approval without asking for it again; otherwise obtain the concrete missing scope before creating or connecting a destination. Group only missing specifics: actual accessible account/destination, which inspected revision and record workflow the trial uses, and any absent per-agent access or automatic-trigger permission. This guide grants no new credentials, access expansion, hosting, subscriptions or paid services.

Following this guide does not itself create a repository, start agents or authorize remote effects. Report the actual outcomes of your trial. You can validate the ordinary agent-mediated workflow independently of remote R2 execution, with separately named and evidenced results.
