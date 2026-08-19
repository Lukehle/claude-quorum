---
name: quorum-verification
description: The adversarial verify phase - the measured differentiator of a quorum. Covers writing refutation prompts that genuinely attack a finding, what counts as reproducing evidence, verdict tallying rules, why abstentions are not support and ties fail, and reading survival rates. Use whenever findings must be proven before anyone acts on them. Trigger on "verify", "refute", "is this finding real", "adversarial check", "prove it", "the reviewers agreed too easily", "survival rate".
---

# Verification

This is the phase that earns the quorum. The retrospective is unusually clear about it:

> The five strongest runs all had a **separate adversarial Verify phase**. The mediocre runs also had
> named lenses — what they lacked was a phase whose only job was to try to break each finding.
>
> Measured: **31/36 findings confirmed**, with lens survival **uniform at 83-89% (~86%)**.

The uniformity is the finding. If lens naming were doing the work, survival would vary by lens. It
does not — the returns come from *having* a refutation step, not from perfecting the roster.

**If you cut a phase, never cut this one. Cut a judge instead.**

---

## The contract: verifiers refute, they do not assess

A verifier asked "is this finding valid?" will mostly say yes. The prompt must invert the burden.

```
A miner claims:

  TITLE:    Token budget is not enforced on subagent spawns
  CLAIM:    Subagents inherit no budget cap, so a fan-out can exceed the run budget
  EVIDENCE: workflow.js:142 spawns agents in a loop with no budget check;
            run 2026-08-14 shows 41 agents against a stated cap of 16

YOUR JOB IS TO REFUTE THIS.

Independently re-open the cited evidence. Do not trust the miner's reading of it.

Refute if ANY of these hold:
  - The cited evidence does not exist, or does not say what is claimed
  - The evidence exists but does not support the conclusion drawn
  - A mechanism elsewhere already prevents the problem
  - The finding is real but its stated impact is materially overstated

Uphold ONLY if you re-opened the evidence yourself and it reproduces.

Default to refuted when uncertain. A finding that cannot be independently
reproduced must not reach the report as confirmed.

Return: {refuted: boolean, reason: string, whatIChecked: string, correctedImpact?: string}
```

Four load-bearing elements:

1. **"YOUR JOB IS TO REFUTE THIS"** — stated as the task, not as a perspective to consider.
2. **"Independently re-open"** — the verifier must go to the source, not reason about the summary.
   A verifier that only reads the finding is an opinion generator.
3. **"Default to refuted when uncertain"** — this is what makes the phase asymmetric, and the
   asymmetry is the whole point.
4. **`whatIChecked`** — makes a lazy verification visible. A verifier that returns `upheld` with an
   empty `whatIChecked` did not verify anything.

---

## What counts as reproducing evidence

| Evidence type | Reproduced means |
|---|---|
| File and line | Open it. The line exists and says what was claimed |
| A count or metric | Re-run the query or the grep. The number matches |
| A quote | Found verbatim in the cited source |
| A behaviour | Reproduce the sequence, or cite where the code makes it inevitable |
| A screenshot or artifact | Open it and describe what is visible independently |
| "It is well known that…" | **Not evidence. Refute** |

**A finding whose evidence is a plausible narrative refutes.** Plausibility is what the miner already
supplied; the verifier's job is to test whether anything underneath it holds.

---

## Verdict tallying

Deterministic — do it in code, not with another agent:

```js
import { tallyVerdicts, ruleFinding } from './tools/quorum-lib.mjs';
const tally = tallyVerdicts(verdicts);          // {survives, upheld, refuted, abstained, contested}
const ruled = ruleFinding(finding, tally);      // adds CONFIRMED | PLAUSIBLE | REFUTED
```

Three rules, each guarding a way runs quietly go wrong:

**Abstentions are not support.** A verifier that errored, timed out, or returned a malformed verdict
has produced no evidence for the finding. Counting it as a non-refutation manufactures confidence
from a failure.

**A tie fails.** Two refute, two uphold means the evidence is contested. Contested evidence is
reported `PLAUSIBLE`, never `CONFIRMED`. Rounding a tie toward confirmation is the single easiest way
to put a wrong claim in a report.

**Zero valid verdicts does not survive.** Nothing verified it, so nothing confirms it.

### Verdict meanings

| Verdict | Means | What the report does |
|---|---|---|
| **CONFIRMED** | Evidence independently reproduced, uncontested | State it as fact |
| **PLAUSIBLE** | Contested, or could not be reproduced with available access | State it *as unverified*, with what would settle it |
| **REFUTED** | Majority refuted on re-check | Drop from findings; **record why**, so the next round does not re-litigate it |

Keeping refuted findings with their reasons is cheap and stops a requorum rediscovering the same
dead end.

---

## How many verifiers

| Stakes | Verifiers per finding |
|---|---|
| Ordinary review | 1 |
| Shipping to others | 1, plus a second on anything marked critical |
| Audit, irreversible decision | 3, with majority ruling |
| Where failure modes differ in kind | 3, **each with a different lens** |

**Perspective-diverse verification beats redundancy** when a finding can be wrong in several ways.
Three identical refuters catch the same class of error three times; a correctness refuter, a
reproduction refuter, and an impact refuter catch three classes.

---

## Reading survival rates

The corpus baseline is **~86%, uniform across lenses**. Use it as a calibration signal:

| Observed | Likely meaning |
|---|---|
| ~80-90% | Healthy. Matches the corpus |
| **100%** | **Verifiers were not adversarial.** Re-prompt to refute; check `whatIChecked` is populated |
| Under ~50% | Miners are padding, or the evidence contract was never stated |
| Varies sharply by lens | One lens is speculating while others cite. Fix that miner's prompt |

A 100% survival rate is the one to distrust hardest. It is far more often a broken verify phase than
a flawless mining phase.

---

## Verifying a verification

For anything genuinely high-stakes, spot-check the verifiers themselves:

- Sample two upheld findings and re-check them yourself.
- Look for `whatIChecked` that merely restates the claim.
- Look for verdicts returned faster than the evidence could have been opened.

A verify phase that is not itself occasionally audited drifts toward rubber-stamping, which returns
the run to the mediocre baseline while looking like the strong one.

---

## Related skills

- `quorum` — the orchestrator
- `quorum-lenses` — the refuter seat, and permitting empty miner results
- `quorum-judging` — what happens to the surviving dossier
- `quorum-degradation` — verification when parallel agents are unavailable
