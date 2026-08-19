---
name: design-quorum
description: Adversarial review of a UI, chart, dashboard, or published page before anyone relies on it - lenses for misreading, degradation, comprehension, craft, and data integrity, because design failures are exactly the class the person who built the thing cannot see. Trigger on "review this design", "review the chart", "before I publish", "does this mislead", "design review", "UI review", "check this dashboard", "is this chart honest".
---

# Design quorum

Design failures are the hardest class to self-review: **you know what the chart means, so you cannot
experience misreading it.** A checklist catches what you remembered to look for. It does not catch
"a reader draws the opposite conclusion from this axis."

This adapter seats lenses that hunt exactly that.

---

## When to run it

| Run it | Skip it |
|---|---|
| Before a chart or page goes to a board, investor, client, or the public | Exploratory views nobody will act on |
| Before publishing anything that distributes | Formatting-only changes |
| When the visual is technically fine but feels generic | Work already reviewed and unchanged since |
| When a number on the page will be quoted | |

Run the mechanical checklist **first** (`artifact-testing` in the chartroom pack, or your own), then
this. They catch different things: the checklist catches omissions, the quorum catches misreads.

---

## The lenses

Five, coined for visual work. Drop any that does not apply; add subject-specific ones.

### 1. Misread adversary
> *"Show me a competent reader reaching a wrong conclusion from this."*

Hunts: truncated axes on additive measures, dual axes implying a relationship, inconsistent series
colours across charts, a smoothed line through discrete periods, a definition change with no visible
break, "other" larger than the smallest named category, percentage without base, area encoding read
as linear.

The strongest single lens here. Most charts that mislead do so without a factual error in them.

### 2. Degradation adversary
> *"Show me this broken."*

Hunts: system-dark theme with no `data-theme` attribute set, greyscale where two series merge, 375px
width, printed output, keyboard-only operation, a viewer without the data capability, an empty result
set, a filtered-to-nothing result.

Cheap to run and finds real failures nearly every time, because these states are rarely built
deliberately.

### 3. Comprehension adversary
> *"Show me the question this claims to answer but does not."*

Hunts: a title promising a finding the chart cannot support, a page with no clear primary question,
twelve equally weighted tiles with no ranking, a takeaway that requires arithmetic the reader must
do, a legend that forces lookup, a value available only on hover.

### 4. Craft adversary
> *"Show me what reads as defaulted rather than chosen."*

Hunts: the generated-page signature — gradient hero, everything in cards, one radius everywhere,
shadows as decoration, emoji section icons, three equal columns, centred text in wide containers,
icons repeating their labels.

Ask of each element: *could the author say why this decision was made?*

### 5. Data-integrity adversary
> *"Show me a number here that is not what its label says."*

Hunts: a bridge whose bars do not sum to its anchor, totals that disagree with their rows, precision
beyond what the source supports, percent versus percentage points, a stated as-of that does not match
the data, an open-period figure presented as final, a benchmark with no stage or vintage, suppressed
cells rendered blank so they read as zero.

**Seat this whenever the page carries figures.** It is the lens that catches the failures with real
consequences.

---

## Add a brand/client-voice lens when the deliverable leaves the building

For anything client-facing or public: internal codenames leaking into external text, tone drift from
the house voice, placeholder content that survived, and real data used as sample data.

This seat is conditional in the corpus, and it earned its place by catching an internal codename in
client-facing copy.

---

## Judges

Two or three constraints that would actually kill the deliverable:

| Judge | Asks |
|---|---|
| **Audience credibility** | Would this survive one hostile question from its intended reader? |
| **Decision fitness** | Does it prompt the right decision, or merely inform? |
| **Distribution risk** | What happens if this is forwarded to someone it was not built for? |

That last one matters for anything published — artifacts and links travel.

---

## Evidence contract

Visual findings need re-checkable evidence, which is easy to skip and easy to fake.

- **Name the element**: selector, chart, panel, row, or a described position
- **State the condition**: "at 375px", "in system-dark", "in greyscale", "with the filter cleared"
- **State the wrong conclusion**, not just the defect: not "the axis is truncated" but "the axis
  starts at 4.6M, so a 4% ARR change reads as a doubling"
- Screenshots help; **the described condition is what makes it reproducible**

A verifier must be able to reproduce the condition and see the same thing. "The layout feels
cramped" is not verifiable and should refute.

---

## Verification for visual findings

The refuter re-opens the artifact under the stated condition. Refute when:

- The condition does not reproduce the defect
- The defect exists but no realistic reader would draw the stated wrong conclusion
- A label, annotation, or adjacent element already prevents the misread
- The impact is materially overstated — a cosmetic issue described as misleading

**"It looks fine to me" is not a refutation.** The verifier must state the condition they tested.

---

## Running it

Tier 1 with a workflow tool; otherwise `quorum-degradation`. Tier 3 is common for design work and
works acceptably here **provided each lens question is written down before looking** — the
degradation and data-integrity lenses in particular are largely mechanical and survive single-context
review well. The misread lens is the one that suffers most, since you cannot un-know what the chart
means.

---

## Related skills

- `quorum`, `quorum-lenses`, `quorum-verification`, `quorum-degradation`
- The [chartroom](https://github.com/Lukehle/chartroom) pack — `artifact-testing` for the mechanical
  pass this follows, plus `ui-antipatterns`, `chart-annotation`, and the chart-form skills that
  define what "correct" means for each of these lenses
