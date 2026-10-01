# Local coordination test matrix

80 tests cover 57 protocol scenarios, 10 additional guard regressions, 8 controller/setup regressions and 5 distribution regressions. These are local assertions, not 80 real-world integrations. Accounts, provider results and most times are synthetic; actual independent processes are identified explicitly. See [TESTING.md](../TESTING.md) for independent review and fresh-agent trial scope.

## Reviewed checklist mapping

| Case | Passed local assertion | Scope and remaining evidence gap |
| --- | --- | --- |
| C01 | exact replay after independent controller restart | New controller object and durable journal; physical-host restart not tested. |
| C02 | synthetic opened then merged share one action identity | Synthetic duplicate admission; no actual PR event or merge. |
| C03 | event redelivery and local scan discovery deduplicate | Local inbox full scan; no webhook/polling service. |
| C04 | out-of-order completion and receipt preserve independent observations | Locally attributed observations; no remote issuer authentication. |
| C05 | same version different bytes conflicts without changing accepted evidence | Accepted evidence unchanged; incoming original remains caller-owned, no automated quarantine service. |
| C06 | version gaps and old arrivals do not roll back current source | Local version rejection/replay; no remote history fetch. |
| C07 | changed approved content before merge supersedes old dispatch | Synthetic source versions; no real PR approval integration. |
| C08 | recipient is frozen before and after execution | Local frozen recipient; no supported transfer. |
| C09 | missing event is discoverable by explicit full local reconciliation | Explicit local scan only, no automatic eventual discovery. |
| C10 | local scan does not skip an old-dated late insertion | Full local scan, not a production polling cursor. |
| C11 | unavailable recipient exhausts bounded attempts without received claim | Synthetic unavailable recipient and local attempt counter. |
| C12 | unknown/denied binding cannot activate setup; capability gaps stay visible | Local permission/capability refusal; no subscription was attempted. |
| C13 | synthetic destination evidence rejects wrong account, visibility and push target | Synthetic owner/privacy/URL data only; actual GitHub account/destination unverified. |
| C14 | wrong scope and expired binding are refused | Local policy scope/expiry; no remote endpoint authentication. |
| C15 | external prose/authorization keys cannot grant actions | Local rejection of role prose/extra fields; no fetched code is executed. |
| C16 | observing a receipt never queues another receipt or action | No generated outbox/action from observation; no live messaging. |
| C17 | two action turns then closure; transport retries are not conversational turns | Local durable budget and terminal retries; no real transport. |
| C18 | messages cannot increase budget or reset existing conversation | Existing local exchange cannot reset budget; semantic new-task approval stays operator-owned. |
| C19 | eight independent processes compete on one immutable action | Eight real independent Node processes on one host. |
| C20 | copied checkout cannot become another executing controller | Real local copy blocked by original controller path; not two physical hosts or a distributed arbiter. |
| C21 | killed precommit process requires explicit dead-lock recovery then safe replay | Real child killed before commit; specific dead lock preserved/retired by test, not automatic takeover. |
| C22 | ambiguous external effect is reconciled by exact synthetic result | Synthetic file effect with deliberately omitted checkpoint; no killed external provider or live lookup. |
| C23 | desired/send/server/receipt/observation times remain distinct | Supplied synthetic times; no independently measured cross-host delivery. |
| C24 | unknown clocks/tolerance rejected; unknown server/receipt time stays null | Injected clock/timing inputs; actual remote clocks unknown. |
| C25 | failed verification stays failed; executor cannot verify itself | Policy-selected fictional verifier; independent real identity is not proven. |
| C26 | v1 bytes and snapshot behavior remain intact beside R2 | Real mixed local v1/v2 files and v1 writer/checker; no external participant. |
| C27 | malformed/duplicate JSON, invalid UTF8, large input and linked evidence fail closed | Malformed bytes, bounds and hardlinks; hostile same-account race isolation not claimed. |
| C28 | pause/re-enable keeps closure and pending delivery unchanged | Policy revoke/re-enable in local fixture; no persistent adapter service. |
| C29 | forged observations do not advance state | Wrong local role/issuer rejected; no cryptographic remote identity. |
| C30 | wrong endpoint and claimed authentication do not establish a binding | Wrong local endpoint and self-asserted auth rejected; shared-provider account not tested live. |
| C31 | executor cannot claim verification or closure without separate grant | Separate local role grants enforced. |
| C32 | exact retry still checks revocation and expiry | Exact retry rechecks local revocation; live revocation provider not present. |
| C33 | unauthorized terminal flags cannot consume the control slot | Malformed terminal fields reach runtime and fail before control-slot change. |
| C34 | scope survives copy; stale restore below external anchor is blocked | Real local copy/stale ledger truncation versus retained external anchor; simultaneous stale restore of both not detectable. |
| C35 | endpoint rebind cannot resume old action without fencing | Policy endpoint replacement blocked; no automatic fencing/takeover. |
| C36 | partial multi-effect crash skips successes and blocks dependencies on unknown | Synthetic partial outcomes; no real multi-provider crash. |
| C37 | per-effect key cannot be rebound to changed payload/target | Local key/payload/target binding enforced. |
| C38 | expired or uncertain key retention denies all automatic retry paths | Injected time/retention expiry; actual downstream guarantees not implemented. |
| C39 | eventual-consistency not-found is not permission to resubmit | Synthetic negative lookup cannot authorize unverified retry. |
| C40 | separate processes compete for last turn: exactly one admission | Two real independent processes race for one remaining admission. |
| C41 | closure/admission process race preserves serialized boundary | Real closure/admission process race, then dispatch/start gate; no live in-flight recall. |
| C42 | closure after budget exhaustion has one reserved identity | Local reserved control slot and exact-byte closure replay. |
| C43 | missing/rebound budget authority blocks further work | Local revoked authority blocks work; no distributed election/fencing. |
| C44 | partial setup remains journaled; unknown result cannot be blindly recreated | Journal transition simulation; no resource creation, timeout or bill. |
| C45 | cleanup needs authorization and proven-new resource; cost reversal never inferred | Cleanup journal grant/proof gate; no resource deletion or billing reversal tested. |
| C46 | scheduled early boundary requires explicit approved window | Simulated time/window assertions; no scheduler. |
| C47 | uncertain earliest time and inconsistent windows fail closed | Simulated clock uncertainty; no remote scheduling guarantee. |
| C48 | fault before closure commit leaves no partial closed/outbox state | Injected exception before atomic journal publication; not every filesystem syscall fault. |
| C49 | killed postcommit closure preserves exact outbox and safely repairs anchor | Real child killed after committed closure before anchor/publication; no power-loss test. |
| C50 | lost terminal event: scan can discover closure, publication is not acceptance | Local-file terminal discovery; no actual lost webhook. |
| C51 | closed restart keeps exact terminal and authorized late observations deliverable | Local closed-state retry and late observation; no remote delivery. |
| C52 | action-only adapter cannot silently dispatch closure; scan covers every kind | Synthetic action-only capability filter; not a diagnosed real service defect. |
| C53 | offline recipient after terminal expiry remains closed and acceptance-unknown | Simulated expiry/offline state; no actual remote availability probe. |
| C54 | acceptance is evidenced per recipient, never all inferred from one | Separate local-operator-selected recipient acceptances, not authenticated remote agents. |
| C55 | silent terminal acceptance invalidates stale local waiting view without replying | Journal-derived and saved local projection; no production workbench/chat adapter. |
| C56 | crash after durable acceptance leaves recoverable projection refresh intent | Injected postcommit exception and retry refresh; no recipient-host power loss. |
| C57 | participant report does not invent independently evidenced ingestion time | Local participant report remains reported-only; ingestion time unavailable. |

