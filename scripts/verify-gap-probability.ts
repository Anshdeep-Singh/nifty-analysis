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
  const daily = getAuthenticDailyCandles('NIFTY');
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
    spotOpen: 25150,
    vix: 14.0,
    resistanceLevel: 25000 // Spot has broken above key resistance
  });

  assert.strictEqual(res.gapFillDynamics.gapClassification, 'BREAKAWAY', 'Fresh breakout must classify as BREAKAWAY');
  assert.ok(res.gapFillDynamics.sameDayFillProbabilityPct < 50, 'Breakaway gap must have <50% same-day fill rate');
  assert.ok(res.gapFillDynamics.gapMythVerdict.includes('MYTH BUSTED'), 'Must include explicit myth-busting explanation');
  assert.ok(res.gapFillDynamics.gapMythVerdict.includes('57.4%'), 'Must quote authentic empirical statistics');
});

// -------------------------------------------------------------
// TEST 3B: 4-Regime Microstructure Taxonomy Verification
// -------------------------------------------------------------
runTest('Engine distinctly discriminates BREAKAWAY, RUNAWAY, EXHAUSTION, and COMMON regimes', () => {
  // 1. Runaway test: streak >= 2 with normal range expansion
  const runawayRes = evaluateGapProbability({
    symbol: 'NIFTY',
    spotPrice: 25400,
    spotPrevClose: 25250,
    spotOpen: 25350,
    vix: 13.5,
    dailyCandles: [
      { date: '2026-11-01', open: 24800, high: 24950, low: 24780, close: 24940 },
      { date: '2026-11-02', open: 25000, high: 25150, low: 24980, close: 25140 },
      { date: '2026-11-03', open: 25200, high: 25420, low: 25180, close: 25400 }
    ]
  });
  assert.strictEqual(runawayRes.gapFillDynamics.gapClassification, 'RUNAWAY', 'Streak >= 2 without compression must be RUNAWAY');

  // 2. Exhaustion test: streak >= 4 with compressed range at resistance
  const exhaustionRes = evaluateGapProbability({
    symbol: 'NIFTY',
    spotPrice: 25660,
    spotPrevClose: 25600,
    spotOpen: 25650,
    spotHigh: 25680,
    spotLow: 25630,
    vix: 15.0,
    dailyCandles: [
      { date: '2026-11-01', open: 25000, high: 25150, low: 24980, close: 25140 },
      { date: '2026-11-02', open: 25200, high: 25300, low: 25180, close: 25290 },
      { date: '2026-11-03', open: 25360, high: 25480, low: 25340, close: 25470 },
      { date: '2026-11-04', open: 25520, high: 25620, low: 25500, close: 25600 },
      { date: '2026-11-05', open: 25650, high: 25680, low: 25630, close: 25660 }
    ],
    resistanceLevel: 25680
  });
  assert.strictEqual(exhaustionRes.gapFillDynamics.gapClassification, 'EXHAUSTION', 'Compressed peak after streak must be EXHAUSTION');
  assert.ok(exhaustionRes.gapFillDynamics.sameDayFillProbabilityPct >= 55, 'Exhaustion gap must have elevated fill odds');

  // 3. Common chop test: zero streak / inside range
  const commonRes = evaluateGapProbability({
    symbol: 'NIFTY',
    spotPrice: 25000,
    spotPrevClose: 25020,
    spotOpen: 25010,
    vix: 12.0,
    dailyCandles: [
      { date: '2026-11-01', open: 25000, high: 25200, low: 24900, close: 25050 },
      { date: '2026-11-02', open: 25020, high: 25150, low: 24950, close: 25000 }
    ]
  });
  assert.strictEqual(commonRes.gapFillDynamics.gapClassification, 'COMMON', 'Inside range open must be COMMON');
});

