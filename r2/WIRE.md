# R2 local wire and durability contract

This is the implemented local preview profile, not an assertion that every part of the reviewed proposal is deployed. Record/software versions remain distinct. Validators are authoritative at [codec.mjs](codec.mjs), policy/store at [store.mjs](store.mjs), and operation reducers at [controller.mjs](controller.mjs). Fully executable synthetic inputs are in [demo.mjs](demo.mjs).

## Bytes and limits

Canonical encoding is one JSON value with recursively lexicographically sorted object keys, compact separators and one final LF, encoded as strict UTF-8. No BOM, duplicate/unknown keys, unpaired surrogates, noncanonical escapes/whitespace, unsafe integer values or reserved prototype keys. Object keys are exact sets. Arrays retain order. An action's `content_sha256` covers canonical encoding of all action fields **except itself**. Full record identity additionally uses SHA-256 of the complete canonical record bytes. Digests do not establish authority or truth.

Records: at most 65,536 bytes. IDs: 3–96 ASCII letters/digits/underscore/hyphen, beginning with alphanumeric, excluding reserved prototype keys. Policy project IDs additionally need to satisfy the inherited v1 directory validator. Source revisions are exactly 40 or 64 lowercase hex characters and must be in the operator's independently approved allowlist. Times are exact ISO UTC strings; null is accepted only at explicitly unknown/unscheduled fields. Missing fields do not become defaults.

Maximum local state: 1,000 records, 10,000 commands/events, 16 MiB canonical journal entry; no pruning/reset is automatic. The entire chain is read and validated on each transaction. Full-state journal copies favor auditability over scale. Reaching limits is a stop/review condition; do not erase dedup history to regain capacity. Large/long-running projects need a separately reviewed storage/retention design.

## Records

Every record requires `protocol_revision: 2`, `kind`, `record_id`, `ledger_scope`, `project`, `conversation_id`, `sender_declared`, `source_revision`, `policy_ref`.

| Kind | Additional exact fields |
| --- | --- |
| `action` | `action_id`, `recipient`, `content_version`, `previous_digest`, `content_sha256`, `payload`, `in_reply_to`, `turn_index`, `max_turns`, `budget_authority_ref`, `admission_ref`, `reply_policy`, `terminal`, `timing` |
| `observation` | `action_id`, `content_version`, `action_sha256`, `recipient`, `state`, `at`, `evidence_refs`, `verification`, `reply_policy`, `terminal` |
| `closure` | `recipients`, `result_refs`, `at`, `reply_policy`, `terminal` |

Action payload is `{summary, evidence_refs}`. Timing is `{desired_at, deadline_at, timing_boundary, early_policy, early_tolerance_ms, late_tolerance_ms, late_policy}`. See validation code for enumerations and exact bounds. This profile accepts non-null scheduling only at the controlled local `send-attempt` boundary; remote scheduling is unsupported, not silently substituted. It does not implement a waiting scheduler.

Observation states are `published`, `received`, `started`, `completed`, `independently_verified`, `blocked`, `expired`, `cancelled`; these are attributed reports, not generic execution grants. Verification is `{result: 'not-applicable'|'pass'|'fail', independent: boolean}`. A verification report requires the separate local policy grant; separate labels do not independently authenticate observers. All original observations remain available with their exact action version. Old-version reports cannot suppress newer work. This prototype does not automatically compare external artifacts or resolve contradictory claims.

Only closures have `terminal: true`; observations always use `reply_policy: 'none'`. Actions use false and `none`/`next-action`. Nothing automatically creates a successor or a receipt of a receipt. Explicit operator admission is required even when a record permits a follow-up.

## Commands and policy

Canonical command: `{request_id, op, args}`. Constructor/CLI binding and endpoint are supplied independently by the trusted local OS operator. They are incorporated into command deduplication, not accepted from record content. Current binding expiry/revocation, role grants, endpoint and applicable source/authority checks run before returning saved results. Never reuse a request ID with different bytes.

| Operations | Role boundary and effect |
| --- | --- |
| `exchange`, `admit` | Establish fixed participants/budget/closers; atomically admit action identity and outbox |
| `observe` | State-specific grant; current version reports can update local execution report; no automatic response |
| `close` | Explicit closer plus active authority; atomically commit closed/record/per-recipient outboxes |
| `queue_observation`, `attempt_delivery`, `publication` | Explicit local transport role; bounded attempts and attributable publication assertion, no actual network |
| `accept`, `report_acceptance` | Bound recipient local acceptance versus a separately labelled participant report |
| `refresh` | Current derived view persisted; later mutations invalidate caches |
| `start`, `plan_effect`, `attempt_effect`, `effect_result` | Frozen executor and current authority; checkpoints/results only; synthetic effect adapter is separate |
| `setup_plan`, `setup_result`, `setup_reconcile`, `cleanup_result` | Scoped setup/inspection/cleanup journal only, no resource creation/deletion or billing operation |

