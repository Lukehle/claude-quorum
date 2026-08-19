/**
 * quorum-lib - the deterministic parts of a quorum run.
 *
 * Deduplication, vote tallying, ruling, and requorum diffing are plain data
 * transforms. Doing them with an agent is slower, costlier, and non-reproducible
 * - two runs over the same findings should produce the same dossier, and only
 * code guarantees that.
 *
 * Pure functions, no I/O. Import into a Workflow script, or run the tests.
 *
 * Design note: every function here is intentionally conservative. A dedup that
 * over-merges silently destroys a real finding, and a ruling that rounds in
 * favour of "confirmed" manufactures confidence. Where a call is ambiguous,
 * these keep the finding and surface the ambiguity.
 */

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'that', 'this',
  'it', 'its', 'has', 'have', 'had', 'not', 'no', 'if', 'when', 'than', 'then',
  'there', 'their', 'they', 'we', 'our', 'can', 'could', 'should', 'would', 'may',
  'might', 'will', 'does', 'do', 'did', 'so', 'too', 'very', 'more', 'most',
  'per', 'any', 'all', 'each', 'some', 'via', 'into', 'onto', 'over', 'under',
]);

/**
 * Light suffix stripping.
 *
 * Miners reword the same finding constantly - "token budget not enforced" and
 * "budget for tokens not enforced anywhere" are one finding, and "cap the token
 * budget" / "capping the token budget" are one recommendation. Without stemming
 * these never match and the dedup silently does nothing, which is worse than no
 * dedup because the run looks like it deduplicated.
 *
 * Deliberately crude: it only needs to make two phrasings of the same claim
 * collide, not to be linguistically correct.
 */
function stem(w) {
  let s = w;
  if (s.length > 4 && s.endsWith('ies')) s = s.slice(0, -3) + 'y';
  else if (s.length > 3 && s.endsWith('s') && !s.endsWith('ss')) s = s.slice(0, -1);
  if (s.length > 5 && s.endsWith('ing')) s = s.slice(0, -3);
  else if (s.length > 4 && s.endsWith('ed')) s = s.slice(0, -2);
  // Undo the doubled consonant English adds before -ing/-ed: capping -> capp -> cap
  if (s.length > 3 && /([bdfglmnprt])\1$/.test(s)) s = s.slice(0, -1);
  // Normalize a trailing 'e' so enforce/enforced both land on 'enforc'
  if (s.length > 4 && s.endsWith('e')) s = s.slice(0, -1);
  return s;
}

/**
 * Normalize a finding title into a comparison key.
 * Lowercase, strip punctuation, drop stopwords, stem, sort the remaining tokens
 * so word order cannot defeat the match, and keep the most significant few.
 */
export function findingKey(title, { tokens = 5 } = {}) {
  const words = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map(stem);
  return [...new Set(words)].slice(0, tokens).sort().join('|');
}

/**
 * Find the best match for a key among candidates, or null.
 * Shared by dedupe, judge consensus, and the requorum diff - all three need
 * fuzzy matching, and exact key equality makes all three quietly useless.
 */
export function matchKey(key, candidateKeys, threshold = 0.7) {
  let best = null;
  let bestScore = 0;
  for (const c of candidateKeys) {
    const score = c === key ? 1 : keySimilarity(c, key);
    if (score >= threshold && score > bestScore) { best = c; bestScore = score; }
  }
  return best;
}

/** Jaccard overlap of two key strings, 0..1. */
export function keySimilarity(a, b) {
  const A = new Set(String(a).split('|').filter(Boolean));
  const B = new Set(String(b).split('|').filter(Boolean));
  if (!A.size && !B.size) return 1;
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const t of A) if (B.has(t)) shared++;
  return shared / (A.size + B.size - shared);
}

/**
 * Deduplicate findings across miners.
 *
 * Findings that merge keep every contributing lens, because "three lenses
 * independently found this" is a signal the judges need and a naive dedup
 * throws away. The surviving record is the one with the most evidence, not the
 * first one seen.
 *
 * threshold defaults to 0.7 - loose enough that two phrasings of one finding
 * collide, tight enough that two findings sharing a noun do not. Over-merging
 * is the dangerous direction (a dropped real finding is invisible, while a
 * surviving duplicate merely costs one agent call), so raise it if in doubt.
 */
