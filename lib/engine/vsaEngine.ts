import { CandleBar, VsaClassification, VsaPatternType } from '../types';

export type VsaTimeframe = '1min' | '5min' | '15min' | '1hr';

interface TimeframeThresholds {
  surgeVol: number;
  airPocketVol: number;
  airPocketSpread: number;
  absorptionVol: number;
  absorptionSpread: number;
  climaxVol: number;
  climaxWickPct: number;
  minSpreadPts: number;
}

// Timeframe-adaptive thresholds calibrated to variance scaling (sigma ~ 1 / sqrt(N))
const TF_THRESHOLDS: Record<VsaTimeframe, TimeframeThresholds> = {
  '1min': {
    surgeVol: 2.00,
    airPocketVol: 0.45,
    airPocketSpread: 1.60,
    absorptionVol: 2.20,
    absorptionSpread: 0.60,
    climaxVol: 1.80,
    climaxWickPct: 0.55,
    minSpreadPts: 2.5 // Suppresses tick-level noise on 1m
  },
  '5min': {
    surgeVol: 1.50,
    airPocketVol: 0.75,
    airPocketSpread: 1.35,
    absorptionVol: 1.70,
    absorptionSpread: 0.70,
    climaxVol: 1.50,
    climaxWickPct: 0.50,
    minSpreadPts: 5.0
  },
  '15min': {
    surgeVol: 1.25,
    airPocketVol: 0.85,
    airPocketSpread: 1.25,
    absorptionVol: 1.30,
    absorptionSpread: 0.80,
    climaxVol: 1.30,
    climaxWickPct: 0.45,
    minSpreadPts: 10.0
  },
  '1hr': {
    surgeVol: 1.15,
    airPocketVol: 0.90,
    airPocketSpread: 1.15,
    absorptionVol: 1.20,
    absorptionSpread: 0.85,
    climaxVol: 1.20,
    climaxWickPct: 0.40,
    minSpreadPts: 18.0
  }
};

/**
 * Calculates authentic cumulative Volume-Weighted Average Price (VWAP).
 * Anchored to the start of the trading day.
 * If volume is not available, calculates standard typical price cumulative average without fake volume weighting.
 */
export function calculateTrueVwap(candles: CandleBar[]): number[] {
  if (candles.length === 0) return [];

  const hasVolume = candles.some(c => typeof c.volume === 'number' && c.volume > 0);

  let cumPv = 0;
  let cumVolOrCount = 0;
  let currentDay = '';
  const vwapList: number[] = [];

  for (const c of candles) {
    // Reset VWAP at day transition (09:15 session open)
    if (c.date && c.date !== currentDay) {
      currentDay = c.date;
      cumPv = 0;
      cumVolOrCount = 0;
    }

    const typicalPrice = (c.high + c.low + c.close) / 3;

    if (hasVolume) {
      const vol = Math.max(0, c.volume || 0);
      cumPv += typicalPrice * vol;
      cumVolOrCount += vol;
      vwapList.push(cumVolOrCount > 0 ? Number((cumPv / cumVolOrCount).toFixed(2)) : Number(typicalPrice.toFixed(2)));
    } else {
      cumPv += typicalPrice;
      cumVolOrCount += 1;
      vwapList.push(Number((cumPv / cumVolOrCount).toFixed(2)));
    }
  }

  return vwapList;
}

/**
 * Evaluates Volume Spread Analysis (VSA) and Money Blueprint (MBP) sequential price action.
 * Incorporates timeframe-adaptive thresholds, 1m rolling composite filtering, and
 * consecutive-wick absorption tracking at key auction boundaries.
 */
