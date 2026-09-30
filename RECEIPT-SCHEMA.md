# Receipt wire contract

Canonical output is UTF-8 JSON, two-space indentation, fixed field order and one LF. No normalization or lossy decoding. The canonicalizer and tests, not a permissive generic JSON parser, define accepted bytes. Replay/snapshot verification compares all bytes and source digests. No signature or authenticated identity is present.

Agent output fields in order:

| Field | Rule |
| --- | --- |
| schema / kind | 1 / agent-receipt |
| id | 16-80 ASCII letters, digits, underscore or hyphen |
| project | 1-64 ASCII letters/digits/underscore/hyphen, starts alphanumeric |
| actor_declared, task_id, summary | Nonblank strings, max 512 UTF-16 code units, no CR/LF/NUL |
| status | received, started, completed, blocked |
| at | Exact ISO UTC timestamp round-tripping through JavaScript Date.toISOString |
| source_revision | 40 or 64 lowercase hex characters; format does not prove existence/trust |
| evidence | At most 10 strings, each at most 512 UTF-16 code units; never fetch/execute references automatically |
| authorization | ordinary-record-not-approval |

The input canonicalizer discards unknown keys and supplies authorization; this is not extensible signed-envelope support. Stored noncanonical extras fail byte verification. See agent-receipt.mjs.

Legacy service choice output fields: schema=1, kind=choice-record, id, project, at, source=boards-api/local-admin, authorization=ordinary-record-not-approval, request_sha256, source_state_sha256, alert_id, title, choice. request_sha256 hashes JSON.stringify({project, alert_id, title, choice}) in that order; source_state_sha256 hashes the original CURRENT_STATE bytes. See ledger-write.mjs for exact validation and legacy record distinctions. A matching digest proves consistency, not authority. No choice service is included in this extraction.
