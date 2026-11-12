import {
  SmartKeyLevel,
  SmartLevelType,
  TacticalActionSignal,
  GapRegimeAnalysis,
  SmartMoneyRoadmapState,
  CandleBar
} from '../types';

export interface CandleLike {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp?: number;
}

/**
 * Calculates Parkinson High-Low Volatility (1980)
 * Diffusion volatility estimator with 5x higher statistical efficiency than close-to-close returns.
 */
export function calculateParkinsonVolatility(candles: CandleLike[]): number {
  if (!candles || candles.length === 0) return 13.5;

  let sumSquares = 0;
  let validCount = 0;

  for (const c of candles) {
    if (c.high > 0 && c.low > 0 && c.high >= c.low) {
      const ratio = c.high / c.low;
      const logHL = Math.log(ratio);
      sumSquares += logHL * logHL;
      validCount++;
    }
  }

  if (validCount < 5) return 13.5;

  const constant = 4.0 * Math.LN2;
  const variancePerBar = sumSquares / (constant * validCount);
  const isMinuteBars = Math.sqrt(variancePerBar) < 0.0035;
  const barsPerDay = isMinuteBars ? 375 : 1;
  const varianceDaily = variancePerBar * barsPerDay;
  const sigmaDaily = Math.sqrt(varianceDaily);
  const annualVolPct = sigmaDaily * Math.sqrt(252) * 100.0;
  return Number(Math.max(6.0, Math.min(90.0, annualVolPct)).toFixed(1));
}

/**
 * 1D Density Clustering on Candle Bodies (Opens & Closes)
 * Identifies high-density horizontal price acceptance shelves.
 */
function extractBodyClusters(
  candles: CandleLike[],
  minPrice: number,
  maxPrice: number,
  radiusPts: number
): { center: number; touches: number; high: number; low: number }[] {
  const points: number[] = [];

  for (const c of candles) {
    if (!c || c.close <= 0) continue;
    if (c.open >= minPrice && c.open <= maxPrice) points.push(c.open);
    if (c.close >= minPrice && c.close <= maxPrice) points.push(c.close);
  }

  if (points.length === 0) return [];
  points.sort((a, b) => a - b);

  const clusters: { center: number; touches: number; high: number; low: number }[] = [];
  const maxBucketSpread = radiusPts * 2.5;

  let currentBucket: number[] = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p - currentBucket[currentBucket.length - 1] <= radiusPts && (p - currentBucket[0] <= maxBucketSpread)) {
      currentBucket.push(p);
    } else {
      if (currentBucket.length >= 2) {
        const avg = currentBucket.reduce((sum, v) => sum + v, 0) / currentBucket.length;
        clusters.push({
          center: Number(avg.toFixed(1)),
          touches: currentBucket.length,
          high: Math.max(...currentBucket),
          low: Math.min(...currentBucket)
        });
      }
      currentBucket = [p];
    }
  }

  if (currentBucket.length >= 2) {
    const avg = currentBucket.reduce((sum, v) => sum + v, 0) / currentBucket.length;
    clusters.push({
      center: Number(avg.toFixed(1)),
      touches: currentBucket.length,
      high: Math.max(...currentBucket),
      low: Math.min(...currentBucket)
    });
  }

  return clusters.sort((a, b) => b.touches - a.touches);
}

/**
 * Institutional Order Block Detection (Imbalance Displacement Shelves)
 */
function detectOrderBlocks(candles: CandleLike[], minDisplacementPts: number) {
  const supply: { top: number; bottom: number; displacement: number; candleIndex: number }[] = [];
  const demand: { top: number; bottom: number; displacement: number; candleIndex: number }[] = [];

  if (candles.length < 3) return { supply, demand };

  for (let i = 0; i < candles.length - 2; i++) {
    const c0 = candles[i];
    const c1 = candles[i + 1];
    const c2 = candles[i + 2];

    const drop = c0.close - Math.min(c1.close, c2.close);
    if (drop >= minDisplacementPts && (c1.close < c0.low || c2.close < c0.low)) {
      supply.push({
        top: Math.max(c0.high, c0.open),
        bottom: Math.min(c0.open, c0.close),
        displacement: Number(drop.toFixed(1)),
        candleIndex: i
      });
    }

    const surge = Math.max(c1.close, c2.close) - c0.close;
    if (surge >= minDisplacementPts && (c1.close > c0.high || c2.close > c0.high)) {
      demand.push({
        top: Math.max(c0.open, c0.close),
        bottom: Math.min(c0.low, c0.open),
        displacement: Number(surge.toFixed(1)),
        candleIndex: i
      });
    }
  }

  return { supply, demand };
}

