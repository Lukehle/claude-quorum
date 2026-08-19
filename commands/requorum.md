---
description: Re-run a quorum in gate mode against the prior ruling's open blockers
---

# /requorum

$ARGUMENTS

Gate mode. **Same roster, changed subject** — diff against the prior ruling rather than starting over.

1. **Retrieve the prior ruling.** This is a definite reference, so it is a retrieval obligation: find
   the actual prior output before doing anything. If you cannot find it, ask — do not reconstruct it
   from memory and proceed as though you had it.

2. **Extract the open blockers** from that ruling — the confirmed critical and high findings that
   were not resolved.

3. **Re-run the same lenses** against the current state. Keeping the roster stable is what makes the
   rounds comparable; changing lenses mid-loop means you are running a new quorum, not a gate.

4. **Diff in code:**

   ```js
   import { requorumDiff, shouldContinue } from './tools/quorum-lib.mjs';
   const diff = requorumDiff(priorBlockers, currentFindings);
   const next = shouldContinue(diff, round, { cap: 3 });
   ```

   Matching is fuzzy by design — **a blocker restated in different words is REMAINING**, not
   simultaneously closed and newly raised. That misreport is what makes a stalled loop look like
   progress.

5. **Report per round:**
   - **Closed** — was open, now absent. Say what closed it
   - **Remaining** — still open. Say whether it moved at all
   - **Newly raised** — appeared this round, often as a side effect of a fix
   - **Verdict** — dry, or continue

6. **Stop at zero remaining and zero newly raised, or at the round cap.** Reaching the cap with
   blockers open is a result to report plainly, not a failure to hide: name what is still open and
   what it would take to close it.

A loop that is not converging by round 3 usually means the blockers are symptoms of something the
lenses are not looking at. Re-derive the lenses rather than running a fourth round.
