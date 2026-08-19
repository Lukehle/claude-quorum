---
name: quorum-judging
description: The judge panel and the synthesis that follows - naming judges as hard constraints rather than extra lenses, when zero judges is correct, consensus and dissent handling, and the ruling format. Covers the one step that survived every run in the corpus - an explicit dissent-honoring convergence. Trigger on "judge", "panel", "who decides", "synthesize", "the ruling", "disagreement", "conflicting recommendations", "prioritize the findings".
---

# Judging and synthesis

By this point the dossier is confirmed. Judging is not "check it again" — it is **deciding what to do
about it**, under the constraints that actually govern.

And synthesis carries the single most important rule in the pack:

> **The only family-invariant across ~21 runs is an explicit dissent-honoring convergence step.** It
> survives every specimen, including judge-less and verify-less runs. Everything else — phase count,
> verify presence, judge count (0 to 3 observed), evidence mechanism — varied.

---

## Judges are constraints, not lenses

A lens asks *how could this fail?* A judge asks *would this pass the thing that actually kills
proposals like this?*

Name the **2-4 hard constraints that would kill or approve this class of decision**, from the
subject's real stakes.

| Subject | Judges (constraints) | Not judges (those are lenses) |
|---|---|---|
| A process audit | automation architect · token economist · reliability judge | "thorough reviewer" |
| A shipping decision | user impact · rollback cost · on-call burden | "QA" |
| An architecture choice | migration cost · operational complexity · reversibility | "senior engineer" |
| A board deliverable | credibility with the audience · defensibility of every number · does it prompt the right decision | "editor" |

**If a proposed judge would have made a good miner, it is a lens.** Move it.

---

## Zero judges is a real answer

The corpus observed **0 to 3 judges**. Use zero when nothing is contested:

- **Generation with checkable ground truth** — citations resolve, tests pass. Mine → Verify, then
  synthesize. A panel over an uncontested check adds cost and no information.
- **A quick review** where the confirmed dossier already implies its own priority order.

Adding a panel because a quorum "should have one" is exactly the invented-structure failure the
corpus rejected elsewhere.

---

## What judges receive, and may do

Judges get the **confirmed dossier as data** — JSON, findings with verdicts, evidence, corroboration
counts.

- **They may not re-mine.** A judge that goes hunting produces unverified findings that bypass the
  verify phase entirely.
- **They may not launch tools**, with one exception: a targeted re-read of a single cited artifact.
- They rule on what is in front of them.

Each judge returns:

```
{
  judge: "token economist",
  recommendations: [{title, gain, effort, rationale}],
  rejected:        [{title, reason}],
  novelInsight:    "one thing nobody asked about"
}
```

The `rejected` array matters as much as the recommendations — it is what produces a genuine dispute
rather than silent divergence, and disputes are what the synthesis must rule on.

`novelInsight` is where a panel repeatedly earns its cost: the judge sees the whole dossier at once,
which no miner did.

---

## Consensus, computed not narrated

```js
import { judgeConsensus } from './tools/quorum-lib.mjs';
const { consensus, singleJudge, disputed } = judgeConsensus(judgeOutputs);
```

| Bucket | Meaning | Treatment in the ruling |
|---|---|---|
| `consensus` | 2+ judges endorsed, none rejected | Top of the actions table |
| `singleJudge` | One judge endorsed, none rejected | Below consensus, attributed to that judge |
| `disputed` | Endorsed by one, **rejected by another** | **Must appear with an explicit ruling** |

Matching is fuzzy by design: judges phrase the same recommendation differently, and exact matching
would report three single-judge picks where there was one three-judge consensus — inverting the point
of the panel.

---

## Dissent is the deliverable

The rule that survived every run:

> **A disagreement is reported with an explicit ruling. It is never silently dropped.**

Dropping dissent is tempting because it produces a cleaner document. It also destroys the only
information the panel uniquely generated — that informed perspectives *disagree*, and on what.

Ruling on a dispute means stating:

1. **What each side held**, in one line each
2. **Which position governs here**, and why — usually because one judge's constraint is binding in
   this context and the other's is not
3. **What would change the ruling** — the condition under which the other side wins

```markdown
### Disputed: delete the unused MCP servers

- **Token economist (for):** 2 servers, 0 calls in 34 sessions; their tool
  definitions are resident on every request.
- **Reliability judge (against):** one is the emergency rollback path; removing
  it trades a recurring small cost for a rare large one.

**Ruling:** disconnect the analytics server, keep the rollback server. The
economist's argument is binding for the server with no failure role; the
reliability constraint governs the other.

**Would change this:** if the rollback path gets a non-MCP equivalent, the
second server goes too.
```

---

## The synthesis output

Fixed section order. Do not improvise a variant:

1. **Root causes** — ranked, quantified. Not a restatement of findings; the *why underneath* them
2. **Top actions** — a table with gain and effort, consensus first
3. **Stop-doing list** — what to cease. Consistently the most-acted-on section, and the most often
   omitted
4. **Disagreements and rulings** — per above

Then, briefly: what was **not** covered, and what remains unverified. A synthesis claiming total
coverage is asserting something the run did not establish.

---

## Quality checks on a ruling

- [ ] Every quantitative claim traces to a CONFIRMED finding
- [ ] `PLAUSIBLE` findings are labelled as unverified where used
- [ ] Every dispute has a ruling and a would-change-this condition
- [ ] The stop-doing list is present and non-empty (if genuinely empty, say so explicitly)
- [ ] Actions are specific enough to start today — the corpus's strong runs shipped **6 of 10
      recommendations in the same session**; vague actions are the tell of a thin run
- [ ] The novel insights from judges appear somewhere rather than being discarded

---

## Related skills

- `quorum` — the orchestrator and the output contract
- `quorum-verification` — what produced the confirmed dossier
- `quorum-lenses` — why judges are not lenses
- `decision-quorum` — the adapter where judging carries the most weight
