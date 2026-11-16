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
    airPocketVol: 0.55,
    airPocketSpread: 1.45,
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
    if (timeframe === '1min' && m.spread < cfg.minSpreadPts) {
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
    const lookbackStart = Math.max(0, i - 12);

    // Look for previous retests of resistance (swing high within 0.15% or 8 points)
    let priorResistanceTouchIdx = -1;
    let priorSupportTouchIdx = -1;

    for (let j = i - 1; j >= lookbackStart; j--) {
      const prev = candles[j];
      const prevM = barMetrics[j];

      // Resistance test: Highs close to each other
      const highDiff = Math.abs(c.high - prev.high);
      const isNearHigh = highDiff <= Math.max(4, c.high * 0.0015);
      if (isNearHigh && prevM.upperWickPct >= 0.40 && priorResistanceTouchIdx === -1) {
        priorResistanceTouchIdx = j;
      }

      // Support test: Lows close to each other
      const lowDiff = Math.abs(c.low - prev.low);
      const isNearLow = lowDiff <= Math.max(4, c.low * 0.0015);
      if (isNearLow && prevM.lowerWickPct >= 0.40 && priorSupportTouchIdx === -1) {
        priorSupportTouchIdx = j;
      }
    }

    // A. Supply Absorption Check (Retesting Resistance with Shrinking Wicks)
    if (priorResistanceTouchIdx !== -1) {
      const priorM = barMetrics[priorResistanceTouchIdx];
      const wickShrank = m.upperWickPct <= 0.30 && m.upperWickPct < priorM.upperWickPct * 0.65;
      const strongClose = m.clv >= 0.35;
      const sustainedVol = m.volumeRatio >= 0.90;

      if (wickShrank && strongClose && sustainedVol) {
        pattern = 'PASSIVE_ABSORPTION_BREAKOUT';
        label = 'MBP: Supply Absorption Breakout';
        bias = 'BULLISH';
        isAnomaly = true;
        sequenceStage = 2;
        badgeColor = 'bg-cyan-950/90 text-cyan-300 border-cyan-400/60';
        narrative = `MBP Absorption: Upper rejection wick shrank from ${(priorM.upperWickPct * 100).toFixed(0)}% to ${(m.upperWickPct * 100).toFixed(0)}% at resistance with a strong close (CLV +${m.clv}) and sustained volume (${m.volumeRatio}x SMA). Passive limit sellers are exhausted; bullish breakout imminent.`;
        mbpSequenceDetected = true;
      }
    }

    // B. Demand Absorption Check (Retesting Support with Shrinking Wicks)
    if (!mbpSequenceDetected && priorSupportTouchIdx !== -1) {
      const priorM = barMetrics[priorSupportTouchIdx];
      const wickShrank = m.lowerWickPct <= 0.30 && m.lowerWickPct < priorM.lowerWickPct * 0.65;
      const weakClose = m.clv <= -0.35;
      const sustainedVol = m.volumeRatio >= 0.90;

      if (wickShrank && weakClose && sustainedVol) {
        pattern = 'PASSIVE_ABSORPTION_BREAKOUT';
        label = 'MBP: Demand Absorption Breakdown';
        bias = 'BEARISH';
        isAnomaly = true;
        sequenceStage = 2;
        badgeColor = 'bg-cyan-950/90 text-cyan-300 border-cyan-400/60';
        narrative = `MBP Absorption: Lower rejection wick shrank from ${(priorM.lowerWickPct * 100).toFixed(0)}% to ${(m.lowerWickPct * 100).toFixed(0)}% at support with a weak close (CLV ${m.clv}) and sustained volume (${m.volumeRatio}x SMA). Passive limit buyers are exhausted; bearish breakdown imminent.`;
        mbpSequenceDetected = true;
      }
    }

    // =========================================================================
    // STANDARD VSA CLASSIFICATION (TIMEFRAME-CALIBRATED)
    // =========================================================================
    if (!mbpSequenceDetected) {
      // 1. AIR POCKET SPIKE / FALSE BREAKOUT (Wide spread, dry volume)
      if (m.spreadRatio >= cfg.airPocketSpread && m.volumeRatio <= cfg.airPocketVol) {
        pattern = 'AIR_POCKET_SPIKE';
        label = isBull ? 'Air Pocket Spike (Bull Trap)' : 'Air Pocket Drop (Bear Trap)';
        bias = 'TRAP_WARNING';
        isAnomaly = true;
        badgeColor = 'bg-rose-950/90 text-rose-300 border-rose-500/50';
        narrative = `Wide price spread (${m.spreadRatio}x ATR) formed on dry volume (${m.volumeRatio}x 20-SMA). Market makers swept thin limit orders without genuine institutional buying. High probability of a snapback trap.`;
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
          if (compSpread < cfg.minSpreadPts * 1.5) {
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
