# Calibration

Everything in this pack traces to a retrospective over **~21 production quorum runs** (phase counts:
1-phase ×6, 2-phase ×7, 3-phase ×2, 4-phase ×5). This file records what that retrospective actually
measured, so the design choices can be checked rather than taken on faith — and so that anyone
extending the pack knows which parts are evidence and which are convention.

The full synthesis lives in
[`skills/quorum/references/2026-07-17-experts-roster-and-playbook.md`](skills/quorum/references/2026-07-17-experts-roster-and-playbook.md).

---

## Finding 1 — the adversarial Verify phase is the differentiator

The five strongest runs all had a **separate adversarial Verify phase**. The weaker runs were not
weaker for lack of named lenses — they had those too — they folded verification into the judge.

> **Verified over lens-name specificity.** The mediocre runs also had named lenses. What they lacked
> was a phase whose only job was to try to break each finding.

Measured on the largest audit: **31 of 36 findings confirmed**, with lens survival **uniform at
83–89% (~86%)**.

**The uniformity is the interesting part.** If lens naming were doing the heavy lifting, survival
would vary by lens. It does not. The mine→verify structure is well-calibrated regardless of which
lens surfaced the finding — which means the returns come from *having* the refutation step, not from
perfecting the roster.

Practical consequence: if you must cut a phase, **never cut Verify**. Cut a judge instead.

---

## Finding 2 — the only family-invariant is dissent-honoring convergence

Across every specimen — including judge-less runs and verify-less runs — exactly one step survived:

> **An explicit convergence step that honors dissent.** Disagreements get an explicit ruling; they
> are never silently dropped.

Everything else varied by family: phase count, whether Verify was present, roster names and counts
(**0 to 3 judges observed**), and the evidence mechanism.

Practical consequence: the synthesis phase is the one you may never omit, and "report the
disagreement with a ruling" is the one rule that applies to every quorum shape.

---

## Finding 3 — lenses are coined per subject, not reused

**Every non-audit run swapped 100% of the pinned roster.** Lenses that worked were coined from the
subject's own failure and value axes — `token-burn`, `deal-risk`, `brand-comms` — never
`reviewer 1 / reviewer 2 / reviewer 3`.

A roster is a *starting vocabulary*, not a default to apply. See `quorum-lenses`.

---

## Finding 4 — thin runs leave no artifact

The strong runs produced same-session action: **6 of 10 audit recommendations shipped that
session**, and one skill-gap quorum spawned a 20-skill build the next day. The thin runs left no
traceable artifact at all.

Practical consequence: a quorum whose output is not actionable within a day is a signal that the
question was wrong, not that the answer needs another round.

---

## Finding 5 — what the judges rejected

Recorded because negative results are the cheapest to lose:

| Rejected | Why |
|---|---|
| A forensics trio of *root-cause / timeline-integrity / blast-radius* | **Invented — zero mined runs used it. Rejected 3/3 judges.** It reads plausibly, which is exactly why it needed rejecting |
| The audit's own 5 miner lens names, proposed as a default roster | Those were artifacts of that subject, not a reusable roster |
| *post-mortem / forecaster* as listed skill vocabulary | Not attested in real usage |

The first row is the useful one. A plausible-sounding roster invented in the abstract did not survive
contact with the evidence — which is the same failure mode the Verify phase exists to catch, applied
to the design of the tool itself.

---

## Finding 6 — intent parsing, with attestation counts

Grounded in what was actually typed, not in what a prompt vocabulary *could* contain:

| Signal | Attestation |
|---|---|
| Until-clause as a done-check ("keep running until X") | **9× across 6 sessions** |
| "quick quorum" / "exhaustive" as scale words | **0× — never typed** |

Practical consequence: **scale is signalled by the shape of the ask, not by magic words.** The pack
does not implement a `--quick` flag because nobody ever asked for one; it sizes the panel to the
subject instead.

Also attested: a **definite past-tense referent** ("our best runs", "like we did for Y") is a
retrieval obligation — grep the artifact *before* mining or building. Substituting a rebuild for a
lookup is a named production failure (the "Chandler 256KB rebuild").

---

## What is convention, not evidence

Stated plainly so it is not mistaken for measurement:

- The **three degradation tiers** (Workflow → sequential Agent → single-context) are a portability
  design, not a measured result. Tier 3 is weaker and says so.
- The **0.7 dedup similarity threshold** in `tools/quorum-lib.mjs` is tuned against test fixtures,
  not against the production corpus.
- **Tie-fails-closed** in verdict tallying is a judgement call: contested evidence is reported
  `PLAUSIBLE`, never `CONFIRMED`.
- The **domain adapters** (`design-quorum`, `code-quorum`, `research-quorum`, `decision-quorum`,
  `incident-quorum`) generalize the observed families. Only the audit, build-gap, forensics, review,
  and research families are attested in the corpus.

---

## If you re-run this analysis

The retrospective was itself a quorum — which is the strongest available check on the method. Worth
repeating once the corpus has roughly doubled. The numbers to recompute:

1. Verify-phase survival rate, and whether it is still uniform across lenses
2. Whether any step other than dissent-honoring convergence has become invariant
3. Roster reuse rate across families (currently 0% outside audit)
4. Time-to-action on recommendations
5. Whether the round cap of 3 is ever reached, and what happens when it is
