# 2026-10-05 — Setup revision and ledger protocol link

A cold Join trial showed two Minimal Setup mistakes.

- `docs/HOW_WE_COORDINATE.md` could record an inspected toolkit commit other than the commit whose `PROTOCOL.md` bytes were copied. Setup now says to record `git rev-parse HEAD` in the checkout used for that copy, or the commit of the raw URL, and only when those bytes match. `unset` remains only for an unresolved commit. The POSIX smoke fills the synthetic ledger with that HEAD and checks `git show HEAD:PROTOCOL.md`.
- The byte-copied `PROTOCOL.md` linked to `r2/WIRE.md`, which is not in an adopter ledger. That relative link was removed from `PROTOCOL.md`. The sentence still says the optional R2 local preview adds a bounded single-controller journal and does not turn Git clones into a distributed lock or remote identity service. Copy stays a straight byte copy. The smoke rejects a relative markdown link in the copied files that does not resolve inside the ledger.
- `MANIFEST.json` size and SHA-256 rows now match the committed blobs, including `PROTOCOL.md`. The POSIX smoke checks those rows with `git cat-file`.
