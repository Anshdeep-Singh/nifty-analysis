import assert from 'assert';
import { OptionGreeksMetrics } from '../lib/types';
import {
  calculateGreeks,
  synthesizeOrComputeOptionChainGreeks,
  getTimeToExpiry
} from '../lib/engine/optionGreeksEngine';
import {
  calculateExpected30mMove,
  evaluate30mRollingRegime,
  getRollingBuffer,
  clearRollingBuffer
} from '../lib/engine/rolling30mRegimeEngine';
import { NIFTY_50_STOCKS_DATA, buildNifty50Analysis } from '../lib/engine/nifty50Constituents';

console.log('========================================================================');
console.log('🧪 RUNNING DEEP VERIFICATION SUITE: 30-MIN CONTINUOUS GREEKS REGIME ENGINE');
console.log('========================================================================\n');

let testsPassed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ [FAIL] ${name}: ${msg}`);
    process.exit(1);
  }
}

// -------------------------------------------------------------
// TEST 1: Black-Scholes Mathematical Rigor & Greek Invariants
// -------------------------------------------------------------
runTest('Black-Scholes Delta, Gamma, Vega satisfy put-call parity and non-negativity', () => {
  const spot = 24500;
  const strike = 24500;
  const dte = 4.0;
  const iv = 14.0;

  const ce = calculateGreeks(spot, strike, dte, iv, 'CE');
  const pe = calculateGreeks(spot, strike, dte, iv, 'PE');

  // ATM Delta for Call is near +0.50, Put is near -0.50 (Delta_CE - Delta_PE == 1)
  assert.ok(ce.delta > 0.45 && ce.delta < 0.55, `Call delta should be ~0.50, got ${ce.delta}`);
  assert.ok(pe.delta < -0.45 && pe.delta > -0.55, `Put delta should be ~-0.50, got ${pe.delta}`);
  assert.ok(Math.abs((ce.delta - pe.delta) - 1.0) < 0.01, `Delta difference must be ~1.0, got ${ce.delta - pe.delta}`);

  // Gamma and Vega are identical for CE and PE
  assert.strictEqual(ce.gamma, pe.gamma, 'Gamma must be identical for CE and PE');
  assert.strictEqual(ce.vega, pe.vega, 'Vega must be identical for CE and PE');
  assert.ok(ce.gamma > 0, 'Gamma must be strictly positive');
});

// -------------------------------------------------------------
// TEST 2: Option Chain GEX & Gamma Flip Resolution
// -------------------------------------------------------------
runTest('Option Chain GEX, Call Wall, Put Wall, and Gamma Flip compute accurately', () => {
  const spot = 24520;
  const vix = 14.2;

  const { metrics, strikes } = synthesizeOrComputeOptionChainGreeks('NIFTY', spot, vix, 3.5);

  assert.strictEqual(strikes.length, 21, `Expected 21 strikes (ATM ± 10), got ${strikes.length}`);
  assert.ok(metrics.callWall >= 24500, `Call wall strike must be >= ATM, got ${metrics.callWall}`);
  assert.ok(metrics.putWall <= 24500, `Put wall strike must be <= ATM, got ${metrics.putWall}`);
  assert.ok(metrics.pcrRatio > 0.4 && metrics.pcrRatio < 2.5, `PCR ratio must be within reasonable bounds, got ${metrics.pcrRatio}`);
  assert.ok(Number.isFinite(metrics.netGexCr), 'Net GEX must be finite number');
  assert.ok(metrics.gammaFlip > 0, 'Gamma flip strike must be positive');
});

// -------------------------------------------------------------
// TEST 3: Volatility-Scaled Continuous 30-Minute Expected Move
// -------------------------------------------------------------
runTest('Continuous 30m Expected Move scales with Spot * (VIX/100) / sqrt(3150)', () => {
  const spot = 24500;
  const vix = 14.5;
  const expected30m = calculateExpected30mMove(spot, vix);

  // Spot 24500 * 0.145 / 56.1248 ~ 63.3 pts
  assert.ok(expected30m >= 60 && expected30m <= 66, `Expected ~63.3 pts, got ${expected30m}`);

  // Low VIX (10.0) -> Expected move shrinks
  const lowVixMove = calculateExpected30mMove(spot, 10.0);
  assert.ok(lowVixMove < expected30m, `Low VIX move (${lowVixMove}) should be less than normal VIX move (${expected30m})`);

  // Crisis VIX (28.0) -> Expected move expands
  const highVixMove = calculateExpected30mMove(spot, 28.0);
  assert.ok(highVixMove > expected30m * 1.8, `High VIX move (${highVixMove}) should expand significantly`);
});

// -------------------------------------------------------------
// TEST 4: Confluent Bullish Squeeze Scenario (High Conviction)
// -------------------------------------------------------------
runTest('Bullish squeeze: High Adv Turnover + Call Shedding yields STRONG_BULLISH with high confidence', () => {
  clearRollingBuffer();
  const spotPrevClose = 24500;
  const spotPrice = 24560; // +60 pts
  const vix = 14.0;

  // Advancing updates: 40 stocks advancing
  const stockUpdates = NIFTY_50_STOCKS_DATA.map((s, idx) => {
    const isAdv = idx < 40;
    return {
      symbol: s.symbol,
      price: isAdv ? s.price * 1.008 : s.price * 0.998,
      changePct: isAdv ? 0.8 : -0.2,
      prevClose: s.price,
      volume: 2500000
    };
  });

  const analysis = buildNifty50Analysis(
    stockUpdates,
    spotPrice,
    vix,
    60,
    spotPrevClose,
    24505,
    24565,
    24500,
    true
  );

  const { metrics } = synthesizeOrComputeOptionChainGreeks('NIFTY', spotPrice, vix);

  // Simulate short gamma cascade with call shedding
  const customGreeks = {
    ...metrics,
    gexRegime: 'DEALER_SHORT_GAMMA_CASCADE' as const,
    netGexCr: -450
  };

  const { prediction } = evaluate30mRollingRegime({
    symbol: 'NIFTY',
    spotPrice,
    spotNetChange: 60,
    spotPrevClose,
    vix,
    advancesDeclines: analysis.advancesDeclines,
    stocks: analysis.analyzedStocks,
    greeks: customGreeks,
    impulseAttribution: analysis.impulseAttribution,
    anomalies: []
  });

  assert.ok(prediction.direction.includes('BULLISH'), `Expected BULLISH direction, got ${prediction.direction}`);
  assert.ok(prediction.confidencePct >= 70, `Expected confidence >= 70%, got ${prediction.confidencePct}%`);
  assert.ok(prediction.targetHigh > spotPrice, `Target high (${prediction.targetHigh}) must be > spot (${spotPrice})`);
  assert.ok(prediction.tacticalStopLoss < spotPrice, `Stop loss (${prediction.tacticalStopLoss}) must be < spot (${spotPrice})`);
});

// -------------------------------------------------------------
// TEST 5: Single-Stock Anomaly Trap Interception (Governor Veto)
// -------------------------------------------------------------
runTest('Single-stock anomaly (Reliance carrying move alone) clamps confidence <= 48% with FAKEOUT warning', () => {
  clearRollingBuffer();
  const spotPrevClose = 24500;
  const spotPrice = 24545; // +45 pts net
  const vix = 14.0;

  // Skewed: Reliance +3.5% (large weight ~9%), while 35 stocks decline
  const stockUpdates = NIFTY_50_STOCKS_DATA.map((s) => {
    if (s.symbol === 'RELIANCE') {
      return {
        symbol: s.symbol,
        price: s.price * 1.035,
        changePct: 3.5,
        prevClose: s.price,
        volume: 12000000
      };
    }
    return {
      symbol: s.symbol,
      price: s.price * 0.998,
      changePct: -0.2,
      prevClose: s.price,
      volume: 1000000
    };
  });

  const analysis = buildNifty50Analysis(
    stockUpdates,
    spotPrice,
    vix,
    45,
    spotPrevClose,
    24500,
    24550,
    24490,
    true
  );

  const { metrics } = synthesizeOrComputeOptionChainGreeks('NIFTY', spotPrice, vix);

  const { prediction } = evaluate30mRollingRegime({
    symbol: 'NIFTY',
    spotPrice,
    spotNetChange: 45,
    spotPrevClose,
    vix,
    advancesDeclines: analysis.advancesDeclines,
    stocks: analysis.analyzedStocks,
    greeks: metrics,
    impulseAttribution: analysis.impulseAttribution,
    anomalies: []
  });

  assert.strictEqual(prediction.reconciliationState, 'FAKEOUT_EXHAUSTION', 'Must be classified as FAKEOUT_EXHAUSTION');
  assert.ok(prediction.confidencePct <= 48, `Confidence must be clamped <= 48%, got ${prediction.confidencePct}%`);
  assert.notStrictEqual(prediction.direction, 'STRONG_BULLISH', 'STRONG_BULLISH must be vetoed under single-stock trap');
  assert.ok(prediction.verdictHeadline.includes('FAKEOUT'), 'Headline must include FAKEOUT warning');
});

// -------------------------------------------------------------
// TEST 6: Fortress Pin Regime (Long Gamma Containment)
// -------------------------------------------------------------
runTest('Positive Dealer GEX in balanced market favors FORTRESS_PIN / range chop', () => {
  clearRollingBuffer();
  const spotPrevClose = 24500;
  const spotPrice = 24505; // flat (+5 pts)
  const vix = 12.0;

  const stockUpdates = NIFTY_50_STOCKS_DATA.map((s, idx) => ({
    symbol: s.symbol,
    price: idx % 2 === 0 ? s.price * 1.001 : s.price * 0.999,
    changePct: idx % 2 === 0 ? 0.1 : -0.1,
    prevClose: s.price,
    volume: 1500000
  }));

  const analysis = buildNifty50Analysis(
    stockUpdates,
    spotPrice,
    vix,
    5,
    spotPrevClose,
    24500,
    24515,
    24495,
    true
  );

  const { metrics } = synthesizeOrComputeOptionChainGreeks('NIFTY', spotPrice, vix);

  const customGreeks = {
    ...metrics,
    gexRegime: 'DEALER_LONG_GAMMA_PIN' as const,
    netGexCr: 620
  };

  const { prediction } = evaluate30mRollingRegime({
    symbol: 'NIFTY',
    spotPrice,
    spotNetChange: 5,
    spotPrevClose,
    vix,
    advancesDeclines: analysis.advancesDeclines,
    stocks: analysis.analyzedStocks,
    greeks: customGreeks,
    impulseAttribution: analysis.impulseAttribution,
    anomalies: []
  });

  assert.strictEqual(prediction.direction, 'NEUTRAL_CHOPPY', 'Flat market with Long Gamma must resolve to NEUTRAL_CHOPPY');
  assert.strictEqual(prediction.reconciliationState, 'FORTRESS_PIN', 'Must resolve to FORTRESS_PIN');
  assert.ok(prediction.actionablePlaybook.includes('Iron Condor') || prediction.actionablePlaybook.includes('Credit Spreads') || prediction.actionablePlaybook.includes('pin'), 'Playbook must recommend pin/range strategies');
  assert.strictEqual(prediction.netPointImpact, 5, 'netPointImpact must match spotNetChange');
  assert.ok(Number.isFinite(prediction.drift30mPts), 'drift30mPts must be a finite number');
});

// -------------------------------------------------------------
// TEST 7: Bank Nifty Greeks & GEX Synthesis
// -------------------------------------------------------------
runTest('Bank Nifty Greeks & GEX synthesize accurately with 100-pt strike steps and scaled contracts', () => {
  const spot = 52400;
  const vix = 16.5;

  const { metrics, strikes } = synthesizeOrComputeOptionChainGreeks('BANKNIFTY', spot, vix);

  assert.strictEqual(strikes.length, 21, 'Bank Nifty must yield 21 strikes');
  assert.strictEqual(strikes[1].strike - strikes[0].strike, 100, 'Bank Nifty strike step must be exactly 100');
  assert.ok(metrics.callWall >= 52400, 'Bank Nifty Call Wall must be >= ATM');
  assert.ok(metrics.putWall <= 52400, 'Bank Nifty Put Wall must be <= ATM');
  assert.ok(metrics.gammaFlip > 50000, 'Bank Nifty Gamma Flip must be in Bank Nifty strike range');
});

// -------------------------------------------------------------
// TEST 8: Extreme Breakout Beyond Call/Put Walls Invariant
// -------------------------------------------------------------
runTest('Breakout beyond Call Wall guarantees targetHigh > spot; cascade below Put Wall guarantees targetLow < spot', () => {
  clearRollingBuffer();
  const spotPrice = 25200; // Far above 24800 Call Wall
  const vix = 18.0;

  const mockGreeks: OptionGreeksMetrics = {
    spotPrice,
    vix,
    gammaFlip: 24700,
    callWall: 24800, // Spot is 400 pts above Call Wall!
    putWall: 24200,
    netGexCr: -600,
    callGexCr: 200,
    putGexCr: 800,
    gexRegime: 'DEALER_SHORT_GAMMA_CASCADE',
    callOiTotal: 2000000,
    putOiTotal: 1500000,
    pcrRatio: 0.75,
    atmIv: 18.0,
    deltaVector: 0.25,
    rolling30mCallOiChangePct: -1.5,
    rolling30mPutOiChangePct: 0.5,
    oiVelocityRegime: 'BULLISH_SHORT_COVERING'
  };

  const { prediction: bullPred } = evaluate30mRollingRegime({
    symbol: 'NIFTY',
    spotPrice,
    spotNetChange: 150,
    spotPrevClose: 25050,
    vix,
    advancesDeclines: {
      advances: 42,
      declines: 8,
      unchanged: 0,
      advancingWeight: 88,
      decliningWeight: 12,
      unchangedWeight: 0,
      adRatio: 5.25,
      breadthVelocity: 'EXPANDING_BULLISH',
      totalTurnoverCr: 5000,
      advancingTurnoverCr: 4100,
      decliningTurnoverCr: 900,
      advancingVolumePct: 82,
      decliningVolumePct: 18,
      volumeBreadthRatio: 4.5,
      volumeConviction: 'STRONG_ACCUMULATION'
    },
    stocks: [],
    greeks: mockGreeks,
    anomalies: []
  });

  // targetHigh must NEVER be inverted below spotPrice!
  assert.ok(bullPred.targetHigh > spotPrice, `targetHigh (${bullPred.targetHigh}) must be > spotPrice (${spotPrice})`);
  assert.ok(bullPred.tacticalStopLoss < spotPrice, `tacticalStopLoss (${bullPred.tacticalStopLoss}) must be < spotPrice (${spotPrice})`);

  // Downside crash below Put Wall
  const crashSpot = 23900; // Far below 24200 Put Wall!
  const { prediction: bearPred } = evaluate30mRollingRegime({
    symbol: 'NIFTY',
    spotPrice: crashSpot,
    spotNetChange: -250,
    spotPrevClose: 24150,
    vix: 22.0,
    advancesDeclines: {
      advances: 5,
      declines: 45,
      unchanged: 0,
      advancingWeight: 10,
      decliningWeight: 90,
      unchangedWeight: 0,
      adRatio: 0.11,
      breadthVelocity: 'EXPANDING_BEARISH',
      totalTurnoverCr: 5500,
      advancingTurnoverCr: 800,
      decliningTurnoverCr: 4700,
      advancingVolumePct: 15,
      decliningVolumePct: 85,
      volumeBreadthRatio: 0.17,
      volumeConviction: 'HEAVY_DISTRIBUTION'
    },
    stocks: [],
    greeks: { ...mockGreeks, spotPrice: crashSpot, vix: 22.0, putWall: 24200 },
    anomalies: []
  });

  // targetLow must NEVER be inverted above spotPrice!
  assert.ok(bearPred.targetLow < crashSpot, `targetLow (${bearPred.targetLow}) must be < crashSpot (${crashSpot})`);
  assert.ok(bearPred.tacticalStopLoss > crashSpot, `tacticalStopLoss (${bearPred.tacticalStopLoss}) must be > crashSpot (${crashSpot})`);
});

// -------------------------------------------------------------
// TEST 9: NaN, Zero, and Negative Input Immunity
// -------------------------------------------------------------
runTest('Engine gracefully handles NaN, zero, and negative inputs without NaN propagation or runtime crashes', () => {
  const expectedMove = calculateExpected30mMove(NaN as unknown as number, -5);
  assert.ok(Number.isFinite(expectedMove), 'Expected move must be finite number even with NaN/negative inputs');
  assert.ok(expectedMove >= 15, 'Expected move must maintain positive floor');

  const greeks = calculateGreeks(0, 0, -1, 0, 'CE');
  assert.ok(Number.isFinite(greeks.price), 'Call price must be finite');
  assert.ok(Number.isFinite(greeks.delta), 'Delta must be finite');
  assert.ok(Number.isFinite(greeks.gamma), 'Gamma must be finite');
  assert.ok(Number.isFinite(greeks.theta), 'Theta must be finite');
  assert.ok(Number.isFinite(greeks.vega), 'Vega must be finite');
});

console.log(`\n🎉 ALL ${testsPassed} TESTS PASSED WITH 100% MATHEMATICAL & MICROSTRUCTURE RIGOR!`);