export function dedupeFindings(findings, { threshold = 0.7 } = {}) {
  const groups = [];

  for (const f of findings) {
    if (!f || !f.title) continue;
    const key = findingKey(f.title);
    let placed = false;

    for (const g of groups) {
      if (g.key === key || keySimilarity(g.key, key) >= threshold) {
        g.members.push(f);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push({ key, members: [f] });
  }

  return groups.map((g) => {
    // Keep the member carrying the most evidence - the richest statement of
    // the finding survives, not whichever miner happened to report first.
    const best = g.members.reduce((a, b) =>
      (String(b.evidence || '').length > String(a.evidence || '').length ? b : a));
    const lenses = [...new Set(g.members.map((m) => m.lens).filter(Boolean))];
    return {
      ...best,
      key: g.key,
      lenses,
      corroboration: lenses.length,
      duplicates: g.members.length - 1,
    };
  });
}

/**
 * Tally adversarial verdicts for one finding.
 *
 * The contract is refutation: a verifier is asked to REFUTE, so `refuted: true`
 * kills. Abstentions and malformed verdicts are NOT treated as support - an
 * agent that failed to reach a conclusion is not evidence for the finding.
 *
 * Ties fail. With 2 of 4 refuting, the evidence is contested and a contested
 * finding must not be reported as confirmed.
 */
export function tallyVerdicts(verdicts, { rule = 'majority' } = {}) {
  const valid = (verdicts || []).filter(
    (v) => v && typeof v === 'object' && typeof v.refuted === 'boolean');
  const abstained = (verdicts || []).length - valid.length;

  const refuted = valid.filter((v) => v.refuted).length;
  const upheld = valid.length - refuted;

  let survives;
  if (valid.length === 0) {
    survives = false;                      // nothing verified it; not confirmed
  } else if (rule === 'unanimous') {
    survives = refuted === 0;
  } else if (rule === 'any-refute-kills') {
    survives = refuted === 0;
  } else {
    survives = upheld > refuted;           // strict: a tie fails
  }

  return {
    survives,
    upheld,
    refuted,
    abstained,
    total: (verdicts || []).length,
    contested: valid.length > 0 && refuted > 0 && upheld > 0,
    reason: valid.length === 0
      ? 'no valid verdict returned'
      : (survives ? 'majority upheld' : (upheld === refuted ? 'tie - contested' : 'majority refuted')),
  };
}

/**
 * Assign a verdict label to a finding from its tally.
 * CONFIRMED - survived, evidence reproduced
 * PLAUSIBLE - contested, or evidence could not be independently re-checked
 * REFUTED   - majority refuted
 */
export function ruleFinding(finding, tally) {
  let verdict;
  if (tally.survives && !tally.contested) verdict = 'CONFIRMED';
  else if (tally.survives && tally.contested) verdict = 'PLAUSIBLE';
  else if (tally.total === 0 || tally.abstained === tally.total) verdict = 'PLAUSIBLE';
  else verdict = 'REFUTED';

  return { ...finding, verdict, tally };
}

/**
 * Rank a confirmed dossier for the synthesis phase.
 *
 * Ordering: severity, then cross-lens corroboration, then verification margin.
 * Corroboration outranks margin deliberately - independent lenses converging is
 * a stronger signal than one lens whose finding no verifier could break.
 */
const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

export function rankFindings(findings) {
  return [...findings].sort((a, b) => {
    const sa = SEVERITY_RANK[String(a.severity || 'medium').toLowerCase()] ?? 2;
    const sb = SEVERITY_RANK[String(b.severity || 'medium').toLowerCase()] ?? 2;
    if (sa !== sb) return sa - sb;
    const ca = a.corroboration || 1;
    const cb = b.corroboration || 1;
    if (ca !== cb) return cb - ca;
    const ma = (a.tally?.upheld || 0) - (a.tally?.refuted || 0);
    const mb = (b.tally?.upheld || 0) - (b.tally?.refuted || 0);
    return mb - ma;
  });
}

/**
 * Judge panel consensus.
 *
 * An action endorsed by 2+ judges outranks a single-judge pick. Disagreements
 * are RETURNED, never dropped - the synthesis must rule on them explicitly,
 * which is the one step that survived every run in the calibration set.
 */
export function judgeConsensus(judgeOutputs, { minEndorsements = 2, threshold = 0.7 } = {}) {
  const tally = new Map();

  // Judges phrase the same recommendation differently ("cap the token budget" /
  // "cap token budget per run" / "capping the token budget"). Matching on exact
  // keys would report three single-judge picks instead of one 3-judge consensus,
  // which inverts the entire point of the panel.
  const slot = (title) => {
    const key = findingKey(title);
    if (!key) return null;
    return matchKey(key, tally.keys(), threshold) ?? key;
  };

  for (const out of judgeOutputs || []) {
    if (!out || typeof out !== 'object') continue;
    for (const rec of Array.isArray(out.recommendations) ? out.recommendations : []) {
      const key = slot(rec.title || rec.action || '');
      if (!key) continue;
      if (!tally.has(key)) tally.set(key, { key, item: rec, endorsedBy: [], rejectedBy: [] });
      tally.get(key).endorsedBy.push(out.judge || 'unnamed');
    }
    for (const rej of Array.isArray(out.rejected) ? out.rejected : []) {
      const key = slot(rej.title || rej.action || '');
      if (!key) continue;
      if (!tally.has(key)) tally.set(key, { key, item: rej, endorsedBy: [], rejectedBy: [] });
      tally.get(key).rejectedBy.push(out.judge || 'unnamed');
    }
  }

  const all = [...tally.values()];
  return {
    consensus: all
      .filter((e) => e.endorsedBy.length >= minEndorsements && e.rejectedBy.length === 0)
      .sort((a, b) => b.endorsedBy.length - a.endorsedBy.length),
    singleJudge: all.filter(
      (e) => e.endorsedBy.length > 0 && e.endorsedBy.length < minEndorsements
             && e.rejectedBy.length === 0),
    // Endorsed by someone AND rejected by someone else. These must appear in
    // the ruling with an explicit decision; silently dropping them is the
    // failure this whole function exists to prevent.
    disputed: all.filter((e) => e.endorsedBy.length > 0 && e.rejectedBy.length > 0),
  };
}

/**
 * Requorum: diff a new round against the prior ruling's open blockers.
 * Returns what closed, what remains, and what is newly raised.
 */
export function requorumDiff(priorBlockers, currentFindings, { threshold = 0.7 } = {}) {
  const currentKeys = new Map(
    (currentFindings || []).map((f) => [f.key || findingKey(f.title), f]));
  const priorKeys = new Map(
    (priorBlockers || []).map((b) => [b.key || findingKey(b.title), b]));

  // Fuzzy-match across rounds. A blocker restated in round 2 is the SAME
  // blocker; exact-key matching would report it closed and simultaneously
  // newly-raised, which reads as progress where there is none.
  const matchedCurrent = new Set();
  const closed = [];
  const remaining = [];

  for (const [key, blocker] of priorKeys) {
    const hit = matchKey(key, currentKeys.keys(), threshold);
    if (hit) { matchedCurrent.add(hit); remaining.push({ ...blocker, key, matchedAs: hit }); }
    else closed.push({ ...blocker, key });
  }

  const raised = [];
  for (const [key, f] of currentKeys) {
    if (!matchedCurrent.has(key)) raised.push({ ...f, key });
  }

  return {
    closed,
    remaining,
    raised,
    // The loop is dry when nothing carried over AND nothing new appeared.
    // Remaining-only is not dry: the blocker is still open.
    dry: remaining.length === 0 && raised.length === 0,
    round: null,
  };
}

/**
 * Should the loop continue? Enforces the round cap so a non-converging
 * requorum terminates instead of running forever.
 */
export function shouldContinue(diff, round, { cap = 3 } = {}) {
  if (diff.dry) return { continue: false, reason: 'loop is dry - no remaining or new blockers' };
  if (round >= cap) {
    return {
      continue: false,
      reason: `round cap ${cap} reached with ${diff.remaining.length} blocker(s) still open`,
      unresolved: diff.remaining,
    };
  }
  return { continue: true, reason: `${diff.remaining.length} remaining, ${diff.raised.length} newly raised` };
}

/** Summary stats for a completed run - what to report and to log. */
export function runStats(mined, deduped, ruled) {
  const confirmed = ruled.filter((f) => f.verdict === 'CONFIRMED').length;
  const plausible = ruled.filter((f) => f.verdict === 'PLAUSIBLE').length;
  const refuted = ruled.filter((f) => f.verdict === 'REFUTED').length;
  const verified = ruled.length || 1;
  return {
    mined: mined.length,
    afterDedup: deduped.length,
    duplicatesMerged: mined.length - deduped.length,
    confirmed,
    plausible,
    refuted,
    survivalRate: Number((confirmed / verified).toFixed(3)),
    multiLens: deduped.filter((f) => (f.corroboration || 1) > 1).length,
  };
}
