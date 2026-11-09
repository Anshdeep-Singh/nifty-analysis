import assert from 'assert';
import { NIFTY_50_STOCKS_DATA, buildNifty50Analysis } from '../lib/engine/nifty50Constituents';
import { calculateImpulseAttribution } from '../lib/engine/impulseAttribution';
import { Nifty50Stock, SectorAnalysis, AdvancesDeclinesSummary } from '../lib/types';

console.log('===============================================================');
console.log('🧪 TESTING SUDDEN IMPULSE & LIQUIDITY ATTRIBUTION ENGINE');
console.log('===============================================================\n');

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
// TEST 1: Single-Stock Heavyweight Culprit Detection
// -------------------------------------------------------------
runTest('Isolates single heavyweight shock (e.g. HDFCBANK spikes +3.0% alone)', () => {
  const spotPrevClose = 24500.0;
  const hdfc = NIFTY_50_STOCKS_DATA.find((s) => s.symbol === 'HDFCBANK')!;
  assert.ok(hdfc, 'HDFCBANK must exist in constituent basket');

  // HDFC Bank moves +3.0%, while other 49 stocks are flat (0.00%)
  const updates = NIFTY_50_STOCKS_DATA.map((s) => ({
    symbol: s.symbol,
    price: s.symbol === 'HDFCBANK' ? s.price * 1.03 : s.price,
    changePct: s.symbol === 'HDFCBANK' ? 3.0 : 0.0,
    prevClose: s.price,
    volume: s.symbol === 'HDFCBANK' ? 50000000 : 1000000 // Surge volume in HDFCBANK
  }));

  // Expected HDFC point impact: 24500 * (11.45 / 100) * (3.0 / 100) = ~84.18 pts
  const expectedHdfcPoints = spotPrevClose * (hdfc.weight / 100) * (3.0 / 100);
  const spotPrice = spotPrevClose + expectedHdfcPoints;

  const analysis = buildNifty50Analysis(
    updates,
    spotPrice,
    14.0,
    expectedHdfcPoints,
    spotPrevClose,
    spotPrevClose,
    spotPrice,
    spotPrevClose,
    true
  );

  const impulse = analysis.impulseAttribution;
  assert.ok(impulse, 'Impulse attribution must be generated');
  assert.strictEqual(impulse.causeType, 'SINGLE_STOCK_CULPRIT', 'Must identify SINGLE_STOCK_CULPRIT');
  assert.strictEqual(impulse.culprit?.symbol, 'HDFCBANK', 'Must identify HDFCBANK as the culprit');
  assert.ok(impulse.concentrationRatio1 >= 80, `CR1 should be >80%, got ${impulse.concentrationRatio1}%`);
  assert.ok(impulse.culprit.pctOfNetIndexMove >= 90, `HDFCBANK should explain >=90% of net move, got ${impulse.culprit.pctOfNetIndexMove}%`);
  assert.ok(impulse.actionLinks.length >= 3, 'Must attach 3 verification action links for HDFCBANK');
});

// -------------------------------------------------------------
// TEST 2: Low-Depth Air Pocket (Vacuum Slippage)
// -------------------------------------------------------------
runTest('Detects thin liquidity vacuum when index moves on dry volume (RVOL < 0.70x)', () => {
  const spotPrevClose = 24500.0;
  // All stocks advance slightly (+0.30%), but with tiny traded volumes
  const updates = NIFTY_50_STOCKS_DATA.map((s) => ({
    symbol: s.symbol,
    price: s.price * 1.003,
    changePct: 0.30,
    prevClose: s.price,
    volume: 5000 // Very tiny volume across all stocks -> dry book
  }));

  const expectedMove = spotPrevClose * 0.003; // ~73.5 pts
  const spotPrice = spotPrevClose + expectedMove;

  const analysis = buildNifty50Analysis(
    updates,
    spotPrice,
    14.0,
    expectedMove,
    spotPrevClose,
    spotPrevClose,
    spotPrice,
    spotPrevClose,
    true
  );

  const impulse = analysis.impulseAttribution;
  assert.ok(impulse, 'Impulse attribution must be generated');
  assert.strictEqual(impulse.liquidityState, 'THIN_AIR_POCKET', 'Must flag THIN_AIR_POCKET');
  assert.strictEqual(impulse.causeType, 'VACUUM_SLIPPAGE', 'Must classify as VACUUM_SLIPPAGE');
  assert.ok(impulse.aggregateRvol < 0.50, `Aggregate RVOL must be < 0.50x, got ${impulse.aggregateRvol}`);
});

