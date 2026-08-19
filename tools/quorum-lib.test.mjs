/**
 * Tests for quorum-lib. Run: node tools/quorum-lib.test.mjs
 *
 * These pin the behaviours where a plausible-looking implementation would
 * quietly corrupt a run: over-merging findings, counting abstentions as
 * support, letting a tie pass as confirmed, or dropping a disputed
 * recommendation instead of surfacing it.
 */

import {
  findingKey, keySimilarity, dedupeFindings, tallyVerdicts, ruleFinding,
  rankFindings, judgeConsensus, requorumDiff, shouldContinue, runStats,
} from './quorum-lib.mjs';

let pass = 0, fail = 0;
const ok = (label, cond, detail) => {
  if (cond) { pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (detail ? '  -> ' + detail : '')); }
};

// ------------------------------------------------------------- findingKey
{
  ok('findingKey drops stopwords and orders tokens',
    findingKey('The token budget is not enforced') === findingKey('Token budget not enforced'),
    findingKey('The token budget is not enforced'));

  ok('findingKey is word-order independent',
    findingKey('cache invalidation on redeploy') === findingKey('redeploy cache invalidation'));

  ok('findingKey separates genuinely different findings',
    findingKey('token budget not enforced') !== findingKey('secret guard misses PEM keys'));

  ok('findingKey handles empty input', findingKey('') === '');
  ok('findingKey handles null', findingKey(null) === '');
}

// ---------------------------------------------------------- keySimilarity
{
  ok('keySimilarity identical is 1', keySimilarity('a|b|c', 'a|b|c') === 1);
  ok('keySimilarity disjoint is 0', keySimilarity('a|b', 'c|d') === 0);
  ok('keySimilarity partial is between',
    keySimilarity('a|b|c', 'a|b|d') > 0.4 && keySimilarity('a|b|c', 'a|b|d') < 0.7);
  ok('keySimilarity both empty is 1', keySimilarity('', '') === 1);
  ok('keySimilarity one empty is 0', keySimilarity('a|b', '') === 0);
}

// ----------------------------------------------------------------- dedupe
{
  const findings = [
    { title: 'Token budget is not enforced', lens: 'cost', evidence: 'short' },
    { title: 'Budget for tokens not enforced anywhere', lens: 'reliability',
      evidence: 'a much longer piece of evidence with file paths and counts' },
    { title: 'Secret guard misses PEM private keys', lens: 'security', evidence: 'x' },
  ];
  const out = dedupeFindings(findings);

  ok('dedupe merges restatements of the same finding', out.length === 2,
    JSON.stringify(out.map((o) => o.title)));

  const merged = out.find((o) => o.corroboration === 2);
  ok('dedupe records every contributing lens (corroboration signal preserved)',
    merged && merged.lenses.includes('cost') && merged.lenses.includes('reliability'),
    JSON.stringify(merged?.lenses));

  ok('dedupe keeps the richest evidence, not the first seen',
    merged && merged.evidence.length > 20, merged?.evidence);

  ok('dedupe counts duplicates', merged && merged.duplicates === 1);

  // The dangerous direction: over-merging destroys a real finding invisibly.
  const distinct = dedupeFindings([
    { title: 'Cache TTL is too short for long sessions', lens: 'a' },
    { title: 'Cache key omits the model identifier', lens: 'b' },
  ]);
  ok('dedupe does NOT over-merge distinct findings sharing a word (regression guard)',
    distinct.length === 2, JSON.stringify(distinct.map((d) => d.title)));

  ok('dedupe skips malformed findings',
    dedupeFindings([{ lens: 'x' }, null, { title: 'real one' }]).length === 1);
}

// ---------------------------------------------------------------- tallying
{
  ok('tally: unanimous uphold survives',
    tallyVerdicts([{ refuted: false }, { refuted: false }, { refuted: false }]).survives);

  ok('tally: majority refute kills',
    !tallyVerdicts([{ refuted: true }, { refuted: true }, { refuted: false }]).survives);

  const tie = tallyVerdicts([{ refuted: true }, { refuted: false }]);
  ok('tally: a TIE fails (contested evidence is not confirmed) - regression guard',
    !tie.survives, JSON.stringify(tie));
  ok('tally: a tie is marked contested', tie.contested === true);

  const abst = tallyVerdicts([{ refuted: false }, null, { junk: true }]);
  ok('tally: abstentions are NOT counted as support - regression guard',
    abst.abstained === 2 && abst.upheld === 1, JSON.stringify(abst));

  const none = tallyVerdicts([]);
  ok('tally: zero verdicts does not survive', !none.survives);
  ok('tally: zero verdicts explains itself', none.reason.includes('no valid verdict'));

  ok('tally: unanimous rule kills on a single refute',
    !tallyVerdicts([{ refuted: false }, { refuted: false }, { refuted: true }],
      { rule: 'unanimous' }).survives);
}

// ----------------------------------------------------------------- ruling
{
  const f = { title: 'x' };
  ok('rule: clean survival is CONFIRMED',
    ruleFinding(f, tallyVerdicts([{ refuted: false }, { refuted: false }])).verdict === 'CONFIRMED');

  ok('rule: majority refuted is REFUTED',
    ruleFinding(f, tallyVerdicts([{ refuted: true }, { refuted: true }])).verdict === 'REFUTED');

  ok('rule: no verdicts is PLAUSIBLE, never CONFIRMED',
    ruleFinding(f, tallyVerdicts([])).verdict === 'PLAUSIBLE');

  const contested = ruleFinding(f, tallyVerdicts([
    { refuted: false }, { refuted: false }, { refuted: true }]));
  ok('rule: survived-but-contested is PLAUSIBLE not CONFIRMED',
    contested.verdict === 'PLAUSIBLE', contested.verdict);
}

