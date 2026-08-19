export const meta = {
  name: 'quorum',
  description: 'Generic quorum: mine with per-subject lenses, verify adversarially, judge, synthesize with dissent honored',
  whenToUse: 'Any question where the answer must be defensible rather than plausible - audits, gap analyses, reviews, decisions. Pass config via args.',
  phases: [
    { title: 'Mine',      detail: 'one agent per lens, blind to each other' },
    { title: 'Verify',    detail: 'adversarial refuters, one per deduped finding' },
    { title: 'Judge',     detail: 'constraint panel over the confirmed dossier' },
    { title: 'Synthesize', detail: 'ruling with disagreements resolved explicitly' },
  ],
};

// ---------------------------------------------------------------------------
// Config. Pass as the Workflow `args` value:
//
// {
//   subject:  "the July close package",
//   scope:    "close-runs/2026-07/ - all reconciliations and the flux pack",
//   lenses:   [{name, question, lookAt}],
//   judges:   [{name, question}],          // omit or [] for no panel
//   verifiersPerFinding: 1,                // 3 for high-stakes
//   priorBlockers: []                      // requorum mode: the prior ruling's open blockers
// }
//
// Lenses are coined per subject - see the quorum-lenses skill. The defaults
// below are a smoke test, not a roster to apply.
// ---------------------------------------------------------------------------

const cfg = args || {};
const SUBJECT = cfg.subject || 'the subject under review';
const SCOPE = cfg.scope || 'as provided in context';
const LENSES = (cfg.lenses && cfg.lenses.length) ? cfg.lenses : [
  { name: 'correctness', question: 'Show me something here that is factually wrong.' },
  { name: 'omission',    question: 'Show me something important that is missing.' },
  { name: 'risk',        question: 'Show me how this fails in practice.' },
];
const JUDGES = cfg.judges || [];
const VERIFIERS = Math.max(1, cfg.verifiersPerFinding || 1);
const PRIOR = cfg.priorBlockers || [];

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title:          { type: 'string' },
          claim:          { type: 'string' },
          evidence:       { type: 'string' },
          impact:         { type: 'string' },
          severity:       { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          recommendation: { type: 'string' },
        },
        required: ['title', 'claim', 'evidence', 'severity'],
      },
    },
  },
  required: ['findings'],
};

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    refuted:         { type: 'boolean' },
    reason:          { type: 'string' },
    whatIChecked:    { type: 'string' },
    correctedImpact: { type: 'string' },
  },
  required: ['refuted', 'reason', 'whatIChecked'],
};

const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    judge: { type: 'string' },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' }, gain: { type: 'string' },
          effort: { type: 'string' }, rationale: { type: 'string' },
        },
        required: ['title'],
      },
    },
    rejected: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, reason: { type: 'string' } },
        required: ['title'],
      },
    },
    novelInsight: { type: 'string' },
  },
  required: ['judge', 'recommendations'],
};

// --- Deterministic helpers -------------------------------------------------
// Inlined rather than imported: Workflow scripts have no module resolution.
// Kept in sync with tools/quorum-lib.mjs, which is the tested source of truth.

const STOPWORDS = new Set(['the','a','an','and','or','but','is','are','was','were','be','been','in','on','at','to','for','of','with','by','from','as','that','this','it','its','has','have','had','not','no','if','when','than','then','there','their','they','we','our','can','could','should','would','may','might','will','does','do','did','so','too','very','more','most','per','any','all','each','some','via','into','onto','over','under']);

function stem(w) {
  let s = w;
  if (s.length > 4 && s.endsWith('ies')) s = s.slice(0, -3) + 'y';
  else if (s.length > 3 && s.endsWith('s') && !s.endsWith('ss')) s = s.slice(0, -1);
  if (s.length > 5 && s.endsWith('ing')) s = s.slice(0, -3);
  else if (s.length > 4 && s.endsWith('ed')) s = s.slice(0, -2);
  if (s.length > 3 && /([bdfglmnprt])\1$/.test(s)) s = s.slice(0, -1);
  if (s.length > 4 && s.endsWith('e')) s = s.slice(0, -1);
  return s;
}

function key(title) {
  const words = String(title || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/).filter((w) => w.length > 2 && !STOPWORDS.has(w)).map(stem);
  return [...new Set(words)].slice(0, 5).sort().join('|');
}

function sim(a, b) {
  const A = new Set(String(a).split('|').filter(Boolean));
  const B = new Set(String(b).split('|').filter(Boolean));
  if (!A.size && !B.size) return 1;
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const t of A) if (B.has(t)) shared++;
  return shared / (A.size + B.size - shared);
}

