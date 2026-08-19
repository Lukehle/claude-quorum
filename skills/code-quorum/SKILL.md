---
name: code-quorum
description: Adversarial review of a change, a pull request, or a subsystem - lenses for correctness under adversarial input, failure modes, interface and migration risk, operability, and test honesty, with an evidence contract that demands a reproducing case rather than a code smell. Trigger on "review this PR", "review the code", "before I merge", "is this safe to ship", "code review", "audit this subsystem", "what could break".
---

# Code quorum

Ordinary code review finds style issues and obvious bugs reliably. What it misses is the class that
matters: **the interaction that only fails under a specific input, at a specific scale, on the second
deploy.**

This adapter seats lenses that hunt those, with an evidence bar that rejects taste dressed as
correctness.

---

## When to run it

| Run it | Skip it |
|---|---|
| Irreversible or hard-to-reverse changes — migrations, data deletion, auth, money movement | Formatting, renames, comments |
| Changes to a subsystem you did not write | Changes with strong existing test coverage and a clean diff |
| Before a merge nobody else will review | Prototypes and spikes |
| After the second failed fix attempt on the same bug | |

That last row is the highest-value trigger. **Two failed fixes means the model of the problem is
wrong**, and more attempts from the same model produce more wrong fixes. A quorum re-derives the
model from evidence.

---

## The lenses

### 1. Correctness adversary
> *"Show me an input that produces a wrong result."*

Hunts: boundary values (zero, one, empty, max), off-by-one, null and undefined through the happy
path, unicode and encoding, timezone and DST boundaries, floating-point money arithmetic, integer
overflow, sort stability assumptions, silent type coercion.

Must produce **a concrete input**, not a category. "Could have an off-by-one" refutes; "with an empty
array, line 42 indexes `[0]` and throws" does not.

### 2. Failure adversary
> *"Show me what happens when the thing it depends on fails."*

Hunts: unhandled rejections, partial writes with no rollback, retry without idempotency, timeouts
with no cap, a swallowed error, a fallback that silently returns wrong data rather than failing, a
lock never released, resource exhaustion under retry storms.

**Silent-wrong-data is the finding to prioritise.** A crash is visible; a fallback returning a
plausible wrong value is not.

### 3. Interface and migration adversary
> *"Show me the caller this breaks, or the deploy where old and new disagree."*

Hunts: signature and contract changes, response-shape changes consumers depend on, a migration that
is not backward compatible during a rolling deploy, a schema change without a backfill, a feature
flag whose two branches produce different persisted state, an ordering dependency between deploy
steps.

The rolling-deploy window — old and new running simultaneously — is where most of these hide.

### 4. Operability adversary
> *"Show me this failing in production at 3am with nobody able to tell why."*

Hunts: no logging at the failure point, an error message with no identifiers, no metric on the new
path, an unbounded query, an N+1 that only appears at scale, a config with no default, a dependency
with no timeout.

### 5. Test-honesty adversary
> *"Show me a test that would pass if the code were wrong."*

Hunts: tests asserting the implementation rather than the behaviour, mocks so complete the real path
is never exercised, a test whose assertion cannot fail, coverage of the happy path only, snapshot
tests updated blindly, a test that passes because of a shared fixture side effect.

Frequently the most productive lens on a change that "has tests".

### 6. Security adversary *(seat when the change touches input, auth, or data access)*
> *"Show me the path from untrusted input to something that matters."*

Hunts: injection, missing authorization on a new route, IDOR, secrets in code or logs, SSRF, unsafe
deserialization, a permission check on the client only.

---

## Evidence contract

Higher than most quorums, because code review attracts opinion.

A finding must include **one** of:

- **A reproducing input** — the concrete value, and what it produces
- **A file and line** where the mechanism is visible, with the mechanism stated
- **A failing sequence** — the ordered steps and the resulting state
- **A citation** to the contract being violated — the API docs, the schema, the spec

Explicitly **not** evidence: "this is fragile", "this could be a problem", "consider whether…",
"best practice is…". A finding whose evidence is a code smell **refutes**.

---

## Verification

The refuter re-opens the code and attempts the claim. Refute when:

- The cited input does not produce the claimed result
- A guard elsewhere already prevents it — **name where**
- The path is unreachable given actual callers
- The behaviour is intentional and documented
- The impact is materially overstated

The strongest refutation is running it. Where a test can settle a finding in a minute, that is the
verification — not an argument about whether the finding is real.

---

## Judges

| Judge | Asks |
|---|---|
| **Blast radius** | If this is wrong in production, what is the worst realistic outcome and how fast do we know? |
| **Reversibility** | Can we undo it, or does undoing require a correcting migration? |
| **Carrying cost** | What does this commit us to maintaining? |

For a shipping decision those three usually settle it. Add a **compliance** judge where the change
touches regulated data or an audited control.

---

## Running it on a diff

Give miners the diff **plus enough surrounding context to be right** — a diff alone hides the caller
that makes a change safe, and produces confident wrong findings.

```
Scope: the diff below, plus the modules that call the changed functions.
Out of scope: pre-existing issues not touched by this change.
```

That second line matters. Without it, a code quorum reliably returns an audit of the whole codebase,
which is a different (and usually unwanted) job.

---

## Related skills

- `quorum`, `quorum-lenses`, `quorum-verification`, `quorum-judging`, `quorum-degradation`
- `incident-quorum` — when the failure has already happened
