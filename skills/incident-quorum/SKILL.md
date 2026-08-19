---
name: incident-quorum
description: Post-mortem and forensics as a quorum - assembling cited FACTS before any diagnosis, mining causes against those facts rather than against recollection, and producing a prevention process rather than a list of contributing factors. Trigger on "post-mortem", "why did it fail", "what went wrong", "incident review", "root cause", "retro", "how did we miss this", "forensics".
---

# Incident quorum

Post-mortems fail in a specific, predictable way: **the first plausible story wins.** Someone
proposes a cause, everyone recognizes it, and the investigation stops — usually at the most visible
contributor rather than the one that actually made the failure possible.

The forensics family has a structural difference from every other quorum shape, and it is
non-negotiable:

> **The orchestrator assembles cited FACTS before any fan-out.** Miners diagnose *against those
> facts*, never against recollection.

Without that step, miners generate competing plausible narratives and the verify phase has nothing
independent to check them against.

---

## Phase 0 — FACTS (before spawning anything)

Assemble a timeline where **every entry carries a source**. This is orchestrator work, done first.

```markdown
# FACTS — checkout failures, 2026-08-14

| Time (UTC) | Fact | Source |
|---|---|---|
| 09:12 | Deploy of api@4.18.0 completed | deploy log, run 8821 |
| 09:14 | 5xx rate 0.2% → 11% | metrics dashboard, screenshot |
| 09:22 | First customer report | support ticket 44120 |
| 09:31 | On-call paged | pager log |
| 09:48 | Rollback to 4.17.2 started | deploy log, run 8822 |
| 09:55 | 5xx rate back to 0.3% | metrics dashboard |

## Established
- The change in 4.18.0 touching the payment client is at
  `api/payments/client.ts:88-140` (diff attached)
- Connection pool max is 20 (config, unchanged since March)

## NOT established (do not assume)
- Whether the pool was actually exhausted — no metric existed for it
- Why the canary did not catch it
- Whether the 09:22 reports are the same failure as the 09:14 spike
```

**The `NOT established` section is the most valuable part.** It is what stops miners from treating a
gap as a fact, and it usually names the missing instrumentation that becomes a prevention action.

Facts are observations with sources. "The pool was exhausted" is a hypothesis; "no pool metric
existed" is a fact.

---

## The lenses

Coined per incident, but these five generalize:

### 1. Mechanism adversary
> *"Show me the causal chain from the facts to the observed failure, with no gaps."*

Every link must be supported by a fact or be explicitly marked as inference. The chain — not a list
of contributors — is the deliverable.

### 2. Alternative-cause adversary
> *"Show me a different cause that fits these same facts."*

**Seat this always.** It is the direct counter to first-plausible-story-wins. If two causes fit the
facts equally, the investigation is not finished, and saying so is a legitimate result.

### 3. Detection adversary
> *"Show me why this was not caught earlier."*

Hunts: the missing alert, the test that should have failed, the canary that passed, the review that
did not look, the dashboard nobody watches. Detection findings usually produce the highest-value
prevention actions, because they generalize past this one incident.

### 4. Blast-radius adversary
> *"Show me what else this touched that nobody has checked."*

Hunts: silently corrupted data, partially processed queues, downstream systems that consumed bad
output, retries that duplicated work, cached wrong values still being served.

**Run this before closing the incident.** The failure people find later is usually here.

### 5. Response adversary
> *"Show me where the response itself cost time."*

Hunts: unclear ownership, a missing runbook, an ambiguous alert, a rollback path nobody had tested,
the time between detection and the decision to act.

> **A note on rosters:** the corpus explicitly rejected an invented forensics trio of *root-cause /
> timeline-integrity / blast-radius* — zero mined runs used it, and 3/3 judges rejected it. Two of
> those concepts appear above because they emerged from real incidents; the point is that they were
> derived per-incident, not applied as a default. See [CALIBRATION.md](../../CALIBRATION.md).

---

## Evidence contract

- Every claim cites a **fact from Phase 0**, or is explicitly labelled `INFERENCE`
- Inferences state what would confirm them
- **"Probably" and "likely" require a stated basis**, or they refute
- Timeline claims cite a timestamped source

The framing that keeps this honest: **a post-mortem is not an explanation, it is a set of claims that
survived attempts to break them.**

---

## Verification

Refuters check each causal link against the facts. Refute when:

- A link has no supporting fact and is not marked as inference
- The facts equally support a different mechanism
- The timeline does not permit the claimed sequence — **check this first; it is the fastest kill**
- The mechanism would have produced additional symptoms nobody observed

That last one is powerful: if the proposed cause predicts effects the incident did not show, the
cause is wrong or incomplete.

---

## The output must include a prevention process

A post-mortem ending in "we fixed the bug" has produced nothing durable. The family requires a
**prevention process** — a change to how work is done, not only to what the code says.

| Layer | Example |
|---|---|
| **Detection** | Add the pool-utilization metric that did not exist; alert at 80% |
| **Prevention** | Load-test the payment path against pool limits in CI |
| **Response** | Runbook for pool exhaustion; test the rollback path quarterly |
| **Process** | Deploys touching connection-pooled clients require a canary at production concurrency |

Each needs an owner and a date, or it will not happen.

**No blame.** The corpus is clear that findings must attach to systems and processes. A post-mortem
that names a person stops producing honest inputs immediately, and every subsequent incident review
gets worse.

---

## Judges

| Judge | Asks |
|---|---|
| **Recurrence** | Would these actions actually have prevented this? |
| **Generality** | Do they prevent the *class*, or only this instance? |
| **Cost** | Is the prevention proportionate to the risk? |

The generality judge is the one that upgrades a post-mortem from a patch to a process improvement.

---

## Related skills

- `quorum`, `quorum-lenses`, `quorum-verification`, `quorum-judging`
- `code-quorum` — the pre-merge review that would have caught it
- `decision-quorum` — when the incident forces a bigger call
