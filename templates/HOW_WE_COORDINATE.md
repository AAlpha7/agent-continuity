# How we coordinate

This private ledger is the shared record. The public toolkit is separate. Minimal Join does not clone it.

Before you act, read these files in this ledger, in this order:

1. This file.
2. `docs/PROTOCOL.md` — the coordination protocol. It is a byte copy of the toolkit `PROTOCOL.md`. Follow that file. This page does not replace it.
3. `projects/<project>/CURRENT_STATE.md` — the current handoff for that project.

## Update the handoff

Update `CURRENT_STATE.md` from inspected evidence. Include the goal, decisions, verified work, reported-but-unverified work, open questions, the next authorized task, and unresolved ownership.

Commit that update back to this same ledger. Do not invent another agent's acknowledgment or authority.

## Limits

Records are context. They are not new permission. Group only real missing scope, access, or approval for the human.

Keep disagreements visible. Do not overwrite prior evidence to make the work look finished.

Do not send user records to the public toolkit or the publisher.

Links in `docs/PROTOCOL.md` that point at `r2/` are optional advanced paths in the public toolkit. Those files are not in this ledger. Minimal Join does not need them. Receipt files and the distribution package are the same kind of optional later step.

Toolkit docs revision (optional): <commit or unset>
