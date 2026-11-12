import {
  Nifty50Stock,
  SectorAnalysis,
  AdvancesDeclinesSummary,
  ImpulseAttribution,
  CulpritStockDetail
} from '../types';

export interface ImpulseAttributionParams {
  indexSymbol: 'NIFTY' | 'BANKNIFTY';
  spotPrice: number;
  spotNetChange: number;
  spotPrevClose: number;
  vix: number;
  expected1DayMove: number;
  stocks: Nifty50Stock[];
  sectors: SectorAnalysis[];
  advancesDeclines: AdvancesDeclinesSummary;
}

/**
 * Sudden Impulse Attribution & Microstructure Liquidity Engine
 * 
 * Mathematical Model:
 * 1. Isolates instantaneous directional point impact: P_i = BaseSpot * (Weight / 100) * (ChangePct / 100)
 * 2. Computes Culprit Concentration Ratios (CR1, CR2) against gross and directional points
 * 3. Evaluates Relative Volume (RVOL) and aggregate constituent turnover to distinguish
 *    between single-stock catalyst, programmatic basket arbitrage, and thin limit order book slippage (air pockets).
 */
export function calculateImpulseAttribution({
  indexSymbol,
  spotPrice,
  spotNetChange,
  spotPrevClose,
  vix,
  expected1DayMove,
  stocks,
  sectors,
  advancesDeclines
}: ImpulseAttributionParams): ImpulseAttribution {
  const netPoints = Number(spotNetChange.toFixed(2));
  const absNetPoints = Math.abs(netPoints);

  // Compute gross points across all constituent vectors
  let grossPoints = 0;
  for (const s of stocks) {
    grossPoints += Math.abs(s.pointImpact);
  }
  grossPoints = Number(grossPoints.toFixed(2));

  // Volatility scaled velocity threshold (8% of daily 1-sigma move, clamped)
  const minVelocityFloor = indexSymbol === 'BANKNIFTY' ? 30 : 12;
  const velocityThreshold = Math.max(minVelocityFloor, Number((expected1DayMove * 0.08).toFixed(1)));

  // Direction classification
  let direction: ImpulseAttribution['direction'] = 'NEUTRAL_BALANCED';
  if (netPoints >= velocityThreshold) {
    direction = 'BULLISH_SURGE';
  } else if (netPoints <= -velocityThreshold) {
    direction = 'BEARISH_PLUNGE';
  }

  // Segregate positive vs negative point movers
  const positiveStocks = stocks
    .filter((s) => s.pointImpact > 0.01)
    .sort((a, b) => b.pointImpact - a.pointImpact);

  const negativeStocks = stocks
    .filter((s) => s.pointImpact < -0.01)
    .sort((a, b) => a.pointImpact - b.pointImpact); // ascending: largest negative first

  const totalPositivePoints = positiveStocks.reduce((sum, s) => sum + s.pointImpact, 0);
  const totalNegativePoints = negativeStocks.reduce((sum, s) => sum + Math.abs(s.pointImpact), 0);

  // Determine the directional leading cohort
  let leadingCohort = positiveStocks;
  let directionalPointsSum = Math.max(0.1, totalPositivePoints);

  if (direction === 'BEARISH_PLUNGE' || (direction === 'NEUTRAL_BALANCED' && totalNegativePoints > totalPositivePoints)) {
    leadingCohort = negativeStocks;
    directionalPointsSum = Math.max(0.1, totalNegativePoints);
  }

  const primaryStock = leadingCohort[0];
  const secondaryStock = leadingCohort[1];

  // Concentration Ratios (CR1, CR2)
  const primaryAbsImpact = primaryStock ? Math.abs(primaryStock.pointImpact) : 0;
  const secondaryAbsImpact = secondaryStock ? Math.abs(secondaryStock.pointImpact) : 0;

  const cr1 = directionalPointsSum > 0 ? (primaryAbsImpact / directionalPointsSum) * 100 : 0;
  const cr2 = directionalPointsSum > 0 ? ((primaryAbsImpact + secondaryAbsImpact) / directionalPointsSum) * 100 : cr1;

  const concentrationRatio1 = Number(cr1.toFixed(1));
  const concentrationRatio2 = Number(cr2.toFixed(1));

  // Percentage of Net Index Move
  const primaryPctOfNet = absNetPoints > 0.1 ? Number(((primaryAbsImpact / absNetPoints) * 100).toFixed(1)) : concentrationRatio1;
  const secondaryPctOfNet = absNetPoints > 0.1 && secondaryStock ? Number(((secondaryAbsImpact / absNetPoints) * 100).toFixed(1)) : 0;

  // Turnover-weighted Aggregate RVOL & Market Liquidity Depth
  let turnoverWeightedRvolSum = 0;
  let totalTurnoverWeight = 0;
  for (const s of stocks) {
    const weightTurnover = Math.max(1, s.turnoverCr ?? (s.price * (s.volume ?? 100000) / 1e7));
    const rvol = s.relativeVolume ?? 1.0;
    turnoverWeightedRvolSum += weightTurnover * rvol;
    totalTurnoverWeight += weightTurnover;
  }
  const aggregateRvol = totalTurnoverWeight > 0
    ? Number((turnoverWeightedRvolSum / totalTurnoverWeight).toFixed(2))
    : 1.0;

  let liquidityState: ImpulseAttribution['liquidityState'] = 'MODERATE_DEPTH';
  if (aggregateRvol < 0.80) {
    liquidityState = 'THIN_AIR_POCKET';
  } else if (aggregateRvol >= 1.30) {
    liquidityState = 'HEALTHY_DEPTH';
  }

  // Market Breadth Synchronization
  const totalMovers = advancesDeclines.advances + advancesDeclines.declines;
  const alignedMovers = netPoints >= 0 ? advancesDeclines.advances : advancesDeclines.declines;
  const marketBreadthSyncPct = totalMovers > 0
    ? Number(((alignedMovers / totalMovers) * 100).toFixed(1))
    : 50.0;

  // Cause Classification Rules
  let causeType: ImpulseAttribution['causeType'] = 'ORDERLY_DRIFT';
  let causeBadge = 'Orderly Flow';
  let headline = 'Balanced Multi-Stock Price Discovery';
  let verdict = 'Constituents are trading within standard dispersion bands without acute single-stock dislocations or liquidity vacuums.';
  let recommendation = 'NORMAL EXECUTION: Systematic risk models and Greeks guidelines apply.';

  // Check Sector Divergence Split (e.g. Bank vs IT divergence)
  const isSectorSplit = sectors.some((s) => s.pointImpact > 10) && sectors.some((s) => s.pointImpact < -10);

  // Single-stock condition: High concentration in top stock or top 2 stocks pulling the index
  const isSingleStockDislocation = Boolean(
    primaryStock &&
    (concentrationRatio1 >= 38 || concentrationRatio2 >= 58 || (primaryPctOfNet >= 45 && absNetPoints >= velocityThreshold * 0.5)) &&
    (primaryAbsImpact >= (indexSymbol === 'BANKNIFTY' ? 25 : 8) || (primaryStock.relativeVolume ?? 1.0) >= 1.4)
  );

  // Sector rotation condition: High gross churn with suppressed net drift (internal sector tug-of-war)
  // Operates only when single-stock concentration is not dominating
  const isSectorRotation = !isSingleStockDislocation && (
    (grossPoints >= (indexSymbol === 'BANKNIFTY' ? 60 : 25) && grossPoints > 2.0 * Math.max(1, absNetPoints)) ||
    (isSectorSplit && absNetPoints < velocityThreshold * 1.5)
  );

  // Vacuum / Thin liquidity condition
  const isThinVacuum = absNetPoints >= velocityThreshold && liquidityState === 'THIN_AIR_POCKET' && concentrationRatio1 < 50;

  // Basket sweep condition: Broadly uniform breadth with moderate/low concentration
  const isBasketSweep = marketBreadthSyncPct >= 70 && concentrationRatio2 <= 42 && absNetPoints >= velocityThreshold;

  if (isSingleStockDislocation && primaryStock) {
    causeType = 'SINGLE_STOCK_CULPRIT';
    causeBadge = 'Single-Stock Dislocation';
    const primaryRvol = (primaryStock.relativeVolume ?? 1.0).toFixed(1);
    const primaryImpactStr = `${primaryStock.pointImpact > 0 ? '+' : ''}${primaryStock.pointImpact.toFixed(1)} pts`;
    const remainingConstituentCount = Math.max(1, stocks.length - 1);
    headline = `${primaryStock.symbol} Driving ${primaryPctOfNet > 100 ? '>100' : primaryPctOfNet}% of Index Move (${primaryImpactStr}, ${primaryRvol}x Vol)`;
    verdict = `The index movement is heavily driven by ${primaryStock.name} (${primaryStock.symbol}), which accounts for ${primaryPctOfNet > 100 ? '>100' : primaryPctOfNet}% of the net point change. The remaining ${remainingConstituentCount} stocks are not broadly confirming this impulse.`;
    recommendation = `CAUTION (FAKEMOVE RISK): Do not chase index breakouts/breakdowns driven by single-stock skew. A reversal or exhaustion in ${primaryStock.symbol} will likely trigger an index snap-back.`;
  } else if (isSectorRotation) {
    causeType = 'SECTOR_ROTATION_BALANCED';
    causeBadge = 'Sector Capital Rotation';
    headline = `Internal Sector Tug-of-War (Gross: ${grossPoints.toFixed(0)} pts vs Net: ${netPoints.toFixed(0)} pts)`;
    verdict = `High constituent dispersion: gains in leading sectors are being directly absorbed by selling in lagging sectors. Strong stock-specific volatility, but muted directional index trend.`;
    recommendation = `RANGE / DELTA NEUTRAL: Favorable environment for short options carry and mean-reversion; naked directional trades will suffer from choppy whipsaws.`;
  } else if (isThinVacuum) {
    causeType = 'VACUUM_SLIPPAGE';
    causeBadge = 'Low-Depth Air Pocket';
    headline = `Thin Liquidity Index Slippage (${aggregateRvol.toFixed(2)}x Market RVOL)`;
    verdict = `Index moved ${absNetPoints.toFixed(1)} points despite dry constituent volume (${aggregateRvol.toFixed(2)}x normal run-rate). Market makers pulled passive limit orders, creating thin bid-ask air pockets that magnify point volatility.`;
    recommendation = `TIGHTEN SL: Low market depth produces sharp wicks and false triggers on minimal order flow. Widen execution buffers and avoid market orders.`;
  } else if (isBasketSweep) {
    causeType = 'BASKET_ARBITRAGE_SWEEP';
    causeBadge = 'Programmatic Basket Sweep';
    headline = `Institutional Index Basket Arbitrage (${marketBreadthSyncPct.toFixed(0)}% Breadth Sync)`;
    verdict = `Uniform institutional buying/selling across ${direction === 'BULLISH_SURGE' ? advancesDeclines.advances : advancesDeclines.declines} constituents with low stock-level concentration (CR2: ${concentrationRatio2}%). Consistent with Cash-Futures arbitrage algos or large index ETF basket rebalancing.`;
    recommendation = `RIDE TREND: High constituent synchrony indicates authentic multi-sector institutional participation. Look for continuation on pullbacks.`;
  }

  // Intensity resolution
  let intensity: ImpulseAttribution['intensity'] = 'LOW';
  if (absNetPoints >= expected1DayMove * 0.40 || (primaryStock && primaryAbsImpact >= (indexSymbol === 'BANKNIFTY' ? 100 : 30))) {
    intensity = 'EXTREME';
  } else if (absNetPoints >= expected1DayMove * 0.20 || (primaryStock && primaryAbsImpact >= (indexSymbol === 'BANKNIFTY' ? 60 : 18))) {
    intensity = 'HIGH';
  } else if (absNetPoints >= velocityThreshold) {
    intensity = 'MODERATE';
  }

  // Construct Culprit Stock Details
  let culprit: CulpritStockDetail | undefined = undefined;
  if (primaryStock) {
    culprit = {
      symbol: primaryStock.symbol,
      name: primaryStock.name,
      sector: primaryStock.sector,
      weight: primaryStock.weight,
      price: primaryStock.price,
      changePct: primaryStock.changePct,
      pointImpact: primaryStock.pointImpact,
      pctOfDirectionalMove: Number(cr1.toFixed(1)),
      pctOfNetIndexMove: primaryPctOfNet,
      relativeVolume: primaryStock.relativeVolume ?? 1.0,
      turnoverCr: primaryStock.turnoverCr ?? Number(((primaryStock.price * (primaryStock.volume ?? 100000)) / 1e7).toFixed(1)),
      volumeZScore: primaryStock.volumeZScore
    };
  }

  let secondaryCulprit: CulpritStockDetail | undefined = undefined;
  if (secondaryStock) {
    secondaryCulprit = {
      symbol: secondaryStock.symbol,
      name: secondaryStock.name,
      sector: secondaryStock.sector,
      weight: secondaryStock.weight,
      price: secondaryStock.price,
      changePct: secondaryStock.changePct,
      pointImpact: secondaryStock.pointImpact,
      pctOfDirectionalMove: Number(((secondaryAbsImpact / directionalPointsSum) * 100).toFixed(1)),
      pctOfNetIndexMove: secondaryPctOfNet,
      relativeVolume: secondaryStock.relativeVolume ?? 1.0,
      turnoverCr: secondaryStock.turnoverCr ?? Number(((secondaryStock.price * (secondaryStock.volume ?? 100000)) / 1e7).toFixed(1)),
      volumeZScore: secondaryStock.volumeZScore
    };
  }

  // Top 3 Drivers and Top 3 Draggers
  const topDrivers = positiveStocks.slice(0, 3).map((s) => ({
    symbol: s.symbol,
    name: s.name,
    weight: s.weight,
    points: s.pointImpact,
    changePct: s.changePct,
    rvol: s.relativeVolume ?? 1.0
  }));

  const topDraggers = negativeStocks.slice(0, 3).map((s) => ({
    symbol: s.symbol,
    name: s.name,
    weight: s.weight,
    points: s.pointImpact,
    changePct: s.changePct,
    rvol: s.relativeVolume ?? 1.0
  }));

  // Build Action Links for Culprit
  const actionLinks: { label: string; url: string }[] = [];
  if (primaryStock) {
    actionLinks.push(
      {
        label: `${primaryStock.symbol} NSE Filings`,
        url: `https://www.nseindia.com/companies-listing/corporate-filings-announcements?symbol=${encodeURIComponent(primaryStock.symbol)}`
      },
      {
        label: `${primaryStock.symbol} News`,
        url: `https://www.google.com/finance/quote/${encodeURIComponent(primaryStock.symbol)}:NSE`
      },
      {
        label: `${primaryStock.symbol} Chart`,
        url: `https://www.tradingview.com/chart/?symbol=NSE:${encodeURIComponent(primaryStock.symbol)}`
      }
    );
  }

  return {
    isImpulseDetected: absNetPoints >= velocityThreshold || isSingleStockDislocation || isThinVacuum,
    intensity,
    direction,
    netPoints,
    grossPoints,
    causeType,
    causeBadge,
    headline,
    verdict,
    recommendation,
    concentrationRatio1,
    concentrationRatio2,
    culprit,
    secondaryCulprit,
    topDrivers,
    topDraggers,
    marketBreadthSyncPct,
    aggregateRvol,
    liquidityState,
    actionLinks,
    timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST'
  };
}
