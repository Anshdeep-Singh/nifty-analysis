import assert from 'assert';
import { NIFTY_50_STOCKS_DATA, buildNifty50Analysis } from '../lib/engine/nifty50Constituents';
import { buildSectorCoDependencyAnalysis } from '../lib/engine/sectorCoDependency';
import { scanMicrostructureAnomalies } from '../lib/engine/anomalyScanner';
import {
  sealData,
  unsealData,
  getNextKiteExpiry6AM,
  getKiteLoginUrl,
  setManualKiteToken
} from '../lib/kite/session';

console.log('===============================================================');
console.log('🧪 RUNNING DEEP VERIFICATION SUITE FOR NIFTY-ANALYSIS');
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
// TEST 1: Constituent Universe Completeness & Weight Precision
// -------------------------------------------------------------
runTest('Constituent Basket contains exactly 50 unique stocks summing to 100.00%', () => {
  assert.strictEqual(NIFTY_50_STOCKS_DATA.length, 50, `Expected 50 stocks, found ${NIFTY_50_STOCKS_DATA.length}`);
  const symbols = NIFTY_50_STOCKS_DATA.map(s => s.symbol);
  const uniqueSymbols = new Set(symbols);
  assert.strictEqual(uniqueSymbols.size, 50, 'Duplicate symbols detected in constituent list');

  const totalWeight = NIFTY_50_STOCKS_DATA.reduce((acc, s) => acc + s.weight, 0);
  assert.ok(Math.abs(totalWeight - 100.0) < 0.0001, `Weight sum must be 100.00%, got ${totalWeight.toFixed(4)}%`);
});

// -------------------------------------------------------------
// TEST 2: BaseSpot Anchoring & Point Contribution Integrity
// -------------------------------------------------------------
runTest('Point impacts anchor strictly to prevClose without fluctuating drift', () => {
  const spotPrevClose = 24500.0;
  const spotPrice = 24622.5; // +122.50 pts (+0.50%)

  // If every stock gains exactly +0.50%, the sum of points must equal exactly +122.50
  const uniformUpdates = NIFTY_50_STOCKS_DATA.map(s => ({
    symbol: s.symbol,
    price: s.price * 1.005,
    changePct: 0.50,
    prevClose: s.price
  }));

  const analysis = buildNifty50Analysis(
    uniformUpdates,
    spotPrice,
    14.5,
    122.50,
    spotPrevClose,
    24500,
    24630,
    24490,
    true
  );

  const sumPoints = analysis.analyzedStocks.reduce((sum, s) => sum + s.pointImpact, 0);
  const expectedPoints = spotPrevClose * (0.50 / 100); // 122.50
  assert.ok(
    Math.abs(sumPoints - expectedPoints) < 0.5,
    `Sum of point contributions (${sumPoints}) diverges from expected (${expectedPoints})`
  );
});

// -------------------------------------------------------------
// TEST 3: Zero-Contamination Live Guard
// -------------------------------------------------------------
runTest('Zero-Contamination Live Guard forces unquoted stocks to 0.00% in live feeds', () => {
  // Feed only quotes top 5 stocks
  const partialUpdates = [
    { symbol: 'RELIANCE', price: 1250, changePct: 1.5, prevClose: 1231.5 },
    { symbol: 'HDFCBANK', price: 700, changePct: 0.8, prevClose: 694.4 },
    { symbol: 'ICICIBANK', price: 1400, changePct: 0.5, prevClose: 1393.0 }
  ];

  const analysis = buildNifty50Analysis(
    partialUpdates,
    24550,
    14.0,
    undefined,
    24500,
    undefined,
    undefined,
    undefined,
    true // isLive = true
  );

  // Unquoted stock like INFY or TCS must have changePct === 0.00, NOT the snapshot percentage
  const infy = analysis.analyzedStocks.find(s => s.symbol === 'INFY');
  assert.ok(infy, 'INFY must exist');
  assert.strictEqual(infy.changePct, 0, 'Unquoted stock must not inherit snapshot change in live mode');
  assert.strictEqual(infy.pointImpact, 0, 'Unquoted stock point impact must be 0 in live mode');
});