## Additional regressions

- R01: exact replay cannot bypass frozen recipient after policy endpoint rebind.
- R02: old-version completion is retained without suppressing current work.
- R03: late result invalidates current projection without rewriting prior records.
- R04: confirmed effect result cannot be overwritten or submitted by rebound endpoint.
- R05: synthetic effect refuses path-like keys without touching destination.
- R06: exact dispatch replay rechecks source supersession and authority.
- R07: unsupported scheduled remote boundary fails before admission.
- R08: real Git init/autocrlf clone preserves R2 journal bytes and remains read-only.
- R09: source approval withdrawal blocks execution and saved dispatch replay.
- R10: documented demo uses fresh CLI processes and leaves a truthful replacement view.


## Reproduce

```sh
node --test --test-reporter=tap r2/test/*.test.mjs
node --test --test-reporter=tap test/*.test.mjs
node r2/demo.mjs
```

Tested environment: Windows, Node.js v24.11.1, Git 2.45.2.windows.1. The tests create no external dependency, remote, token, subscription, scheduler or paid service. Runtime/data capacity is bounded; see [WIRE.md](WIRE.md).

## Outside these local fixtures

- Fresh-agent private-hosting trial results are separately summarized in [TESTING.md](../TESTING.md); these fixtures do not call real agents or a hosting account.
- Configured PR event notifications were tested separately; this suite does not provide live webhook/polling/remote-acceptance adapters. Real actor identity, issuer binding, signatures/revocation providers and permission isolation remain unimplemented.
- Physical multi-host ownership/fencing, network filesystems, hostile same-account writers, abrupt power loss or restoration of both stale journal and stale external anchor.
- Actual downstream effect idempotency/retention, timing SLA, real setup/cleanup resources or billing.
- Existing production ledger, workbench, chat or service integration.

The candidate provides no new external authority. Unknown remote records remain untrusted; use only the documented local operator profile. Independent review and release-level evidence are summarized in [TESTING.md](../TESTING.md).