/**
 * Analyzes Gap Structure and Gap Regime Invariants
 */
export function analyzeGapRegime(
  spotPrice: number,
  dayOpen: number,
  prevClose: number,
  dayHigh?: number,
  dayLow?: number,
  symbol: 'NIFTY' | 'BANKNIFTY' = 'NIFTY'
): GapRegimeAnalysis {
  const gapPts = Number((dayOpen - prevClose).toFixed(1));
  const gapPct = prevClose > 0 ? Number(((gapPts / prevClose) * 100).toFixed(2)) : 0;
  const minGapThreshold = symbol === 'BANKNIFTY'
    ? Math.max(80, Math.round(spotPrice * 0.0018)) // ~100 pts for Bank Nifty
    : Math.max(30, Math.round(spotPrice * 0.0014)); // ~35 pts for Nifty 50
  const isGapUp = gapPts >= minGapThreshold;
  const isGapDown = gapPts <= -minGapThreshold;
  const hasGap = Math.abs(gapPts) >= minGapThreshold;

  const gapType = isGapUp ? 'GAP_UP' : isGapDown ? 'GAP_DOWN' : 'FLAT_OPEN';
  const gapZone = {
    top: Math.max(dayOpen, prevClose),
    bottom: Math.min(dayOpen, prevClose)
  };

  let regime: 'GAP_RUNAWAY' | 'GAP_FADE' | 'CORRIDOR_CONTAINMENT' = 'CORRIDOR_CONTAINMENT';
  let verdict = 'Market opened flat within standard continuous auction range.';

  if (isGapUp) {
    if (spotPrice >= dayOpen) {
      regime = 'GAP_RUNAWAY';
      verdict = `Gap-up (+${gapPts} pts, +${gapPct}%) holding above Day Open (${dayOpen.toFixed(1)}). Institutional buyers defending opening range; runaway expansion favored.`;
    } else if (spotPrice < dayOpen && spotPrice > prevClose) {
      regime = 'GAP_FADE';
      verdict = `Gap-up (+${gapPts} pts) under pullback pressure below Day Open. Price retesting gap zone (${gapZone.bottom.toFixed(1)} - ${gapZone.top.toFixed(1)}).`;
    } else {
      regime = 'GAP_FADE';
      verdict = `Gap-up (+${gapPts} pts) fully filled at ${prevClose.toFixed(1)}. Bearish reversal pressure active.`;
    }
  } else if (isGapDown) {
    if (spotPrice <= dayOpen) {
      regime = 'GAP_RUNAWAY';
      verdict = `Gap-down (${gapPts} pts, ${gapPct}%) expanding below Day Open (${dayOpen.toFixed(1)}). Aggressive liquidation active.`;
    } else if (spotPrice <= prevClose) {
      regime = 'GAP_FADE';
      verdict = `Gap-down (${gapPts} pts) experiencing short covering bounce towards gap zone (${dayOpen.toFixed(1)} - ${prevClose.toFixed(1)}).`;
    } else {
      regime = 'GAP_FADE';
      verdict = `Gap-down (${gapPts} pts) fully reversed and filled! Spot reclaimed Prev Close (${prevClose.toFixed(1)}) and expanding higher (+${(spotPrice - prevClose).toFixed(1)} pts). Bullish gap reversal active.`;
    }
  }

  // Gap Support is Day Open on gap up, or yesterday close on gap down
  const gapSupportPrice = isGapUp ? dayOpen : prevClose;
  const gapFillTargetPrice = prevClose;

  return {
    hasGap,
    gapType,
    gapPts,
    gapPct,
    gapZone,
    gapSupportPrice,
    gapFillTargetPrice,
    regime,
    verdict
  };
}

