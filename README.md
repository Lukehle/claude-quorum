# claude-quorum

**A multi-agent verification harness for Claude Code.** Parallel evidence miners with per-subject
lenses → adversarial verification → judge panel → dissent-honoring synthesis.

For questions where the answer must be **defensible, not just plausible** — audits, gap analyses,
post-mortems, design and code review, architecture rulings, decisions you cannot easily reverse.

---

## Why this exists

Ask one capable reviewer "does this look right?" and you will mostly get yes. The question invites
confirmation, and a single reviewer — however good — cannot refute a finding they just produced.

A quorum instead runs independent lenses that each try to **break** the work, then rules on what
survives.

The design is not invented. It comes from a retrospective over **~21 production quorum runs**, and
two findings drove everything here:

> **The separate adversarial Verify phase is the differentiator.** The five strongest runs all had
> one; the mediocre runs also had named lenses but folded verification into the judge. Measured:
> **31/36 findings confirmed, with lens survival uniform at 83–89% (~86%)**.
>
> The uniformity is the point. If lens naming were doing the work, survival would vary by lens. It
> does not — the returns come from *having* a refutation step.

> **The only family-invariant is a dissent-honoring convergence step.** It survives every specimen,
> including judge-less and verify-less runs. Everything else — phase count, verify presence, judge
> count (0–3 observed), evidence mechanism — varied by family.

Full evidence, including what the judges **rejected**, is in [CALIBRATION.md](CALIBRATION.md).

---

## Install

```
/plugin marketplace add Lukehle/claude-quorum
/plugin install claude-quorum
```

or

```bash
git clone https://github.com/Lukehle/claude-quorum.git && cd claude-quorum
./install.sh          # macOS / Linux / Git Bash
pwsh ./install.ps1    # Windows
```

Verify the deterministic library:

```bash
node tools/quorum-lib.test.mjs    # 48 assertions
```

Then: `/quorum <question or scope>`

---

## The skills

### Core mechanics

| Skill | For |
|---|---|
| [`quorum`](skills/quorum/SKILL.md) | The orchestrator — intent parsing, family selection, the four phases, requorum |
| [`quorum-lenses`](skills/quorum-lenses/SKILL.md) | Coining lenses from the subject's failure and value axes; sizing; the earned starting vocabulary |
| [`quorum-verification`](skills/quorum-verification/SKILL.md) | The refutation phase — prompts, evidence reproduction, tallying, reading survival rates |
| [`quorum-judging`](skills/quorum-judging/SKILL.md) | Judges as constraints not lenses; consensus; ruling on dissent |
| [`quorum-degradation`](skills/quorum-degradation/SKILL.md) | Three tiers, from parallel subagents to a structured single-context pass |

### Domain adapters

| Skill | For |
|---|---|
| [`design-quorum`](skills/design-quorum/SKILL.md) | UIs, charts, dashboards, published pages — misread, degradation, comprehension, craft, data-integrity |
| [`code-quorum`](skills/code-quorum/SKILL.md) | Changes, PRs, subsystems — correctness, failure, interface/migration, operability, test-honesty |
| [`incident-quorum`](skills/incident-quorum/SKILL.md) | Post-mortems — FACTS before diagnosis, and a prevention process as the required output |
| [`research-quorum`](skills/research-quorum/SKILL.md) | Verified research — per-claim confidence, circular-citation detection |
| [`decision-quorum`](skills/decision-quorum/SKILL.md) | Decisions — hunting the unexamined premise, not the weak argument |

---

## Runnable pieces

**`workflows/quorum.js`** — a parameterized Workflow script. Pass a config; it mines, dedupes,
verifies, judges, and synthesizes.

```js
Workflow({ scriptPath: "workflows/quorum.js", args: {
  subject: "the July close package",
  scope:   "close-runs/2026-07/ — all reconciliations and the flux pack",
  lenses:  [{ name: "cutoff", question: "Show me a figure in the wrong period." }, ...],
  judges:  [{ name: "materiality", question: "Would this change a decision?" }],
  verifiersPerFinding: 3,
}});
```

**`tools/scaffold.mjs`** — generate a starting config:

```bash
node tools/scaffold.mjs --subject "the ARR dashboard" --adapter design --judges 2
node tools/scaffold.mjs --subject "PR #412" --adapter code --verifiers 3
```

**`tools/quorum-lib.mjs`** — the deterministic parts, tested. Dedup, tallying, ruling, ranking, judge
consensus, requorum diffing. These are data transforms; doing them with an agent is slower, costlier,
and non-reproducible.

**`workflows/site-content-quorum.example.js`** — a full production script from a real two-round
website content audit. Useful as a worked template.

---

## Five behaviours the library guards

Each is a way a run quietly goes wrong while looking fine:

1. **Dedup preserves every contributing lens.** "Three lenses found this independently" is signal the
   judges need, and naive dedup throws it away.
2. **Abstentions are not support.** A verifier that errored or returned malformed output has produced
   no evidence for the finding.
3. **A tie fails.** Two refute, two uphold means contested — reported `PLAUSIBLE`, never `CONFIRMED`.
4. **Disputed judge picks are returned, not dropped.** Silently dropping dissent produces a cleaner
   document and destroys the only information the panel uniquely generated.
5. **A restated blocker is the same blocker.** Across requorum rounds, fuzzy matching stops a
   reworded blocker reading as simultaneously closed and newly raised.

Findings are matched with light stemming, because miners reword constantly — without it, "token
budget not enforced" and "budget for tokens not enforced" never merge and the dedup silently does
nothing, which is worse than no dedup because the run *looks* deduplicated.

---

## Rules of thumb

- **If you cut a phase, never cut Verify.** Cut a judge instead.
- **Zero judges is a real answer.** Generation with checkable ground truth is Mine → Verify only; a
  panel over an uncontested check adds cost and no information.
- **A quorum that finds nothing on its first run should be suspected**, not celebrated. So should
  100% survival — the corpus baseline is ~86%.
- **Lenses are coined per subject.** Every non-audit run swapped 100% of its pinned roster. A roster
  is a starting vocabulary, never a default.
- **Say which tier ran.** A Tier 3 single-context pass read as a Tier 1 result is the failure
  `quorum-degradation` exists to prevent.
- **Scale is signalled by the subject, not by magic words** — "quick" and "exhaustive" were typed 0×
  across the corpus.

---

## Companion packs

| | |
|---|---|
| [closeloop](https://github.com/Lukehle/closeloop) | Finance operations — close, reconciliation, statements, SaaS metrics. Its `finance-quorum` is this pattern applied to numbers |
| [chartroom](https://github.com/Lukehle/chartroom) | Artifacts, apps, and charts. Pairs with `design-quorum` for pre-publish review |

## License

MIT — see [LICENSE](LICENSE).
