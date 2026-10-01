# R2 local coordination preview

This additive preview implements a **single-controller local journal** for bounded agent coordination: separate action, observation and closure records; durable action/effect guards; atomic closure plus terminal outboxes; per-recipient acceptance; and recoverable current-state projections.

It ships in **0.1.0-rc.3 as a local preview**, not a completed remote-agent integration. Protocol revision 2 is distinct from the software release number. Existing ordinary receipts/history keep their format and raw bytes. Start with [ONBOARDING.md](ONBOARDING.md); the root README explains the user workflow.

```sh
node --test r2/test/*.test.mjs
node r2/demo.mjs
```

The demo uses new disposable synthetic storage outside the toolkit, separate CLI processes and fictional roles selected by one local OS operator. It does not create a Git repository, remote, account, token, listener or scheduled service. It deliberately leaves one recipient's delivery unknown and unfinished work visible after closure. Keep its `DEMO-RESULT.json` and `COMMAND-RESULTS.json` to inspect what happened.

## Implemented boundary

| Mechanism | What this preview establishes |
| --- | --- |
| Canonical records | Strict UTF-8, exact keys/bytes/digests, bounded input, no v1 downgrade |
| Guard and budget | One ledger-local serialization lock and pinned control location; stable scope/action IDs, immutable recipient/version chain and atomic admissions |
| Retry and crash recovery | Immutable hash-linked full-state commits plus a separate controller high-water mark; no automatic stale-lock takeover |
| Terminal delivery | Closed state, exact closure bytes and per-recipient outboxes committed together; retries remain bounded after closure |
| Evidence | Publication assertions, local durable acceptance and participant reports kept separate; no automatic receipt of a receipt |
| Current view | Durable invalidation on state changes; explicit refresh, and current status derived directly from journal evidence |
| Effect recovery | Stable per-effect key/payload/target/dependencies; unknown and expired results block unsafe retry; synthetic local-file adapter only |
| Local permissions | Explicit operator policy, endpoint/role/source checks and revocation rechecks; these are **not remote identity authentication** |

The operator selects each local binding. An incoming message must never choose its own binding or become a CLI command. Anyone with the same OS account/file access can alter policy, journal or anchor; hashes are corruption evidence, not a defense against that actor. Declared names, Git authors, shared accounts and synthetic roundtrips do not prove separate agents or truth.

No live GitHub/webhook/polling adapter, remote inbox verification, signing, credential storage, distributed lock, ownership transfer, workbench API, automatic chat refresh or scheduler is implemented. A clone can inspect records but cannot execute through the original controller. Independent agents/hosts and power-loss/filesystem guarantees require separate verification. No exactly-once external-effect or delivery SLA is claimed.

See [WIRE.md](WIRE.md), [ONBOARDING.md](ONBOARDING.md) and [ACCEPTANCE.md](ACCEPTANCE.md) for format, recovery and case-by-case evidence. [TWO-AGENT-PLAN.md](TWO-AGENT-PLAN.md) explains the minimal trial using existing authorized GitHub tools; it does not require a new identity service or claim remote executor readiness. New code uses Node built-ins and unchanged rc.2 helpers, with no added dependencies. The existing MIT license applies.
