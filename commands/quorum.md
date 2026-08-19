---
description: Run an adversarial multi-perspective quorum over a question or artifact
---

# /quorum

$ARGUMENTS

Run the **quorum** skill. Do not improvise the process — instantiate the template.

1. **Parse the ask before spawning anything.**
   - Family from the leading verb + deliverable-noun: refine/gaps → audit; how-to-build → build-gap;
     why-did-X-fail → forensics; analyze/design → review; research → delegate the mining.
   - A **definite past-tense referent** ("our X", "like we did for Y") is a **retrieval obligation** —
     Grep it before mining. On an empty search, ask. Never substitute a build for a lookup.
   - An **until-clause** is a done-check: re-run until it holds, cap 3 rounds.
   - Client-facing deliverable → seat a brand/client-voice lens.

2. **Coin the lenses** (`quorum-lenses`). Derive from this subject's failure and value axes. Phrase
   each as "Show me…". Never `reviewer 1/2/3`. Size the panel to the stakes — 2-3 for a quick check,
   5-6 for an audit. Check orthogonality: what does each lens find that the others cannot?

3. **Pick the tier** (`quorum-degradation`). Workflow tool → Tier 1. Subagents only → Tier 2, fresh
   context per pass. Neither → Tier 3, and say so in the output.

4. **Mine.** Every finding carries re-checkable evidence. Permit empty results.

5. **Dedupe in code**, not with an agent — `tools/quorum-lib.mjs`.

6. **Verify adversarially** (`quorum-verification`). Verifiers are told to REFUTE and to re-open the
   evidence themselves. Default to refuted when uncertain. Abstentions are not support; ties fail.

7. **Judge** (`quorum-judging`) — only if something is contested. Judges are the 2-4 constraints that
   would kill or approve this. They get the dossier as data and may not re-mine.

8. **Synthesize**: root causes → actions table → stop-doing → **disagreements with explicit rulings**.
   Never drop a disagreement.

Report survival rate. If it is 100%, suspect the verifiers rather than celebrating the work — the
corpus baseline is ~86%.
