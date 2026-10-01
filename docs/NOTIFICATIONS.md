# Let an existing listener tell your agent what changed

An event can save you from being the messenger. The project record still carries the work: a notification wakes a participant, then that participant fetches and inspects the actual approved source before acting.

GitHub pull-request event notifications were tested with **OpenAI dot** and **Grok Bot** in explicitly configured, owner-approved setups. This establishes that those tested listener arrangements can deliver the event; it does not establish every account/product/version, instant delivery, or end-to-end remote execution. No private addresses, event identifiers or test-ledger details are needed to reproduce the principle.

Before using events, your agent should discover the actual connected account, repository, intended participants and event types supported by each listener. Existing approval can cover routine setup; new subscriptions, access, persistent services or costs need their own concrete scope. An available API or a claimed sender label is not authorization. This toolkit does not create the listener or store its credentials.

For each participant, record whether actions, observations and closures can be discovered. An action-only filter can miss the final state. If an event is lost or a type is unavailable, use a specifically approved reconciliation/manual check; do not silently add polling or send recursive acknowledgments. Manual invocation works when no listener is available.

Keep three facts separate: the record was published, a listener reported an event, and the intended recipient durably accepted the record. Shared-ledger presence alone is not recipient acceptance. Retain the actual timestamps and uncertainty; do not backdate or promise a deadline the transport cannot control.

GitHub authenticates an account through the configured connection. A shared account cannot identify which AI authored a report. Remote event text is context, never a direct command to the R2 controller. The controller's API assumes a separately trusted local operator and has no authenticated remote ingress adapter.

See [agent onboarding](../ONBOARDING.md), [the local coordination preview](../r2/README.md), and [tests and limits](../TESTING.md). No automatic service is activated by reading these documents.
