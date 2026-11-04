import assert from 'assert';
import { buildSmartMoneyRoadmap, analyzeGapRegime } from '../lib/engine/smartMoneyRoadmap';
import { buildNifty50Analysis } from '../lib/engine/nifty50Constituents';

console.log('===============================================================');
console.log('🧪 TESTING SMART MONEY ROADMAP & GAP REGIME ENGINE');
console.log('===============================================================\\n');

// -------------------------------------------------------------
// 1. GAP-UP REGIME TESTS
// -------------------------------------------------------------
const prevClose = 23440.80;
const dayOpenUp = 23800.00; // +359.2 pt gap up
const vix = 15.72;

// Scenario A: GAP-UP RUNAWAY (Holding above Day Open)
{
  const spotPrice = 23810.85;
  const gapAnalysis = analyzeGapRegime(spotPrice, dayOpenUp, prevClose, 23845.0, 23780.0);
  assert.strictEqual(gapAnalysis.hasGap, true);
  assert.strictEqual(gapAnalysis.gapType, 'GAP_UP');
  assert.strictEqual(gapAnalysis.regime, 'GAP_RUNAWAY');
  assert.strictEqual(gapAnalysis.gapSupportPrice, dayOpenUp);

  const roadmap = buildSmartMoneyRoadmap({ spotPrice, prevClose, dayOpen: dayOpenUp, dayHigh: 23845, dayLow: 23780, vix });
  assert.strictEqual(roadmap.actionSignal.status, 'SAFE_TO_BUY');
  assert.strictEqual(roadmap.actionSignal.badge, 'GAP DEFENDED');
  const slDistance = spotPrice - roadmap.actionSignal.invalidationPrice!;
  assert.ok(slDistance > 10 && slDistance < 50, `SL must be tight, got ${slDistance}`);
  console.log('✅ [PASS] 1A: Gap-Up Runaway (Spot >= Open) -> SAFE_TO_BUY with tight SL');
}

// Scenario B: GAP-UP RETEST (Pullback below Open into Gap Zone, holding above PrevClose)
{
  const spotPrice = 23600.00; // Between PrevClose (23440) and Open (23800)
  const gapAnalysis = analyzeGapRegime(spotPrice, dayOpenUp, prevClose, 23845.0, 23550.0);
  assert.strictEqual(gapAnalysis.regime, 'GAP_FADE');

  const roadmap = buildSmartMoneyRoadmap({ spotPrice, prevClose, dayOpen: dayOpenUp, dayHigh: 23845, dayLow: 23550, vix });
  assert.strictEqual(roadmap.actionSignal.status, 'AWAIT_CONFIRMATION');
  assert.strictEqual(roadmap.actionSignal.badge, 'GAP RETEST');
  console.log('✅ [PASS] 1B: Gap-Up Retest (Close < Spot < Open) -> AWAIT_CONFIRMATION in Gap Zone');
}

// Scenario C: GAP-UP REVERSAL (Gap fully filled and broken BELOW PrevClose)
{
  const spotPrice = 23350.00; // Below PrevClose (23440.80)
  const gapAnalysis = analyzeGapRegime(spotPrice, dayOpenUp, prevClose, 23845.0, 23320.0);
  assert.strictEqual(gapAnalysis.regime, 'GAP_FADE');
  assert.ok(gapAnalysis.verdict.includes('fully filled'));

  const roadmap = buildSmartMoneyRoadmap({ spotPrice, prevClose, dayOpen: dayOpenUp, dayHigh: 23845, dayLow: 23320, vix });
  assert.strictEqual(roadmap.actionSignal.status, 'DO_NOT_BUY');
  assert.strictEqual(roadmap.actionSignal.badge, 'GAP REVERSAL BEAR');
  assert.strictEqual(roadmap.actionSignal.variant, 'rose');
  assert.ok(roadmap.actionSignal.invalidationPrice! > spotPrice, 'SL for bear reversal must be above spot');
  console.log('✅ [PASS] 1C: Gap-Up Surrendered (Spot < PrevClose) -> DO_NOT_BUY, Bearish Reversal Active');
}

// -------------------------------------------------------------
// 2. GAP-DOWN REGIME TESTS
// -------------------------------------------------------------
const prevCloseDown = 23810.85;
const dayOpenDown = 23742.25; // -68.6 pt gap down