// -------------------------------------------------------------
// TEST 4: Master Synthesis Integration
// -------------------------------------------------------------
runTest('Master synthesis cockpit automatically exposes gapDynamics for both NIFTY and BANKNIFTY', () => {
  const synthesisNifty = synthesizeExecutiveMasterCockpit({
    symbol: 'NIFTY',
    spotPrice: 25450,
    spotNetChange: 80,
    spotPrevClose: 25370,
    spotOpen: 25420,
    vix: 13.8
  });

  assert.ok(synthesisNifty.gapDynamics, 'synthesisNifty.gapDynamics must be populated');
  assert.ok(synthesisNifty.gapDynamics.openingProbability.confidence >= 30, 'Confidence must be >= 30');
  assert.ok(synthesisNifty.gapDynamics.expectedOpeningRange.high > synthesisNifty.gapDynamics.expectedOpeningRange.low, 'Range must be valid');

  const synthesisBank = synthesizeExecutiveMasterCockpit({
    symbol: 'BANKNIFTY',
    spotPrice: 55200,
    spotNetChange: 350,
    spotPrevClose: 54850,
    spotOpen: 55100,
    vix: 14.5
  });

  assert.ok(synthesisBank.gapDynamics, 'synthesisBank.gapDynamics must be populated');
  assert.ok(synthesisBank.gapDynamics.expectedOpeningRange.dailyExpectedMovePts > 400, 'Bank Nifty expected move must scale properly (>400 pts)');
  assert.ok(synthesisBank.gapDynamics.expectedOpeningRange.low > 50000, 'Bank Nifty bounds must not be contaminated by Nifty index levels');
});

// -------------------------------------------------------------
// TEST 5: Gap Down vs Gap Up Directional Accuracy (No Date-Discontinuity Contamination)
// -------------------------------------------------------------
runTest('Gap Down open (spotOpen < spotPrevClose) is accurately detected as BEARISH_GAP', () => {
  const resGapDown = evaluateGapProbability({
    symbol: 'NIFTY',
    spotPrice: 25500,
    spotPrevClose: 25600, // yesterday closed at 25600
    spotOpen: 25500,      // opened down 100 pts
    vix: 14.5
  });

  assert.strictEqual(resGapDown.streakAnalysis.streakType, 'BEARISH_GAP', 'Must accurately detect Bearish Gap');
  assert.strictEqual(resGapDown.streakAnalysis.consecutiveGaps, 1, 'Single-day gap down should have streak count 1');
  assert.ok(resGapDown.openingProbability.gapDownPct >= 30, 'Gap down probability must be elevated');

  const resGapUp = evaluateGapProbability({
    symbol: 'NIFTY',
    spotPrice: 25700,
    spotPrevClose: 25600, // yesterday closed at 25600
    spotOpen: 25680,      // opened up 80 pts
    vix: 14.5
  });

  assert.strictEqual(resGapUp.streakAnalysis.streakType, 'BULLISH_GAP', 'Must accurately detect Bullish Gap');
  assert.strictEqual(resGapUp.streakAnalysis.consecutiveGaps, 1, 'Single-day gap up should have streak count 1');
});

// -------------------------------------------------------------
// TEST 6: Bank Nifty Spot Scaling & Isolation
// -------------------------------------------------------------
runTest('Bank Nifty operates with dynamic threshold, distinct ATR, and independent price levels', () => {
  const resBN = evaluateGapProbability({
    symbol: 'BANKNIFTY',
    spotPrice: 55000,
    spotPrevClose: 54800,
    spotOpen: 55000,
    spotHigh: 55150,
    spotLow: 54950,
    vix: 15.0
  });

  // Bank Nifty 1σ expected move: 55000 * 0.15 / sqrt(252) ≈ 519 pts
  assert.ok(resBN.expectedOpeningRange.dailyExpectedMovePts > 450, 'Bank Nifty move must be > 450 pts');
  assert.ok(resBN.expectedOpeningRange.low > 54000, 'Bank Nifty corridor low must be around 54k-55k');
  assert.ok(resBN.expectedOpeningRange.high < 56000, 'Bank Nifty corridor high must be around 55k-56k');
  assert.strictEqual(resBN.streakAnalysis.streakType, 'BULLISH_GAP', '200 pt gap up on Bank Nifty is a Bullish Gap');
});

