import assert from 'assert';
import { synthesizeExecutiveMasterCockpit } from '../lib/engine/masterSynthesisEngine';
import { synthesizeOrComputeOptionChainGreeks } from '../lib/engine/optionGreeksEngine';

console.log('===============================================================');
console.log('🧪 RUNNING DEEP AUDIT & VERIFICATION: MASTER SYNTHESIS COCKPIT');
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
// TEST 1: Put Wall & Call Wall Separation Around Spot
// -------------------------------------------------------------
runTest('Call Wall is strictly above spot and Put Wall is strictly below spot (no identical walls)', () => {
  // Test both Nifty and Bank Nifty
  const niftyGreeks = synthesizeOrComputeOptionChainGreeks('NIFTY', 25196.55, 16.2).metrics;
  const bankGreeks = synthesizeOrComputeOptionChainGreeks('BANKNIFTY', 60820.0, 16.2).metrics;

  assert.ok(niftyGreeks.callWall > 25196.55, `Nifty Call Wall (${niftyGreeks.callWall}) must be > spot (25196.55)`);
  assert.ok(niftyGreeks.putWall < 25196.55, `Nifty Put Wall (${niftyGreeks.putWall}) must be < spot (25196.55)`);

  assert.ok(bankGreeks.callWall > 60820.0, `Bank Nifty Call Wall (${bankGreeks.callWall}) must be > spot (60820.0)`);
  assert.ok(bankGreeks.putWall < 60820.0, `Bank Nifty Put Wall (${bankGreeks.putWall}) must be < spot (60820.0)`);

  const synthesisNifty = synthesizeExecutiveMasterCockpit({
    symbol: 'NIFTY',
    spotPrice: 25196.55,
    spotNetChange: -102.8,
    spotPrevClose: 25299.35,
    vix: 16.2,
    greeks: niftyGreeks
  });

  assert.ok(synthesisNifty.keyLevels.hardFloor.price < 25196.55, 'Hard Floor must be strictly below spot');
  assert.ok(synthesisNifty.keyLevels.hardCeiling.price > 25196.55, 'Hard Ceiling must be strictly above spot');
  assert.ok(synthesisNifty.keyLevels.hardFloor.price < synthesisNifty.keyLevels.hardCeiling.price, 'Hard Floor < Hard Ceiling');

  const synthesisBank = synthesizeExecutiveMasterCockpit({
    symbol: 'BANKNIFTY',
    spotPrice: 60820.0,
    spotNetChange: -484.0,
    spotPrevClose: 61304.0,
    vix: 16.2,
    greeks: bankGreeks
  });

  assert.ok(synthesisBank.keyLevels.hardFloor.price < 60820.0, 'Bank Nifty Hard Floor must be strictly below spot');
  assert.ok(synthesisBank.keyLevels.hardCeiling.price > 60820.0, 'Bank Nifty Hard Ceiling must be strictly above spot');
});

// -------------------------------------------------------------
// TEST 2: Graceful Handling of Zero / NaN / Negative Inputs
// -------------------------------------------------------------
runTest('Engine gracefully handles undefined, NaN, and zero inputs without runtime crashes or NaN output', () => {
  const synthesis = synthesizeExecutiveMasterCockpit({
    symbol: 'NIFTY',
    spotPrice: NaN,
    spotNetChange: NaN,
    spotPrevClose: 0,
    vix: 0
  });

  assert.ok(synthesis.headlineState.status != null);
  assert.ok(!synthesis.plainSummary.whatsHappening.includes('NaN'), 'whatsHappening must not contain NaN');
  assert.ok(!synthesis.plainSummary.whatsHappening.includes('Infinity'), 'whatsHappening must not contain Infinity');
  assert.ok(synthesis.keyLevels.hardFloor.price > 0, 'Hard floor must be positive');
  assert.ok(synthesis.keyLevels.hardCeiling.price > 0, 'Hard ceiling must be positive');
  assert.ok(synthesis.liquidityPool.longStopZone.low > 0, 'Long stop zone low must be positive');
});