function dedupe(findings, threshold = 0.7) {
  const groups = [];
  for (const f of findings) {
    if (!f || !f.title) continue;
    const k = key(f.title);
    const g = groups.find((x) => x.key === k || sim(x.key, k) >= threshold);
    if (g) g.members.push(f); else groups.push({ key: k, members: [f] });
  }
  return groups.map((g) => {
    const best = g.members.reduce((a, b) =>
      (String(b.evidence || '').length > String(a.evidence || '').length ? b : a));
    const lenses = [...new Set(g.members.map((m) => m.lens).filter(Boolean))];
    return { ...best, key: g.key, lenses, corroboration: lenses.length };
  });
}

function tally(verdicts) {
  const valid = (verdicts || []).filter((v) => v && typeof v.refuted === 'boolean');
  const refuted = valid.filter((v) => v.refuted).length;
  const upheld = valid.length - refuted;
  // Abstentions are not support; a tie fails. See quorum-verification.
  return {
    survives: valid.length > 0 && upheld > refuted,
    upheld, refuted, abstained: (verdicts || []).length - valid.length,
    contested: valid.length > 0 && refuted > 0 && upheld > 0,
  };
}

// --- Phase 1: Mine ---------------------------------------------------------

phase('Mine');
log(`Quorum on: ${SUBJECT} — ${LENSES.length} lenses, ${VERIFIERS} verifier(s) per finding`);

const mined = await parallel(LENSES.map((lens) => () =>
  agent(
    `You are the ${lens.name.toUpperCase()} lens on: ${SUBJECT}\n\n` +
    `SCOPE: ${SCOPE}\n\n` +
    `Hunt exactly one class of failure: ${lens.question}\n` +
    (lens.lookAt ? `Where to look: ${lens.lookAt}\n` : '') +
    `\nEVERY finding must cite re-checkable evidence — a file and line, a count, a query, ` +
    `or a verbatim quote under 200 characters. A finding you cannot point at is not a finding ` +
    `and will be refuted downstream.\n\n` +
    `Hunt ONLY your lens. Do not report general observations.\n` +
    `Return an empty array if you find nothing. Do not pad — invented findings ` +
    `consume verifier budget and dilute the result.`,
    { label: `mine:${lens.name}`, phase: 'Mine', schema: FINDINGS_SCHEMA,
      model: 'sonnet', effort: 'high' })
    .then((r) => (r?.findings || []).map((f) => ({ ...f, lens: lens.name })))
)).then((rs) => rs.filter(Boolean).flat());

const deduped = dedupe(mined);
log(`Mined ${mined.length} → ${deduped.length} after dedup ` +
    `(${deduped.filter((f) => f.corroboration > 1).length} found by multiple lenses)`);

if (deduped.length === 0) {
  log('WARNING: zero findings. Suspect the lenses were generic or the evidence contract was unclear — a clean first round is rarer than a broken one.');
  return { subject: SUBJECT, findings: [], note: 'no findings mined' };
}

// --- Phase 2: Verify -------------------------------------------------------

phase('Verify');

const ruled = await parallel(deduped.map((f) => () =>
  parallel(Array.from({ length: VERIFIERS }, (_, i) => () =>
    agent(
      `A miner claims the following about ${SUBJECT}:\n\n` +
      `TITLE: ${f.title}\nCLAIM: ${f.claim}\nEVIDENCE: ${f.evidence}\n` +
      `IMPACT: ${f.impact || '(not stated)'}\n\n` +
      `YOUR JOB IS TO REFUTE THIS.\n\n` +
      `Independently re-open the cited evidence. Do not trust the miner's reading of it.\n\n` +
      `Refute if ANY of these hold:\n` +
      `  - the cited evidence does not exist or does not say what is claimed\n` +
      `  - it exists but does not support the conclusion drawn\n` +
      `  - a mechanism elsewhere already prevents the problem\n` +
      `  - the finding is real but its stated impact is materially overstated\n\n` +
      `Uphold ONLY if you re-opened the evidence yourself and it reproduces.\n` +
      `Default to refuted when uncertain.\n\n` +
      `whatIChecked must name what you actually opened. An empty or restated ` +
      `whatIChecked means you did not verify.`,
      { label: `verify:${f.key.slice(0, 22)}#${i + 1}`, phase: 'Verify',
        schema: VERDICT_SCHEMA, model: 'opus', effort: 'high' })
  )).then((verdicts) => {
    const t = tally(verdicts.filter(Boolean));
    const verdict = !t.survives ? (t.upheld + t.refuted === 0 ? 'PLAUSIBLE' : 'REFUTED')
      : (t.contested ? 'PLAUSIBLE' : 'CONFIRMED');
    return { ...f, verdict, tally: t, verdicts: verdicts.filter(Boolean) };
  })
));