// -------------------------------------------------------------
// TEST 7: CLV Clamping & ATR Compression with Lagged Quotes
// -------------------------------------------------------------
runTest('CLV is strictly bounded in [0.0, 1.0] even with inverted or lagged quotes', () => {
  // Case A: spotPrice exceeds spotHigh (lagged quote tick)
  const resOver = evaluateGapProbability({
    symbol: 'NIFTY',
    spotPrice: 25750,
    spotPrevClose: 25600,
    spotOpen: 25650,
    spotHigh: 25700, // lower than spotPrice!
    spotLow: 25600,
    vix: 14.5
  });
  assert.ok(resOver.streakAnalysis.clv >= 0.0 && resOver.streakAnalysis.clv <= 1.0, `CLV must be clamped in [0, 1], got ${resOver.streakAnalysis.clv}`);

  // Case B: spotPrice below spotLow
  const resUnder = evaluateGapProbability({
    symbol: 'NIFTY',
    spotPrice: 25550,
    spotPrevClose: 25600,
    spotOpen: 25600,
    spotHigh: 25700,
    spotLow: 25600, // higher than spotPrice!
    vix: 14.5
  });
  assert.ok(resUnder.streakAnalysis.clv >= 0.0 && resUnder.streakAnalysis.clv <= 1.0, `CLV must be clamped in [0, 1], got ${resUnder.streakAnalysis.clv}`);
});

// -------------------------------------------------------------
// TEST 8: Edge Case Resilience (Zero, NaN, undefined)
// -------------------------------------------------------------
runTest('Engine gracefully handles undefined/zero/extreme inputs without NaN propagation', () => {
  const res = evaluateGapProbability({
    symbol: 'NIFTY',
    spotPrice: 0,
    spotPrevClose: NaN as any,
    vix: -5 as any
  });

  assert.ok(Number.isFinite(res.expectedOpeningRange.low), 'Low must be finite');
  assert.ok(Number.isFinite(res.expectedOpeningRange.high), 'High must be finite');
  assert.ok(res.expectedOpeningRange.high > res.expectedOpeningRange.low, 'High must be strictly > Low');
  assert.strictEqual(
    res.openingProbability.gapUpPct + res.openingProbability.flatPct + res.openingProbability.gapDownPct,
    100,
    'Probabilities must sum to 100 even with corrupted inputs'
  );
  assert.ok(res.openingProbability.gapUpPct >= 0, 'No negative probabilities');
  assert.ok(res.openingProbability.flatPct >= 0, 'No negative probabilities');
  assert.ok(res.openingProbability.gapDownPct >= 0, 'No negative probabilities');
});

