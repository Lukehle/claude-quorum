# Quorum Skill — Final Synthesis Report

## 1. What the best runs had in common (quantified)

Across ~21 distinct quorum runs (phase counts: 1-phase ×6, 2-phase ×7, 3-phase ×2, 4-phase ×5), the 5 strongest (process-quorum-audit, skill-gap-audit, client-postmortem, hud-gap series, agent-os-improvement) shared:

- **A separate adversarial Verify phase** — the true differentiator (verified over lens-name specificity; the mediocre flow/typo runs also had named lenses but folded verify into the judge). Audit: 31/36 findings confirmed; lens survival uniform 83–89% (~86%) — the mine→verify structure is well-calibrated regardless of lens.
- **Lenses coined per-subject from failure/value axes** (token-burn, deal-risk, brand-comms) — never generic "reviewer 1/2/3".
- **Same-day action**: 6/10 audit recs shipped same session; skill-gap quorum spawned a 20-skill build next day. Thin runs left no traceable artifact.
- **The sole family-invariant**: an explicit dissent-honoring convergence step. It survives every specimen, including judge-less and verify-less runs. Everything else — phase count, verify presence, roster names/counts (0–3 judges observed), evidence mechanism — varied by family. Every non-audit run swapped 100% of the pinned roster.

## 2. The experts roster

Minimal evidence-backed seats. Tiers per model-routing.md (miners `sonnet high`; verifiers/judges `opus high` pin; synthesizer inherit `xhigh`; Luke used `fable` seats for high-stakes build quorums).

| Seat | Uniquely catches | Families | Tier |
|---|---|---|---|
| architect | structural/coupling/migration risk | build, audit | sonnet (fable high-stakes) |
| security / security-rails | rail violations, exposure; holds vetoes | build, audit | opus as judge |
| operator (daily-driver) | day-2 friction, real usage cost | build, review | sonnet |
| strategy / roi (variants: thin-scope guardian, token economist) | value-per-effort, scope creep | build; audit judge | opus as judge |
| delivery pragmatist | ship-now vs perfect tradeoffs | build | sonnet |
| automation architect | deterministic-over-model-driven | audit judge only | opus |
| reliability judge | first-time-right; where MORE process hurts | audit judge only | opus |
| red-team / refuter | invalidation of claimed evidence (IS the Verify phase) | all families | opus |
| brand / client-voice | internal codenames leaking into client text; tone drift (caught "Steadhold") | **conditional**: client-facing/creative deliverables only | sonnet mine, opus verify |
| visual · ux · messaging · conversion · responsive | design-review axes | review | sonnet + 1 opus judge |

**Judge-rejected (do not seat):** forensics trio *root-cause/timeline-integrity/blast-radius* (invented, zero mined runs — 3/3 judges); this audit's 5 miner lens names as a default roster (subject artifacts, not a roster); *post-mortem/forecaster* as listed skill vocabulary (see §6).

## 3. Task-family playbook

| Family | Shape | Default seats | Deliverable |
|---|---|---|---|
| **build / build-gap** | Panel(4–6)→Judge/Synthesize, verify folded in; **requorum gate loop** until 0 open blockers or round cap | architect, security, operator, strategy, delivery | blocker list + ruling per iteration |
| **generation w/ checkable ground truth** | Mine→Verify only — **no judge panel over an uncontested check** | authors + citation/test verifiers | verified artifacts |
| **review (design/copy/UX)** | Review(5 lenses)→1 opus Judge (dedupe+verify+prioritize). Purely visual → **route to gsd:ui-review** | coined per subject (e.g. visual/ux/messaging/conversion/responsive) | prioritized fix list |
| **debug / forensics** | FACTS (orchestrator-assembled, cited, before fan-out)→Mine-against-facts→Verify→Synthesize | coined per incident; + brand/client-voice if client-facing | ranked causes **+ documented prevention process** |
| **research** | **Route mining to deep-research**; judges score only its verified output | derivation rule | cited report + ruling |
| **audit (high-stakes)** | Full Mine(5)→Verify(per-finding)→Judge(3)→Synthesize | audit trio: automation-architect / token-economist / reliability-judge | root causes → actions table → stop-doing → rulings |
| **creative** | Generation to owning skill (frontend-design, copywriting…); quorum only as Review→Judge over contested drafts | + brand/client-voice | ruled shortlist |

## 4. Intent-parse rules (grounded in Luke's actual prompts)

1. **Verb+noun classify family** — prompts encode nothing else: *refine/gaps/what's-next* → audit; *how-to-build/what's-missing-to-ship* → build-gap; *why-did-X-fail/went-wrong* → forensics; *analyze/rebuild/design* → review; *research/landscape* → delegate to deep-research.
2. **Definite past-tense referent = retrieval obligation** ("our best quorum runs", "like we did for Y"): Grep/Glob the artifact BEFORE mining/building; on empty search, ask — never substitute a build for a lookup (a 256KB document was once rebuilt from scratch instead of retrieved — costly failure).
3. **Until-clause = done-check** (attested 9× across 6 sessions; "quick quorum"/"exhaustive" attested 0× in typed input): re-run until X holds, cap 3 rounds.
4. **Requorum phrases** ("continue the loop until the quorum passes", "requorum") → gate mode: same roster, diff against prior ruling's open blockers.
5. **Client-facing deliverable-noun** (email, sent artifact, site/form copy) → seat brand/client-voice lens.
6. **No ALL-CAPS rule**; parse imperatives (*do not/only/always/never*) case-insensitively.

