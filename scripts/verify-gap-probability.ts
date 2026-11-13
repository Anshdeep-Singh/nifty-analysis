import assert from 'assert';
import { evaluateGapProbability, getAuthenticDailyCandles } from '../lib/engine/gapProbabilityEngine';
import { synthesizeExecutiveMasterCockpit } from '../lib/engine/masterSynthesisEngine';

console.log('===============================================================');
console.log('🧪 RUNNING VERIFICATION: GAP PROBABILITY & FILL RADAR ENGINE');
console.log('===============================================================\n');

let testsPassed = 0;
function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err: any) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    process.exit(1);
  }
}

// -------------------------------------------------------------
// TEST 1: Authentic Historical Daily Data Ingestion
// -------------------------------------------------------------
runTest('Authentic Kite historical daily candles load and aggregate properly', () => {
  const daily = getAuthenticDailyCandles();
  assert.ok(Array.isArray(daily), 'Daily candles must be an array');
  assert.ok(daily.length > 50, `Expected >50 daily candles from Kite minute cache, found ${daily.length}`);
  
  const sample = daily[0];
  assert.ok(sample.open > 10000, 'Daily open must be realistic Nifty spot');
  assert.ok(sample.high >= sample.low, 'High must be >= Low');
  assert.ok(sample.close > 0, 'Close must be > 0');
});

// -------------------------------------------------------------
// TEST 2: Gap Up Streak & Diminishing Opening Probability
// -------------------------------------------------------------
runTest('Consecutive gap-ups decay opening probability and elevate Flat/Gap-Down digestion', () => {
  // Simulate 4 consecutive gap-up days leading into resistance (similar to user screenshot)
  const syntheticStreak = [
    { date: '2026-11-01', open: 25000, high: 25150, low: 24980, close: 25140 },
    { date: '2026-11-02', open: 25200, high: 25300, low: 25180, close: 25290 },
    { date: '2026-11-03', open: 25360, high: 25480, low: 25340, close: 25470 },
    { date: '2026-11-04', open: 25520, high: 25620, low: 25500, close: 25600 },
    // Day 5: Small compressed consolidation bar at the peak
    { date: '2026-11-05', open: 25650, high: 25680, low: 25630, close: 25660 }
  ];

  const res = evaluateGapProbability({
    symbol: 'NIFTY',
    spotPrice: 25660,
    spotPrevClose: 25600,
    spotOpen: 25650,
    spotHigh: 25680,
    spotLow: 25630,
    vix: 15.0,
    dailyCandles: syntheticStreak,
    resistanceLevel: 25680
  });

  const { openingProbability, streakAnalysis, gapFillDynamics, expectedOpeningRange } = res;

  // Probabilities must sum to 100
  const sumP = openingProbability.gapUpPct + openingProbability.flatPct + openingProbability.gapDownPct;
  assert.strictEqual(sumP, 100, `Probabilities must sum to 100, got ${sumP}`);

  // After 4+ gap-ups, Flat or Gap-Down digestion probability should exceed Gap-Up probability
  assert.ok(
    openingProbability.flatPct + openingProbability.gapDownPct > openingProbability.gapUpPct,
    'After 4+ consecutive gap-ups, consolidation/digestion probability must dominate over another gap-up'
  );

  assert.ok(streakAnalysis.consecutiveGaps >= 4, `Streak count must be >= 4, got ${streakAnalysis.consecutiveGaps}`);
  assert.strictEqual(streakAnalysis.streakType, 'BULLISH_GAP');
  assert.ok(
    streakAnalysis.exhaustionState === 'OVERBOUGHT_DIGESTION' || streakAnalysis.exhaustionState === 'EXTENDED_EXHAUSTION',
    `Expected exhaustion state, got ${streakAnalysis.exhaustionState}`
  );

  // Expected opening corridor must be centered around spot and scaled continuously
  assert.ok(expectedOpeningRange.low < expectedOpeningRange.centralPoint, 'Opening low < central point');
  assert.ok(expectedOpeningRange.high > expectedOpeningRange.centralPoint, 'Opening high > central point');
  assert.ok(expectedOpeningRange.dailyExpectedMovePts > 150, 'Daily expected move must be realistic for Nifty at 15 VIX');
});

// -------------------------------------------------------------
// TEST 3: Institutional Breakaway vs Gap Myth Verdict
// -------------------------------------------------------------
runTest('Breakaway gaps reflect low same-day fill rate and myth-busting verdict', () => {
  const res = evaluateGapProbability({
    symbol: 'NIFTY',
    spotPrice: 25200,
    spotPrevClose: 24900,
    vix: 14.0,
    resistanceLevel: 25000 // Spot has broken above key resistance
  });

  assert.ok(res.gapFillDynamics.sameDayFillProbabilityPct < 50, 'Breakaway gap must have <50% same-day fill rate');
  assert.ok(res.gapFillDynamics.gapMythVerdict.includes('MYTH BUSTED'), 'Must include explicit myth-busting explanation');
  assert.ok(res.gapFillDynamics.gapMythVerdict.includes('57.4%'), 'Must quote authentic empirical statistics');
});

// -------------------------------------------------------------
// TEST 4: Master Synthesis Integration
// -------------------------------------------------------------
runTest('Master synthesis cockpit automatically exposes gapDynamics', () => {
  const synthesis = synthesizeExecutiveMasterCockpit({
    symbol: 'NIFTY',
    spotPrice: 25450,
    spotNetChange: 80,
    spotPrevClose: 25370,
    vix: 13.8
  });

  assert.ok(synthesis.gapDynamics, 'synthesis.gapDynamics must be populated');
  assert.ok(synthesis.gapDynamics.openingProbability.confidence >= 30, 'Confidence must be >= 30');
  assert.ok(synthesis.gapDynamics.expectedOpeningRange.high > synthesis.gapDynamics.expectedOpeningRange.low, 'Range must be valid');
});

// -------------------------------------------------------------
// TEST 5: Edge Case Resilience (Zero, NaN, undefined)
// -------------------------------------------------------------
runTest('Engine gracefully handles undefined/zero/extreme inputs', () => {
  const res = evaluateGapProbability({
    symbol: 'NIFTY',
    spotPrice: 0,
    spotPrevClose: NaN as any,
    vix: -5 as any
  });

  assert.ok(Number.isFinite(res.expectedOpeningRange.low), 'Low must be finite');
  assert.ok(Number.isFinite(res.expectedOpeningRange.high), 'High must be finite');
  assert.strictEqual(
    res.openingProbability.gapUpPct + res.openingProbability.flatPct + res.openingProbability.gapDownPct,
    100,
    'Probabilities must sum to 100 even with corrupted inputs'
  );
});

console.log(`\n🎉 ALL ${testsPassed}/5 GAP PROBABILITY ENGINE TESTS PASSED!`);