// -------------------------------------------------------------
// TEST 3: Programmatic Basket Sweep / Index Cash-Futures Arbitrage
// -------------------------------------------------------------
runTest('Identifies Programmatic Basket Sweep when 45+ stocks move synchronously with normal volume', () => {
  const spotPrevClose = 24500.0;
  // 45 stocks advance by +0.60%, 5 stocks flat, with healthy volumes
  const updates = NIFTY_50_STOCKS_DATA.map((s, idx) => ({
    symbol: s.symbol,
    price: idx < 45 ? s.price * 1.006 : s.price,
    changePct: idx < 45 ? 0.60 : 0.0,
    prevClose: s.price,
    volume: (s.avgVolume || 5000000) * 1.5 // Healthy institutional volume
  }));

  const analysis = buildNifty50Analysis(
    updates,
    24630,
    14.0,
    130.0,
    spotPrevClose,
    spotPrevClose,
    24630,
    spotPrevClose,
    true
  );

  const impulse = analysis.impulseAttribution;
  assert.ok(impulse, 'Impulse attribution must be generated');
  assert.strictEqual(impulse.causeType, 'BASKET_ARBITRAGE_SWEEP', 'Must classify as BASKET_ARBITRAGE_SWEEP');
  assert.ok(impulse.marketBreadthSyncPct >= 70, `Breadth sync must be >=70%, got ${impulse.marketBreadthSyncPct}%`);
  assert.ok(impulse.concentrationRatio2 <= 42, `Concentration ratio CR2 must be <=42%, got ${impulse.concentrationRatio2}%`);
  assert.strictEqual(impulse.liquidityState, 'HEALTHY_DEPTH', 'Liquidity depth must be HEALTHY_DEPTH');
});

// -------------------------------------------------------------
// TEST 4: Sector Capital Rotation Churn (IT vs Bank split)
// -------------------------------------------------------------
runTest('Identifies Sector Capital Rotation when Banking rallies and IT plunges', () => {
  const spotPrevClose = 24500.0;
  // Banking stocks rally +2.0%, IT stocks plunge -2.0%, net index is almost flat
  const updates = NIFTY_50_STOCKS_DATA.map((s) => {
    let changePct = 0;
    if (s.sector === 'Financial Services') changePct = 1.8;
    else if (s.sector === 'Information Technology') changePct = -2.2;
    return {
      symbol: s.symbol,
      price: s.price * (1 + changePct / 100),
      changePct,
      prevClose: s.price,
      volume: (s.avgVolume || 3000000)
    };
  });

  const analysis = buildNifty50Analysis(
    updates,
    24505,
    14.0,
    5.0,
    spotPrevClose,
    spotPrevClose,
    24520,
    24480,
    true
  );

  const impulse = analysis.impulseAttribution;
  assert.ok(impulse, 'Impulse attribution must be generated');
  assert.strictEqual(impulse.causeType, 'SECTOR_ROTATION_BALANCED', 'Must classify as SECTOR_ROTATION_BALANCED');
  assert.ok(impulse.grossPoints > 40, `Gross points must be substantial (>40), got ${impulse.grossPoints}`);
});

console.log(`\n===============================================================`);
console.log(`🎉 ALL ${testsPassed}/${testsPassed} IMPULSE ATTRIBUTION TESTS PASSED SUCCESSFULLY!`);
console.log(`===============================================================\n`);
