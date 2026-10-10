# Acceptance standard for agent-written changes

> **中文摘要：** 所有由 agent 写的改动，都通过 GitHub Issue（写 `@claude`）派发：一个 Issue = 一个 Claude 任务 = 一个分支 = 一个 PR。
> PR 永不自动合并，只有 Lance 合并。合并前必须过五层门槛：L1 机械门（typecheck/lint/test/build），
> L2 真实运行证据（截图/录屏/日志，按仓库的 verify skill + feature map 驱动），L3 新上下文的独立审查，
> L4 可检查的验收标准 + 影响范围（blast radius）说明，L5 防作弊（不能改弱/删测试、不能硬编码期望值、留出的冒烟测试）。
> PR 正文用下方的审查包模板。每被纠正一次，就把它变成一条测试/lint/门槛（/correct 循环）。
> 本文取代 AAlpha7/Hercules（2026-10-09 停止开发），只保留其验收标准。

Status: active since 2026-10-09. Supersedes the orchestrator in
[AAlpha7/Hercules](https://github.com/AAlpha7/Hercules) (archived; see its
`SPEC.md` §9 for the original five-layer loop). Repo-agnostic: every repo Lance
lets agents write to adopts this file by reference and adds its own verify
skill and feature map.

## 1. Purpose

An agent's "done" must be something Lance can approve from a phone without
reading the code. That only works if "done" is defined, checked by machines
first, proven on the real running thing, and critiqued by someone who did not
write it. This document is the minimum bar. A repo may raise it, never lower it.

What was dropped from Hercules: the daemon, control repo, worktree manager,
scheduler and mobile UI. GitHub now does that job:

| Hercules piece | Replacement |
|---|---|
| One isolated agent/worktree per open task (SPEC §0) | One Claude Code Action job + branch per issue |
| Task file in a control repo | GitHub Issue with acceptance criteria |
| Review packet in the mobile UI | PR body (template in §5) |
| L1–L5 verifier | CI checks + per-repo verify skill + reviewer job (§4) |
| Human approve | Lance merges the PR |

## 2. How work flows

