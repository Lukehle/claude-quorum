---
name: quorum
description: Run a multi-agent quorum - parallel evidence miners with per-subject lenses, adversarial verification, a judge panel, and dissent-honoring synthesis - when an answer must be defensible rather than plausible. Handles audits, gap analyses, post-mortems, architecture rulings, and gated re-runs. Trigger on "run the quorum", "/quorum", "requorum", "continue the loop until the quorum passes", "adversarial review", "multi-perspective analysis", "stress test this", "is this defensible", "second opinion", or any request for a verified analysis. Pass the question or scope as args.
---

# Quorum

A quorum is for questions where being **plausible is not enough**. Asking one capable reviewer "does
this look right?" reliably returns yes — the question invites confirmation. A quorum instead runs
independent lenses that each try to **break** the work, then rules on what survives.

Do not re-derive the process. Instantiate this template with the subject.

Everything below traces to a retrospective over ~21 production runs. See [CALIBRATION.md](../../CALIBRATION.md)
for what was actually measured; the two findings that matter most:

> **The separate adversarial Verify phase is the differentiator** — verified over lens-name
> specificity, with survival uniform at ~86% across lenses.
>
> **The only family-invariant is a dissent-honoring convergence step.** It survives every specimen,
> including judge-less and verify-less runs.

---

## Parse the ask before spawning anything

**Family** comes from the leading verb plus the trailing deliverable-noun:

| Signal | Family | Shape |
|---|---|---|
| refine / gaps / what's next | **audit** | Full Mine → Verify → Judge → Synthesize |
| how to build / what's missing to ship | **build-gap** | Panel → Judge, verify folded in; requorum gate loop |
| why did X fail / what went wrong | **forensics** | FACTS first, then Mine-against-facts → Verify → Synthesize; output must include a prevention process |
| analyze / rebuild / design | **review** | Review lenses → one judge that dedupes, verifies and prioritizes |
| research / landscape | **research** | Delegate mining to a research skill; judges score its verified output |
| generation with checkable ground truth | **generation** | Mine → Verify only. **No judge panel over an uncontested check** |

Then three parse rules, each attested in real usage:

1. **A definite past-tense referent is a retrieval obligation.** "our X", "the X we did", "like we
   did for Y" → Grep/Glob it **before** mining or building. On an empty search, ask. Never substitute
   a build for a lookup.
2. **An until-clause is an explicit done-check.** "keep running until X", "do not prompt me" → re-run
   until X holds, capped at 3 rounds unless stated. (Attested 9× across 6 sessions.)
3. **Scale is signalled by the subject, not by magic words.** Size the panel to the stakes: 2-3
   lenses for a quick review, 5+ for an audit. ("quick"/"exhaustive" were typed 0× — do not look for
   them.)

**Client-facing deliverable?** (email, sent artifact, site or form copy) → seat a brand/client-voice
lens. It catches internal codenames leaking into external text and tone drift.

---

## The four phases

### 1. Mine

3-6 parallel miners, one per orthogonal lens. Each returns structured findings:

```
{ title, claim, evidence, impact, severity, recommendation, lens }
```

**Lenses are coined per subject** from its failure and value axes — what could go wrong here, and who
would notice. Never `reviewer 1 / 2 / 3`. Every non-audit run in the corpus swapped 100% of the
pinned roster; a roster is a starting vocabulary, not a default. See `quorum-lenses`.

**Every finding must carry re-checkable evidence** — counts, file paths, verbatim quotes ≤200 chars
— that a downstream agent will actually re-open. Grep and scripts for transcript audits, direct reads
of cited sources for design, fetches for research. Never dump whole large files.

### 2. Verify

**One adversarial verifier per deduped finding, prompted to REFUTE** by independently re-checking the
evidence. `isReal = false` when the core evidence cannot be reproduced. Findings that fail die here.

This is the phase that earns the whole exercise. If you cut anything, do not cut this. See
`quorum-verification`.

### 3. Judge

Judges are **the 2-4 hard constraints that would actually kill or approve this class of decision**,
named from the subject's real stakes. Use **zero judges and go straight to synthesis when nothing is
contested** — generation with checkable ground truth is Mine→Verify only.

Judges see the confirmed dossier as data. They may not launch tools or re-mine, though a targeted
re-read of one cited artifact is allowed. Each returns: top recommendations with gain and effort,
rejected items with reasons, and one novel insight. See `quorum-judging`.

### 4. Synthesize — the one phase you may never omit

One agent merges. An action endorsed by 2+ judges outranks single-judge picks. **Disagreements are
reported with an explicit ruling, never silently dropped.**

Output sections, in this order:

1. Root causes, ranked and quantified
2. Top actions table with gain and effort
3. Stop-doing list
4. Disagreements and rulings

---

## Deterministic steps stay in code

Dedup, vote tallying, ruling, ranking, and requorum diffing are data transforms. Doing them with an
agent is slower, costlier, and non-reproducible.

```js
import { dedupeFindings, tallyVerdicts, ruleFinding, rankFindings,
         judgeConsensus, requorumDiff, shouldContinue } from './tools/quorum-lib.mjs';
```

Tested behaviours worth knowing, because each is a way a run quietly goes wrong:

- **Dedup preserves every contributing lens.** "Three lenses found this independently" is signal the
  judges need.
- **Abstentions are not support.** A verifier that failed to reach a conclusion is not evidence.
- **A tie fails.** Contested evidence is `PLAUSIBLE`, never `CONFIRMED`.
- **Disputed judge picks are returned, not dropped.**
- **A restated blocker is the same blocker** across requorum rounds.

---

## Model routing

Pass explicitly at spawn; do not let a cheap session silently become the gatekeeper.

| Role | Tier |
|---|---|
| Miners | mid tier, high effort |
| Verifiers and judges | **top tier, pinned — never inherit** |
| Synthesizer | inherit session tier, highest effort |

On a seat where routing is restricted, compensate with process rather than accepting a weaker gate —
see `quorum-degradation`.

---

## Requorum (gate mode)

"continue the loop until the quorum passes" / "requorum" → re-run the same roster against a changed
subject, diffing each finding against the prior ruling's open blockers. Stop at zero remaining or the
round cap.

`requorumDiff` matches restated blockers fuzzily, so a reworded blocker reads as *remaining* rather
than as simultaneously closed and newly raised. `shouldContinue` enforces the cap and reports what is
still open when it trips.

Distinct from a loop-until-dry mining round, which deepens evidence within one run.

---

## Hard rules

- Dedup between Mine and Verify **in code**, not with an agent.
- Every quantitative claim in the final report is verifier-confirmed; anything else is marked
  unverified.
- Judges get the dossier as JSON and no tools.
- **A quorum that finds nothing on its first run should be suspected**, not celebrated — either the
  lenses were generic or they were not genuinely trying to break the work.
- Save durable conclusions to memory only when they change standing behaviour.

---

## Related skills

- `quorum-lenses` — coining lenses for a subject
- `quorum-verification` — the refutation phase in depth
- `quorum-judging` — panels, consensus, and dissent
- `quorum-degradation` — running this on a restricted harness
- `design-quorum`, `code-quorum`, `research-quorum`, `decision-quorum`, `incident-quorum` — adapters
