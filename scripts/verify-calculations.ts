import assert from 'assert';
import { NIFTY_50_STOCKS_DATA, buildNifty50Analysis } from '../lib/engine/nifty50Constituents';
import { BANK_NIFTY_STOCKS_DATA, buildBankNiftyAnalysis } from '../lib/engine/bankNiftyConstituents';
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

// -------------------------------------------------------------
// TEST 11: Turnover Flow & Volume Breadth Synthesis
// -------------------------------------------------------------
runTest('Turnover Flow & Volume Breadth computes institutional rupee flow and 5th confirmation signal', () => {
  const analysis = buildNifty50Analysis();
  const ad = analysis.advancesDeclines;

  assert.ok(typeof ad.totalTurnoverCr === 'number' && ad.totalTurnoverCr > 0, 'Total turnover must be positive');
  assert.ok(typeof ad.advancingTurnoverCr === 'number' && ad.advancingTurnoverCr >= 0);
  assert.ok(typeof ad.decliningTurnoverCr === 'number' && ad.decliningTurnoverCr >= 0);
  assert.ok(
    Math.abs(ad.advancingVolumePct + ad.decliningVolumePct - 100.0) < 0.2,
    `Advancing (${ad.advancingVolumePct}%) and Declining (${ad.decliningVolumePct}%) turnover must sum to 100%`
  );
  assert.ok(['STRONG_ACCUMULATION', 'MODERATE_INFLOW', 'NEUTRAL_FLOW', 'MODERATE_OUTFLOW', 'HEAVY_DISTRIBUTION'].includes(ad.volumeConviction));

  // Verify 5th confirmation signal
  const volSignal = analysis.prediction.confirmationSignals.find(s => s.id === 'VOLUME_TURNOVER_CONFIRMATION');
  assert.ok(volSignal, 'VOLUME_TURNOVER_CONFIRMATION signal must exist in prediction levels');
  assert.strictEqual(volSignal.weight, 0.20, 'Volume signal must have 0.20 institutional weight');
  assert.ok(['CONFIRMED', 'DIVERGENT', 'NEUTRAL'].includes(volSignal.status));

  // Verify weights across all 5 confirmation signals sum strictly to 1.00
  const totalSignalWeight = analysis.prediction.confirmationSignals.reduce((sum, s) => sum + s.weight, 0);
  assert.ok(Math.abs(totalSignalWeight - 1.00) < 0.001, `Signal weights must sum strictly to 1.00, got ${totalSignalWeight}`);
});

// -------------------------------------------------------------
// TEST 12: Microstructure Volume Surge Anomaly Detection
// -------------------------------------------------------------
runTest('Anomaly scanner flags institutional VOLUME_SURGE when RVOL >= 1.8x with price change', () => {
  const sampleStocks = [
    {
      symbol: 'TATASTEEL',
      name: 'Tata Steel Ltd.',
      sector: 'Metals & Mining',
      weight: 1.37,
      price: 180,
      changePct: 1.8,
      prevClose: 176.8,
      pointImpact: 6.2,
      relativeVolume: 2.5, // 2.5x RVOL institutional surge
      volume: 105000000,
      avgVolume: 42000000,
      turnoverCr: 1890,
      trend: 'MODERATE_BULL' as const
    }
  ];

  const sampleSectors = [
    {
      name: 'Metals & Mining',
      weight: 4.45,
      stockCount: 1,
      advances: 1,
      declines: 0,
      unchanged: 0,
      weightedReturn: 1.8,
      pointImpact: 6.2,
      trend: 'BULLISH' as const,
      dominantStock: 'TATASTEEL',
      stocks: []
    }
  ];

  const alerts = scanMicrostructureAnomalies(sampleStocks, sampleSectors);
  const surgeAlert = alerts.find(a => a.type === 'VOLUME_SURGE');
  assert.ok(surgeAlert, 'Must flag VOLUME_SURGE alert');
  assert.strictEqual(surgeAlert.symbol, 'TATASTEEL');
  assert.strictEqual(surgeAlert.volumeMultiplier, 2.5);
  assert.ok(surgeAlert.headline.includes('Volume Surge'));
});