const confirmed = ruled.filter((f) => f.verdict === 'CONFIRMED');
const plausible = ruled.filter((f) => f.verdict === 'PLAUSIBLE');
const refutedOut = ruled.filter((f) => f.verdict === 'REFUTED');
const survival = (confirmed.length / (ruled.length || 1));

log(`Verified: ${confirmed.length} confirmed, ${plausible.length} plausible, ` +
    `${refutedOut.length} refuted (survival ${(survival * 100).toFixed(0)}%)`);
if (survival === 1 && ruled.length > 2) {
  log('WARNING: 100% survival — verifiers may not have been adversarial. Corpus baseline is ~86%.');
}

// --- Phase 3: Judge --------------------------------------------------------

let judgeOutputs = [];
if (JUDGES.length && confirmed.length) {
  phase('Judge');
  const dossier = JSON.stringify(
    confirmed.map((f) => ({
      title: f.title, claim: f.claim, evidence: f.evidence,
      impact: f.impact, severity: f.severity, recommendation: f.recommendation,
      foundByLenses: f.lenses,
    })), null, 1);

  judgeOutputs = (await parallel(JUDGES.map((j) => () =>
    agent(
      `You are the ${j.name.toUpperCase()} judge on: ${SUBJECT}\n\n` +
      `Your constraint: ${j.question}\n\n` +
      `Here is the CONFIRMED dossier. Every finding has already survived ` +
      `adversarial verification — do not re-verify, and do not go hunting for ` +
      `new findings.\n\n${dossier}\n\n` +
      `Rule on what to DO about these, under your constraint.\n` +
      `Recommend, reject with reasons, and give one novel insight that comes ` +
      `from seeing the whole dossier at once.`,
      { label: `judge:${j.name}`, phase: 'Judge', schema: JUDGE_SCHEMA,
        model: 'opus', effort: 'high' })
  ))).filter(Boolean);
}

// --- Phase 4: Synthesize ---------------------------------------------------

phase('Synthesize');

const requorumNote = PRIOR.length
  ? `\n\nREQUORUM MODE. Prior open blockers:\n${JSON.stringify(PRIOR, null, 1)}\n` +
    `State for each: CLOSED, REMAINING, or superseded. List newly raised items separately. ` +
    `A blocker restated in different words is REMAINING, not closed-and-new.`
  : '';

const ruling = await agent(
  `Write the ruling for a quorum on: ${SUBJECT}\n\n` +
  `CONFIRMED (${confirmed.length}):\n${JSON.stringify(confirmed.map((f) => ({
    title: f.title, claim: f.claim, evidence: f.evidence, severity: f.severity,
    recommendation: f.recommendation, lenses: f.lenses,
  })), null, 1)}\n\n` +
  `PLAUSIBLE but unverified (${plausible.length}):\n${JSON.stringify(
    plausible.map((f) => ({ title: f.title, why: f.tally })), null, 1)}\n\n` +
  (judgeOutputs.length
    ? `JUDGE PANEL:\n${JSON.stringify(judgeOutputs, null, 1)}\n\n` : '') +
  requorumNote + `\n\n` +
  `Output these sections IN THIS ORDER:\n` +
  `1. Root causes — ranked and quantified. The why underneath the findings, not a restatement\n` +
  `2. Top actions — a table with gain and effort. Actions endorsed by 2+ judges rank above single-judge picks\n` +
  `3. Stop-doing list\n` +
  `4. Disagreements and rulings\n\n` +
  `RULES:\n` +
  `- Every quantitative claim must trace to a CONFIRMED finding. Mark anything from ` +
  `PLAUSIBLE explicitly as unverified.\n` +
  `- A disagreement between judges gets an explicit ruling AND a "what would change this" ` +
  `condition. Never drop one silently — this is the one step that survived every run in the corpus.\n` +
  `- End with what was NOT covered and what remains unverified.`,
  { label: 'synthesize', phase: 'Synthesize', effort: 'xhigh' });

return {
  subject: SUBJECT,
  stats: {
    lenses: LENSES.length, mined: mined.length, deduped: deduped.length,
    confirmed: confirmed.length, plausible: plausible.length,
    refuted: refutedOut.length, survivalRate: Number(survival.toFixed(3)),
    judges: judgeOutputs.length,
  },
  confirmed: confirmed.map((f) => ({ key: f.key, title: f.title, severity: f.severity })),
  openBlockers: confirmed
    .filter((f) => ['critical', 'high'].includes(String(f.severity).toLowerCase()))
    .map((f) => ({ key: f.key, title: f.title })),
  ruling,
};
