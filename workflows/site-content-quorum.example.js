export const meta = {
  name: 'site-content-quorum',
  description: 'Content-quality quorum for any marketing site: mine per-lens, adversarially verify, judge, synthesize a per-page action plan',
  whenToUse: 'Run a verified content audit (navigate/understand/read) over a website repo. Pass args: {repo, brandVoice?, inventory?, prior?, lenses?}. Pass prior rulings to run a requorum round; loop until the synthesis declares the loop dry.',
  phases: [
    { title: 'Mine', detail: 'one miner per content-failure lens', model: 'sonnet' },
    { title: 'Verify', detail: 'one adversarial refuter per deduped finding', model: 'opus' },
    { title: 'Judge', detail: '3 judges score the confirmed dossier', model: 'opus' },
    { title: 'Synthesize', detail: 'ranked action plan + loop status' },
  ],
}

/* ================================================================
   site-content-quorum — extracted 2026-07-21 from a production
   content audit (2 rounds: 57 mined, 21 verified, 16 shipped, loop
   declared dry). Instantiates the pinned /quorum shape for the
   specific job of auditing a website's content.

   args (object):
     repo        REQUIRED  absolute path of the site repo, forward slashes
     brandVoice  optional  one-line voice standard
                           (default: 'clear, calm, concrete — no hype')
     inventory   optional  page-inventory string given to miners; when
                           omitted, each miner enumerates src/pages (or
                           equivalent) itself before mining
     prior       optional  requorum block: shipped fixes + ruled-out items
                           from earlier rounds. When present, miners skip
                           them, verifiers kill re-litigations, and the
                           synthesizer diffs against them.
     lenses      optional  [{key, focus}] to override the default five;
                           `focus` is the lens-specific charge appended to
                           the shared miner preamble.
   Returns { confirmedCount, confirmed, report }. The report's final
   section states whether another round is warranted or the loop is dry.
   ================================================================ */

if (!args || !args.repo) {
  throw new Error('site-content-quorum requires args.repo (absolute path to the site repo)')
}
const REPO = args.repo
const VOICE = args.brandVoice || 'clear, calm, concrete — no hype'
const INVENTORY = args.inventory
  ? `PAGE INVENTORY:\n${args.inventory}`
  : 'No inventory supplied — FIRST enumerate the pages yourself (src/pages/ or the framework equivalent, plus shared nav/footer components and content collections), then mine.'
const PRIOR = args.prior
  ? `\nPRIOR ROUNDS (already shipped or ruled out — do NOT re-report or re-litigate):\n${args.prior}\n`
  : ''

