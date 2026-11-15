import { CandleBar, VsaClassification, VsaPatternType } from '../types';

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
 * Evaluates Volume Spread Analysis (VSA) across candle bars.
 * Categorizes bars into institutional flow states (Air Pocket Spikes, Absorption, Impulses).
 * Strictly requires authentic volume. If volume is not available, returns candles without synthetic VSA.
 */
export function classifyCandleVsa(candles: CandleBar[]): CandleBar[] {
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

  // 2. Classify Each Candle Bar
  return candles.map((c, idx) => {
    const vol = c.volume || 0;
    const currentVolSma = volSma20[idx];

    // If this specific candle has no volume or SMA is zero, skip VSA classification
    if (vol <= 0 || currentVolSma <= 0) {
      return {
        ...c,
        vsa: undefined
      };
    }

    const spread = Math.max(0.5, c.high - c.low);
    const currentAtr = Math.max(1, atr20[idx]);

    const spreadRatio = Number((spread / currentAtr).toFixed(2));
    const volumeRatio = Number((vol / currentVolSma).toFixed(2));

    // Close Location Value (CLV): -1.0 (closed at low) to +1.0 (closed at high)
    const rawClv = ((c.close - c.low) - (c.high - c.close)) / spread;
    const clv = Number(Math.max(-1.0, Math.min(1.0, rawClv)).toFixed(2));

    const isBull = c.close >= c.open;
    const upperWick = c.high - Math.max(c.open, c.close);
    const lowerWick = Math.min(c.open, c.close) - c.low;
    const upperWickPct = upperWick / spread;
    const lowerWickPct = lowerWick / spread;

    let pattern: VsaPatternType = 'NORMAL_AUCTION';
    let label = 'Normal Auction';
    let bias: VsaClassification['bias'] = 'NEUTRAL';
    let isAnomaly = false;
    let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
    let narrative = 'Price and volume are trading within normal continuous auction parameters.';

    // PATTERN 1: AIR POCKET SPIKE / FALSE BREAKOUT (Wide spread, dry volume)
    if (spreadRatio >= 1.35 && volumeRatio <= 0.75) {
      pattern = 'AIR_POCKET_SPIKE';
      label = isBull ? 'Air Pocket Spike (Bull Trap)' : 'Air Pocket Drop (Bear Trap)';
      bias = 'TRAP_WARNING';
      isAnomaly = true;
      badgeColor = 'bg-rose-950/90 text-rose-300 border-rose-500/50';
      narrative = `Wide price spread (${spreadRatio}x ATR) formed on dry volume (${volumeRatio}x 20-SMA). Market makers swept thin limit orders without genuine institutional buying. High probability of a snapback trap.`;
    }
    // PATTERN 2: INSTITUTIONAL ABSORPTION / STOPPING VOLUME (Tight spread, massive volume)
    else if (spreadRatio <= 0.70 && volumeRatio >= 1.70) {
      pattern = 'INSTITUTIONAL_ABSORPTION';
      label = 'Institutional Absorption (Pin)';
      bias = 'ABSORPTION';
      isAnomaly = true;
      badgeColor = 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50';
      narrative = `Heavy volume surge (${volumeRatio}x 20-SMA) trapped in a narrow spread (${spreadRatio}x ATR). Institutional passive limit orders are absorbing aggressive market orders. Imminent pivot/reversal likely.`;
    }
    // PATTERN 3: CLIMAX REJECTION / EXHAUSTION WICK (Heavy wick + high volume)
    else if (volumeRatio >= 1.50 && (upperWickPct >= 0.50 || lowerWickPct >= 0.50)) {
      pattern = 'CLIMAX_EXHAUSTION';
      const isTopRejection = upperWickPct > lowerWickPct;
      label = isTopRejection ? 'Buying Climax Rejection' : 'Selling Capitulation Wick';
      bias = isTopRejection ? 'BEARISH' : 'BULLISH';
      isAnomaly = true;
      badgeColor = 'bg-amber-950/90 text-amber-300 border-amber-500/50';
      narrative = `High volume rejection (${volumeRatio}x 20-SMA) with a prominent ${(Math.max(upperWickPct, lowerWickPct) * 100).toFixed(0)}% wick. Aggressive push was decisively rejected by contrary institutional liquidity.`;
    }
    // PATTERN 4: INSTITUTIONAL IMPULSE (Wide spread + heavy volume + strong close)
    else if (spreadRatio >= 1.25 && volumeRatio >= 1.45 && Math.abs(clv) >= 0.35) {
      pattern = 'INSTITUTIONAL_IMPULSE';
      label = isBull ? 'Confirmed Bullish Impulse' : 'Confirmed Bearish Impulse';
      bias = isBull ? 'BULLISH' : 'BEARISH';
      isAnomaly = false;
      badgeColor = isBull
        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
        : 'bg-rose-950/90 text-rose-300 border-rose-500/50';
      narrative = `Strong directional expansion (${spreadRatio}x ATR) confirmed by heavy institutional participation (${volumeRatio}x 20-SMA, CLV ${clv > 0 ? '+' : ''}${clv}). Continuation favored.`;
    }

    const vsa: VsaClassification = {
      pattern,
      label,
      bias,
      volumeRatio,
      spreadRatio,
      clv,
      isAnomaly,
      badgeColor,
      narrative
    };

    return {
      ...c,
      vsa
    };
  });
}