// -------------------------------------------------------------
// TEST 9: Exhaustion Trap & Volume Profile Liquidity Radar
// -------------------------------------------------------------
runTest('Exhaustion Trap Tracker accurately detects filled gap, trapped overhead volume, and plain-English briefing', () => {
  // Simulate the exact chart from user:
  // Impulse from 24,800 to 25,400. Gap up from 25,140 close to 25,220 open.
  // Today's candle drops to 25,070, slicing through the 25,140 gap floor!
  const userChartDaily = [
    { date: '2026-11-04', open: 24700, high: 24850, low: 24680, close: 24800, volume: 500000 },
    { date: '2026-11-05', open: 24850, high: 25020, low: 24800, close: 25000, volume: 800000 }, // High volume accumulation base at 25,000
    { date: '2026-11-06', open: 25020, high: 25160, low: 25000, close: 25140, volume: 400000 },
    // Nov 11 Gap up: opens at 25,220 (gap of 80 pts above 25,140 close)
    { date: '2026-11-11', open: 25220, high: 25380, low: 25200, close: 25320, volume: 600000 },
    // Consolidation day at peak with heavy volume
    { date: '2026-11-12', open: 25330, high: 25420, low: 25280, close: 25340, volume: 700000 }
  ];

  const res = evaluateGapProbability({
    symbol: 'NIFTY',
    spotPrice: 25144, // Today's spot trading down
    spotPrevClose: 25340,
    spotOpen: 25300,
    spotHigh: 25350,
    spotLow: 25070, // Sliced through the 25,140 gap floor!
    vix: 14.5,
    dailyCandles: userChartDaily,
    resistanceLevel: 25400
  });

  const tracker = res.exhaustionTrapTracker;
  assert.ok(tracker, 'exhaustionTrapTracker must be present');
  assert.strictEqual(tracker.isExhaustionTrapDetected, true, 'Must detect exhaustion trap');
  assert.strictEqual(tracker.trapStatus, 'EXHAUSTION_CONFIRMED_GAP_FILLED', 'Must confirm gap filled when low penetrates floor');
  assert.ok(tracker.gapFloorPrice <= 25150, `Gap floor must be ~25,140, got ${tracker.gapFloorPrice}`);
  assert.ok(tracker.trappedSupplyZone.volumePct > 25, `Overhead trapped volume must be significant (>25%), got ${tracker.trappedSupplyZone.volumePct}%`);
  assert.ok(tracker.institutionalFloorPrice <= 25050, `Institutional floor must locate around 25,000 POC, got ${tracker.institutionalFloorPrice}`);

  // Verify Plain-English Briefing
  const briefing = tracker.plainEnglishBriefing;
  assert.ok(briefing.headline.includes('Exhaustion Top Confirmed'), 'Headline must declare exhaustion top confirmed');
  assert.ok(briefing.whatHappened.includes('exhaustion trap'), 'What happened must explain the exhaustion trap');
  assert.ok(briefing.dangerZone.includes('underwater') || briefing.dangerZone.includes('Heavy volume'), 'Danger zone must explain trapped buyers');
  assert.ok(briefing.realFloor.includes('25,000') || briefing.realFloor.includes(tracker.institutionalFloorPrice.toLocaleString('en-IN')), 'Real floor must highlight POC');
  assert.ok(briefing.actionPlan.includes('Bear Call') || briefing.actionPlan.includes('Do NOT buy'), 'Action plan must provide clear guidance');
});

// -------------------------------------------------------------
// TEST 10: Zero-Streak / Inside Day False Positive Prevention
// -------------------------------------------------------------
runTest('Market without authentic bullish gap does not falsely trigger exhaustion gap filled trap', () => {
  const normalChopDaily = [
    { date: '2026-11-01', open: 25000, high: 25050, low: 24980, close: 25000 },
    { date: '2026-11-02', open: 25000, high: 25050, low: 24980, close: 25000 },
    { date: '2026-11-03', open: 25005, high: 25060, low: 24990, close: 25010 }
  ];

  const res = evaluateGapProbability({
    symbol: 'NIFTY',
    spotPrice: 24940, // Drops 70 pts on flat open
    spotPrevClose: 25010,
    spotOpen: 25010,
    spotHigh: 25020,
    spotLow: 24930,
    vix: 14.0,
    dailyCandles: normalChopDaily
  });

  const tracker = res.exhaustionTrapTracker;
  assert.ok(tracker, 'tracker must be defined');
  assert.strictEqual(tracker.isExhaustionTrapDetected, false, 'Must NOT flag exhaustion trap when no bullish gap exists');
  assert.strictEqual(tracker.trapStatus, 'MOMENTUM_HEALTHY', 'Status must remain MOMENTUM_HEALTHY');
  assert.strictEqual(tracker.gapFloorPrice, 0, 'No gap floor should be fabricated');
  assert.ok(tracker.plainEnglishBriefing.headline.includes('No Active Exhaustion Trap') || tracker.plainEnglishBriefing.headline.includes('Orderly Auction'), 'Headline must report orderly auction');
});