// -------------------------------------------------------------
// TEST 3: Genuine Broad Trend Cascade vs. Fakeout Trap Distinction
// -------------------------------------------------------------
runTest('Broad selloff with 75% declining turnover triggers CASCADE_CONFIRMED, not false fakeout trap', () => {
  const synthesis = synthesizeExecutiveMasterCockpit({
    symbol: 'NIFTY',
    spotPrice: 25185.0, // probing near day low 25180
    spotNetChange: -114.35,
    spotPrevClose: 25299.35,
    spotLow: 25180.0,
    spotHigh: 25250.0,
    vix: 16.5,
    advancesDeclines: {
      advances: 12,
      declines: 38,
      unchanged: 0,
      advancingWeight: 22,
      decliningWeight: 78,
      unchangedWeight: 0,
      adRatio: 0.31,
      breadthVelocity: 'EXPANDING_BEARISH',
      totalTurnoverCr: 45000,
      advancingTurnoverCr: 11000,
      decliningTurnoverCr: 34000,
      advancingVolumePct: 24,
      decliningVolumePct: 76,
      volumeBreadthRatio: 0.32,
      volumeConviction: 'HEAVY_DISTRIBUTION'
    }
  });

  assert.strictEqual(synthesis.liquidityPool.trapState, 'CASCADE_CONFIRMED', 'Must confirm cascade with 76% declining turnover');
  assert.strictEqual(synthesis.headlineState.status, 'BEARISH_CASCADE', 'Must classify as BEARISH_CASCADE');
  assert.strictEqual(synthesis.playbook.actionBias, 'TREND_FOLLOW');
  assert.ok(synthesis.playbook.doNotDo.includes('falling knives'));
});

// -------------------------------------------------------------
// TEST 4: Breadth Divergence Triggers FAKE_BREAKDOWN_TRAP at Lows
// -------------------------------------------------------------
runTest('Divergent breadth (advances >= 50% while spot probes low) triggers LONG_STOP_HUNT_SWEEP', () => {
  const synthesis = synthesizeExecutiveMasterCockpit({
    symbol: 'NIFTY',
    spotPrice: 25182.0, // probing near day low 25180
    spotNetChange: -60.0,
    spotPrevClose: 25242.0,
    spotLow: 25180.0,
    spotHigh: 25250.0,
    vix: 15.0,
    advancesDeclines: {
      advances: 28, // more than 50% advancing
      declines: 22,
      unchanged: 0,
      advancingWeight: 55,
      decliningWeight: 45,
      unchangedWeight: 0,
      adRatio: 1.27,
      breadthVelocity: 'BALANCED',
      totalTurnoverCr: 40000,
      advancingTurnoverCr: 24000,
      decliningTurnoverCr: 16000,
      advancingVolumePct: 60,
      decliningVolumePct: 40,
      volumeBreadthRatio: 1.5,
      volumeConviction: 'MODERATE_INFLOW'
    }
  });

  assert.strictEqual(synthesis.liquidityPool.trapState, 'LONG_STOP_HUNT_SWEEP', 'Must trigger LONG_STOP_HUNT_SWEEP');
  assert.strictEqual(synthesis.headlineState.status, 'FAKE_BREAKDOWN_TRAP');
  assert.strictEqual(synthesis.playbook.actionBias, 'AVOID_PUTS');
  assert.ok(synthesis.playbook.doNotDo.includes('DO NOT chase Put option buys'));
});

// -------------------------------------------------------------
// TEST 5: Single Heavyweight Culprit Attribution in Master Narrative
// -------------------------------------------------------------
runTest('Narrative clearly names culprit and percentage contribution when concentration is detected', () => {
  const synthesis = synthesizeExecutiveMasterCockpit({
    symbol: 'NIFTY',
    spotPrice: 25200.0,
    spotNetChange: -99.35,
    spotPrevClose: 25299.35,
    vix: 15.5,
    impulseAttribution: {
      timestamp: '11:30 IST',
      isImpulseDetected: true,
      intensity: 'HIGH',
      direction: 'BEARISH_PLUNGE',
      netPoints: -99.35,
      grossPoints: 120.0,
      causeType: 'SINGLE_STOCK_CULPRIT',
      causeBadge: 'Single Stock Culprit',
      headline: 'HDFCBANK Dragging Nifty',
      verdict: 'Concentrated move',
      recommendation: 'Avoid chasing puts',
      concentrationRatio1: 0.62,
      concentrationRatio2: 0.78,
      marketBreadthSyncPct: 42,
      aggregateRvol: 1.4,
      liquidityState: 'MODERATE_DEPTH',
      topDrivers: [],
      topDraggers: [],
      actionLinks: [],
      culprit: {
        symbol: 'HDFCBANK',
        name: 'HDFC Bank Ltd.',
        sector: 'Financial Services',
        price: 1750.0,
        pointImpact: -38.5,
        changePct: -1.8,
        weight: 13.5,
        relativeVolume: 1.9,
        turnoverCr: 4500,
        pctOfDirectionalMove: 38.7,
        pctOfNetIndexMove: 38.7
      }
    }
  });

  assert.ok(synthesis.plainSummary.whatsHappening.includes('HDFC Bank Ltd.'));
  assert.ok(synthesis.plainSummary.whatsHappening.includes('39%'));
  assert.ok(synthesis.plainSummary.whatsHappening.includes('concentrated'));
});

console.log(`\n🎉 ALL ${testsPassed}/5 MASTER SYNTHESIS VERIFICATION TESTS PASSED WITH 100% RIGOR!`);