// Scenario A: GAP-DOWN RUNAWAY (Expanding below Day Open)
{
  const spotPrice = 23680.00;
  const gapAnalysis = analyzeGapRegime(spotPrice, dayOpenDown, prevCloseDown, 23750, 23650);
  assert.strictEqual(gapAnalysis.hasGap, true);
  assert.strictEqual(gapAnalysis.gapType, 'GAP_DOWN');
  assert.strictEqual(gapAnalysis.regime, 'GAP_RUNAWAY');

  const roadmap = buildSmartMoneyRoadmap({ spotPrice, prevClose: prevCloseDown, dayOpen: dayOpenDown, dayHigh: 23750, dayLow: 23650, vix });
  assert.strictEqual(roadmap.actionSignal.status, 'DO_NOT_BUY');
  assert.strictEqual(roadmap.actionSignal.badge, 'BEAR RUNAWAY');
  assert.strictEqual(roadmap.actionSignal.variant, 'rose');
  console.log('✅ [PASS] 2A: Gap-Down Runaway (Spot <= Open) -> DO_NOT_BUY, Bear Runaway');
}

// Scenario B: GAP-DOWN RETEST (Short covering bounce inside Gap Zone)
{
  const spotPrice = 23780.00; // Between Open (23742.25) and PrevClose (23810.85)
  const gapAnalysis = analyzeGapRegime(spotPrice, dayOpenDown, prevCloseDown, 23790, 23720);
  assert.strictEqual(gapAnalysis.regime, 'GAP_FADE');

  const roadmap = buildSmartMoneyRoadmap({ spotPrice, prevClose: prevCloseDown, dayOpen: dayOpenDown, dayHigh: 23790, dayLow: 23720, vix });
  assert.strictEqual(roadmap.actionSignal.status, 'AWAIT_CONFIRMATION');
  assert.strictEqual(roadmap.actionSignal.badge, 'PULLBACK SHORT');
  console.log('✅ [PASS] 2B: Gap-Down Short-Covering (Open < Spot <= Close) -> AWAIT_CONFIRMATION');
}

// Scenario C: GAP-DOWN REVERSAL (Gap 100% filled and broke ABOVE PrevClose)
{
  const spotPrice = 23875.00; // Above PrevClose (23810.85)
  const gapAnalysis = analyzeGapRegime(spotPrice, dayOpenDown, prevCloseDown, 23890, 23720);
  assert.strictEqual(gapAnalysis.regime, 'GAP_FADE');
  assert.ok(gapAnalysis.verdict.includes('fully reversed and filled'));

  const roadmap = buildSmartMoneyRoadmap({ spotPrice, prevClose: prevCloseDown, dayOpen: dayOpenDown, dayHigh: 23890, dayLow: 23720, vix });
  assert.strictEqual(roadmap.actionSignal.status, 'SAFE_TO_BUY');
  assert.strictEqual(roadmap.actionSignal.badge, 'GAP REVERSAL BULL');
  assert.strictEqual(roadmap.actionSignal.variant, 'emerald');
  assert.ok(roadmap.actionSignal.invalidationPrice! < spotPrice, 'SL for bull reversal must be below spot');
  console.log('✅ [PASS] 2C: Gap-Down Reversal (Spot > PrevClose) -> SAFE_TO_BUY, Bullish Gap Reversal');
}

// -------------------------------------------------------------
// 3. CONFIRMATION SIGNALS DIRECTIONAL EVALUATOR TESTS
// -------------------------------------------------------------
// Test Bull Market Confirmation Alignment
{
  const analysis = buildNifty50Analysis([], 24600, 14, 150, 24450); // +150 pt bull trend
  const confirmed = analysis.prediction.confirmationSignals.filter(s => s.status === 'CONFIRMED');
  for (const sig of confirmed) {
    assert.ok(sig.score >= 0, `All confirmed signals in bull trend must have positive score, got ${sig.score} on ${sig.id}`);
  }
  console.log('✅ [PASS] 3A: In Bullish Market, all CONFIRMED signals strictly carry positive scores');
}

// Test Bear Market Confirmation Alignment
{
  const analysis = buildNifty50Analysis([], 24300, 14, -150, 24450); // -150 pt bear trend
  const confirmed = analysis.prediction.confirmationSignals.filter(s => s.status === 'CONFIRMED');
  for (const sig of confirmed) {
    assert.ok(sig.score <= 0, `All confirmed signals in bear trend must have negative score, got ${sig.score} on ${sig.id}`);
  }
  console.log('✅ [PASS] 3B: In Bearish Market, all CONFIRMED signals strictly carry negative scores');
}

// Test Neutral Market No-Contradiction Guard
{
  // Spot change is 0 (neutral flat market)
  const analysis = buildNifty50Analysis([], 24450, 14, 0, 24450, 24450, 24450, 24450, true);
  const confirmed = analysis.prediction.confirmationSignals.filter(s => s.status === 'CONFIRMED');
  assert.strictEqual(confirmed.length, 0, 'In flat market, no signal should falsely show CONFIRMED');
  console.log('✅ [PASS] 3C: In Neutral/Flat Market, zero signals falsely report CONFIRMED');
}

console.log('\\n===============================================================');
console.log('🎉 ALL SMART MONEY ROADMAP & CONFIRMATION TESTS PASSED!');
console.log('===============================================================\\n');