export interface SmartMoneyRoadmapInput {
  spotPrice: number;
  prevClose: number;
  dayOpen?: number;
  dayHigh?: number;
  dayLow?: number;
  vix?: number;
  candles?: CandleLike[];
  symbol?: 'NIFTY' | 'BANKNIFTY';
}

/**
 * Builds the Complete Institutional Smart Money Roadmap & Tactical Levels
 */
export function buildSmartMoneyRoadmap(input: SmartMoneyRoadmapInput): SmartMoneyRoadmapState {
  const { spotPrice, prevClose } = input;
  const symbol = input.symbol || 'NIFTY';
  const isBankNifty = symbol === 'BANKNIFTY';
  const dayOpen = input.dayOpen && input.dayOpen > 0 ? input.dayOpen : spotPrice;
  const dayHigh = input.dayHigh && input.dayHigh > 0 ? input.dayHigh : Math.max(spotPrice, dayOpen);
  const dayLow = input.dayLow && input.dayLow > 0 ? input.dayLow : Math.min(spotPrice, dayOpen);

  const candles = input.candles || [];
  const effectiveVix = input.vix && input.vix > 5 && input.vix < 90
    ? input.vix
    : calculateParkinsonVolatility(candles);

  // SESSION ANCHOR INVARIANT:
  // Macro volatility bands anchor to session reference (Day Open or Prev Close)
  // so guidelines remain rock-solid throughout the day and never drift tick-by-tick!
  const anchorPrice = dayOpen > 0 ? dayOpen : prevClose;

  // Expected 1-day move calculation: Spot * (VIX / 100) / sqrt(252)
  const dailyExpectedMovePts = Number(((anchorPrice * (effectiveVix / 100)) / Math.sqrt(252)).toFixed(1));

  const macro1SigmaUpper = Number((anchorPrice + dailyExpectedMovePts).toFixed(1));
  const macro1SigmaLower = Number((anchorPrice - dailyExpectedMovePts).toFixed(1));
  const macro2SigmaUpper = Number((anchorPrice + 2 * dailyExpectedMovePts).toFixed(1));
  const macro2SigmaLower = Number((anchorPrice - 2 * dailyExpectedMovePts).toFixed(1));

  // Gap Analysis
  const gapAnalysis = analyzeGapRegime(spotPrice, dayOpen, prevClose, dayHigh, dayLow, symbol);

  // Extract candle clusters & order blocks
  const radius = Math.max(isBankNifty ? 25 : 10, Number((anchorPrice * 0.0006).toFixed(1)));
  const minDisplacement = Math.max(isBankNifty ? 60 : 25, dailyExpectedMovePts * 0.2);
  const clusters = extractBodyClusters(candles, anchorPrice - dailyExpectedMovePts * 1.2, anchorPrice + dailyExpectedMovePts * 1.2, radius);
  const { supply, demand } = detectOrderBlocks(candles, minDisplacement);

  // Generate Key Tactical Structural Levels
  const tacticalLevels: SmartKeyLevel[] = [];

  // LEVEL 1: MACRO EXPANSION CEILING (+1σ Daily Band)
  tacticalLevels.push({
    id: 'MACRO_CEILING_1SIGMA',
    price: macro1SigmaUpper,
    type: 'EXPANSION_CEILING',
    label: '1-σ Macro Ceiling',
    actionTag: 'Options Strangle Upper Wall • Tail Risk',
    description: `Macro statistical 68% daily close upper bound (+${dailyExpectedMovePts} pts from anchor). Exhaustion/fade territory.`,
    touches: 1,
    strength: 88,
    confluence: ['Daily Black-Scholes 1-σ Envelope', `India VIX: ${effectiveVix.toFixed(1)}`],
    distancePts: Number((macro1SigmaUpper - spotPrice).toFixed(1))
  });

  // LEVEL 2: INTRADAY PULLBACK RESISTANCE / RECENT HIGH
  // Anchored to structural candle clusters, Session High, or institutional strike intervals
  // Strictly prevents resistance targets from floating dynamically with live spot tick-by-tick!
  const step = isBankNifty ? 100 : 50;
  const clusterAbove = clusters
    .filter(c => c.center > spotPrice + (isBankNifty ? 10 : 5))
    .sort((a, b) => a.center - b.center)[0];

  let immediateResistance: number;
  let resistanceConfluence: string[];

  if (clusterAbove) {
    immediateResistance = clusterAbove.center;
    resistanceConfluence = ['Cluster Price Shelf', `5m Acceptance (${clusterAbove.touches} touches)`];
  } else if (dayHigh > spotPrice + (isBankNifty ? 15 : 8)) {
    immediateResistance = Number(dayHigh.toFixed(1));
    resistanceConfluence = ['Session High Shelf', 'Opening Range / Swing High'];
  } else {
    // Spot is testing or breaking session high: anchor to next round strike wall
    const baseHigh = Math.max(dayHigh, spotPrice);
    let nextStrike = Math.ceil((baseHigh + 1) / step) * step;
    if (nextStrike - spotPrice < (isBankNifty ? 20 : 10)) {
      nextStrike += step;
    }
    immediateResistance = Number(Math.min(nextStrike, macro1SigmaUpper).toFixed(1));
    resistanceConfluence = ['Institutional Strike Wall', 'Expansion Target 1'];
  }

  tacticalLevels.push({
    id: 'TACTICAL_RESISTANCE_1',
    price: Number(immediateResistance.toFixed(1)),
    type: 'PULLBACK_RESISTANCE',
    label: 'Immediate Tactical Resistance',
    actionTag: 'Intraday Target 1 • Trail Stop Here',
    description: 'First structural resistance shelf; break triggers momentum expansion towards session highs.',
    touches: clusters.filter(c => c.center > spotPrice).length || 2,
    strength: 78,
    confluence: resistanceConfluence,
    distancePts: Number((immediateResistance - spotPrice).toFixed(1))
  });

  // LEVEL 3: DECISION PIVOT / SESSION EQUILIBRIUM
  // Anchored to Day Open or Session Equilibrium
  tacticalLevels.push({
    id: 'DECISION_PIVOT',
    price: Number(anchorPrice.toFixed(1)),
    type: 'DECISION_PIVOT',
    label: 'Session Decision Pivot (Open)',
    actionTag: 'Bull / Bear Boundary • Trend Line in Sand',
    description: `Session Day Open (${dayOpen.toFixed(1)}). Above = Bulls in Control • Below = Gap Fade / Intraday Weakness.`,
    touches: 3,
    strength: 92,
    confluence: ['Session Open', 'Institutional Daily Reference'],
    distancePts: Number((spotPrice - anchorPrice).toFixed(1))
  });

  // LEVEL 4: IMMEDIATE TACTICAL SUPPORT / DIP BUYING SHELF (TIGHT STOP-LOSS)
  // Anchored to structural candle clusters, Day Open, Reclaimed Gap Base, or institutional strike shelf
  // Strictly prevents support and stop loss levels from drifting dynamically with live spot tick-by-tick!
  const clusterBelow = clusters
    .filter(c => c.center < spotPrice - (isBankNifty ? 10 : 5))
    .sort((a, b) => b.center - a.center)[0];

  let immediateSupportPrice: number;
  let supportConfluence: string[];

  if (clusterBelow) {
    immediateSupportPrice = clusterBelow.center;
    supportConfluence = ['Cluster Price Shelf', `5m Acceptance (${clusterBelow.touches} touches)`];
  } else if (gapAnalysis.hasGap && gapAnalysis.gapType === 'GAP_UP') {
    if (spotPrice > dayOpen) {
      immediateSupportPrice = Number(Math.max(dayLow, dayOpen).toFixed(1));
      supportConfluence = ['Day Open Support Shelf', 'Opening Range Base'];
    } else if (spotPrice > prevClose) {
      immediateSupportPrice = Number(prevClose.toFixed(1));
      supportConfluence = ['Previous Close', 'Gap Baseline Floor'];
    } else {
      immediateSupportPrice = Number(Math.min(dayLow, prevClose).toFixed(1));
      supportConfluence = ['Session Floor', 'Extended Liquidation Base'];
    }
  } else if (gapAnalysis.hasGap && gapAnalysis.gapType === 'GAP_DOWN') {
    if (spotPrice > prevClose) {
      // Bullish gap reversal: spot reclaimed prevClose!
      if (spotPrice - prevClose <= (isBankNifty ? 120 : 60)) {
        immediateSupportPrice = Number(prevClose.toFixed(1));
        supportConfluence = ['Reclaimed Prev Close', 'Bullish Gap Reversal Base'];
      } else {
        // Expanded well above prevClose: anchor to highest round strike shelf or prevClose
        const strikeShelf = Math.floor(spotPrice / step) * step;
        const midShelf = Number(((prevClose + dayHigh) / 2).toFixed(1));
        immediateSupportPrice = Number(Math.max(prevClose, strikeShelf > prevClose ? strikeShelf : midShelf).toFixed(1));
        supportConfluence = ['Institutional Strike Shelf', 'Intraday Demand Base'];
      }
    } else if (spotPrice >= dayOpen) {
      immediateSupportPrice = Number(dayOpen.toFixed(1));
      supportConfluence = ['Day Open Floor', 'Opening Range Support'];
    } else {
      immediateSupportPrice = Number(Math.min(dayLow, macro1SigmaLower).toFixed(1));
      supportConfluence = ['Session Low Floor', 'Macro Expansion Floor'];
    }
  } else {
    // Flat / Balanced Auction
    if (spotPrice > anchorPrice + (isBankNifty ? 25 : 12)) {
      immediateSupportPrice = Number(anchorPrice.toFixed(1));
      supportConfluence = ['Session Open Base', 'Daily Decision Pivot'];
    } else {
      const strikeFloor = Math.floor((spotPrice - 1) / step) * step;
      immediateSupportPrice = Number(Math.max(macro1SigmaLower, Math.min(dayLow, strikeFloor)).toFixed(1));
      supportConfluence = ['Structural Strike Floor', 'Demand Shelf'];
    }
  }

  tacticalLevels.push({
    id: 'TACTICAL_SUPPORT_1',
    price: Number(immediateSupportPrice.toFixed(1)),
    type: 'DIP_BUYING_SHELF',
    label: 'Immediate Tactical Support',
    actionTag: 'Long Invalidation SL • Structural Shelf',
    description: `Immediate structural support floor (${(spotPrice - immediateSupportPrice).toFixed(1)} pts away). Invalidation for longs.`,
    touches: clusters.filter(c => c.center < spotPrice).length || 2,
    strength: 84,
    confluence: supportConfluence,
    distancePts: Number((spotPrice - immediateSupportPrice).toFixed(1))
  });

  // LEVEL 5: GAP FILL ZONE / PREVIOUS CLOSE
  if (gapAnalysis.hasGap) {
    tacticalLevels.push({
      id: 'GAP_ZONE_LEVEL',
      price: Number(prevClose.toFixed(1)),
      priceHigh: gapAnalysis.gapZone.top,
      priceLow: gapAnalysis.gapZone.bottom,
      type: 'GAP_ZONE',
      label: `Gap Baseline (Prev Close)`,
      actionTag: 'Gap Fill Target • Major Reversal Pivot',
      description: `Yesterday's closing price (${prevClose.toFixed(1)}). Full gap fill level if Day Open fails.`,
      touches: 4,
      strength: 90,
      confluence: ['Previous Session Close', 'Full Gap Fill Boundary'],
      distancePts: Number((spotPrice - prevClose).toFixed(1))
    });
  }

  // LEVEL 6: MACRO EXPANSION FLOOR (-1σ Daily Band)
  tacticalLevels.push({
    id: 'MACRO_FLOOR_1SIGMA',
    price: macro1SigmaLower,
    type: 'EXPANSION_FLOOR',
    label: '1-σ Macro Floor',
    actionTag: 'Options Strangle Lower Wall • Tail Risk',
    description: `Macro statistical 68% daily close lower bound (-${dailyExpectedMovePts} pts from anchor). Capitulation/oversold zone.`,
    touches: 1,
    strength: 88,
    confluence: ['Daily Black-Scholes 1-σ Envelope', `India VIX: ${effectiveVix.toFixed(1)}`],
    distancePts: Number((spotPrice - macro1SigmaLower).toFixed(1))
  });

  // Sort tactical levels descending by price
  tacticalLevels.sort((a, b) => b.price - a.price);

  // Generate Tactical Action Signal & Invalidation Price
  let actionSignal: TacticalActionSignal;
  const isHoldingAboveOpen = spotPrice >= dayOpen;
  const stopLossCushion = isBankNifty ? 25 : 10;
  const stopLossPrice = Number((immediateSupportPrice - stopLossCushion).toFixed(1));

  if (gapAnalysis.gapType === 'GAP_UP') {
    if (isHoldingAboveOpen) {
      actionSignal = {
        status: 'SAFE_TO_BUY',
        headline: 'GAP-UP RUNAWAY CONFIRMED • BUY ON PULLBACK',
        detail: `Market holding above Day Open (${dayOpen.toFixed(1)}). Target: ${immediateResistance.toFixed(1)}. Tight SL: ${stopLossPrice.toFixed(1)} (Risk: ${(spotPrice - stopLossPrice).toFixed(1)} pts).`,
        badge: 'GAP DEFENDED',
        variant: 'emerald',
        invalidationPrice: stopLossPrice,
        triggerCondition: `Pullback near ${immediateSupportPrice.toFixed(1)} with bullish 5m candle confirmation.`
      };
    } else if (spotPrice >= prevClose) {
      actionSignal = {
        status: 'AWAIT_CONFIRMATION',
        headline: 'GAP RETEST IN PROGRESS • DO NOT CHASE',
        detail: `Spot broke below Day Open (${dayOpen.toFixed(1)}). Watching Gap Zone (${prevClose.toFixed(1)} - ${dayOpen.toFixed(1)}) for demand stabilization.`,
        badge: 'GAP RETEST',
        variant: 'amber',
        invalidationPrice: Number((prevClose - (isBankNifty ? 35 : 15)).toFixed(1)),
        triggerCondition: `Reclaim of ${dayOpen.toFixed(1)} on 5m close.`
      };
    } else {
      // Spot broke BELOW Prev Close: Gap is 100% FILLED and bears took over!
      actionSignal = {
        status: 'DO_NOT_BUY',
        headline: 'GAP REVERSED & SURRENDERED • BEARISH MOMENTUM',
        detail: `Gap-up fully surrendered. Spot broke below Prev Close (${prevClose.toFixed(1)}) and trending lower (-${(prevClose - spotPrice).toFixed(1)} pts). Rejection ceiling at ${immediateResistance.toFixed(1)}.`,
        badge: 'GAP REVERSAL BEAR',
        variant: 'rose',
        invalidationPrice: Number((prevClose + (isBankNifty ? 25 : 10)).toFixed(1)),
        triggerCondition: `Bounce failing near ${immediateResistance.toFixed(1)} on 5m close.`
      };
    }
  } else if (gapAnalysis.gapType === 'GAP_DOWN') {
    if (spotPrice <= dayOpen) {
      actionSignal = {
        status: 'DO_NOT_BUY',
        headline: 'GAP-DOWN LIQUIDATION ACTIVE • SHORT CARRY',
        detail: `Index expanding downward under Day Open (${dayOpen.toFixed(1)}). Do not fight the trend. Target: ${macro1SigmaLower.toFixed(1)}.`,
        badge: 'BEAR RUNAWAY',
        variant: 'rose',
        invalidationPrice: Number((dayOpen + (isBankNifty ? 35 : 15)).toFixed(1))
      };
    } else if (spotPrice <= prevClose) {
      actionSignal = {
        status: 'AWAIT_CONFIRMATION',
        headline: 'SHORT-COVERING RETEST IN GAP',
        detail: `Spot bounced above Day Open into gap zone. Look for rejection at ${prevClose.toFixed(1)}.`,
        badge: 'PULLBACK SHORT',
        variant: 'amber',
        invalidationPrice: Number((dayHigh + (isBankNifty ? 25 : 10)).toFixed(1))
      };
    } else {
      // Spot broke ABOVE Prev Close: Gap is 100% FILLED and bulls are expanding upward!
      actionSignal = {
        status: 'SAFE_TO_BUY',
        headline: 'GAP REVERSED & EXPANDING • BULLISH MOMENTUM',
        detail: `Gap-down fully filled. Spot reclaimed Prev Close (${prevClose.toFixed(1)}) and trending higher (+${(spotPrice - prevClose).toFixed(1)} pts). Dip buying shelf at ${immediateSupportPrice.toFixed(1)}.`,
        badge: 'GAP REVERSAL BULL',
        variant: 'emerald',
        invalidationPrice: stopLossPrice,
        triggerCondition: `Pullback holding near ${immediateSupportPrice.toFixed(1)} on 5m close.`
      };
    }
  } else {
    // Normal / Flat auction
    const distFromAnchor = Math.abs(spotPrice - anchorPrice);
    if (distFromAnchor > dailyExpectedMovePts * 0.8) {
      actionSignal = {
        status: 'DO_NOT_BUY',
        headline: '1-SIGMA BAND EXTENDED • HIGH MEAN REVERSION RISK',
        detail: `Spot is stretched near daily 1-σ band. Extrinsic volatility risk is high; avoid chasing breakout.`,
        badge: 'OVERSTRETCHED',
        variant: 'rose',
        invalidationPrice: stopLossPrice
      };
    } else {
      actionSignal = {
        status: 'SAFE_TO_BUY',
        headline: 'BALANCED INTRADAY AUCTION • TRADE SATELLITE LEVELS',
        detail: `Trade between Tactical Support (${immediateSupportPrice.toFixed(1)}) and Resistance (${immediateResistance.toFixed(1)}). Tight invalidation: ${stopLossPrice.toFixed(1)}.`,
        badge: 'STRUCTURE PLAY',
        variant: 'cyan',
        invalidationPrice: stopLossPrice
      };
    }
  }

  // Determine overall regime
  let regime = 'CORRIDOR_CONTAINMENT';
  let regimeTag = 'Standard 1-σ Corridor';
  let regimeDescription = 'Normal continuous auction within the 68% probability volatility envelope.';

  if (spotPrice > macro1SigmaUpper) {
    regime = 'BREAKOUT_EXPANSION';
    regimeTag = '1-σ Bullish Expansion';
    regimeDescription = 'Price has breached above the daily 1-sigma ceiling. High-momentum breakout mode active.';
  } else if (spotPrice < macro1SigmaLower) {
    regime = 'BREAKDOWN_EXPANSION';
    regimeTag = '1-σ Bearish Liquidation';
    regimeDescription = 'Price has broken below the daily 1-sigma floor. Severe capitulation mode active.';
  } else if (gapAnalysis.hasGap && gapAnalysis.regime === 'GAP_RUNAWAY') {
    regime = 'GAP_EXPANSION';
    regimeTag = gapAnalysis.gapType === 'GAP_UP' ? 'Gap-Up Runaway' : 'Gap-Down Runaway';
    regimeDescription = gapAnalysis.verdict;
  }

  return {
    symbol,
    spotPrice,
    anchorPrice,
    regime,
    regimeTag,
    regimeDescription,
    gapAnalysis,
    tacticalLevels,
    actionSignal,
    macro1SigmaUpper,
    macro1SigmaLower,
    macro2SigmaUpper,
    macro2SigmaLower,
    dailyExpectedMovePts
  };
}