// -------------------------------------------------------------
// TEST 13: Time-Adjusted Volume Ratio & Institutional U-Curve
// -------------------------------------------------------------
runTest('getIntradayExpectedVolumeRatio strictly handles session boundaries, weekends, and U-curve', () => {
  const { getIntradayExpectedVolumeRatio } = require('../lib/engine/nifty50Constituents');

  // Weekend (Sunday 11:30 AM IST) -> Must be 1.00 (completed session)
  const sunday = new Date('2026-11-01T06:00:00.000Z');
  assert.strictEqual(getIntradayExpectedVolumeRatio(sunday), 1.00, 'Weekend must return 1.00');

  // Pre-market (Tuesday 08:30 AM IST) -> Must be 1.00 (prior day session complete)
  const preMarket = new Date('2026-11-03T03:00:00.000Z');
  assert.strictEqual(getIntradayExpectedVolumeRatio(preMarket), 1.00, 'Pre-market must return 1.00');

  // Post-market (Tuesday 16:00 PM IST) -> Must be 1.00 (session complete)
  const postMarket = new Date('2026-11-03T10:30:00.000Z');
  assert.strictEqual(getIntradayExpectedVolumeRatio(postMarket), 1.00, 'Post-market must return 1.00');

  // Opening burst (Tuesday 09:15 AM IST) -> 0.08 minimum
  const marketOpen = new Date('2026-11-03T03:45:00.000Z');
  assert.strictEqual(getIntradayExpectedVolumeRatio(marketOpen), 0.08, 'Market open 09:15 must return 0.08');

  // Morning continuation (Tuesday 10:00 AM IST, elapsed 45m) -> 0.25 (25%)
  const morning10 = new Date('2026-11-03T04:30:00.000Z');
  assert.strictEqual(Number(getIntradayExpectedVolumeRatio(morning10).toFixed(2)), 0.25, '10:00 AM IST must return 0.25');

  // Midday lull (Tuesday 11:00 AM IST, elapsed 105m) -> 0.40 (40%)
  const midday11 = new Date('2026-11-03T05:30:00.000Z');
  assert.strictEqual(Number(getIntradayExpectedVolumeRatio(midday11).toFixed(2)), 0.40, '11:00 AM IST must return 0.40');

  // Afternoon sprint start (Tuesday 13:45 PM IST, elapsed 270m) -> 0.70 (70%)
  const afternoon1345 = new Date('2026-11-03T08:15:00.000Z');
  assert.strictEqual(Number(getIntradayExpectedVolumeRatio(afternoon1345).toFixed(2)), 0.70, '13:45 PM IST must return 0.70');
});

// -------------------------------------------------------------
// TEST 14: Sudden Impulse Attribution & Microstructure Cause Classification
// -------------------------------------------------------------
runTest('Impulse Attribution accurately isolates heavyweight culprit and attaches direct verification links', () => {
  const spotPrevClose = 24500.0;
  const updates = NIFTY_50_STOCKS_DATA.map((s) => ({
    symbol: s.symbol,
    price: s.symbol === 'RELIANCE' ? s.price * 1.025 : s.price,
    changePct: s.symbol === 'RELIANCE' ? 2.5 : 0.0,
    prevClose: s.price,
    volume: s.symbol === 'RELIANCE' ? 25000000 : 1000000
  }));

  const analysis = buildNifty50Analysis(
    updates,
    24560,
    14.0,
    60.0,
    spotPrevClose,
    spotPrevClose,
    24560,
    spotPrevClose,
    true
  );

  const impulse = analysis.impulseAttribution;
  assert.ok(impulse, 'Impulse attribution must be generated');
  assert.strictEqual(impulse.causeType, 'SINGLE_STOCK_CULPRIT', 'Must identify RELIANCE as single-stock culprit');
  assert.strictEqual(impulse.culprit?.symbol, 'RELIANCE', 'Culprit must be RELIANCE');
  assert.ok(impulse.actionLinks.length >= 3, 'Must provide 3 regulatory/news inspection links');
  assert.ok(impulse.actionLinks.some(l => l.url.includes('RELIANCE')), 'Link URL must encode RELIANCE symbol');
});