export function classifyCandleVsa(candles: CandleBar[], timeframe: VsaTimeframe = '5min'): CandleBar[] {
  if (candles.length === 0) return [];

  // Strictly verify authentic non-zero volume is available
  const hasAuthenticVolume = candles.some(c => typeof c.volume === 'number' && c.volume > 0);
  if (!hasAuthenticVolume) {
    return candles.map(c => ({
      ...c,
      vsa: undefined
    }));
  }

  const count = candles.length;
  const cfg = TF_THRESHOLDS[timeframe] || TF_THRESHOLDS['5min'];

  // Detect whether candles represent Bank Nifty to adapt absolute point gates (e.g. minSpreadPts)
  const isBankNifty = candles.some(c => (c.close > 35000) || (c.open > 35000));
  const minSpread = isBankNifty ? cfg.minSpreadPts * 2.4 : cfg.minSpreadPts;

  // 1. Calculate Rolling 20-period True Range and Volume SMA on authentic volume
  const trList: number[] = [];
  for (let i = 0; i < count; i++) {
    const c = candles[i];
    const prevC = i > 0 ? candles[i - 1].close : c.open;
    const tr = Math.max(c.high - c.low, Math.abs(c.high - prevC), Math.abs(c.low - prevC));
    trList.push(tr);
  }

  const atr20: number[] = [];
  const volSma20: number[] = [];

  for (let i = 0; i < count; i++) {
    const windowStart = Math.max(0, i - 19);
    const windowLen = i - windowStart + 1;

    let trSum = 0;
    let volSum = 0;
    for (let j = windowStart; j <= i; j++) {
      trSum += trList[j];
      volSum += candles[j].volume || 0;
    }

    atr20.push(trSum / windowLen);
    volSma20.push(volSum / windowLen);
  }

  // Pre-calculate spread, wicks, and CLV across all bars for sequence awareness
  const barMetrics = candles.map((c, idx) => {
    const spread = Math.max(0.1, c.high - c.low);
    const upperWick = Math.max(0, c.high - Math.max(c.open, c.close));
    const lowerWick = Math.max(0, Math.min(c.open, c.close) - c.low);
    const upperWickPct = upperWick / spread;
    const lowerWickPct = lowerWick / spread;
    const rawClv = ((c.close - c.low) - (c.high - c.close)) / spread;
    const clv = Number(Math.max(-1.0, Math.min(1.0, rawClv)).toFixed(2));
    const currentVolSma = volSma20[idx];
    const volumeRatio = currentVolSma > 0 ? Number(((c.volume || 0) / currentVolSma).toFixed(2)) : 1.0;
    const currentAtr = Math.max(1, atr20[idx]);
    const spreadRatio = Number((spread / currentAtr).toFixed(2));

    return {
      spread,
      upperWick,
      lowerWick,
      upperWickPct,
      lowerWickPct,
      clv,
      volumeRatio,
      spreadRatio
    };
  });

  // 2. Classify Each Candle Bar with Timeframe Calibration & MBP Sequence Tracking
  const classifiedBars: CandleBar[] = [];

  for (let i = 0; i < count; i++) {
    const c = candles[i];
    const m = barMetrics[i];
    const vol = c.volume || 0;
    const currentVolSma = volSma20[i];

    // If this specific candle has no volume or SMA is zero, skip VSA classification
    if (vol <= 0 || currentVolSma <= 0) {
      classifiedBars.push({
        ...c,
        vsa: undefined
      });
      continue;
    }

    const isBull = c.close >= c.open;

    // NOISE GATE: On 1-minute chart, suppress micro-tick anomalies when absolute spread is tiny
    if (timeframe === '1min' && m.spread < minSpread) {
      classifiedBars.push({
        ...c,
        vsa: {
          pattern: 'NORMAL_AUCTION',
          label: 'Normal Auction (Micro Tick)',
          bias: 'NEUTRAL',
          timeframe,
          volumeRatio: m.volumeRatio,
          spreadRatio: m.spreadRatio,
          clv: m.clv,
          upperWickPct: Number(m.upperWickPct.toFixed(2)),
          lowerWickPct: Number(m.lowerWickPct.toFixed(2)),
          isAnomaly: false,
          badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
          narrative: 'Price movement is within sub-tick micro-spread noise.'
        }
      });
      continue;
    }

    let pattern: VsaPatternType = 'NORMAL_AUCTION';
    let label = 'Normal Auction';
    let bias: VsaClassification['bias'] = 'NEUTRAL';
    let isAnomaly = false;
    let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
    let narrative = 'Price and volume are trading within normal continuous auction parameters.';
    let sequenceStage = 1;

    // =========================================================================
    // MBP CHECK: CONSECUTIVE WICK SEQUENCE (ABSORPTION VS REJECTION)
    // =========================================================================
    let mbpSequenceDetected = false;
    const lookbackStart = Math.max(0, i - 18);

    // Look for previous retests of resistance or support within current session
    let priorResistanceTouchIdx = -1;
    let priorSupportTouchIdx = -1;
    let resistanceRetestCount = 1;
    let supportRetestCount = 1;

    // Tolerance scales dynamically with rolling ATR & spot price
    const currentAtr = Math.max(1, atr20[i]);
    const dynamicTol = Math.max(isBankNifty ? 7 : 3, Math.min(currentAtr * 0.45, c.high * 0.0012));

    // Calculate the swing range in the lookback window to check if market is in a dead flat chop box
    let localHigh = -Infinity;
    let localLow = Infinity;
    for (let k = lookbackStart; k <= i; k++) {
      if (candles[k].high > localHigh) localHigh = candles[k].high;
      if (candles[k].low < localLow) localLow = candles[k].low;
    }
    const localBracketSpread = localHigh - localLow;
    // Chop gate: On 1m, require minimum bracket spread (e.g. >= minSpread * 1.5) to avoid false ping-pong in micro-ranges
    const isBracketSpreadSufficient = timeframe !== '1min' || localBracketSpread >= minSpread * 1.5;

    if (isBracketSpreadSufficient) {
      for (let j = i - 1; j >= lookbackStart; j--) {
        const prev = candles[j];
        const prevM = barMetrics[j];

        // Session guard: Do not cross overnight gaps or large gaps (> 5 hours)
        if (c.date && prev.date && c.date !== prev.date) break;
        if (c.timestamp && prev.timestamp && Math.abs(c.timestamp - prev.timestamp) > 18000) break;

        // Separation guard: A retest cannot be the immediate adjacent bar (must have at least 1 intervening bar)
        if (i - j < 2) continue;

        // Resistance test: Highs close to each other within dynamic tolerance OR candle engages with resistance
        const highDiff = Math.abs(c.high - prev.high);
        const isNearHigh = highDiff <= dynamicTol || (c.high >= prev.high - dynamicTol && c.low <= prev.high + dynamicTol);
        if (isNearHigh && prevM.upperWickPct >= 0.40 && (prev.volume || 0) > 0 && prevM.volumeRatio >= 0.75) {
          // Check that intermediate bars didn't blow out resistance AND that there was an actual pullback between touches
          let intermediateBreach = false;
          let lowestBetween = Infinity;
          for (let k = j + 1; k < i; k++) {
            if (candles[k].high > Math.max(c.high, prev.high) + dynamicTol * 1.5) {
              intermediateBreach = true;
              break;
            }
            if (candles[k].low < lowestBetween) {
              lowestBetween = candles[k].low;
            }
          }

          // Pullback requirement: Price must have pulled back away from resistance between touches
          const minPullback = Math.max(isBankNifty ? 6 : 2.5, dynamicTol * 0.6);
          const hadPullback = (Math.min(c.high, prev.high) - lowestBetween) >= minPullback;

          if (!intermediateBreach && hadPullback) {
            if (priorResistanceTouchIdx === -1) {
              priorResistanceTouchIdx = j;
            } else {
              resistanceRetestCount++;
            }
          }
        }

        // Support test: Lows close to each other within dynamic tolerance OR candle engages with support
        const lowDiff = Math.abs(c.low - prev.low);
        const isNearLow = lowDiff <= dynamicTol || (c.low <= prev.low + dynamicTol && c.high >= prev.low - dynamicTol);
        if (isNearLow && prevM.lowerWickPct >= 0.40 && (prev.volume || 0) > 0 && prevM.volumeRatio >= 0.75) {
          let intermediateBreach = false;
          let highestBetween = -Infinity;
          for (let k = j + 1; k < i; k++) {
            if (candles[k].low < Math.min(c.low, prev.low) - dynamicTol * 1.5) {
              intermediateBreach = true;
              break;
            }
            if (candles[k].high > highestBetween) {
              highestBetween = candles[k].high;
            }
          }

          // Bounce requirement: Price must have bounced off support between touches
          const minBounce = Math.max(isBankNifty ? 6 : 2.5, dynamicTol * 0.6);
          const hadBounce = (highestBetween - Math.max(c.low, prev.low)) >= minBounce;

          if (!intermediateBreach && hadBounce) {
            if (priorSupportTouchIdx === -1) {
              priorSupportTouchIdx = j;
            } else {
              supportRetestCount++;
            }
          }
        }
      }
    }

    // A. Resistance Tests: No Demand vs. Supply Absorption
    if (priorResistanceTouchIdx !== -1) {
      const priorTouchCandle = candles[priorResistanceTouchIdx];
      const priorM = barMetrics[priorResistanceTouchIdx];
      const minAbsVol = timeframe === '1min' ? 1.30 : 1.10;
      const maxDryVol = timeframe === '1min' ? 0.80 : 0.85;

      // Check 1: Genuine No Demand Test (Dry Volume + Dominant Upper Rejection Wick / Weak Close)
      const isDryVolume = m.volumeRatio <= maxDryVol;
      const isUpperWickDominant = m.upperWickPct >= m.lowerWickPct;
      const hasRejectionAtHigh = isUpperWickDominant && (m.upperWickPct >= 0.30 || m.clv <= 0.20);
      const isContainedBelowResistance = c.close <= priorTouchCandle.high;

      if (isDryVolume && hasRejectionAtHigh && isContainedBelowResistance && m.spreadRatio < cfg.airPocketSpread) {
        pattern = 'NO_DEMAND_TEST';
        label = 'No Demand Test (Exhaustion Warning)';
        bias = 'TRAP_WARNING';
        isAnomaly = true;
        badgeColor = 'bg-amber-950/90 text-amber-300 border-amber-500/50';
        narrative = `No Demand Test: Price probed resistance (~₹${priorTouchCandle.high.toFixed(0)}) on dry volume (${m.volumeRatio}x 20-SMA) with rejection (upper wick ${(m.upperWickPct * 100).toFixed(0)}%, CLV ${m.clv > 0 ? '+' : ''}${m.clv}). Absence of institutional buying appetite confirms buyer exhaustion; high probability of downward rollover.`;
        mbpSequenceDetected = true;
      }
      // Check 2: High Volume Absorption with Shrinking Upper Wick
      else {
        const wickShrank = m.upperWickPct <= 0.30 && (m.upperWickPct <= 0.20 || m.upperWickPct < priorM.upperWickPct * 0.70);
        const strongClose = m.clv >= 0.35;
        const sustainedVol = m.volumeRatio >= minAbsVol;

        if (wickShrank && strongClose && sustainedVol) {
          // Strict displacement: close must be strictly greater than prior resistance high
          const isConfirmedBreakout = c.close > priorTouchCandle.high;

          if (isConfirmedBreakout) {
            pattern = 'PASSIVE_ABSORPTION_BREAKOUT';
            label = 'MBP: Supply Absorption Breakout';
            bias = 'BULLISH';
            isAnomaly = true;
            sequenceStage = resistanceRetestCount + 1;
            badgeColor = 'bg-cyan-950/90 text-cyan-300 border-cyan-400/60';
            narrative = `MBP Absorption Breakout: Upper rejection wick shrank from ${(priorM.upperWickPct * 100).toFixed(0)}% to ${(m.upperWickPct * 100).toFixed(0)}% at resistance (Touch #${sequenceStage}) with displaced close (₹${c.close.toFixed(1)} > ₹${priorTouchCandle.high.toFixed(1)}, CLV +${m.clv}) on heavy volume (${m.volumeRatio}x SMA). Limit sellers are exhausted; bullish breakout confirmed.`;
          } else {
            pattern = 'PASSIVE_ABSORPTION_TEST';
            label = 'MBP: Supply Absorption in Progress';
            bias = 'ABSORPTION';
            isAnomaly = true;
            sequenceStage = resistanceRetestCount + 1;
            badgeColor = 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40';
            narrative = `MBP Absorption Test: Upper rejection wick shrank from ${(priorM.upperWickPct * 100).toFixed(0)}% to ${(m.upperWickPct * 100).toFixed(0)}% at resistance on sustained volume (${m.volumeRatio}x SMA), but close remains inside the level. Limit sellers are being absorbed; awaiting confirmed breakout expansion.`;
          }
          mbpSequenceDetected = true;
        }
      }
    }

    // B. Support Tests: No Supply vs. Demand Absorption
    if (!mbpSequenceDetected && priorSupportTouchIdx !== -1) {
      const priorTouchCandle = candles[priorSupportTouchIdx];
      const priorM = barMetrics[priorSupportTouchIdx];
      const minAbsVol = timeframe === '1min' ? 1.30 : 1.10;
      const maxDryVol = timeframe === '1min' ? 0.80 : 0.85;

      // Check 1: Genuine No Supply Test (Dry Volume + Dominant Lower Defense Wick / Resilient Close)
      const isDryVolume = m.volumeRatio <= maxDryVol;
      const isLowerWickDominant = m.lowerWickPct >= m.upperWickPct;
      const hasDefenseAtLow = isLowerWickDominant && (m.lowerWickPct >= 0.30 || m.clv >= -0.20);
      const isContainedAboveSupport = c.close >= priorTouchCandle.low;

      if (isDryVolume && hasDefenseAtLow && isContainedAboveSupport && m.spreadRatio < cfg.airPocketSpread) {
        pattern = 'NO_SUPPLY_TEST';
        label = 'No Supply Test (Floor Defense)';
        bias = 'BULLISH';
        isAnomaly = true;
        badgeColor = 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50';
        narrative = `No Supply Test: Price probed support (~₹${priorTouchCandle.low.toFixed(0)}) on dry volume (${m.volumeRatio}x 20-SMA) with defense (lower wick ${(m.lowerWickPct * 100).toFixed(0)}%, CLV ${m.clv > 0 ? '+' : ''}${m.clv}). Absence of institutional selling pressure confirms seller exhaustion; high probability of upward bounce.`;
        mbpSequenceDetected = true;
      }
      // Check 2: High Volume Absorption with Shrinking Lower Wick
      else {
        const wickShrank = m.lowerWickPct <= 0.30 && (m.lowerWickPct <= 0.20 || m.lowerWickPct < priorM.lowerWickPct * 0.70);
        const weakClose = m.clv <= -0.35;
        const sustainedVol = m.volumeRatio >= minAbsVol;

        if (wickShrank && weakClose && sustainedVol) {
          // Strict displacement: close must be strictly less than prior support low
          const isConfirmedBreakdown = c.close < priorTouchCandle.low;

          if (isConfirmedBreakdown) {
            pattern = 'PASSIVE_ABSORPTION_BREAKOUT';
            label = 'MBP: Demand Absorption Breakdown';
            bias = 'BEARISH';
            isAnomaly = true;
            sequenceStage = supportRetestCount + 1;
            badgeColor = 'bg-rose-950/90 text-rose-300 border-rose-400/60';
            narrative = `MBP Absorption Breakdown: Lower rejection wick shrank from ${(priorM.lowerWickPct * 100).toFixed(0)}% to ${(m.lowerWickPct * 100).toFixed(0)}% at support (Touch #${sequenceStage}) with displaced close (₹${c.close.toFixed(1)} < ₹${priorTouchCandle.low.toFixed(1)}, CLV ${m.clv}) on heavy volume (${m.volumeRatio}x SMA). Limit buyers are exhausted; bearish breakdown confirmed.`;
          } else {
            pattern = 'PASSIVE_ABSORPTION_TEST';
            label = 'MBP: Demand Absorption in Progress';
            bias = 'ABSORPTION';
            isAnomaly = true;
            sequenceStage = supportRetestCount + 1;
            badgeColor = 'bg-rose-950/70 text-rose-300 border-rose-500/40';
            narrative = `MBP Demand Absorption Test: Lower rejection wick shrank from ${(priorM.lowerWickPct * 100).toFixed(0)}% to ${(m.lowerWickPct * 100).toFixed(0)}% at support on sustained volume (${m.volumeRatio}x SMA), but close remains inside the level. Limit buyers are being absorbed; awaiting confirmed breakdown expansion.`;
          }
          mbpSequenceDetected = true;
        }
      }
    }

    // =========================================================================
    // STANDARD VSA CLASSIFICATION (TIMEFRAME-CALIBRATED)
    // =========================================================================
    if (!mbpSequenceDetected) {
      // 1. AIR POCKET SPIKE / LIQUIDITY VACUUM DROP (Wide spread, dry volume)
      const minAirPocketSpread = isBankNifty ? 15.0 : 6.0;
      const isAirPocketSpreadSufficient = timeframe !== '1min' || m.spread >= minAirPocketSpread;

      if (isAirPocketSpreadSufficient && m.spreadRatio >= cfg.airPocketSpread && m.volumeRatio <= cfg.airPocketVol) {
        if (isBull) {
          pattern = 'AIR_POCKET_SPIKE';
          label = 'Air Pocket Spike (Bull Trap / No Demand)';
          bias = 'TRAP_WARNING';
          isAnomaly = true;
          badgeColor = 'bg-amber-950/90 text-amber-300 border-amber-500/50';
          narrative = `Wide upward spread (${m.spreadRatio}x ATR) formed on dry volume (${m.volumeRatio}x 20-SMA). Lack of institutional demand—market makers swept thin offers without genuine buying. High probability of upward exhaustion and snapback reversal downward.`;
        } else {
          pattern = 'AIR_POCKET_DROP';
          label = 'Air Pocket Drop (Liquidity Vacuum)';
          bias = 'BEARISH';
          isAnomaly = true;
          badgeColor = 'bg-rose-950/90 text-rose-300 border-rose-500/50';
          narrative = `Wide downward spread (${m.spreadRatio}x ATR) formed on dry volume (${m.volumeRatio}x 20-SMA). Price is freefalling through an order-book vacuum (absence of resting limit bids). This is NOT a bear trap or buyable dip—expect continued downward slide until resting institutional limit bids (POC floor) are reached.`;
        }
      }
      // 2. INSTITUTIONAL ABSORPTION / STOPPING VOLUME (Tight spread, massive volume)
      else if (m.spreadRatio <= cfg.absorptionSpread && m.volumeRatio >= cfg.absorptionVol) {
        pattern = 'INSTITUTIONAL_ABSORPTION';
        label = 'Institutional Absorption (Pin)';
        bias = 'ABSORPTION';
        isAnomaly = true;
        badgeColor = 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50';
        narrative = `Heavy volume surge (${m.volumeRatio}x 20-SMA) trapped in a narrow spread (${m.spreadRatio}x ATR). Institutional passive limit orders are absorbing aggressive market orders. Imminent pivot/reversal likely.`;
      }
      // 3. CLIMAX REJECTION / INITIAL DEFENSE (Heavy wick + high volume)
      else if (m.volumeRatio >= cfg.climaxVol && (m.upperWickPct >= cfg.climaxWickPct || m.lowerWickPct >= cfg.climaxWickPct)) {
        const isTopRejection = m.upperWickPct > m.lowerWickPct;
        const wickPct = Math.max(m.upperWickPct, m.lowerWickPct);

        // On 1m, check 3-bar composite filter to prevent single-tick flicker
        let confirm1m = true;
        if (timeframe === '1min' && i >= 2) {
          const c0 = candles[i - 2];
          const c1 = candles[i - 1];
          const compHigh = Math.max(c0.high, c1.high, c.high);
          const compLow = Math.min(c0.low, c1.low, c.low);
          const compSpread = compHigh - compLow;
          if (compSpread < minSpread * 1.5) {
            confirm1m = false;
          }
        }

        if (confirm1m) {
          pattern = isTopRejection ? 'INITIAL_SUPPLY_REJECTION' : 'INITIAL_DEMAND_DEFENSE';
          label = isTopRejection ? 'Initial Supply Rejection' : 'Initial Demand Defense';
          bias = isTopRejection ? 'BEARISH' : 'BULLISH';
          isAnomaly = true;
          badgeColor = isTopRejection
            ? 'bg-rose-950/90 text-rose-300 border-rose-500/50'
            : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50';
          narrative = `High volume rejection (${m.volumeRatio}x 20-SMA) with a prominent ${(wickPct * 100).toFixed(0)}% wick. Institutional orders defended this level on first touch.`;
        }
      }
      // 4. INSTITUTIONAL IMPULSE (Wide spread + heavy volume + directional close)
      else if (m.spreadRatio >= (cfg.airPocketSpread * 0.90) && m.volumeRatio >= cfg.surgeVol && Math.abs(m.clv) >= 0.35) {
        pattern = 'INSTITUTIONAL_IMPULSE';
        label = isBull ? 'Confirmed Bullish Impulse' : 'Confirmed Bearish Impulse';
        bias = isBull ? 'BULLISH' : 'BEARISH';
        isAnomaly = false;
        badgeColor = isBull
          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
          : 'bg-rose-950/90 text-rose-300 border-rose-500/50';
        narrative = `Strong directional expansion (${m.spreadRatio}x ATR) confirmed by heavy institutional participation (${m.volumeRatio}x 20-SMA, CLV ${m.clv > 0 ? '+' : ''}${m.clv}). Continuation favored.`;
      }
    }

    // Enrich narrative with VWAP trend context if VWAP is calculated
    if (typeof c.vwap === 'number' && c.vwap > 0) {
      if ((bias === 'BULLISH' || (bias === 'ABSORPTION' && priorResistanceTouchIdx !== -1)) && c.close < c.vwap) {
        narrative += ` (Context: Trading below intraday VWAP ₹${c.vwap.toFixed(1)} — counter-trend resistance overhead).`;
      } else if ((bias === 'BEARISH' || (bias === 'ABSORPTION' && priorSupportTouchIdx !== -1)) && c.close > c.vwap) {
        narrative += ` (Context: Trading above intraday VWAP ₹${c.vwap.toFixed(1)} — counter-trend support underneath).`;
      }
    }

    const vsa: VsaClassification = {
      pattern,
      label,
      bias,
      timeframe,
      volumeRatio: m.volumeRatio,
      spreadRatio: m.spreadRatio,
      clv: m.clv,
      upperWickPct: Number(m.upperWickPct.toFixed(2)),
      lowerWickPct: Number(m.lowerWickPct.toFixed(2)),
      sequenceStage,
      isAnomaly,
      badgeColor,
      narrative
    };

    classifiedBars.push({
      ...c,
      vsa
    });
  }

  return classifiedBars;
}