1. **Issue.** Lance (or an agent, with Lance's ok) opens an issue with a goal,
   out-of-scope list and checkable acceptance criteria (§3). Mention
   `@claude` to dispatch. Only the repo owner can trigger the Action.
2. **One job per issue.** The Action runs one Claude job on its own branch
   (`claude/issue-<n>-…`). Never two agents on one issue; never one agent
   across several issues. Concurrency is keyed by issue number.
3. **Vague issue → plan first.** If criteria are missing or not checkable, the
   agent's first output is a proposed plan + criteria as an issue comment, and
   it stops until Lance answers. No code before that.
4. **PR.** The agent opens a PR that closes the issue, with the review packet
   (§5) as the body. Draft until all required gates are green.
5. **Never auto-merge.** No auto-merge, no merge queue bypass, no agent-run
   `merge`, tag, release or publish. Lance merges (squash by default).
6. **Time window.** No repo writes (push, PR, comment-triggered runs that
   write) Mon–Fri 09:00–18:00 America/Los_Angeles. The workflow guard skips
   runs inside that window. Ledger repo `AAlpha7/codex-continuity` is exempt.
7. **Follow-ups** go through `@claude` comments on the same PR; the same
   branch is updated. A new concern = a new issue.

## 3. Writing an issue agents can finish

```markdown
## Goal
One or two sentences, user-visible outcome.

## Out of scope
- Things the agent must not touch (paths, APIs, behaviours).

## Acceptance criteria
- [ ] AC1 — observable, checkable (prefer: "test X passes", "page Y shows Z").
- [ ] AC2 — …

## Evidence wanted
Screenshot of …, log line …, or recording of …
```

Good first tasks are small: bug with a reproduction, tight feature, test-guarded
refactor. Judgment-heavy work stays in an interactive session.

## 4. Required gates (L1–L5)

A PR is mergeable only when every row is green **or** explicitly marked
`n/a` with a reason. `n/a` is never shown as a pass.

| Level | What it proves | Concrete check | Where it runs |
|---|---|---|---|
| **L1 Mechanical** | It builds and nothing obvious broke | `typecheck`, `lint` (incl. architectural lints), full `test`, `build` | Required CI status checks on the PR |
| **L2 Behavioural** | It actually works on the real thing | Per-repo **verify skill** boots the app in isolation and drives every feature in the **feature map** the diff can touch; for bugs: reproduce → fix → reproduction no longer triggers | Agent run; evidence attached to PR |
| **L3 Independent review** | Intent met, no scope creep or gaming | A **fresh-context** reviewer (separate job/session, not the author's context) reviews diff vs. acceptance criteria and posts a verdict | Second Claude job or review step |
| **L4 Acceptance contract** | "Done" is defined and each criterion is bound to proof | Every AC in the issue maps to a test, a CI check or a named evidence file; PR includes a **blast-radius** note | PR body (§5), checked by reviewer |
| **L5 Anti-cheat** | Green was earned, not gamed | Diff lint + held-out smoke suite (below) | Required CI check |

### L1 notes
- Same commands locally and in CI. Lint/error messages should say how to fix
  ("use X instead"), so the failure steers the next turn.
- Health checks are not tests. `GET /health` returning 200 is not L1 or L2.

### L2: per-repo verify skill + feature map
Model: `AAlpha7/aegisflow` `.cursor/skills/verify-aegisflow/` (PR #103). Each
repo that takes agent PRs keeps:
- `SKILL.md` with **Launch** (isolated boot, free ports, no prod data, no real
  secrets), **Doctor** (a script that prints `PASS`/`FAIL` on the real
  preconditions, not just health), **Drive** (how to exercise features),
  **Cleanup** (evidence survives teardown), and an explicit **Acceptance** list.
- `features/` — the **feature map**: one file per user-facing feature, saying
  how to reach it, what "working" looks like, and how to drive it.
- A self-check script (e.g. `check-skill.sh`) so the skill itself is tested.

Rules: drive **every** feature file the diff can change, not just one entry
point. Evidence = screenshot, short recording, or log excerpt of the real
feature, stored with the run id and linked in the PR. Docs/CI-only diffs mark
L2 `n/a` with the reason. Dependency bumps still run Launch + Doctor + one drive.

### L3: independent reviewer
- MUST run with fresh context (new job or session); it gets the issue, the
  diff and the packet — not the author's transcript.
- Prompt must ask: "Did this satisfy the spirit of the criteria, or game the
  metric?" plus: missed intent, over-engineering, scope creep, security smells,
  tests that would pass if the code returned nothing.
- Verdict (`approve` / `changes requested` + reasons) is posted on the PR. The
  author addresses it; loop until approve. Lance still merges.

### L4: blast radius
Every PR body states what the change could break **outside** the diff, and the
one fact its safety rests on, with how far that fact was proven:
1 said so → 2 pointed at `file:line` → 3 walked the failure → 4 ran a script/test
→ 5 reproduced in the running app. Aim for 4+ on risky changes; say where it stopped.
(After pstack `blast-radius`.)

### L5: anti-cheat
Required CI check, run on the PR diff:
- **No weakened tests:** fail if the PR deletes tests, adds `.skip`/`.only`/
  `xit`/`@Ignore`, lowers assertion counts, or loosens assertions in tests
  covering the changed code — unless the PR body has a `Test changes:` section
  justifying it, which the reviewer must check.
- **No silencing:** reject new `eslint-disable`, `@ts-ignore`/`@ts-expect-error`
  without reason, blanket `as any`, empty `catch`, `|| true` in CI scripts,
  `continue-on-error`.
- **No hardcoded outputs:** reject code that special-cases test inputs or
  embeds expected values from the tests/fixtures in production code.
- **Trusted toolchain:** changes to CI workflows, gate scripts, lint/test
  config, `package.json` scripts or the verify skill are flagged and need
  Lance's explicit ok in the PR; gates run from the default branch's config
  where the platform allows.
- **Held-out smoke suite:** a small suite (path declared in the repo's
  `AGENTS.md`/`CLAUDE.md`) the agent may run but not modify; any diff touching
  it fails L5.

## 5. Review packet (PR body template)

```markdown
Closes #<issue>

## What changed
2–4 lines, user-visible first. Files touched: <count> (<main paths>).

## Acceptance criteria → proof
| AC | Proof (test name / CI check / evidence file) | Status |
|----|----|----|
| AC1 | `test/foo.test.ts › handles empty input` | ✅ |
| AC2 | screenshot `evidence/<run-id>/settings.png` | ✅ |

## Gates
- L1 typecheck / lint / test / build: ✅ ✅ ✅ ✅ (CI run link)
- L2 verify skill: run `<run-id>`, features driven: <list> — evidence links
- L3 reviewer verdict: approve / changes requested (link)
- L5 anti-cheat: ✅ (or flagged items + justification)

## Blast radius
Could break: … Safe because: <one fact>, proven to level <1–5> by <how>.

## Test changes
None / list with justification.

## Self-assessment & what's left
Honest confidence, known gaps, follow-ups (as new issues).
```

The packet must stand alone: no "as above", no reliance on the agent's chat
history. Lance should be able to decide from this body plus the evidence.

## 6. The /correct loop

Every time Lance corrects an agent on a PR, the fix is not only the code:
1. Fix the mistake.
2. Make the mistake class impossible, at the highest level that works:
   architecture (one owner, one way, delete the wrong path) → types → a lint/CI
   check whose error names the fix → a behaviour test → docs/agent rules last.
3. Prove the new check fails on the real past mistake.
4. Add a row to the repo's rule table (in `AGENTS.md`/`CLAUDE.md`):
   `rule | enforced by | added (date, PR)`. A rule with nothing enforcing it
   that gets broken again is a repeat — enforce it in the same PR.
5. Exceptions go on the offending line with reason, expiry and Lance's ok.
(After pstack `correct`.)

## 7. Repo adoption checklist

- [ ] `AGENTS.md` (short map) + `CLAUDE.md` pointer, linking this standard.
- [ ] `.github/workflows/claude.yml` (owner-only trigger, weekday 9–6 PT guard).
- [ ] L1 checks required on `main`; branch protection: PR + Lance's review to merge.
- [ ] L5 anti-cheat check in CI; held-out smoke suite path declared.
- [ ] Verify skill + feature map (or a written `n/a` for libraries with no runtime).
- [ ] Reviewer step configured (L3).
- [ ] Rule table started (§6).