// -------------------------------------------------------------
// TEST 15: Microstructure Safety Governor Integrates with Confirmation Engine
// -------------------------------------------------------------
runTest('Microstructure Safety Governor detects Single-Stock Trap, clamps confidence & flags warning', () => {
  const spotPrevClose = 24500.0;
  const updates = NIFTY_50_STOCKS_DATA.map((s) => ({
    symbol: s.symbol,
    price: s.symbol === 'RELIANCE' ? s.price * 1.025 : s.price,
    changePct: s.symbol === 'RELIANCE' ? 2.5 : 0.0,
    prevClose: s.price,
    volume: s.symbol === 'RELIANCE' ? 25000000 : 1000000
  }));

  const analysis = buildNifty50Analysis(
    updates,
    24560,
    14.0,
    60.0,
    spotPrevClose,
    spotPrevClose,
    24560,
    spotPrevClose,
    true
  );

  const safety = analysis.prediction.microstructureSafety;
  assert.ok(safety, 'MicrostructureSafety must exist on prediction');
  assert.strictEqual(safety.trapDetected, true, 'Trap must be detected when single stock moves index');
  assert.strictEqual(safety.status, 'FAKEMOVE_WARNING', 'Status must be FAKEMOVE_WARNING');
  assert.strictEqual(safety.culpritSymbol, 'RELIANCE', 'Culprit symbol must be RELIANCE');
  assert.ok(safety.governorPenalty > 0, 'Governor penalty must be applied');
  assert.ok(analysis.prediction.confidencePct <= 48, `Confidence must be clamped under 48%, got ${analysis.prediction.confidencePct}%`);
  assert.ok(analysis.prediction.direction !== 'STRONG_BULLISH', 'Direction must not report STRONG_BULLISH under fakeout trap');

  // Verify Signal 1 (HEAVYWEIGHT_ALIGNMENT) flagged skew
  const top5Sig = analysis.prediction.confirmationSignals.find(s => s.id === 'HEAVYWEIGHT_ALIGNMENT');
  assert.ok(top5Sig, 'HEAVYWEIGHT_ALIGNMENT signal must exist');
  assert.strictEqual(top5Sig.status, 'DIVERGENT', 'Signal 1 must be DIVERGENT when single stock carries top 5 alone');
  assert.ok(top5Sig.details.includes('SKEWED'), 'Signal 1 details must mention SKEWED');
});

// -------------------------------------------------------------
// TEST 16: Bank Nifty Microstructure Safety Governor Integration
// -------------------------------------------------------------
runTest('Bank Nifty Microstructure Governor catches single-bank trap and penalizes confidence', () => {
  const spotPrevClose = 51200.0;
  const updates = BANK_NIFTY_STOCKS_DATA.map((s) => ({
    symbol: s.symbol,
    price: s.symbol === 'HDFCBANK' ? s.price * 1.03 : s.price,
    changePct: s.symbol === 'HDFCBANK' ? 3.0 : 0.0,
    prevClose: s.price,
    volume: s.symbol === 'HDFCBANK' ? 50000000 : 2000000
  }));

  const analysis = buildBankNiftyAnalysis(
    updates,
    51450,
    14.5,
    250.0,
    spotPrevClose,
    spotPrevClose,
    51450,
    spotPrevClose,
    true
  );

  const safety = analysis.prediction.microstructureSafety;
  assert.ok(safety, 'MicrostructureSafety must exist on Bank Nifty prediction');
  assert.strictEqual(safety.trapDetected, true, 'Trap must be detected on Bank Nifty');
  assert.strictEqual(safety.status, 'FAKEMOVE_WARNING', 'Status must be FAKEMOVE_WARNING');
  assert.strictEqual(safety.culpritSymbol, 'HDFCBANK', 'Culprit must be HDFCBANK');
  assert.ok(analysis.prediction.confidencePct <= 48, 'Bank Nifty confidence must be clamped under 48%');

  const top3Sig = analysis.prediction.confirmationSignals.find(s => s.id === 'HEAVYWEIGHT_ALIGNMENT');
  assert.ok(top3Sig, 'Big-3 Heavyweights Hegemony signal must exist');
  assert.strictEqual(top3Sig.status, 'DIVERGENT', 'Signal 1 must be DIVERGENT when HDFCBANK carries alone');
});