// -------------------------------------------------------------
// TEST 4: Sector Aggregation & 100.00% Sector Coverage
// -------------------------------------------------------------
runTest('All 15 sectors aggregate cleanly and sector weights sum to 100.00%', () => {
  const analysis = buildNifty50Analysis();
  assert.strictEqual(analysis.sectors.length, 15, `Expected 15 official sectors, got ${analysis.sectors.length}`);

  const totalSectorWeight = analysis.sectors.reduce((sum, sec) => sum + sec.weight, 0);
  assert.ok(
    Math.abs(totalSectorWeight - 100.0) < 0.0001,
    `Total sector weight must sum to 100.00%, got ${totalSectorWeight}`
  );

  const totalStockCount = analysis.sectors.reduce((sum, sec) => sum + sec.stockCount, 0);
  assert.strictEqual(totalStockCount, 50, `Total stocks across sectors must be 50, got ${totalStockCount}`);
});

// -------------------------------------------------------------
// TEST 5: Continuous 1-Sigma Expected Move Formulation
// -------------------------------------------------------------
runTest('1-Sigma Expected Move scales continuously with Spot * VIX / sqrt(252)', () => {
  const spot = 24000;
  const vix = 15.874507866387544; // sqrt(252) ~ 15.8745 -> expected move should be exactly 24000 * 0.158745 / 15.8745 = 240 pts
  const analysis = buildNifty50Analysis([], spot, vix);
  const expected = Math.round(spot * (vix / 100) / Math.sqrt(252));
  assert.strictEqual(Math.round(analysis.expected1DayMove), expected, 'Expected 1-day move calculation distorted');
  assert.strictEqual(analysis.prediction.r1_sigma, spot + analysis.expected1DayMove);
  assert.strictEqual(analysis.prediction.s1_sigma, spot - analysis.expected1DayMove);
});

// -------------------------------------------------------------
// TEST 6: Sector Co-Dependency & Dispersion Engine
// -------------------------------------------------------------
runTest('Sector co-dependency correctly computes dispersion score and cross-sector spillovers', () => {
  const analysis = buildNifty50Analysis();
  const coDep = buildSectorCoDependencyAnalysis(analysis.sectors, 24500, 24500);

  assert.ok(coDep.dispersionScore >= 0 && coDep.dispersionScore <= 100, 'Dispersion score must be 0-100');
  assert.ok(coDep.sectors.length === 15, 'Must evaluate all 15 sectors');

  const financial = coDep.sectors.find(s => s.name === 'Financial Services');
  assert.ok(financial, 'Financial Services must exist');
  assert.ok(financial.spillovers.length > 0, 'Financial Services must have cross-sector spillover models');
  
  // Verify relationship types
  for (const sp of financial.spillovers) {
    assert.ok(typeof sp.expectedImpactPct === 'number');
    assert.ok(typeof sp.expectedPoints === 'number');
    assert.ok(['POSITIVE_CO_MOVE', 'CAPITAL_ROTATION_DEFENSE', 'DECOUPLED'].includes(sp.relationship));
  }
});