const DEFAULT_LENSES = [
  {
    key: 'wayfinding',
    focus: 'WAYFINDING & NAVIGATION. Can a visitor get from any page to the page that answers their question? Audit the shared nav/footer against the full page inventory (orphaned pages, labels that hide their destination), cross-links between related pages, dead-end pages with no next step, and whether the 404 routes people to the site’s current spine.',
  },
  {
    key: 'cold-visitor',
    focus: 'FIRST-90-SECONDS COMPREHENSION for a cold visitor. Read the home page and the top commercial pages as someone who has never heard of this company. Flag internal codenames or coinages used before they are defined, abstract value-prop language that never says WHAT is sold and to WHOM, headlines that need three sections to decode, and CTAs whose destination or commitment is unclear (label must equal destination).',
  },
  {
    key: 'scannability',
    focus: 'SCANNABILITY & READING STRUCTURE. Heading hierarchy and paragraph craft: walls of text that should be lists or split, headings that don’t summarize their section (a heading-only scan should still tell the story), key information buried late, numbered/sequenced sections whose sequence is broken, and pages whose length mismatches their job.',
  },
  {
    key: 'template-drift',
    focus: 'REDUNDANCY & CONSISTENCY ACROSS TEMPLATED FAMILIES. Diff within each templated page family (services, industries, case studies…): boilerplate repeated verbatim where it should differ, structure present on some siblings and missing on others for no visible reason, copy pasted across two pages that will drift, hardcoded cross-page references that should resolve from content, and site-wide terminology consistency for the core nouns.',
  },
  {
    key: 'client-voice',
    focus: 'BRAND / CLIENT-VOICE INTEGRITY. Sweep client-facing copy for: internal codenames or project-speak leaking to visitors, hype and superlatives that break the stated register, vague consultant-speak where a plain concrete sentence would land, register inconsistency between pages, and provenance/dev comments that reach the shipped DOM.',
  },
]
const LENSES = (args.lenses && args.lenses.length ? args.lenses : DEFAULT_LENSES)

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      maxItems: 10,
      items: {
        type: 'object',
        required: ['title', 'page', 'claim', 'evidence', 'impact', 'recommendation'],
        properties: {
          title: { type: 'string', description: 'short unique label' },
          page: { type: 'string', description: 'repo-relative file path the change applies to' },
          claim: { type: 'string', description: 'the defect: what makes this harder to navigate/understand/read' },
          evidence: { type: 'string', description: 'verbatim quote <=200 chars + file path + approx line, re-checkable' },
          impact: { type: 'string', description: 'who is hurt and how' },
          recommendation: { type: 'string', description: 'the concrete content change to make' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['isReal', 'reason'],
  properties: {
    isReal: { type: 'boolean' },
    reason: { type: 'string', description: 'what you re-checked and what you found' },
    refinedRecommendation: { type: 'string', description: 'tightened fix if the finding is real but the remedy should differ' },
  },
}

const JUDGE_SCHEMA = {
  type: 'object',
  required: ['top', 'rejected', 'insight'],
  properties: {
    top: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'gain', 'effort'],
        properties: {
          title: { type: 'string', description: 'must exactly match a dossier finding title' },
          gain: { type: 'string', enum: ['high', 'medium', 'low'] },
          effort: { type: 'string', enum: ['low', 'medium', 'high'] },
          note: { type: 'string' },
        },
      },
    },
    rejected: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'reason'],
        properties: { title: { type: 'string' }, reason: { type: 'string' } },
      },
    },
    insight: { type: 'string', description: 'one novel observation the miners missed' },
  },
}

const MINER_COMMON = `You are an evidence miner in a content-quality quorum for a live client-facing website.
Repo: ${REPO}. Brand voice standard: ${VOICE}.
Read the ACTUAL files — every finding must carry a verbatim quote (<=200 chars) plus file path so a downstream verifier can reproduce it. Do not invent quotes. Do not dump whole files.
${INVENTORY}
${PRIOR}
Scope: content upgrades that make the site easier to NAVIGATE, UNDERSTAND, and READ. Not visual design, not performance, not SEO mechanics.
Known dead ends (auto-rejected downstream, don't report them): symmetry-as-finding ("A links to B so B must link to A" without a stranded-user path); complaints about deliberately decorative aria-hidden elements; re-litigating prior rulings.
Return your 5-10 HIGHEST-IMPACT findings only, ranked. Prefer findings that generalize across a template family (one exemplar quote, note it applies to all N pages).`

phase('Mine')
log(`Mining ${LENSES.length} lenses over ${REPO}`)
const mineResults = await parallel(
  LENSES.map((l) => () =>
    agent(`${MINER_COMMON}\nYOUR LENS: ${l.focus}`, {
      label: `mine:${l.key}`,
      phase: 'Mine',
      model: 'sonnet',
      effort: 'high',
      schema: FINDINGS_SCHEMA,
    }).then((r) => (r ? r.findings.map((f) => ({ ...f, lens: l.key })) : []))
  )
)

const allFindings = mineResults.filter(Boolean).flat()
const stopWords = new Set(['the', 'a', 'an', 'of', 'on', 'in', 'to', 'and', 'for', 'is', 'are', 'page', 'pages'])
const keyOf = (f) => {
  const words = (f.title + ' ' + f.claim).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w)).slice(0, 5).sort().join('|')
  return f.page.toLowerCase() + '::' + words
}
const seen = new Map()
for (const f of allFindings) {
  const k = keyOf(f)
  if (!seen.has(k)) seen.set(k, f)
}
const deduped = [...seen.values()]
log(`Mined ${allFindings.length} findings, ${deduped.length} after dedup`)