## 5. SKILL.md patch spec (paste-ready)

**A. Description (line 3)** — append to trigger list: `"continue the loop until the quorum passes", "requorum",`

**B. Insert new section after line 8:**

```markdown
## Parse the ask (before spawning anything)
- Infer task family from the leading verb + trailing deliverable-noun: refine/gaps → audit (full 4 phases); how-to-build/what's-missing → build-gap (Panel→Judge, verify folded in); why-did-X-fail → forensics (orchestrator assembles cited FACTS first; miners diagnose against them; output must include a prevention process); analyze/rebuild/design → review (Review→Judge). Route purely-visual work to gsd:ui-review; delegate pure research/landscape mining to deep-research, judges score its verified output.
- A definite past-tense referent ("our X", "the X we did", "like we did for Y") is a retrieval obligation: Grep/Glob it BEFORE mining or building; on empty search, ask — never substitute a build for a lookup. See [[feedback_definite_reference_is_retrieval]].
- A loop/until clause ("keep running until X", "do not prompt me") makes X an explicit done-check: re-run until it holds, capped at 3 rounds unless stated.
```

**C. Replace line 12 tail** (`Miners aggregate with grep/scripts...`) **with:**

```markdown
Lenses are coined per-subject from its failure/value axes (what could go wrong here + who would notice), never generic reviewer labels. If the deliverable is client-facing (email, sent artifact, site/form copy), seat a brand/client-voice lens (codename leaks, tone drift). Every claim must trace to something re-checkable a downstream agent actually re-opens — grep/scripts for transcript audits, direct Read of cited source/screenshots for design, WebFetch/NotebookLM for research; never dump whole large files.
```

**D. Replace lines 14–18 (judge block) with:**

```markdown
3. **Judge** — judges = the 2–4 hard constraints that would actually kill or approve THIS class of decision, named from the subject's real stakes; use 0 and go straight to synthesis when nothing is contested — generation with checkable ground truth (citations resolve, tests pass) is Mine→Verify only, no panel. Example (audit family): **automation architect** / **token economist** / **reliability judge**. Judges score the confirmed dossier; no re-mine sweep, but a targeted re-Read of one cited artifact is allowed. Each returns: top recommendations (gain + effort), rejected items with reasons, one novel insight.
```

**E. Line 19**: prepend `4. **Synthesize** (the only family-invariant phase) — ...`

**F. Replace line 32 (Scale enum) with two bullets:**

```markdown
- Scale is signalled by the prompt, not fixed words: size the panel to the subject (2–3 lenses for a quick review, 5+ for an audit); a loop/until clause sets the done-check (see Parse).
- Requorum/gate mode: when re-running the same roster on a changed subject, diff each finding against the prior ruling's open blockers/dissents; stop at 0 remaining or the round cap. Reuses Verify+Synthesize (re-enter phase 1 or append a Reverify pass). Distinct from a loop-until-dry mining round, which deepens evidence within one run.
```

**DO-NOT-ADD (judge-rejected):** ALL-CAPS detection rule; the invented forensics judge roster; family-indexed judge-count reductions ("1 judge fine for non-audit"); hardcoded routing strings (gsd:execute-phase / superpowers:subagent-driven-development); five named phase shapes as first-class vocabulary; the 9-name archetype list as skill text; run-census/lineage figures ("3 of 34", Gen1/2/3); this audit's 5 lens names as defaults.

## 6. Disagreements & rulings

- **Archetype seed line** (architect/security/…/forecaster listed in skill): orchestration-architect endorsed; reliability judge rejected as re-anchoring; intent-interpreter silent. **Ruling:** fails 2+ bar — vocabulary lives in this report (§2), not the skill; the derivation rule carries the weight.
- **Requorum as phase vs. mode**: miners said "not a 5th phase"; verifier noted Luke has used both (obsidian-max's explicit Reverify). **Ruling:** mode — either re-enter phase 1 or append Reverify (patch F).
- **What made best runs best**: lens-name specificity (miner) vs. separate adversarial verify (verifier). **Ruling:** verify-phase presence is primary; both encoded (patches C, D).
- **Forensics as named family**: reliability judge would demote to a clause; two judges kept it named. **Ruling:** kept, but only its two novel deltas (facts-first, prevention-process deliverable) — no Diagnose/Refute vocabulary.
- **Evidence-mechanic abstraction** (patch C): single-judge (reliability) endorsement but CONFIRMED-high finding that current absolutes are actively wrong for design/research. **Ruling:** adopted — it replaces existing lines (net ~0), correcting a rule that forces silent deviation.

Net line delta of full patch: ~+7 lines against ~5 deleted — nearly all additions are demotions of false invariants; the only new capability is the requorum gate, per unanimous judge consensus.