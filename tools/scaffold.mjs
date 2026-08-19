#!/usr/bin/env node
/**
 * scaffold - generate a quorum config or a standalone Workflow script.
 *
 * The generic workflow (workflows/quorum.js) is parameterized, so most runs need
 * only a config. Use --standalone when you want a script to edit directly.
 *
 * Usage:
 *   node tools/scaffold.mjs --subject "the July close" --adapter code
 *   node tools/scaffold.mjs --subject "the ARR dashboard" --adapter design --judges 3
 *   node tools/scaffold.mjs --subject "X" --lenses "cutoff,definition,disclosure"
 *   node tools/scaffold.mjs --subject "X" --adapter decision --standalone > wf.js
 *
 * Adapters carry a STARTING lens set, not a roster to apply unexamined. Every
 * non-audit run in the calibration corpus swapped 100% of its pinned roster -
 * edit what this prints before running it.
 */

const ADAPTERS = {
  code: {
    lenses: [
      { name: 'correctness', question: 'Show me an input that produces a wrong result.',
        lookAt: 'boundaries (zero, one, empty, max), null paths, timezone and DST, float money arithmetic, sort stability' },
      { name: 'failure', question: 'Show me what happens when a dependency fails.',
        lookAt: 'unhandled rejections, partial writes, retry without idempotency, swallowed errors, fallbacks that return wrong data instead of failing' },
      { name: 'interface', question: 'Show me the caller this breaks, or the deploy where old and new disagree.',
        lookAt: 'signature and contract changes, response shapes, rolling-deploy compatibility, migrations without backfill' },
      { name: 'operability', question: 'Show me this failing at 3am with nobody able to tell why.',
        lookAt: 'logging at the failure point, identifiers in errors, metrics on new paths, unbounded queries, missing timeouts' },
      { name: 'test-honesty', question: 'Show me a test that would pass if the code were wrong.',
        lookAt: 'assertions on implementation not behaviour, over-complete mocks, assertions that cannot fail, happy-path-only coverage' },
    ],
    judges: [
      { name: 'blast-radius', question: 'If this is wrong in production, what is the worst realistic outcome and how fast do we know?' },
      { name: 'reversibility', question: 'Can we undo it, or does undoing require a correcting migration?' },
      { name: 'carrying-cost', question: 'What does this commit us to maintaining?' },
    ],
  },
  design: {
    lenses: [
      { name: 'misread', question: 'Show me a competent reader reaching a wrong conclusion from this.',
        lookAt: 'truncated axes on additive measures, dual axes, inconsistent series colours, smoothing through discrete periods, unlabelled definition changes' },
      { name: 'degradation', question: 'Show me this broken.',
        lookAt: 'system-dark theme, greyscale, 375px, print, keyboard only, no data capability, empty and filtered-to-nothing states' },
      { name: 'comprehension', question: 'Show me the question this claims to answer but does not.',
        lookAt: 'titles promising unsupported findings, no clear primary question, unranked tiles, values available only on hover' },
      { name: 'craft', question: 'Show me what reads as defaulted rather than chosen.',
        lookAt: 'gradient heroes, everything in cards, one radius everywhere, decorative shadows, emoji section icons, three equal columns' },
      { name: 'data-integrity', question: 'Show me a number here that is not what its label says.',
        lookAt: 'bridges that do not foot, totals disagreeing with rows, false precision, percent vs points, as-of mismatches, blank suppressed cells' },
    ],
    judges: [
      { name: 'audience-credibility', question: 'Would this survive one hostile question from its intended reader?' },
      { name: 'decision-fitness', question: 'Does it prompt the right decision, or merely inform?' },
      { name: 'distribution-risk', question: 'What happens if this is forwarded to someone it was not built for?' },
    ],
  },
  decision: {
    lenses: [
      { name: 'premise', question: 'Show me an assumption here that is not true, or not established.' },
      { name: 'option', question: 'Show me an option nobody put on the table.',
        lookAt: 'do nothing, do less, do it later, buy instead of build, a smaller reversible version, changing who does it' },
      { name: 'reversibility', question: 'Show me what this locks in.',
        lookAt: 'switching costs, foreclosed decisions, contract and data lock-in, organizational commitment' },
      { name: 'second-order', question: 'Show me the problem this creates.',
        lookAt: 'who is worse off, new failure modes, maintenance burden, incentive changes, behaviour at 10x' },
      { name: 'evidence', question: 'Show me a claim in the case for this that is not supported.' },
    ],
    judges: [
      { name: 'reversibility', question: 'If wrong, how fast and how cheaply do we get out?' },
      { name: 'resource-reality', question: 'Do the people and time actually exist, or does this assume slack nobody has?' },
      { name: 'opportunity-cost', question: 'What does this displace?' },
    ],
  },
  incident: {
    lenses: [
      { name: 'mechanism', question: 'Show me the causal chain from the facts to the failure, with no gaps.' },
      { name: 'alternative-cause', question: 'Show me a different cause that fits these same facts.' },
      { name: 'detection', question: 'Show me why this was not caught earlier.',
        lookAt: 'missing alerts, tests that should have failed, canaries that passed, unwatched dashboards' },
      { name: 'blast-radius', question: 'Show me what else this touched that nobody has checked.',
        lookAt: 'corrupted data, partially processed queues, downstream consumers, duplicated retries, cached wrong values' },
      { name: 'response', question: 'Show me where the response itself cost time.' },
    ],
    judges: [
      { name: 'recurrence', question: 'Would these actions actually have prevented this?' },
      { name: 'generality', question: 'Do they prevent the class, or only this instance?' },
      { name: 'cost', question: 'Is the prevention proportionate to the risk?' },
    ],
  },
  audit: {
    lenses: [
      { name: 'architect', question: 'Show me the structural or coupling risk.' },
      { name: 'security', question: 'Show me the rail violation or the exposure.' },
      { name: 'operator', question: 'Show me the day-2 friction a daily user hits.' },
      { name: 'economics', question: 'Show me where effort is spent for no return.' },
      { name: 'reliability', question: 'Show me where more process makes outcomes worse.' },
    ],
    judges: [
      { name: 'automation-architect', question: 'Should this be deterministic rather than model-driven?' },
      { name: 'token-economist', question: 'What is the value per unit of cost here?' },
      { name: 'reliability-judge', question: 'Does this get it right first time, or add ceremony?' },
    ],
  },
};

