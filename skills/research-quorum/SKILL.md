---
name: research-quorum
description: Verified research - delegating the mining to a research capability, then running verification and judging over its output rather than duplicating the search. Covers source verification, the citation-resolves check, distinguishing consensus from repetition, and reporting confidence honestly. Trigger on "research", "what's the landscape", "find out about", "is this claim true", "verify these sources", "literature review", "market scan", "check this research".
---

# Research quorum

Research has a property most quorum subjects lack: **checkable ground truth.** A citation either
resolves or it does not. A number either appears in the cited source or it does not.

That changes the shape. Per the corpus, generation with checkable ground truth is **Mine → Verify**,
often with no judge panel at all — a panel over an uncontested check adds cost and no information.

It also changes who mines:

> **Route the mining to a research capability.** Do not run five agents doing overlapping web
> searches. Judges score its verified output.

---

## The shape

```
1. Delegate mining     -> a research skill/agent that searches broadly and cites
2. Extract claims      -> in code: pull every factual claim + its citation
3. Verify per claim    -> refuters resolve the citation and check the claim against it
4. Judge (optional)    -> only where the verified claims are contested or a decision hangs on them
5. Synthesize          -> report with per-claim confidence, and what could not be verified
```

Step 2 is the one people skip. **A research report is not a finding; each claim inside it is.** The
unit of verification is the claim, not the document.

---

## Extracting claims

Turn prose into a checkable list before verifying:

```json
[
  {"claim": "NRR median compressed to ~101% in 2026",
   "citation": "data-mania.com/b2b-saas-benchmarks-2026",
   "type": "statistic"},
  {"claim": "Expansion drives 40-50% of new ARR at scale",
   "citation": "abacum.ai/rule-of-40-redefined",
   "type": "statistic"},
  {"claim": "Rule of 40 above 60% correlates with 2-3x higher valuations",
   "citation": "abacum.ai/rule-of-40-redefined",
   "type": "causal-ish"}
]
```

Type the claims, because they need different verification:

| Type | Verified by |
|---|---|
| **Statistic** | The number appears in the source, with the same definition and period |
| **Fact** | The source states it |
| **Causal** | The source actually establishes causation, not correlation |
| **Consensus** | Multiple *independent* sources, not one source repeated |
| **Projection** | Source, vintage, and stated assumptions |

---

## Verification

The refuter resolves the citation and checks. Refute when:

- **The citation does not resolve** — dead link, paywalled beyond the claim, or the page does not
  contain it
- **The source does not say it** — the most common failure. The claim is a paraphrase that drifted
- **The definition differs** — "NRR" in the source excludes a segment the claim includes
- **The period differs** — a 2024 figure cited as current
- **Correlation restated as causation**
- **The source is itself citing someone else** — follow it. A blog citing a report citing a survey is
  one source, not three
- **The number is right but the context inverts it** — a median presented as a target

### Circular citation is the trap that matters

Five sources saying the same thing is **not** five sources when four of them cite the first.
Trace every statistic to its origin. The verifier's question is not "do sources agree" but **"how
many independent measurements exist?"**

Often the answer is one, and that changes how the claim should be reported.

---

## Confidence, reported per claim

Do not report a research finding at a single confidence level. Grade each claim:

| Grade | Means |
|---|---|
| **VERIFIED** | Citation resolves, source states it, definition and period match |
| **PARTIAL** | Source supports a weaker version — report the weaker version |
| **SINGLE-SOURCE** | Resolves and checks out, but only one independent origin |
| **UNVERIFIED** | Could not resolve or could not check |
| **REFUTED** | Source contradicts, or does not contain, the claim |

`PARTIAL` is the most useful and most often skipped. "Rule of 40 above 60% correlates with 2-3×
valuations" verifying down to "one 2026 analysis observed higher multiples among high scorers,
without controlling for size" is a real result and a much weaker claim — and the weaker claim is the
one to report.

---

## When judges are worth seating

Skip them when the question is factual and the claims verified cleanly. Seat 2-3 when:

- A decision hangs on the research, and the constraints differ (cost, risk, time-to-value)
- Verified claims **conflict** — two credible sources disagree, which is a finding needing a ruling
- The question is a recommendation ("which should we use"), not a fact

For a recommendations question, judge by **signal quality, not mention count**. Practitioner
testimony with specifics, an expert publicly switching, and a measured benchmark all outrank
volume — popularity in sources measures what is already popular, which is rarely what is best.

---

## Synthesis

```markdown
## What is established
- [VERIFIED] NRR median ~101% in 2026 — data-mania, from the SaaS Capital survey (n=1,000+)

## What is weaker than commonly stated
- [PARTIAL] Rule of 40 above 60% correlates with higher multiples — one 2026
  analysis, no size control. Directionally supported; the "2-3x" figure did not
  reproduce in the source.

## Single-source claims (treat with caution)
- [SINGLE-SOURCE] Expansion drives 40-50% of new ARR at scale — one origin,
  repeated by three downstream posts.

## Could not verify
- [UNVERIFIED] "Most finance teams plan to adopt AI agents by 2027" — the cited
  survey is paywalled; the claim does not appear in the public summary.

## Contradictions found
- Two sources give CAC payback benchmarks that differ by 6 months. They use
  different definitions (gross vs net margin). Both are right; the definitions
  are not interchangeable.
```

That last section is often the most valuable output. **Contradictions in research are usually
definitional**, and surfacing the definitional split is worth more than picking a winner.

---

## Related skills

- `quorum`, `quorum-verification`, `quorum-judging`
- `decision-quorum` — when the research feeds a call
