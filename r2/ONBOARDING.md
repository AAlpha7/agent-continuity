# R2 preview: cold-start instructions

## 1. Establish the actual scope

Use the inspected public `v0.1.0-rc.3` source or an approved exact source-only distribution. Record the actual resolved commit and file hashes. Do not substitute a different version silently. Node.js 24+ and Git are the tested prerequisites; discover the actual OS, tools, owner, paths, project and permissions. No installation or network access is required for the local synthetic demo. Unknown capabilities remain unknown.

For a fresh recipient of this preview, the ledger must supply an accessible pinned toolkit distribution and all required docs, not merely a commit name or another machine's path. Follow [DISTRIBUTION.md](DISTRIBUTION.md). Minimal Join is separate: it reads `docs/PROTOCOL.md` in the private ledger and does not clone this toolkit. A source commit absent from a named repository cannot be fetched there; do not substitute another version silently. A ledger-side source package may be extracted into a new directory outside the ledger after its recorded hashes are checked. No real records belong inside that toolkit.

This toolkit is distribution only. Keep all project records outside its checkout and fixtures. Use a separate, approved private ledger; do not send records to the public toolkit, issues, PRs, support messages or its publisher. No remote is implicitly configured. A later private hosting trial must verify the acting account, owner, actual visibility and every effective fetch/push target (including rewrites and enclosing repositories) through approved access. `checkDestinationEvidence` only tests supplied synthetic values; it cannot verify GitHub. A fork/name containing "private" proves nothing. Keep a suitable local-only result when remote access is missing. Never force login, save tokens or change existing remotes/security.

## 2. Run an isolated local trial

From the inspected toolkit checkout:

```sh
node --test r2/test/*.test.mjs
node --test test/*.test.mjs
node r2/demo.mjs
```

`demo.mjs` creates a new `continuity-r2-demo-*` directory under the OS temporary directory. Every project/actor/revision in it is explicitly fictional. It uses the current local clock, a one-hour demo policy and fresh CLI processes; it does not claim independent AI participants. It prints its exact ledger, operator-control, command-input and read-only replacement-copy locations. No existing paths are adopted or overwritten. Retain first-run failures and partial directories for diagnosis; no automatic deletion or reset is performed by the demo.

Inspect the printed `DEMO-RESULT.json` and `COMMAND-RESULTS.json`. Expected results:

- Exact admission replay is a duplicate and spends no extra turn.
- The synthetic effect is reconciled by its same key and payload; the action itself remains unfinished.
- Closure is durable before local publication; a full inbox scan finds the terminal record without a webhook.
- One recipient accepts locally, the other remains `delivery-unknown`. No conversational acknowledgment is emitted.
- Status changes from `refresh-pending` to `current`; accepted terminal no longer appears awaited. Work stays `started`, not falsely completed.
- A replacement copy reads the same scope and evidence; it has **no execution authority** and no automated takeover.
- `real_independent_agents` is `0`, `network_used` is `false`.

Use the actual printed paths in these templates; uppercase names are placeholders, not shell environment variables:

```text
node r2/cli.mjs inspect REPLACEMENT_LEDGER sample-project
node r2/cli.mjs status LEDGER OPERATOR_CONTROL worker endpoint-worker demo-exchange worker-one
node r2/cli.mjs scan-local-inbox LOCAL_INBOX
```

The `worker`/`endpoint-worker` names above belong only to the generated fictional demo. Do not adopt them as real participants. The CLI writes one JSON result or a structured `code`/`message` error and a failing exit code. Capture the actual error; do not replace it with an optimistic summary.

## 3. An authorized local project (separate from the demo)

Only after the ledger and local operator scope are approved:

1. Inventory/retain existing v1 receipts, history, current text and snapshot bytes. If a new ledger is needed, follow the unchanged [v1 project initializer](../GUIDE.md). Do not point the demo at it. Never silently migrate an existing journal or normalize evidence.
2. Establish a persistent random ledger scope and a unique controller ID. Independently choose the reviewed source revisions and precise actor/endpoint/action/state grants. Actor strings are routing labels; only the trusted local OS operator may choose a binding. No adapter accepting untrusted remote requests exists. An unknown remote issuer stays an untrusted record outside this controller and cannot close work, assert authoritative state or execute.
3. Prepare a canonical policy following `validatePolicy` in [store.mjs](store.mjs) and the shape illustrated in [demo.mjs](demo.mjs). Write it with `encode` from [codec.mjs](codec.mjs); hand-edited whitespace/duplicate keys are deliberately rejected. Do not copy the demo's source revision, roles, dates, scope or grants. Keep the control directory outside **both** ledger and toolkit; do not put it in a remote or give it to new agents as proof of identity. Discover/approve any missing storage authority instead of assuming OS permissions.
4. Initialize a **new**, absent controller and v2 directory:

```text
node r2/cli.mjs init LEDGER NEW_OPERATOR_CONTROL CANONICAL_POLICY_FILE
```

5. Inspect the policy and actual recipient needs before creating an exchange. Build explicit commands using `encode({request_id,op,args})`; stable request IDs are required for retries. `demo.mjs` gives complete canonical examples. Use the trusted locally chosen binding and endpoint:

```text
node r2/cli.mjs command LEDGER OPERATOR_CONTROL LOCAL_BINDING APPROVED_ENDPOINT CANONICAL_COMMAND_FILE
```

This is a local operator API, **not** an authentication challenge. Do not forward a received message verbatim to it or let the message supply `LOCAL_BINDING`, policy, command or filesystem destination. `start`/`attempt_effect` only write checkpoints; they never execute arbitrary payload text. Returned duplicate results are retained history, never a fresh execution permit. The only provided effect adapter is a synthetic immutable local file.

