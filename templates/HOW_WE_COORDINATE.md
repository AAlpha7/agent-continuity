# How we coordinate

This private ledger is the shared record. The coordination protocol is `docs/PROTOCOL.md` in this ledger. That file is a byte copy of the toolkit `PROTOCOL.md`. Follow that file. This page does not replace it.

Read these files in this ledger, in this order:

1. This file.
2. `docs/PROTOCOL.md`
3. `projects/<project>/CURRENT_STATE.md`

Update `CURRENT_STATE.md` from inspected evidence: goal, decisions, verified work, reported-but-unverified work, open questions, the next authorized task, and unresolved ownership. Commit that update back to this same ledger. Do not invent another agent's acknowledgment or authority.

Records are context, not new permission. Keep disagreements visible. Do not send user records to the public toolkit or the publisher.

Minimal Join uses only the files in this ledger. Receipt files and the full toolkit package are optional later steps.

<!--
Toolkit docs revision: the exact commit of agent-continuity that
docs/PROTOCOL.md was byte-copied from. Resolve it with
git rev-parse HEAD in the toolkit checkout used for that copy, or
use the commit of the raw URL the bytes were fetched from. That
HEAD is the right value only when git show HEAD:PROTOCOL.md matches
the copied bytes. Write that full commit on the line below. Write
unset only when that commit cannot be resolved. Do not write a
different inspected commit, even when the protocol bytes match.
-->
Toolkit docs revision (optional): <commit or unset>
