# claude-quorum

**Private repo.** A multi-agent verification harness for Claude Code: parallel
evidence miners → adversarial verification → judge panel → synthesis. Used when
an answer needs to be *defensible*, not just plausible — audits, gap analyses,
post-mortems, architecture rulings.

## What's included

- `skills/quorum/SKILL.md` — the `/quorum <question>` skill: intent
  classification (audit / build-gap / forensics / review / research-delegate),
  roster selection, phase structure, done-checks, and requorum (gate) mode.
- `skills/quorum/references/` — the evidence-backed playbook distilled from
  ~21 production quorum runs: what the strongest runs shared, prompt-pattern
  rules, and calibration data (mine→verify survival rates).
- `workflows/site-content-quorum.example.js` — a full Workflow-tool script
  instantiating the quorum shape for website content auditing (miners per
  lens → adversarial verify → judges → per-page action plan), extracted from
  a real 2-round production audit. Use it as the template for scripting other
  quorum-shaped workflows.

## The shape

1. **Mine** — N parallel agents, each with a distinct lens, surface candidate
   findings. Lenses beat redundancy: diverse failure modes get caught.
2. **Verify** — every finding goes to an adversarial checker prompted to
   refute it. This phase, not lens naming, is the measured differentiator:
   ~86% survival, uniform across lenses.
3. **Judge** — an independent panel scores the surviving findings.
4. **Synthesize** — one agent writes the ruling: confirmed findings, ranked,
   with open blockers listed for the next round.
5. **Requorum** — re-run in gate mode against the prior ruling's blockers
   until the loop is dry (cap 3 rounds).

## Install

```bash
cp -r skills/quorum ~/.claude/skills/
```

Invoke with `/quorum <question or scope>`.
