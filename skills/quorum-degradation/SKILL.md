---
name: quorum-degradation
description: Run a quorum on a restricted harness - three tiers from parallel subagents down to a structured single-context pass, what each tier costs in rigour, and how to state the tier so a reader knows how strong the gate that passed their work actually was. Trigger on "no Workflow tool", "can't spawn agents", "restricted seat", "single context", "quorum without subagents", "managed plan", "how do I run this here".
---

# Degradation

The gate never gets skipped for lack of capability. It **degrades**, and it says which tier it ran
at.

This matters because a managed or restricted seat may block the Workflow tool, subagents, or both —
and the temptation is to skip the review entirely rather than run a weaker one. A weaker gate
honestly labelled beats no gate.

> **Convention, not measurement.** The three tiers are a portability design. The corpus measured the
> Tier 1 shape; Tiers 2 and 3 are reasoned degradations of it. See [CALIBRATION.md](../../CALIBRATION.md).

---

## Tier 1 — parallel subagents

The full shape. Miners run concurrently and blind to each other; verifiers run per finding; judges
see only the confirmed dossier.

**What makes it strongest: genuine independence.** Reviewers who cannot see each other's work do not
converge, and non-convergence is what produces coverage.

Requires a workflow/orchestration tool. Use `workflows/quorum.js` or scaffold one with
`tools/scaffold.mjs`.

---

## Tier 2 — sequential subagents

Subagents available, no parallelism. Same lenses, run one at a time.

**The rule that preserves most of the value: each pass gets a fresh context and does not see earlier
findings.** Independence, not concurrency, is what Tier 1 was buying. A sequential run that hides
prior results retains most of the rigour; one that accumulates them collapses into a single
perspective that agrees with itself.

Costs versus Tier 1: wall-clock time, and some risk of orchestrator context bleed between passes.

```
for each lens:
    spawn agent with ONLY the lens question + scope + evidence contract
    collect findings
    (do not pass previous findings in)
dedupe in code
for each finding: spawn a refuter with ONLY that finding
tally in code
judges: one pass each over the confirmed dossier
synthesize
```

---

## Tier 3 — structured single context

No subagents at all. **You** run every lens, explicitly and one at a time.

This is meaningfully weaker and must be labelled as such. It is also far stronger than one undirected
read, because naming the lens converts a vague "review this" into a specific search.

The discipline that makes it work:

1. **Write the lens question down verbatim, before looking at the subject.** Committing to what you
   are hunting prevents the search from drifting toward what you happen to notice.
2. **Hunt only that failure.** Do not fix anything, do not assess overall quality, do not jump to a
   different concern that catches your eye — note it and return to the lens.
3. **Record findings before switching lenses**, including "nothing found for this lens." The empty
   result is data.
4. **Never skip a lens because an earlier one found something big.** Lenses are orthogonal by
   construction; a major finding in one says nothing about the others.
5. **Verify in a separate explicit pass**, re-opening the evidence, with the refutation framing. Do
   not verify while mining — that is the fold-verify-into-judge failure the corpus identified as the
   difference between strong and mediocre runs.
6. **Rule at the end**, against the pooled list rather than as you go.

The order is doing the work here. A single context that runs mine → verify → rule as distinct passes
retains the structural benefit even though it loses independence.

---

## What each tier costs

| | Independence | Adversarial verify | Panel | Reproducible |
|---|---|---|---|---|
| **Tier 1** | Full | Per finding, parallel | Yes | Yes, scripted |
| **Tier 2** | Good (fresh contexts) | Per finding, sequential | Yes | Mostly |
| **Tier 3** | **None — one mind** | Separate pass, same mind | Self-administered | No |

Tier 3's honest limitation: **you cannot fully refute your own finding**, because you already believe
the reasoning that produced it. It catches evidence that does not reproduce; it catches
reasoning errors much less reliably.

---

## Say which tier ran

Every quorum output states its tier and that tier's limitation. A reader must know how strong the
gate was.

```
Tier 2 (sequential, fresh context per lens) — parallel subagents are
unavailable on this seat. Reviews were independent but not concurrent.
```

```
Tier 3 (structured single-context) — no subagents available. Four lenses were
run as separate explicit passes with a separate verification pass. This is
weaker than independent review: the same reasoning produced and checked the
findings.
```

Omitting the tier lets a Tier 3 pass be read as a Tier 1 result, which is the one outcome this whole
skill exists to prevent.

---

## Deterministic steps never degrade

Dedup, tallying, ruling, ranking and requorum diffing are code at every tier. `tools/quorum-lib.mjs`
has no harness dependencies — it runs anywhere Node runs, and by hand in a spreadsheet if it must.

Keeping these in code is what stops Tier 3 from also losing reproducibility in its bookkeeping on top
of losing independence in its judgement.

---

## Choosing a tier

```
Workflow/orchestration tool available?  -> Tier 1
Subagents available?                    -> Tier 2
Neither?                                -> Tier 3
```

Do not use a lower tier for convenience on high-stakes work. If the stakes justify a quorum and only
Tier 3 is available, run Tier 3, label it, and say plainly what a stronger gate would have added.

---

## Related skills

- `quorum` — the orchestrator
- `quorum-verification` — the phase most degraded at Tier 3
- `quorum-lenses` — naming the lens is what makes Tier 3 work at all
