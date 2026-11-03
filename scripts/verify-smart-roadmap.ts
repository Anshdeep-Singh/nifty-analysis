import assert from 'assert';
import { buildSmartMoneyRoadmap, analyzeGapRegime } from '../lib/engine/smartMoneyRoadmap';

console.log('Testing Smart Money Roadmap & Gap Structure Engine...\n');

// 1. Test Gap Up Scenario (like yesterday's +370 pt gap up)
const spotPrice = 23810.85;
const prevClose = 23440.80;
const dayOpen = 23800.00;
const dayHigh = 23845.00;
const dayLow = 23780.00;
const vix = 15.72;

const gapAnalysis = analyzeGapRegime(spotPrice, dayOpen, prevClose, dayHigh, dayLow);
assert.strictEqual(gapAnalysis.hasGap, true, 'Should detect gap');
assert.strictEqual(gapAnalysis.gapType, 'GAP_UP', 'Should detect GAP_UP');
assert.strictEqual(gapAnalysis.regime, 'GAP_RUNAWAY', 'Holding above Day Open should be GAP_RUNAWAY');
assert.strictEqual(gapAnalysis.gapSupportPrice, dayOpen, 'Gap support should anchor to Day Open');
assert.strictEqual(gapAnalysis.gapFillTargetPrice, prevClose, 'Gap fill target should anchor to Prev Close');
console.log('✅ [PASS] Gap Analysis accurately identified +359 pt GAP_UP, holding above Day Open');

// 2. Test Smart Money Roadmap Levels
const roadmap = buildSmartMoneyRoadmap({
  spotPrice,
  prevClose,
  dayOpen,
  dayHigh,
  dayLow,
  vix
});

// Check that tactical stop-loss is close (15-35 pts), NOT 236 pts away!
const slPrice = roadmap.actionSignal.invalidationPrice!;
const slDistance = spotPrice - slPrice;
console.log(`Spot: ₹${spotPrice}, Tactical SL Invalidation: ₹${slPrice} (Distance: ${slDistance.toFixed(1)} pts)`);
assert(slDistance < 50, `Tactical SL must be tight (under 50 pts), got ${slDistance} pts`);
assert(slDistance > 10, `Tactical SL must have cushion (above 10 pts), got ${slDistance} pts`);
console.log('✅ [PASS] Tactical Stop-Loss is tight and actionable (under 50 pts, not 236 pts abyss)');

// Check that macro 1-sigma ceiling & floor are anchored to Day Open
assert.strictEqual(roadmap.macro1SigmaUpper, Number((dayOpen + roadmap.dailyExpectedMovePts).toFixed(1)));
assert.strictEqual(roadmap.macro1SigmaLower, Number((dayOpen - roadmap.dailyExpectedMovePts).toFixed(1)));
console.log('✅ [PASS] Macro 1-Sigma envelope anchored to session open, preventing floating drift');

console.log('\n🎉 ALL SMART MONEY ROADMAP TESTS PASSED!');