// -------------------------------------------------------------
// TEST 7: Anomaly Scanner & Actionable Links
// -------------------------------------------------------------
runTest('Anomaly scanner flags extreme drift and attaches valid NSE and Google Finance links', () => {
  const sampleStocks = [
    {
      symbol: 'RELIANCE',
      name: 'Reliance Industries Ltd.',
      sector: 'Oil Gas & Consumable Fuels',
      weight: 7.30,
      price: 1300,
      changePct: 4.5, // Extreme bull drift (> 2.2%)
      prevClose: 1244,
      pointImpact: 32.8,
      trend: 'STRONG_BULL' as const
    },
    {
      symbol: 'HDFCBANK',
      name: 'HDFC Bank Ltd.',
      sector: 'Financial Services',
      weight: 9.95,
      price: 680,
      changePct: -0.2,
      prevClose: 681.4,
      pointImpact: -2.0,
      trend: 'NEUTRAL' as const
    }
  ];

  const sampleSectors = [
    {
      name: 'Oil Gas & Consumable Fuels',
      weight: 9.0,
      stockCount: 1,
      advances: 1,
      declines: 0,
      unchanged: 0,
      weightedReturn: 4.5,
      pointImpact: 32.8,
      trend: 'BULLISH' as const,
      dominantStock: 'RELIANCE',
      stocks: []
    },
    {
      name: 'Financial Services',
      weight: 37.13,
      stockCount: 1,
      advances: 0,
      declines: 1,
      unchanged: 0,
      weightedReturn: -0.2,
      pointImpact: -2.0,
      trend: 'NEUTRAL' as const,
      dominantStock: 'HDFCBANK',
      stocks: []
    }
  ];

  const alerts = scanMicrostructureAnomalies(sampleStocks, sampleSectors);
  assert.ok(alerts.length >= 1, 'Must flag RELIANCE extreme drift anomaly');
  const relAlert = alerts.find(a => a.symbol === 'RELIANCE');
  assert.ok(relAlert, 'Must contain alert for RELIANCE');
  assert.strictEqual(relAlert.severity, 'CRITICAL');
  assert.strictEqual(relAlert.actionLinks.length, 3, 'Must contain 3 actionable links');
  assert.ok(relAlert.actionLinks.some(l => l.url.includes('nseindia.com')), 'Must include NSE filing link');
  assert.ok(relAlert.actionLinks.some(l => l.url.includes('google.com/finance')), 'Must include Google Finance link');
});

// -------------------------------------------------------------
// TEST 8: AES-256-GCM Cookie Sealing & Unsealing Integrity
// -------------------------------------------------------------
runTest('AES-256-GCM cookie seals and unseals data with cryptographic tamper resistance', () => {
  const payload = {
    apiKey: 'my_test_api_key_1234',
    accessToken: 'test_token_abcdef1234567890',
    userId: 'TEST01',
    userName: 'Quantitative Trader'
  };

  const sealed = sealData(payload);
  assert.ok(typeof sealed === 'string');
  assert.strictEqual(sealed.split('.').length, 3, 'Sealed payload must have 3 segments (iv.tag.ciphertext)');

  const unsealed = unsealData<typeof payload>(sealed);
  assert.deepStrictEqual(unsealed, payload, 'Unsealed payload must match original');

  // Tampered payload must return null
  const tampered = sealed.slice(0, -4) + 'zzzz';
  assert.strictEqual(unsealData(tampered), null, 'Tampered token must fail authentication');
});

// -------------------------------------------------------------
// TEST 9: Deterministic 06:00 AM IST Session Expiry
// -------------------------------------------------------------
runTest('getNextKiteExpiry6AM calculates strictly 06:00 AM IST (00:30 UTC)', () => {
  const expiryMs = getNextKiteExpiry6AM();
  const d = new Date(expiryMs);
  assert.strictEqual(d.getUTCHours(), 0, 'UTC Hour must be 0 (05:30 IST)');
  assert.strictEqual(d.getUTCMinutes(), 30, 'UTC Minute must be 30 (06:00 IST)');
  assert.ok(expiryMs > Date.now(), 'Expiry must be in the future');
});

// -------------------------------------------------------------
// TEST 10: Kite Connect Login URL Parameter Strictness (redirect_url)
// -------------------------------------------------------------
runTest('getKiteLoginUrl strictly uses redirect_url parameter (not redirect_uri)', () => {
  process.env.KITE_API_KEY = 'mock_api_key';
  const urlLocal = getKiteLoginUrl('http://localhost:3000/api/kite/callback');
  assert.ok(urlLocal.includes('redirect_url='), 'Must use redirect_url parameter');
  assert.ok(!urlLocal.includes('redirect_uri='), 'Must NOT use redirect_uri parameter');
  assert.ok(urlLocal.includes(encodeURIComponent('http://localhost:3000/api/kite/callback')));

  const urlProd = getKiteLoginUrl('https://nifty.anshdeepsingh.com/api/kite/callback');
  assert.ok(urlProd.includes(encodeURIComponent('https://nifty.anshdeepsingh.com/api/kite/callback')));
});

console.log('\n===============================================================');
console.log(`🎉 ALL ${testsPassed}/${testsPassed} VERIFICATION TESTS PASSED SUCCESSFULLY!`);
console.log('===============================================================\n');