function parseArgs(argv) {
  const out = { judges: null, standalone: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--standalone') out.standalone = true;
    else if (a.startsWith('--')) out[a.slice(2)] = argv[++i];
  }
  return out;
}

const a = parseArgs(process.argv.slice(2));

if (!a.subject) {
  console.error(`scaffold - generate a quorum config

Usage:
  node tools/scaffold.mjs --subject "<what is under review>" [options]

Options:
  --adapter <name>     ${Object.keys(ADAPTERS).join(' | ')}
  --lenses  <a,b,c>    custom lens names (overrides the adapter's set)
  --scope   <text>     what is in and out of scope
  --judges  <n>        how many judges to keep (0 for none)
  --verifiers <n>      verifiers per finding (default 1; use 3 for high stakes)
  --standalone         print a full Workflow script instead of a config

Adapters carry a STARTING lens set. Every non-audit run in the calibration
corpus swapped 100% of its pinned roster - edit before running.`);
  process.exit(1);
}

const adapter = a.adapter ? ADAPTERS[a.adapter] : null;
if (a.adapter && !adapter) {
  console.error(`Unknown adapter '${a.adapter}'. Available: ${Object.keys(ADAPTERS).join(', ')}`);
  process.exit(1);
}

let lenses = adapter ? adapter.lenses : [];
if (a.lenses) {
  lenses = a.lenses.split(',').map((n) => ({
    name: n.trim(),
    question: `TODO: phrase this as a failure hunt - "Show me ..."`,
    lookAt: 'TODO: name where to look, without naming what to conclude',
  }));
}
if (!lenses.length) {
  console.error('No lenses. Pass --adapter or --lenses. See the quorum-lenses skill for how to coin them.');
  process.exit(1);
}

let judges = adapter ? adapter.judges : [];
if (a.judges != null) judges = judges.slice(0, Number(a.judges));

const config = {
  subject: a.subject,
  scope: a.scope || 'TODO: state what is in scope and, importantly, what is out',
  lenses,
  judges,
  verifiersPerFinding: Number(a.verifiers || 1),
  priorBlockers: [],
};

if (!a.standalone) {
  console.log(JSON.stringify(config, null, 2));
  console.error(`
# ${lenses.length} lenses, ${judges.length} judges, ${config.verifiersPerFinding} verifier(s) per finding
#
# Run with the generic workflow:
#   Workflow({ scriptPath: "workflows/quorum.js", args: <the JSON above> })
#
# Before running: rewrite every lens question for THIS subject. A lens that
# could apply to anything finds nothing specific.`);
} else {
  console.log(`export const meta = {
  name: ${JSON.stringify('quorum-' + a.subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40))},
  description: ${JSON.stringify('Quorum on ' + a.subject)},
  phases: [
    { title: 'Mine' }, { title: 'Verify' },${judges.length ? " { title: 'Judge' }," : ''} { title: 'Synthesize' },
  ],
};

// Generated by tools/scaffold.mjs. Rewrite the lens questions for this subject
// before running - a lens that could apply to anything finds nothing specific.
const CONFIG = ${JSON.stringify(config, null, 2)};

// Then paste the body of workflows/quorum.js below, or call it with these args.
`);
}