Exact argument keys are in each reducer's `authorize` method. Policy requires schema/scope/project/policy/controller identifiers, `clock_uncertainty_ms`, `valid_until`, `source_revisions` and `bindings`. Each binding requires its ID, declared actor, exact endpoint, rights, permitted states/recipients, expiry, revoked flag, independent flag and declared capabilities. Capabilities list supported record kinds/event labels/reconciliation/acceptance-query; they are **configuration, not tested remote capabilities**.

No shared/local credential is created. Local policy is not a cryptographic identity provider. Treat remote records as untrusted until a separately reviewed authenticated adapter exists; the local scan explicitly labels them that way.

## Durable state

Ledger: `projects/PROJECT/coordination-v2/journal/SEQUENCE-DIGEST.json` plus its evidence-preserving `.gitattributes`, `.gitignore`, and one transient `writer.lock` in that v2 directory. Controller: separately approved `policy.json`, `anchor.json`. The anchor contains `control_realpath`; journal state contains `control_root_sha256`, binding the original resolved control path without embedding that path in shared records. Both bindings are checked. All accepted writers use the same ledger-local lock, including a caller supplying a different control root; simply repinning a copied anchor still fails the immutable journal binding. Controller files must stay outside both toolkit and ledger, on the original approved host/path. They are not synchronized as project memory. This prevents ordinary duplicate-controller copies from forking the supported local journal; it is not hostile same-account isolation or a distributed lock.

Each journal wrapper has `{schema, seq, previous, state, committed_at, digest}`. Digest covers all wrapper fields except itself. One commit contains the whole state: immutable record bytes, action versions/guard/effects, exchange admissions/closure, outboxes, acceptances, projection invalidation, setup journal and request results. Atomic no-clobber file publication uses the existing rc.2 file helper. The controller high-water mark advances before success is returned. No network/effect is called from the transaction.

Closure and every terminal outbox are one commit. Local acceptance/local closure/projection invalidation are one commit. Closed gates new work, while committed terminal attempts and authorized late results remain eligible within fixed delivery/authority bounds. Acceptance can occur after a sending window expires without reviving that window. Observed times are separate from supplied publication/delivery times; unknown remains null.

Copies are read-only unless a future explicitly reviewed reconciliation/fencing mechanism establishes authority. This implementation intentionally has no takeover. The external anchor detects rollback of the ledger relative to that anchor; copying/restoring both to a stale state defeats that freshness evidence and is not supported recovery. Same-account deliberate tampering can recompute hashes; cryptographic tamper resistance and hostile-process isolation are not claimed.

## Effects and retention

Each effect binds a stable hash key to scope/project/action/effect/target plus immutable payload digest, dependencies, expiry and provider profile. Confirmed outcomes are immutable and never resubmitted; unknown dependency results block downstream work. `unverified` profiles get no automatic ambiguous retry. `synthetic-file-v1` alone has an implemented immutable-file dedup guarantee, limited to the retained local fixture. It is not a real provider contract or a way to approve external operations. Key expiry stops every retry, including exact command replay. Lookup absence is never proof of nonexecution.

No fetched code, arbitrary evidence URL or record prose is executed. Rejected original transport files are left intact; the caller must retain incoming raw bytes for conflict review. The controller rejects conflicting inputs without replacing accepted records; it does not invent an authenticated quarantine workflow.

## Scoped setup inspection and cleanup

`setup_plan` now requires `{setup_id, resource_intent, resource_scope, cleanup_authorized}`. Resource scope is exactly `{service, owner, destination, operation}`, all nonblank bounded strings. The resulting state pins the planner binding/endpoint and original `plan_request_id`. New setup journals keep append-only assertion history in addition to the immutable commit history. They do not create a resource or constitute a grant to an outside service.

`setup_result` takes `{setup_id, state, resource_id, created_by_setup, cost_note}`. Valid ordinary transitions are planned to attempted, then attempted to confirmed/failed/outcome-unknown. Confirmed requires a nonblank concrete resource ID. Only confirmed can assert `created_by_setup: true`; an attempt or unknown result cannot prove new ownership. A known ID is retained for later reconciliation.

`setup_reconcile` takes those fields plus `evidence: {resource_scope, setup_request_id, resource_id, observation, source_ref, observed_at}`. It resolves only outcome-unknown to confirmed or failed. Scope, original request and resource ID must match, including any previously known ID. Confirmed ownership is explicitly `exists-created-by-setup` or `exists-preexisting`; failed requires `confirmed-absent`, not an eventual-consistency `not-found`. Dated source references are mandatory. Evidence is a local operator's assertion about an inspection, **not a remote query performed or verified by this code**. A preexisting resource remains ineligible for cleanup. Resolved or failed setup cannot be recreated by resetting its ID.

`cleanup_result` takes `{setup_id, resource_scope, resource_id, outcome, evidence_ref, observed_at}`. Both failed and confirmed-removed assertions require the exact nonblank resource ID/scope from a confirmed proven-new setup, its original cleanup approval, the bound planner endpoint and a dated nonblank evidence reference. Earlier unknown/failed outcomes and possible cost notes remain in history. Confirmed removal cannot regress to failed. No deletion is performed; any real cleanup needs separately authorized external execution and inspection. No billing reversal is implied.