The initializer adds only `projects/PROJECT/coordination-v2/` and the separate control root. Include the generated v2 `.gitattributes` with any separately approved Git record sync; it protects raw journal bytes even under `core.autocrlf=true`. Never add the operator-control directory to that repository. Keep the v1 `.gitattributes` evidence rules too. A v1 `--check` ignores v2 and cannot certify the combined ledger.

## 4. Read evidence and refresh

`inspect` validates canonical bytes and journal chain without an external authority anchor. It reports `controller_freshness: not-checked` and `execution_authority: not-established-by-this-copy`. An intact clone is not proof of being latest or authorized to act.

`status` reads the bound controller and derives current canonical work/closure/acceptance. Read original record bytes and source references, not only cached summaries. `refresh` materializes a recipient's current projection in a new transaction. Subsequent observations invalidate it. No existing workbench/chat service is changed; those remain unsupported surfaces. Nothing rewrites historic chat or rc.2 evidence.

Publication times may remain null. `publication` and `effect_result` are explicitly local-operator assertions; no remote service was queried by this code. A recipient's local `accept` commits its record digest, local closure and refresh intent atomically. `report_acceptance` records participant-reported information only, with unknown delivery time. Receipt, completed work, independent verification and closure are different evidence axes.

Scheduled control supports only the local `send-attempt` boundary; non-null schedules at remote creation/receipt/completion are rejected as unsupported. Nothing waits or schedules a task. Caller timing remains explicit and bounded; unknown clock bounds block execution. Factual late results may still be recorded without authorizing late effects.

## 5. Crash recovery and rollback

All writers serialize at the actual ledger's `projects/PROJECT/coordination-v2/writer.lock`, not a lock beside a caller-supplied control directory. The external anchor pins the original control path, and each journal state also pins a digest of that path. A copied or moved control directory cannot obtain authority for the original ledger; changing only its anchor cannot bypass the journal pin or create a separate accepted lock. A crashed writer leaves this lock; the runtime never steals it by age or PID. Stop new attempts, identify the exact writer and prove it has stopped within approved scope. Preserve the lock and partial files as evidence. Only then may the operator explicitly retire that **specific** dead lock; do not kill an unrelated process or automate wildcard cleanup. Tests do this only to their own child and fixture. The generated v2 `.gitignore` excludes the lock and pending files from ordinary Git additions; it is not an authority boundary or protection against deliberate forced additions.

This preview adds the control-location binding and scoped setup fields. Earlier development R2 control/journal formats are rejected; there is no automatic upgrade or takeover. All validation uses newly initialized synthetic fixtures. Do not patch old anchors, rewrite evidence or reset a real ledger to make it run. Any needed migration requires retained originals and explicit reconciliation first; rc.2 files remain unchanged.

Reload and inspect journal, external anchor and pending effects. A committed entry beyond the anchor is validated and the next successful transaction/retry repairs the anchor before returning success. A ledger behind its external anchor is `STALE_RESTORE`, not a new empty ledger. Do not lower/delete the anchor, invent IDs, erase commits or create a second controller to bypass it. Restoring both the controller and ledger from a stale backup is outside this profile's detection guarantee; retain approved current control evidence and reconcile external outcomes.

Partial initialization, interrupted hard-link publication or malformed bytes fail closed and need inspection. Process kills at defined commit boundaries are tested; sudden power loss, directory-fsync guarantees, network filesystems and adversarial same-account file replacement are not. Never rewrite hashes or normalize data just to pass a checker.

For unknown effects, inspect the exact downstream key/payload/result. A missing result does not permit resubmission. Expired/uncertain retention blocks retries; successful effects are skipped and dependent work behind unknown effects stays blocked. The synthetic-file profile is not a guarantee for any real provider.

Rollback means stop using the preview, retain all v2 journals/control evidence and unresolved effects, and continue rc.2 only for work known safe to resume. It does not delete evidence, reopen closed exchanges, undo effects or reverse costs. Setup commands only journal assertions; they create/delete no resource. Any real setup/cleanup action requires its separately established authority and verified target.

Unknown setup outcomes now have an explicit `setup_reconcile` operation. It requires the original setup request ID, exact service/owner/destination/operation scope, concrete resource ID for a confirmed resource, dated inspection reference and an explicit ownership/affirmative-absence assertion. It retains prior unknown/cost evidence in history. Ordinary `setup_result` cannot silently resolve an unknown outcome; a negative lookup alone is insufficient. `cleanup_result` requires the same concrete resource and scope, original cleanup approval, proven-new assertion and observed cleanup evidence. Neither operation queries or deletes a remote resource: these remain attributable local-operator assertions, not verified hosting facts. Exact fields are in [WIRE.md](WIRE.md).

## 6. Continue with another agent

For ordinary project-memory collaboration, a fresh agent can read your approved private ledger and use its existing authorized Git/GitHub tools to contribute an independent receipt. It does not need a new identity service or a copied controller. Supply the exact accessible tools/docs and explicit task/access scope, then let it inspect originals without hidden coaching. See [TWO-AGENT-PLAN.md](TWO-AGENT-PLAN.md).

The R2 execution controller stays on its original approved host/path. Remote copies are for inspection; no takeover, authenticated remote ingress, receiver-acceptance query or distributed fencing adapter is bundled. Agent-mediated record coordination is useful without those services, but it must not be presented as remote R2 execution. Preserve first failures and report shared-account limitations honestly.
