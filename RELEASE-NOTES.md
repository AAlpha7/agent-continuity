# 0.1.0-rc.3 — your agents change, your work continues

User-owned continuity for ongoing AI-assisted work across projects, AI teams, tools and machines. Keep goals, decisions, contributions and unfinished work available to the next approved participant; let an agent handle routine permitted setup.

This prerelease adds an agent-first bilingual introduction, illustrated scenarios, independent-private-ledger onboarding, an accessible pinned-toolkit/source-package contract, and a local coordination preview with bounded turns, durable outboxes, explicit closure and recoverable views. Notification guidance reports the configured, owner-approved OpenAI dot/Grok Bot GitHub PR event workflow; it does not claim universal integration.

Release preparation fixed reproduced Windows `EPERM` races in writer-lock acquisition and atomic replacement, using bounded retries without weakening exclusive ownership or deleting destinations. The 105-test suite includes ten new failure regressions. [Evidence and limitations](TESTING.md) retain the initial failures and the observed bounded-lock `BUSY` outcome under sustained contention.

The controller is a trusted-local-operator preview. Remote identity, signature/revocation services, distributed takeover, automatic orchestration and continuous backup are not provided. Saved records and referenced artifacts need approved access and deliberate synchronization. No hosted CI, paid model service or deployment is configured.

Follow-up: Minimal Setup copies `PROTOCOL.md` into the private ledger as `docs/PROTOCOL.md`, with the short entry `docs/HOW_WE_COORDINATE.md`. A Join with only that ledger URL reads those files. The pinned toolkit package remains optional. The shell smoke rejects a synthetic Minimal ledger that lacks the protocol bytes.

The rc.2 tag and source assets remain historical, unchanged artifacts. These rc.3 docs describe the rc.3 source tree; a user pinning rc.2 should read that version's docs. Code, docs and original graphics are MIT; referential product marks retain their owners' rights. See [asset attribution](docs/assets/ATTRIBUTION.md).
