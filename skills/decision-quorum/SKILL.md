---
name: decision-quorum
description: Stress-test a decision before committing - surfacing the unstated assumption, the option not considered, the reversibility question, and the failure the decision creates rather than solves. Judges are the constraints that would actually kill it. Trigger on "should we", "help me decide", "which option", "before we commit", "stress test this decision", "is this the right call", "pros and cons", "make the case against".
---

# Decision quorum

The characteristic failure of a considered decision is not bad reasoning. It is **an unexamined
premise that everyone in the room shares** — which no amount of careful analysis inside that premise
will surface.

This adapter hunts premises, not arguments.

---

## When it earns its cost

| Run it | Skip it |
|---|---|
| The decision is hard to reverse | Easily reversible, cheap to try |
| It commits budget, headcount, or a long timeline | The cost of being wrong is one afternoon |
| Everyone agrees quickly | *(this is a trigger, not a reason to skip)* |
| You are choosing between options someone already framed | |

**Quick unanimity deserves suspicion.** It usually means the options were framed inside a shared
premise, not that the answer is obvious.

Reversible decisions do not need this. Make them, watch, adjust.

---

## Frame before mining

State three things, in writing, before spawning anything:

1. **The decision** — the actual choice, phrased as a commitment: "we will do X by Y". Not a topic.
2. **The options as currently framed** — including doing nothing.
3. **The premises** — what everyone is assuming without argument. Write down at least three, however
   obvious they feel. The obvious ones are the target.

```markdown
Decision: adopt a warehouse-native close process by Q1, retiring the spreadsheet close.
Options: (a) full migration, (b) hybrid, (c) status quo.
Premises: the close is too slow; the warehouse is reliable enough; the team can
          learn SQL; slow close is what stakeholders actually complain about.
```

That fourth premise is the kind that decides everything and is never examined.

---

## The lenses

### 1. Premise adversary
> *"Show me an assumption here that is not true, or not established."*

Hunts the written premises **and the unwritten ones**. Highest-value lens in this adapter — a
decision built on a false premise cannot be rescued by good execution.

### 2. Option adversary
> *"Show me an option nobody put on the table."*

Hunts: doing nothing, doing less, doing it later, buying instead of building, a smaller reversible
version first, solving an adjacent problem that dissolves this one, changing who does it rather than
what is done.

Framed options are frequently a false dichotomy someone inherited.

### 3. Reversibility adversary
> *"Show me what this locks in."*

Hunts: what becomes hard to undo, what other decisions this forecloses, switching costs, data or
contract lock-in, organizational commitment that outlives the rationale.

The key distinction: **is this a one-way or a two-way door?** A two-way door deserves a fast decision
and a short review. A one-way door deserves this whole exercise.

### 4. Second-order adversary
> *"Show me the problem this creates."*

Hunts: who is worse off, what new failure mode appears, what maintenance burden it adds, how it
changes incentives, what happens at 10× scale, what the workaround will be when it does not fit.

### 5. Evidence adversary
> *"Show me a claim in the case for this that is not supported."*

Hunts: numbers with no source, a benchmark from a different context, a projection with no stated
assumptions, "everyone is doing this", a success story with survivorship bias.

### 6. Steelman *(inverted lens — seat it when the group is already leaning)*
> *"Make the strongest possible case for the option we are dismissing."*

Not a refutation lens. It exists to test whether the rejected option was rejected on merit or on
momentum. If the steelman is uncomfortably good, the framing was wrong.

---

## Judges: the constraints that would actually kill it

This is where a decision quorum earns most of its value. Name **2-4 constraints that genuinely
govern**, not generic considerations.

| Judge | Asks |
|---|---|
| **Reversibility** | If wrong, how fast and how cheaply do we get out? |
| **Resource reality** | Do the people and time actually exist, or does this assume slack nobody has? |
| **Failure cost** | What is the realistic worst case, and can we absorb it? |
| **Opportunity cost** | What does this displace? |
| **Timing** | Is now the moment, or is this a good decision made too early? |

Domain constraints replace these where they bind harder — regulatory approval, a contract date, a
runway boundary.

---

## The output

```markdown
## Decision
Adopt a warehouse-native close by Q1, retiring the spreadsheet close.

## Premises tested
| Premise | Verdict | Basis |
|---|---|---|
| The close is too slow | CONFIRMED | 9 business days vs 5-day peer median |
| Slow close is what stakeholders complain about | **REFUTED** | Ticket review: 14 of 17 complaints are about *accuracy*, not timing |
| The warehouse is reliable enough | PLAUSIBLE | 99.4% over 6 months; no SLA |

## Ruling
Proceed with (b) hybrid, not (a) full migration.

The speed premise held; the *motivation* premise did not. Reframing on accuracy
changes the design: reconciliation automation matters more than pipeline speed,
and hybrid gets that in Q1 without the migration risk.

## What would change this
If accuracy work lands by Q2 and speed is still the binding complaint, revisit
full migration with a real SLA in place.

## Disagreements
- **Resource judge:** hybrid carries two processes for two quarters — real cost.
- **Reversibility judge:** that is the price of a two-way door here.
- **Ruling:** reversibility governs. The dual-process cost is bounded and known;
  the migration risk is not.
```

**"What would change this" is mandatory.** A decision with no stated reversal condition cannot be
revisited honestly — everyone re-argues from scratch instead of checking a condition.

---

## After the decision

Record the premises and their verdicts alongside the decision. When it is revisited in six months,
the question is not "was this right?" but **"did the premises hold?"** — a far more answerable
question, and the one that produces learning rather than blame.

---

## Related skills

- `quorum`, `quorum-lenses`, `quorum-judging`
- `research-quorum` — verifying the evidence behind the case
- `incident-quorum` — when a past decision produced a failure