// -------------------------------------------------------------
// TEST 17: Single-Stock Skew with Dispersed Positive Peers (Concentration Dominance)
// -------------------------------------------------------------
runTest('Governor detects single-stock skew even when multiple peer heavyweights have minor positive drift', () => {
  const spotPrevClose = 24500.0;
  const updates = NIFTY_50_STOCKS_DATA.map((s) => {
    if (s.symbol === 'RELIANCE') {
      return { symbol: s.symbol, price: s.price * 1.03, changePct: 3.0, prevClose: s.price, volume: 20000000 };
    }
    if (s.symbol === 'TCS') {
      // Minor positive drift (0.05%) that does not constitute broad confirmation
      return { symbol: s.symbol, price: s.price * 1.0005, changePct: 0.05, prevClose: s.price, volume: 1000000 };
    }
    if (s.symbol === 'HDFCBANK' || s.symbol === 'ICICIBANK' || s.symbol === 'INFY') {
      return { symbol: s.symbol, price: s.price * 0.995, changePct: -0.5, prevClose: s.price, volume: 1000000 };
    }
    return { symbol: s.symbol, price: s.price, changePct: 0.0, prevClose: s.price, volume: 1000000 };
  });

  const analysis = buildNifty50Analysis(
    updates,
    24540,
    14.0,
    40.0,
    spotPrevClose,
    spotPrevClose,
    24540,
    spotPrevClose,
    true
  );

  const safety = analysis.prediction.microstructureSafety;
  assert.ok(safety, 'Safety must exist');
  assert.strictEqual(safety.trapDetected, true, 'Trap must be flagged even with 2 positive stocks in top 5');
  assert.strictEqual(safety.culpritSymbol, 'RELIANCE', 'Culprit must be RELIANCE');

  const top5Sig = analysis.prediction.confirmationSignals.find(s => s.id === 'HEAVYWEIGHT_ALIGNMENT');
  assert.strictEqual(top5Sig?.status, 'DIVERGENT', 'Top 5 must be DIVERGENT due to concentration dominance');
  assert.ok(top5Sig?.details.includes('SKEWED'), 'Details must highlight SKEWED condition');
});

// -------------------------------------------------------------
// TEST 18: Compound Risk Handling (Single-Stock Skew in Thin Air Pocket)
// -------------------------------------------------------------
runTest('Compound Risk (Single-Stock Skew + Dry Market RVOL) escalates to CRITICAL with 40% penalty', () => {
  const spotPrevClose = 24500.0;
  // Set all stocks volume to extremely low (dry market RVOL < 0.8x)
  const updates = NIFTY_50_STOCKS_DATA.map((s) => ({
    symbol: s.symbol,
    price: s.symbol === 'RELIANCE' ? s.price * 1.025 : s.price,
    changePct: s.symbol === 'RELIANCE' ? 2.5 : 0.0,
    prevClose: s.price,
    volume: 50000 // Very dry volume (< 0.2x normal ADV)
  }));

  const analysis = buildNifty50Analysis(
    updates,
    24560,
    14.0,
    60.0,
    spotPrevClose,
    spotPrevClose,
    24560,
    spotPrevClose,
    true
  );

  const safety = analysis.prediction.microstructureSafety;
  assert.ok(safety, 'Safety must exist');
  assert.strictEqual(safety.trapDetected, true, 'Trap must be detected');
  assert.strictEqual(safety.riskLevel, 'CRITICAL', 'Risk level must escalate to CRITICAL in thin air pocket');
  assert.strictEqual(safety.governorPenalty, 40, 'Governor penalty must escalate to 40%');
  assert.strictEqual(safety.liquidityState, 'THIN_AIR_POCKET', 'Liquidity state must reflect THIN_AIR_POCKET');
  assert.ok(safety.trapReason?.includes('Thin Depth'), 'Trap reason must explicitly state Thin Depth');
});

// -------------------------------------------------------------
// TEST 19: Clean Order Book State (No False Culprit)
// -------------------------------------------------------------
runTest('Clean Order Book generates HEALTHY status without spurious culprit symbol in UI state', () => {
  const spotPrevClose = 24500.0;
  // Uniform broad-based positive market
  const updates = NIFTY_50_STOCKS_DATA.map((s) => ({
    symbol: s.symbol,
    price: s.price * 1.008,
    changePct: 0.8,
    prevClose: s.price,
    volume: 5000000
  }));

  const analysis = buildNifty50Analysis(
    updates,
    24696,
    13.0,
    196.0,
    spotPrevClose,
    spotPrevClose,
    24696,
    spotPrevClose,
    true
  );

  const safety = analysis.prediction.microstructureSafety;
  assert.ok(safety, 'Safety must exist');
  assert.strictEqual(safety.trapDetected, false, 'No trap should be detected on broad rally');
  assert.strictEqual(safety.status, 'HEALTHY', 'Status must be HEALTHY');
  assert.strictEqual(safety.riskLevel, 'LOW', 'Risk level must be LOW');
  assert.strictEqual(safety.governorPenalty, 0, 'Governor penalty must be 0');
  assert.strictEqual(safety.culpritSymbol, undefined, 'culpritSymbol must be undefined when no trap active');
  assert.strictEqual(safety.culpritPctOfMove, undefined, 'culpritPctOfMove must be undefined when no trap active');
});

console.log('\n===============================================================');
console.log(`🎉 ALL ${testsPassed}/${testsPassed} VERIFICATION TESTS PASSED SUCCESSFULLY!`);
console.log('===============================================================\n');
