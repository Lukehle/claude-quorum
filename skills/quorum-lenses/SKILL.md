---
name: quorum-lenses
description: Coin the lenses for a quorum - deriving them from the subject's own failure and value axes rather than reusing a generic roster, sizing the panel, testing lenses for orthogonality, and the starting vocabulary of seats that have earned their place. Use when setting up any quorum, and when a run returned thin or redundant findings. Trigger on "what lenses", "who should review this", "roster", "perspectives", "the quorum found nothing", "reviewers keep finding the same thing", "set up the panel".
---

# Coining lenses

A lens is **a specific way this subject could fail, held by an agent whose only job is to find that
failure.** Not a job title. Not a persona.

The corpus is unambiguous here: **every non-audit run swapped 100% of the pinned roster.** Lenses
that worked were derived from the subject. A roster is a starting vocabulary, never a default to
apply.

---

## Derive from two axes

For the subject in front of you, ask:

1. **How could this fail?** Not "what is bad" in general — what are the *specific* mechanisms by
   which this particular thing goes wrong?
2. **Who would notice, and when?** Different stakeholders notice different failures at different
   times. Each distinct noticing-position is a candidate lens.

Then name each lens as **the question it asks**, phrased as an attempt to break the thing.

| Weak (a role) | Strong (a failure hunt) |
|---|---|
| Security reviewer | "Show me the input that reaches the database unsanitized" |
| UX reviewer | "Show me a first-time user who cannot complete the primary task" |
| Finance reviewer | "Show me this number is in the wrong period" |
| Performance reviewer | "Show me the query that degrades at 10× the data" |
| Quality reviewer | *(unsalvageable — it hunts nothing)* |

**The test: could this lens return "nothing found" and have that be informative?** A lens hunting a
specific failure yields a meaningful negative. "Quality reviewer: nothing found" means nothing.

---

## Orthogonality

Lenses must catch **different** failures. Two lenses that would find the same finding are one lens
and a wasted agent.

Check by asking, for each pair: *what does A find that B cannot?* If you cannot answer, merge them
and add a genuinely different one.

Common redundancy traps:

- **Security + reliability** overlap heavily on input validation. Split by *consequence* instead:
  one hunts exposure, one hunts outage.
- **Two seniority levels of the same lens** ("senior architect" and "junior developer") — that is
  one lens with a tone knob.
- **A lens per file or per section.** Those are subject artifacts, not lenses. The audit corpus
  explicitly rejected its own five miner lens names as a reusable roster for exactly this reason.

---

## Sizing

Scale to the stakes, not to a magic word (the corpus shows "quick" and "exhaustive" were never
typed):

| Stakes | Lenses | Judges |
|---|---|---|
| A quick check before moving on | 2-3 | 0 — go straight to synthesis |
| Ordinary review | 3-4 | 0-1 |
| Something shipping to others | 4-5 | 2 |
| Audit, post-mortem, irreversible decision | 5-6 | 3 |

Beyond six lenses, returns fall off and dedup load rises. If you want more coverage, deepen the
evidence requirement instead of adding a seventh lens.

**Judges are not extra lenses.** They are the hard constraints that would kill or approve the
decision. Zero judges is correct when nothing is contested — a generation task with checkable ground
truth is Mine→Verify only.

---

## The starting vocabulary

Seats that earned their place in the corpus. **Adapt or discard freely** — this is a prompt for your
own derivation, not a roster to apply.

| Seat | Uniquely catches | Families |
|---|---|---|
| **architect** | structural and coupling risk, migration hazard | build, audit |
| **security / rails** | rail violations, exposure; holds vetoes | build, audit |
| **operator (daily driver)** | day-2 friction, real usage cost | build, review |
| **strategy / ROI** (thin-scope guardian, token economist) | value per effort, scope creep | build; audit judge |
| **delivery pragmatist** | ship-now versus perfect tradeoffs | build |
| **automation architect** | deterministic-over-model-driven | audit judge |
| **reliability judge** | first-time-right; where *more* process hurts | audit judge |
| **red-team / refuter** | invalidation of claimed evidence — **this seat is the Verify phase** | all |
| **brand / client-voice** | internal codenames leaking into client text, tone drift | **conditional** — client-facing deliverables only |
| **visual · ux · messaging · conversion · responsive** | design-review axes | review |

### Rejected seats, recorded because negative results are cheap to lose

- A forensics trio of *root-cause / timeline-integrity / blast-radius* — **invented, zero mined runs,
  rejected 3/3 judges.** It reads plausibly, which is precisely why it needed rejecting.
- *post-mortem / forecaster* as listed vocabulary — not attested in real use.

---

## Writing the miner prompt

Each miner gets: the lens question, the scope, the evidence contract, and the output schema.

```
You are the CUTOFF lens on the July close package.

Hunt exactly one failure: show me a figure that belongs in a different period.
Look at date basis (effective vs posting vs created), timezone conversion at
period boundaries, and whether any extract was taken while the period was open.

Every finding must cite re-checkable evidence: the file and line, the query, or a
verbatim quote under 200 characters. A finding you cannot point at is not a finding.

Return: {title, claim, evidence, impact, severity, recommendation}
Return an empty array if you find nothing. Do not pad.
```

Four things that make this work:

1. **One failure per miner.** A miner asked to find "issues" finds shallow ones across the board.
2. **Name where to look**, without naming what to conclude.
3. **State the evidence contract explicitly** — it is what makes Verify possible at all.
4. **Permit an empty result.** Miners that cannot return nothing will invent something, and invented
   findings consume verifier budget and dilute the dossier.

---

## When a run comes back wrong

| Symptom | Cause | Fix |
|---|---|---|
| Everything deduped into two findings | Lenses were not orthogonal | Re-derive from distinct failure axes |
| Findings are generic ("could improve error handling") | Lenses were roles, not failure hunts | Rewrite as "show me…" questions |
| Nothing survived Verify | Miners padded, or evidence contract was absent | Tighten the contract; permit empty returns |
| **Everything survived Verify on round one** | Verifiers were not genuinely adversarial | Re-prompt to refute; check they re-opened the evidence |
| Judges all said the same thing | Judges were lenses again, not constraints | Name the 2-4 things that would actually kill this |

That fourth row deserves suspicion by default. **A quorum that finds nothing, or confirms
everything, on its first run has usually failed to be adversarial** rather than discovered that the
work is perfect.

---

## Related skills

- `quorum` — the orchestrator
- `quorum-verification` — what the refuter seat does
- `quorum-judging` — why judges are constraints rather than lenses
- the domain adapters — worked lens sets for common subjects
