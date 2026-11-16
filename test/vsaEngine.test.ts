import { classifyCandleVsa } from '../lib/engine/vsaEngine';
import { CandleBar } from '../lib/types';

function createMockCandle(
  timestamp: number,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number
): CandleBar {
  return {
    timestamp,
    time: '10:00',
    date: '2026-11-16',
    open,
    high,
    low,
    close,
    volume
  };
}

// Generate 20 baseline bars with constant spread 10 and volume 1000
function generateBaseline(count = 20, spread = 10, vol = 1000): CandleBar[] {
  const candles: CandleBar[] = [];
  for (let i = 0; i < count; i++) {
    candles.push(createMockCandle(1000 + i * 60, 24000, 24000 + spread, 24000, 24000 + spread / 2, vol));
  }
  return candles;
}

function runTests() {
  console.log('--- RUNNING VSA & MBP TIMEFRAME TESTS ---');

  // TEST 1: 1-minute noise suppression on small tick spread (< 2.5 pts)
  {
    const base = generateBaseline(20, 10, 1000);
    // Add 1m candle with 60% upper wick, but tiny 1.5 pt spread
    const microNoiseCandle = createMockCandle(2260, 24000, 24001.5, 24000, 24000.4, 2100);
    const result1m = classifyCandleVsa([...base, microNoiseCandle], '1min');
    const lastBar = result1m[result1m.length - 1];

    if (lastBar.vsa?.pattern !== 'NORMAL_AUCTION' && lastBar.vsa !== undefined) {
      console.error('FAIL Test 1: 1m micro-tick should be suppressed as NORMAL_AUCTION, got:', lastBar.vsa?.pattern);
      process.exit(1);
    }
    console.log('PASS Test 1: 1m micro-tick noise properly suppressed');
  }

  // TEST 2: 15-minute sensitivity (Volume 1.36x, Spread 0.70x) triggers INSTITUTIONAL_ABSORPTION
  {
    const base = generateBaseline(20, 30, 5000);
    // 15m bar with narrow spread (20 vs 30 ATR = 0.67x) and volume 6800 (1.36x)
    const abs15m = createMockCandle(3000, 24000, 24020, 24000, 24010, 6800);
    const result15m = classifyCandleVsa([...base, abs15m], '15min');
    const lastBar = result15m[result15m.length - 1];

    if (lastBar.vsa?.pattern !== 'INSTITUTIONAL_ABSORPTION') {
      console.error('FAIL Test 2: 15m should detect INSTITUTIONAL_ABSORPTION on 1.36x volume, got:', lastBar.vsa?.pattern);
      process.exit(1);
    }
    console.log('PASS Test 2: 15m activates INSTITUTIONAL_ABSORPTION on realistic volume');
  }

  // TEST 3: 1-hour sensitivity (Air pocket spike: Spread 1.20x, Volume 0.80x)
  {
    const base = generateBaseline(20, 80, 20000);
    // 1h bar with wide upward spread (98 vs 80 ATR = 1.22x) and dry volume 16000 (0.80x)
    const airPocket1h = createMockCandle(4000, 24000, 24098, 24000, 24095, 16000);
    const result1h = classifyCandleVsa([...base, airPocket1h], '1hr');
    const lastBar = result1h[result1h.length - 1];

    if (lastBar.vsa?.pattern !== 'AIR_POCKET_SPIKE') {
      console.error('FAIL Test 3: 1h should detect AIR_POCKET_SPIKE on 1.22x spread & 0.80x vol, got:', lastBar.vsa?.pattern);
      process.exit(1);
    }
    console.log('PASS Test 3: 1h activates AIR_POCKET_SPIKE on realistic thresholds');
  }

  // TEST 3B: Air Pocket Downward Drop (Liquidity Vacuum, NOT a Bear Trap)
  {
    const base = generateBaseline(20, 10, 1000);
    // Downward drop: Open 24018, High 24018, Low 24000, Close 24001 (Spread 18 vs 10 ATR = 1.8x), dry volume 350 (0.35x)
    const dropCandle = createMockCandle(4000, 24018, 24018, 24000, 24001, 350);
    const resultDrop = classifyCandleVsa([...base, dropCandle], '1min');
    const lastBar = resultDrop[resultDrop.length - 1];

    if (lastBar.vsa?.pattern !== 'AIR_POCKET_DROP') {
      console.error('FAIL Test 3B: Downward air pocket should be AIR_POCKET_DROP, got:', lastBar.vsa?.pattern);
      process.exit(1);
    }
    if (lastBar.vsa?.bias !== 'BEARISH') {
      console.error('FAIL Test 3B: Downward air pocket bias should be BEARISH (liquidity vacuum), got:', lastBar.vsa?.bias);
      process.exit(1);
    }
    if (lastBar.vsa?.label?.includes('Bear Trap')) {
      console.error('FAIL Test 3B: Downward air pocket should NOT be called a Bear Trap, got:', lastBar.vsa?.label);
      process.exit(1);
    }
    console.log('PASS Test 3B: Downward air pocket accurately classified as AIR_POCKET_DROP (Liquidity Vacuum, BEARISH)');
  }

  // TEST 3C: 1-minute Air Pocket Sub-Threshold Spread Noise Gate (< 6.0 pts)
  {
    const base = generateBaseline(20, 2.5, 1000);
    // 1m candle with spread 4.5 pts (> 1.6x ATR of 2.5) on low volume 300 (0.3x), but spread < 6.0 pts
    const noiseDropCandle = createMockCandle(4000, 24004.5, 24004.5, 24000, 24000.5, 300);
    const resultNoise = classifyCandleVsa([...base, noiseDropCandle], '1min');
    const lastBar = resultNoise[resultNoise.length - 1];

    if (lastBar.vsa?.pattern !== 'NORMAL_AUCTION') {
      console.error('FAIL Test 3C: 1m bar with spread < 6.0 pts should be suppressed as NORMAL_AUCTION, got:', lastBar.vsa?.pattern);
      process.exit(1);
    }
    console.log('PASS Test 3C: 1m air pocket noise gate (< 6.0 pts) properly suppresses routine flickers');
  }

  // TEST 4: MBP Shrinking Wick Absorption Breakout Sequence
  {
    const base = generateBaseline(20, 20, 2000);
    // Touch 1 at 24500: Open 24485, High 24500, Low 24480, Close 24485 (Upper wick 15/20 = 75%), Vol 3200 (1.6x)
    const touch1 = createMockCandle(3000, 24485, 24500, 24480, 24485, 3200);
    // Pullback candle
    const pb = createMockCandle(3060, 24485, 24490, 24475, 24480, 1800);
    // Touch 2 at 24500: Open 24482, High 24500, Low 24480, Close 24497 (Upper wick 3/20 = 15%, CLV +0.70), Vol 2600 (1.3x)
    const touch2 = createMockCandle(3120, 24482, 24500, 24480, 24497, 2600);

    const result = classifyCandleVsa([...base, touch1, pb, touch2], '5min');
    const t1Class = result[result.length - 3].vsa;
    const t2Class = result[result.length - 1].vsa;

    console.log('Touch 1 VSA Pattern:', t1Class?.pattern, 'Label:', t1Class?.label);
    console.log('Touch 2 VSA Pattern:', t2Class?.pattern, 'Label:', t2Class?.label);

    if (t1Class?.pattern !== 'INITIAL_SUPPLY_REJECTION' && t1Class?.pattern !== 'CLIMAX_EXHAUSTION') {
      console.error('FAIL Test 4a: Touch 1 should be INITIAL_SUPPLY_REJECTION or CLIMAX_EXHAUSTION');
      process.exit(1);
    }

    if (t2Class?.pattern !== 'PASSIVE_ABSORPTION_BREAKOUT') {
      console.error('FAIL Test 4b: Touch 2 should be PASSIVE_ABSORPTION_BREAKOUT, got:', t2Class?.pattern);
      process.exit(1);
    }
    console.log('PASS Test 4: MBP shrinking wick sequence accurately triggers PASSIVE_ABSORPTION_BREAKOUT');
  }

  // TEST 5: Bank Nifty 1m Noise Gate Scaling (Threshold 6.0 pts)
  {
    const bnBase: CandleBar[] = [];
    for (let i = 0; i < 20; i++) {
      bnBase.push(createMockCandle(1000 + i * 60, 52000, 52025, 52000, 52012, 1000));
    }
    // Sub-noise bar on Bank Nifty: spread 4.0 points (< 6.0 points)
    const bnNoise = createMockCandle(2260, 52000, 52004, 52000, 52001, 2500);
    const resultBnNoise = classifyCandleVsa([...bnBase, bnNoise], '1min');
    const lastBar = resultBnNoise[resultBnNoise.length - 1];

    if (lastBar.vsa?.pattern !== 'NORMAL_AUCTION') {
      console.error('FAIL Test 5: Bank Nifty 4.0 pt spread on 1m should be suppressed as NORMAL_AUCTION, got:', lastBar.vsa?.pattern);
      process.exit(1);
    }
    console.log('PASS Test 5: Bank Nifty 1m noise gate properly scales threshold to 6.0 pts');
  }

  // TEST 6: MBP Demand Absorption Breakdown Sequence (Bearish)
  {
    const base = generateBaseline(20, 20, 2000);
    // Touch 1 at Support 24400: Open 24415, High 24420, Low 24400, Close 24415 (Lower wick 15/20 = 75%), Vol 3200 (1.6x)
    const touch1 = createMockCandle(3000, 24415, 24420, 24400, 24415, 3200);
    // Bounce candle
    const pb = createMockCandle(3060, 24415, 24425, 24410, 24420, 1800);
    // Touch 2 at Support 24400: Open 24418, High 24420, Low 24400, Close 24403 (Lower wick 3/20 = 15%, CLV -0.70), Vol 2600 (1.3x)
    const touch2 = createMockCandle(3120, 24418, 24420, 24400, 24403, 2600);

    const result = classifyCandleVsa([...base, touch1, pb, touch2], '5min');
    const t1Class = result[result.length - 3].vsa;
    const t2Class = result[result.length - 1].vsa;

    if (t1Class?.pattern !== 'INITIAL_DEMAND_DEFENSE') {
      console.error('FAIL Test 6a: Touch 1 should be INITIAL_DEMAND_DEFENSE, got:', t1Class?.pattern);
      process.exit(1);
    }

    if (t2Class?.pattern !== 'PASSIVE_ABSORPTION_BREAKOUT' || t2Class?.bias !== 'BEARISH') {
      console.error('FAIL Test 6b: Touch 2 should be PASSIVE_ABSORPTION_BREAKOUT with BEARISH bias, got:', t2Class?.pattern, t2Class?.bias);
      process.exit(1);
    }
    console.log('PASS Test 6: MBP demand absorption breakdown sequence accurately triggers BEARISH PASSIVE_ABSORPTION_BREAKOUT');
  }

  // TEST 7: Intermediate Breakout Invalidation (Price blew out resistance -> NOT absorption)
  {
    const base = generateBaseline(20, 20, 2000);
    const touch1 = createMockCandle(3000, 24485, 24500, 24480, 24485, 3200);
    // Massive intermediate breakout that blew through 24500 to 24650
    const blowout = createMockCandle(3060, 24485, 24650, 24480, 24640, 4000);
    // Subsequent retest of 24500 from above
    const retest = createMockCandle(3120, 24482, 24500, 24480, 24497, 2600);

    const result = classifyCandleVsa([...base, touch1, blowout, retest], '5min');
    const retestClass = result[result.length - 1].vsa;

    if (retestClass?.pattern === 'PASSIVE_ABSORPTION_BREAKOUT') {
      console.error('FAIL Test 7: Blown-out resistance should NOT trigger PASSIVE_ABSORPTION_BREAKOUT');
      process.exit(1);
    }
    console.log('PASS Test 7: Intermediate breakout correctly invalidates false absorption classification');
  }

  // TEST 8: Overnight Day Boundary Guard (Do not connect touches across days)
  {
    const base = generateBaseline(20, 20, 2000);
    const yesterdayTouch = {
      ...createMockCandle(1000, 24485, 24500, 24480, 24485, 3200),
      date: '2026-11-15'
    };
    const todayTouch = {
      ...createMockCandle(50000, 24482, 24500, 24480, 24497, 2600),
      date: '2026-11-16'
    };

    const result = classifyCandleVsa([...base, yesterdayTouch, todayTouch], '5min');
    const todayClass = result[result.length - 1].vsa;

    if (todayClass?.pattern === 'PASSIVE_ABSORPTION_BREAKOUT') {
      console.error('FAIL Test 8: Overnight touches should NOT connect as intraday absorption');
      process.exit(1);
    }
    console.log('PASS Test 8: Day boundary guard prevents false cross-session absorption sequences');
  }

  // TEST 9: Consecutive 1-Minute Chop Box Suppression (Replicating Yesterday's 13:00 Issue)
  {
    // Generate baseline bars trading between 23960 and 23975
    const base: CandleBar[] = [];
    for (let i = 0; i < 20; i++) {
      base.push(createMockCandle(1000 + i * 60, 23965, 23975, 23960, 23970, 1000));
    }
    // Bar 1: Strong push up and demand breakdown attempt at 24000
    const bar1 = createMockCandle(3000, 23995, 24005, 23990, 23992, 10500); // 10.5x vol
    // Bar 2: Immediate next bar pushes to 24010 with 60% upper wick on 4.33x vol -> INITIAL_SUPPLY_REJECTION
    const bar2 = createMockCandle(3060, 24002, 24010, 24002, 24005, 4330);
    // Bar 3: Immediate next bar (consecutive to Bar 2, no pullback) touches 24010 with 3.64x vol
    const bar3 = createMockCandle(3120, 24005, 24010, 24005, 24009, 3640);

    const result = classifyCandleVsa([...base, bar1, bar2, bar3], '1min');
    const b2Class = result[result.length - 2].vsa;
    const b3Class = result[result.length - 1].vsa;

    // Bar 3 MUST NOT trigger PASSIVE_ABSORPTION_BREAKOUT because Bar 2 was the immediate adjacent candle
    if (b3Class?.pattern === 'PASSIVE_ABSORPTION_BREAKOUT') {
      console.error('FAIL Test 9: Bar 3 in consecutive 1m chop should NOT trigger PASSIVE_ABSORPTION_BREAKOUT without pullback, got:', b3Class?.pattern);
      process.exit(1);
    }
    console.log('PASS Test 9: Consecutive 1-minute chop box correctly suppresses false absorption breakout');
  }

  // TEST 10: 0.94x Volume Resistance Test Triggers NO_DEMAND_TEST (Replicating Yesterday's 0.94x Cyan Bar)
  {
    const base = generateBaseline(20, 10, 1000);
    // Touch 1: Upper wick 60% at 24020 with 1.6x volume
    const touch1 = createMockCandle(3000, 24010, 24020, 24010, 24014, 1600);
    // Pullback to 24005
    const pb = createMockCandle(3060, 24014, 24015, 24005, 24008, 900);
    // Touch 2: Retests 24020 on dry 0.94x volume (940 vol vs 1000 SMA)
    const touch2 = createMockCandle(3120, 24008, 24020, 24008, 24018, 940);

    const result = classifyCandleVsa([...base, touch1, pb, touch2], '1min');
    const t2Class = result[result.length - 1].vsa;

    if (t2Class?.pattern !== 'NO_DEMAND_TEST') {
      console.error('FAIL Test 10: 0.94x volume test of resistance should be NO_DEMAND_TEST, got:', t2Class?.pattern);
      process.exit(1);
    }
    if (t2Class?.bias !== 'TRAP_WARNING') {
      console.error('FAIL Test 10: NO_DEMAND_TEST bias should be TRAP_WARNING, got:', t2Class?.bias);
      process.exit(1);
    }
    console.log('PASS Test 10: 0.94x volume test accurately classified as NO_DEMAND_TEST (Trap Warning)');
  }

  // TEST 11: 2-Stage Lifecycle (Absorption Test vs Confirmed Displacement Breakout)
  {
    const base = generateBaseline(20, 15, 1000);
    // Touch 1 at 24030 with 70% upper wick on 1.8x vol
    const touch1 = createMockCandle(3000, 24015, 24030, 24015, 24019, 1800);
    // Pullback to 24010
    const pb = createMockCandle(3060, 24019, 24020, 24010, 24012, 1000);
    // Touch 2: Upper wick shrinks to 26% (4/15), volume is 1.5x, but candle closes inside at 24026 (below 24030 extreme)
    const touch2Inside = createMockCandle(3120, 24015, 24030, 24015, 24026, 1500);

    const resultInside = classifyCandleVsa([...base, touch1, pb, touch2Inside], '5min');
    const t2InsideClass = resultInside[resultInside.length - 1].vsa;

    if (t2InsideClass?.pattern !== 'PASSIVE_ABSORPTION_TEST') {
      console.error('FAIL Test 11a: Inside-level absorption should be PASSIVE_ABSORPTION_TEST, got:', t2InsideClass?.pattern);
      process.exit(1);
    }
    if (t2InsideClass?.bias !== 'ABSORPTION') {
      console.error('FAIL Test 11a: Inside-level absorption bias should be ABSORPTION, got:', t2InsideClass?.bias);
      process.exit(1);
    }
    console.log('PASS Test 11a: Inside-level absorption correctly tagged as PASSIVE_ABSORPTION_TEST');

    // Touch 3: Candle closes above 24030 with displacement at 24033
    const touch3Breakout = createMockCandle(3180, 24023, 24035, 24020, 24033, 1600);
    const resultBreakout = classifyCandleVsa([...base, touch1, pb, touch3Breakout], '5min');
    const t3BreakoutClass = resultBreakout[resultBreakout.length - 1].vsa;

    if (t3BreakoutClass?.pattern !== 'PASSIVE_ABSORPTION_BREAKOUT') {
      console.error('FAIL Test 11b: Displaced close should be PASSIVE_ABSORPTION_BREAKOUT, got:', t3BreakoutClass?.pattern);
      process.exit(1);
    }
    if (t3BreakoutClass?.bias !== 'BULLISH') {
      console.error('FAIL Test 11b: Confirmed breakout bias should be BULLISH, got:', t3BreakoutClass?.bias);
      process.exit(1);
    }
    console.log('PASS Test 11b: Confirmed displaced close accurately triggers PASSIVE_ABSORPTION_BREAKOUT');
  }

  // TEST 12: VWAP Context Note Integration
  {
    const base = generateBaseline(20, 20, 2000);
    const touch1 = createMockCandle(3000, 24485, 24500, 24480, 24485, 3200);
    const pb = createMockCandle(3060, 24485, 24490, 24475, 24480, 1800);
    // Touch 2 has vwap at 24550 (trading at 24497 is below VWAP)
    const touch2 = {
      ...createMockCandle(3120, 24482, 24500, 24480, 24497, 2600),
      vwap: 24550
    };

    const result = classifyCandleVsa([...base, touch1, pb, touch2], '5min');
    const t2Class = result[result.length - 1].vsa;

    if (!t2Class?.narrative.includes('trading below intraday VWAP') && !t2Class?.narrative.includes('Trading below intraday VWAP')) {
      console.error('FAIL Test 12: Narrative should include VWAP context warning, got:', t2Class?.narrative);
      process.exit(1);
    }
    console.log('PASS Test 12: VWAP context note properly reflected in narrative');
  }

  console.log('--- ALL VSA & MBP UNIT TESTS PASSED ---');
}

runTests();