// -------------------------------------------------------------
// TEST 11: Bearish Breakaway & Runaway Regimes
// -------------------------------------------------------------
runTest('Bearish Breakaway and Runaway trigger symmetric downside institutional playbooks', () => {
  // 1. Bearish Breakaway below support
  const bearBreakaway = evaluateGapProbability({
    symbol: 'NIFTY',
    spotPrice: 24350,
    spotPrevClose: 24600,
    spotOpen: 24400,
    spotHigh: 24450,
    spotLow: 24300,
    vix: 16.5,
    supportLevel: 24500, // Spot broke below support
    dailyCandles: [
      { date: '2026-11-01', open: 24650, high: 24700, low: 24580, close: 24620 },
      { date: '2026-11-02', open: 24600, high: 24650, low: 24550, close: 24600 }
    ]
  });

  assert.strictEqual(bearBreakaway.gapFillDynamics.gapClassification, 'BREAKAWAY');
  assert.strictEqual(bearBreakaway.actionablePlaybook.morningBias, 'SELL_THE_RALLIES');
  assert.ok(bearBreakaway.actionablePlaybook.recommendedSetup.includes('Bear Call'), 'Must recommend Bear Call spreads');
  assert.ok(bearBreakaway.gapFillDynamics.structuralVerbiage.includes('breakdown below structural support'), 'Verbiage must identify breakdown');

  // 2. Bearish Runaway (consecutive gap downs)
  const bearRunaway = evaluateGapProbability({
    symbol: 'NIFTY',
    spotPrice: 24100,
    spotPrevClose: 24350,
    spotOpen: 24200,
    vix: 17.0,
    dailyCandles: [
      { date: '2026-11-01', open: 24600, high: 24650, low: 24480, close: 24500 },
      { date: '2026-11-02', open: 24420, high: 24450, low: 24300, close: 24350 },
      { date: '2026-11-03', open: 24250, high: 24280, low: 24080, close: 24100 }
    ]
  });

  assert.strictEqual(bearRunaway.gapFillDynamics.gapClassification, 'RUNAWAY');
  assert.strictEqual(bearRunaway.actionablePlaybook.morningBias, 'BEARISH_CONTINUATION');
  assert.ok(bearRunaway.actionablePlaybook.recommendedSetup.includes('Bear Call'), 'Must recommend Bear Call spreads for downside carry');
});

// -------------------------------------------------------------
// TEST 12: Defensive NaN and Corrupted Input Resilience in Tracker
// -------------------------------------------------------------
runTest('Exhaustion Trap Tracker is resilient to NaN/zero/undefined inputs without string NaN in UI', () => {
  const corrupted = evaluateGapProbability({
    symbol: 'BANKNIFTY',
    spotPrice: NaN as any,
    spotPrevClose: 0,
    spotOpen: undefined as any,
    spotHigh: NaN as any,
    spotLow: NaN as any,
    vix: NaN as any,
    dailyCandles: []
  });

  const tracker = corrupted.exhaustionTrapTracker;
  assert.ok(tracker, 'Tracker must exist');
  assert.ok(Number.isFinite(tracker.gapFloorPrice), 'gapFloorPrice must be finite');
  assert.ok(Number.isFinite(tracker.institutionalFloorPrice), 'institutionalFloorPrice must be finite');
  assert.ok(Number.isFinite(tracker.exhaustionScorePct), 'exhaustionScorePct must be finite');
  assert.ok(!tracker.plainEnglishBriefing.headline.includes('NaN'), 'No NaN in headline');
  assert.ok(!tracker.plainEnglishBriefing.whatHappened.includes('NaN'), 'No NaN in whatHappened');
  assert.ok(!tracker.plainEnglishBriefing.dangerZone.includes('NaN'), 'No NaN in dangerZone');
  assert.ok(!tracker.plainEnglishBriefing.realFloor.includes('NaN'), 'No NaN in realFloor');
});

console.log(`\n🎉 ALL ${testsPassed}/13 GAP PROBABILITY ENGINE TESTS PASSED!`);