// ---------------------------------------------------------------- ranking
{
  const ranked = rankFindings([
    { title: 'low', severity: 'low', corroboration: 3, tally: { upheld: 3, refuted: 0 } },
    { title: 'crit', severity: 'critical', corroboration: 1, tally: { upheld: 2, refuted: 1 } },
    { title: 'high-2lens', severity: 'high', corroboration: 2, tally: { upheld: 2, refuted: 0 } },
    { title: 'high-1lens', severity: 'high', corroboration: 1, tally: { upheld: 3, refuted: 0 } },
  ]);
  ok('rank: severity dominates', ranked[0].title === 'crit', ranked.map(r => r.title).join(','));
  ok('rank: corroboration beats verification margin within a severity',
    ranked[1].title === 'high-2lens', ranked.map(r => r.title).join(','));
  ok('rank: unknown severity defaults to medium, does not crash',
    rankFindings([{ title: 'x' }]).length === 1);
}

// -------------------------------------------------------- judge consensus
{
  const judges = [
    { judge: 'cost', recommendations: [{ title: 'Cap the token budget' },
                                       { title: 'Delete the unused MCP servers' }] },
    { judge: 'reliability', recommendations: [{ title: 'Cap token budget per run' }],
      rejected: [{ title: 'Delete the unused MCP servers' }] },
    { judge: 'security', recommendations: [{ title: 'Capping the token budget' }] },
  ];
  const c = judgeConsensus(judges);

  ok('consensus: 3-judge agreement surfaces as consensus',
    c.consensus.length === 1 && c.consensus[0].endorsedBy.length === 3,
    JSON.stringify(c.consensus.map((x) => x.endorsedBy)));

  ok('consensus: an endorsed-and-rejected item is DISPUTED, not dropped - regression guard',
    c.disputed.length === 1 && c.disputed[0].endorsedBy.length === 1
      && c.disputed[0].rejectedBy.length === 1,
    JSON.stringify(c.disputed));

  ok('consensus: disputed items never leak into consensus',
    !c.consensus.some((x) => x.rejectedBy.length > 0));

  ok('consensus: handles malformed judge output',
    judgeConsensus([null, {}, { judge: 'x' }]).consensus.length === 0);
}

// --------------------------------------------------------------- requorum
{
  const prior = [{ title: 'Token budget not enforced' }, { title: 'Secret guard misses PEM' }];
  const now = [{ title: 'Budget for tokens not enforced' }, { title: 'New: cache key collision' }];
  const d = requorumDiff(prior, now);

  ok('requorum: closed blockers detected',
    d.closed.length === 1 && d.closed[0].title.includes('Secret guard'),
    JSON.stringify(d.closed.map((x) => x.title)));
  ok('requorum: remaining blockers matched across rewording',
    d.remaining.length === 1, JSON.stringify(d.remaining.map((x) => x.title)));
  ok('requorum: newly raised detected',
    d.raised.length === 1 && d.raised[0].title.includes('cache key'));
  ok('requorum: not dry while a blocker remains', d.dry === false);

  const clean = requorumDiff([{ title: 'a thing' }], []);
  ok('requorum: dry when nothing remains and nothing is raised', clean.dry === true);

  ok('requorum: remaining-only is NOT dry (regression guard)',
    requorumDiff([{ title: 'x' }], [{ title: 'x' }]).dry === false);
}

// ------------------------------------------------------------ loop control
{
  const notDry = { dry: false, remaining: [{ title: 'x' }], raised: [] };
  ok('loop: continues while not dry and under cap',
    shouldContinue(notDry, 1, { cap: 3 }).continue === true);

  const capped = shouldContinue(notDry, 3, { cap: 3 });
  ok('loop: stops at the round cap', capped.continue === false);
  ok('loop: reports unresolved blockers at the cap',
    capped.unresolved && capped.unresolved.length === 1, JSON.stringify(capped));

  ok('loop: stops when dry',
    shouldContinue({ dry: true, remaining: [], raised: [] }, 1).continue === false);
}

// ------------------------------------------------------------------ stats
{
  const mined = new Array(36).fill(0).map((_, i) => ({ title: 't' + i }));
  const deduped = new Array(30).fill(0).map((_, i) => ({ title: 't' + i, corroboration: i < 8 ? 2 : 1 }));
  const ruled = [
    ...new Array(26).fill(0).map(() => ({ verdict: 'CONFIRMED' })),
    ...new Array(2).fill(0).map(() => ({ verdict: 'PLAUSIBLE' })),
    ...new Array(2).fill(0).map(() => ({ verdict: 'REFUTED' })),
  ];
  const s = runStats(mined, deduped, ruled);
  ok('stats: counts duplicates merged', s.duplicatesMerged === 6);
  ok('stats: survival rate computed', s.survivalRate === 0.867, String(s.survivalRate));
  ok('stats: multi-lens findings counted', s.multiLens === 8);
}

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