phase('Verify')
const verified = await parallel(
  deduped.map((f, i) => () =>
    agent(
      `You are an ADVERSARIAL VERIFIER in a content quorum. Your job is to REFUTE this finding about the website at ${REPO}. Independently re-check the cited evidence: Read/grep the cited file at the cited location and confirm the quote exists and the claim about it is fair in context. Set isReal=false if the quote cannot be reproduced, if the surrounding context already solves the claimed problem, if the finding is symmetry-taste with no stranded-user path, or if it re-litigates a prior ruling.${PRIOR} If uncertain, lean isReal=false.
FINDING:
${JSON.stringify(f, null, 2)}`,
      { label: `verify:${i}:${f.lens}`, phase: 'Verify', model: 'opus', effort: 'high', schema: VERDICT_SCHEMA }
    ).then((v) => (v ? { ...f, verdict: v } : null))
  )
)
const confirmed = verified.filter(Boolean).filter((f) => f.verdict.isReal)
  .map((f) => ({ ...f, recommendation: f.verdict.refinedRecommendation || f.recommendation }))
log(`${confirmed.length}/${deduped.length} findings survived adversarial verification`)

if (confirmed.length === 0) {
  return { confirmedCount: 0, confirmed: [], report: 'No findings survived adversarial verification. The loop is dry.' }
}

const dossier = JSON.stringify(confirmed.map(({ verdict, ...f }) => f), null, 1)

phase('Judge')
const JUDGES = [
  {
    key: 'clarity-conversion',
    charge: 'CLARITY & CONVERSION JUDGE. Score each finding by whether the change genuinely makes a cold prospect understand faster and act sooner. Kill changes that are editorial taste with no comprehension gain.',
  },
  {
    key: 'brand-voice',
    charge: `BRAND-VOICE JUDGE. The voice standard is: ${VOICE}. Score each finding by whether the recommended change preserves or strengthens that register. Kill changes that would make copy louder, salesier, or more generic; protect deliberate signatures.`,
  },
  {
    key: 'consistency-maintenance',
    charge: 'CONSISTENCY & MAINTENANCE JUDGE. Favor changes applied uniformly across template families and expressible once (single-sourced); kill one-off edits that create sibling drift or a second copy of shared truth.',
  },
]
const judgeResults = await parallel(
  JUDGES.map((j) => () =>
    agent(
      `You are a judge in a content quorum. ${j.charge}
You may NOT mine for new findings or run searches; judge the dossier as given. A single targeted Read of one cited file is allowed if a score hinges on it.
Return top recommendations (gain+effort), rejected items with reasons (titles must match the dossier exactly), and one novel insight.
CONFIRMED DOSSIER (${confirmed.length} verified findings):
${dossier}`,
      { label: `judge:${j.key}`, phase: 'Judge', model: 'opus', effort: 'high', schema: JUDGE_SCHEMA }
    ).then((r) => (r ? { judge: j.key, ...r } : null))
  )
)
const judges = judgeResults.filter(Boolean)

phase('Synthesize')
const synthesis = await agent(
  `You are the SYNTHESIZER of a content quorum on the website at ${REPO}. Merge the confirmed dossier and the judges' rulings. Rules: an action endorsed by 2+ judges outranks single-judge picks; every judge disagreement is reported with an explicit ruling, never silently dropped; every quantitative claim must come from the verified dossier. Decisions that are positioning/product-owner calls rather than copy defects must be ESCALATED as flagged questions, not self-executed.${PRIOR ? ' This is a REQUORUM round: state explicitly whether any finding is a regression of a prior shipped fix versus new ground.' : ''}
Produce a markdown report with sections IN THIS ORDER:
1. **Root causes (ranked, quantified)** — the systemic problems behind the findings.
2. **Top actions table** — columns: Page(s) | Change | Gain | Effort | Endorsed by. Order by gain desc. Each Change row must be executable verbatim by a follow-up editor.
3. **Stop-doing list** — content patterns to stop repeating${PRIOR ? ' (only NEW patterns this round)' : ''}.
4. **Disagreements & rulings**.
5. **Loop status** — is another round warranted, or is the loop dry? (dry = remaining findings would be low-gain polish). List anything that should EXIT the loop as an escalation or backlog item instead of seeding a new round.
CONFIRMED DOSSIER:
${dossier}
JUDGE RULINGS:
${JSON.stringify(judges, null, 1)}`,
  { label: 'synthesize', phase: 'Synthesize', effort: 'xhigh' }
)

return { confirmedCount: confirmed.length, confirmed, report: synthesis }
