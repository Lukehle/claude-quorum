---
name: quorum
description: Run Luke's pinned multi-agent quorum — parallel evidence miners, adversarial verification, judge panel, synthesis. Trigger on "run the quorum", "quorum loop", "/quorum", "continue the loop until the quorum passes", "requorum", or any request for a multi-perspective verified analysis/audit. Pass the question/scope as args.
---

# Quorum — pinned definition

This is the canonical form of Luke's "run the quorum" ritual (typed ~21× before being pinned on 2026-07-16; adaptability patch 2026-07-17 from a quorum over ~21 historical runs). Do NOT re-derive the process; instantiate this template with the task-specific subject.

## Parse the ask (before spawning anything)

- Infer task family from the leading verb + trailing deliverable-noun: refine/gaps → audit (full 4 phases); how-to-build/what's-missing → build-gap (Panel→Judge, verify folded in); why-did-X-fail → forensics (orchestrator assembles cited FACTS first; miners diagnose against them; output must include a prevention process); analyze/rebuild/design → review (Review→Judge). Route purely-visual work to gsd:ui-review; delegate pure research/landscape mining to deep-research, judges score its verified output.
- A definite past-tense referent ("our X", "the X we did", "like we did for Y") is a retrieval obligation: Grep/Glob it BEFORE mining or building; on empty search, ask — never substitute a build for a lookup. See [[feedback_definite_reference_is_retrieval]].
- A loop/until clause ("keep running until X", "do not prompt me") makes X an explicit done-check: re-run until it holds, capped at 3 rounds unless stated.

## Shape (4 phases, via the Workflow tool)

1. **Mine** — 3–6 parallel evidence miners, one per orthogonal lens on the subject. Each returns structured findings: `{title, claim, evidence, impact, recommendation}`. Every finding must carry concrete evidence (counts, file paths, verbatim quotes ≤200 chars). Lenses are coined per-subject from its failure/value axes (what could go wrong here + who would notice), never generic reviewer labels. If the deliverable is client-facing (email, sent artifact, site/form copy), seat a brand/client-voice lens (codename leaks, tone drift). Every claim must trace to something re-checkable a downstream agent actually re-opens — grep/scripts for transcript audits, direct Read of cited source/screenshots for design, WebFetch/NotebookLM for research; never dump whole large files.
2. **Verify** — one adversarial verifier per deduped finding, prompted to REFUTE by independently re-checking the evidence. `isReal=false` if the core evidence can't be reproduced. Findings that fail die here.
3. **Judge** — judges = the 2–4 hard constraints that would actually kill or approve THIS class of decision, named from the subject's real stakes; use 0 and go straight to synthesis when nothing is contested — generation with checkable ground truth (citations resolve, tests pass) is Mine→Verify only, no panel. Example (audit family): **automation architect** / **token economist** / **reliability judge**. Judges score the confirmed dossier; no re-mine sweep, but a targeted re-Read of one cited artifact is allowed. Each returns: top recommendations (gain + effort), rejected items with reasons, one novel insight.
4. **Synthesize** (the only family-invariant phase) — one agent merges: an action endorsed by 2+ judges outranks single-judge picks; disagreements are reported with an explicit ruling, never silently dropped. Output sections, in order: **root causes (ranked, quantified) → top actions table (gain/effort) → stop-doing list → disagreements & rulings**.

## Model routing (per model-routing.md — pass explicitly at spawn)

- Miners: `model: 'sonnet', effort: 'high'`
- Verifiers + judges: `model: 'opus', effort: 'high'` (review pin — never inherit)
- Synthesizer: inherit session tier, `effort: 'xhigh'`

## Hard rules

- Dedup findings in-script between Mine and Verify (title-keyword key), not with an agent.
- Judges see the dossier as JSON; they may not launch tools or re-mine.
- Every quantitative claim in the final report must be verifier-confirmed; mark anything else as unverified.
- Scale is signalled by the prompt, not fixed words: size the panel to the subject (2–3 lenses for a quick review, 5+ for an audit); a loop/until clause sets the done-check (see Parse).
- Requorum/gate mode: when re-running the same roster on a changed subject, diff each finding against the prior ruling's open blockers/dissents; stop at 0 remaining or the round cap. Reuses Verify+Synthesize (re-enter phase 1 or append a Reverify pass). Distinct from a loop-until-dry mining round, which deepens evidence within one run.
- Deliverables: final report in chat; save durable conclusions to memory only if they change standing behavior.
