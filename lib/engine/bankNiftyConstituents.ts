import {
  Nifty50Stock,
  AdvancesDeclinesSummary,
  SectorAnalysis,
  PredictionLevels,
  ConfirmationSignal,
  TrendIntensity,
  ImpulseAttribution,
  MicrostructureSafety
} from '../types';
import { buildSmartMoneyRoadmap } from './smartMoneyRoadmap';
import { calculateImpulseAttribution } from './impulseAttribution';

export interface RawBankStockDefinition {
  symbol: string;
  name: string;
  sector: 'Private Bank' | 'PSU Bank';
  weight: number; // Official baseline percentage weight in Nifty Bank (sums strictly to 100.00%)
  uncappedWeight?: number; // Free-float uncapped weight percentage
  price: number;
  changePct: number;
  prevClose?: number;
  high?: number;
  low?: number;
  volume?: number;
  avgVolume?: number;
}

/**
 * 20-Day Baseline Average Daily Volume (shares) for all 14 Bank Nifty constituents on NSE.
 * Used for dynamic time-adjusted RVOL (Relative Volume) run-rate calculation.
 */
export const BANK_NIFTY_ADV_20D: Record<string, number> = {
  HDFCBANK: 31500000,
  ICICIBANK: 12500000,
  KOTAKBANK: 24500000,
  AXISBANK: 7100000,
  SBIN: 10200000,
  FEDERALBNK: 8400000,
  INDUSINDBK: 2300000,
  AUBANK: 2400000,
  IDFCFIRSTB: 16900000,
  BANKBARODA: 8500000,
  PNB: 20500000,
  UNIONBANK: 15700000,
  CANBK: 22200000,
  YESBANK: 147000000
};

/**
 * Baseline snapshot session volumes for authentic offline rendering.
 */
export const BANK_NIFTY_SNAPSHOT_VOLUME: Record<string, number> = {
  HDFCBANK: 50670000,
  ICICIBANK: 10600000,
  KOTAKBANK: 22070000,
  AXISBANK: 4150000,
  SBIN: 14880000,
  FEDERALBNK: 4250000,
  INDUSINDBK: 1375000,
  AUBANK: 2440000,
  IDFCFIRSTB: 13790000,
  BANKBARODA: 8590000,
  PNB: 18670000,
  UNIONBANK: 12440000,
  CANBK: 17630000,
  YESBANK: 122290000
};

/**
 * Authoritative 14 Bank Nifty stocks with official NSE Factsheet weights and authentic session snapshot prices.
 * Strictly verified: 14 constituents, baseline weights sum strictly to 100.00%
 */
export const BANK_NIFTY_STOCKS_DATA: RawBankStockDefinition[] = [
  // Private Sector Banks (9 stocks — 76.60% capped weight)
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    sector: 'Private Bank',
    weight: 18.18,
    uncappedWeight: 23.92,
    price: 736.70,
    changePct: 1.54,
    prevClose: 725.50
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Ltd.',
    sector: 'Private Bank',
    weight: 14.99,
    uncappedWeight: 21.53,
    price: 1424.10,
    changePct: -0.03,
    prevClose: 1424.50
  },
  {
    symbol: 'KOTAKBANK',
    name: 'Kotak Mahindra Bank Ltd.',
    sector: 'Private Bank',
    weight: 11.28,
    uncappedWeight: 9.62,
    price: 459.40,
    changePct: -1.13,
    prevClose: 464.65
  },
  {
    symbol: 'AXISBANK',
    name: 'Axis Bank Ltd.',
    sector: 'Private Bank',
    weight: 9.97,
    uncappedWeight: 8.08,
    price: 1232.00,
    changePct: -0.06,
    prevClose: 1232.70
  },
  {
    symbol: 'FEDERALBNK',
    name: 'The Federal Bank Ltd.',
    sector: 'Private Bank',
    weight: 7.02,
    uncappedWeight: 1.74,
    price: 335.20,
    changePct: 0.43,
    prevClose: 333.75
  },
  {
    symbol: 'INDUSINDBK',
    name: 'IndusInd Bank Ltd.',
    sector: 'Private Bank',
    weight: 4.62,
    uncappedWeight: 1.41,
    price: 865.15,
    changePct: 0.98,
    prevClose: 856.75
  },
  {
    symbol: 'AUBANK',
    name: 'AU Small Finance Bank Ltd.',
    sector: 'Private Bank',
    weight: 4.14,
    uncappedWeight: 1.43,
    price: 904.35,
    changePct: 2.77,
    prevClose: 880.00
  },
  {
    symbol: 'IDFCFIRSTB',
    name: 'IDFC First Bank Ltd.',
    sector: 'Private Bank',
    weight: 4.01,
    uncappedWeight: 1.36,
    price: 74.73,
    changePct: 2.09,
    prevClose: 73.20
  },
  {
    symbol: 'YESBANK',
    name: 'Yes Bank Ltd.',
    sector: 'Private Bank',
    weight: 2.39,
    uncappedWeight: 1.03,
    price: 15.73,
    changePct: 2.28,
    prevClose: 15.38
  },

  // Public Sector (PSU) Banks (5 stocks — 23.40% capped weight)
  {
    symbol: 'SBIN',
    name: 'State Bank of India',
    sector: 'PSU Bank',
    weight: 9.94,
    uncappedWeight: 19.03,
    price: 979.00,
    changePct: 0.90,
    prevClose: 970.25
  },
  {
    symbol: 'BANKBARODA',
    name: 'Bank of Baroda',
    sector: 'PSU Bank',
    weight: 3.71,
    uncappedWeight: 2.67,
    price: 245.37,
    changePct: 0.85,
    prevClose: 243.30
  },
  {
    symbol: 'PNB',
    name: 'Punjab National Bank',
    sector: 'PSU Bank',
    weight: 3.45,
    uncappedWeight: 2.96,
    price: 122.42,
    changePct: 1.20,
    prevClose: 120.97
  },
  {
    symbol: 'UNIONBANK',
    name: 'Union Bank of India',
    sector: 'PSU Bank',
    weight: 3.25,
    uncappedWeight: 2.96,
    price: 183.89,
    changePct: 0.38,
    prevClose: 183.20
  },
  {
    symbol: 'CANBK',
    name: 'Canara Bank',
    sector: 'PSU Bank',
    weight: 3.05,
    uncappedWeight: 2.26,
    price: 118.32,
    changePct: 0.70,
    prevClose: 117.50
  }
];

export function resolveTrend(changePct: number): TrendIntensity {
  if (changePct >= 2.0) return 'STRONG_BULL';
  if (changePct >= 0.4) return 'MODERATE_BULL';
  if (changePct <= -2.0) return 'STRONG_BEAR';
  if (changePct <= -0.4) return 'MODERATE_BEAR';
  return 'NEUTRAL';
}

/**
 * Calculates time-adjusted expected volume completion fraction according to the
 * institutional NSE U-curve between 09:15 and 15:30 IST (375 trading minutes).
 */
export function getIntradayExpectedVolumeRatio(now = new Date(), isLive = false): number {
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const parts = istFormatter.formatToParts(now);
  const weekday = parts.find(p => p.type === 'weekday')?.value || 'Mon';
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '12', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const currentMinutes = hour * 60 + minute;

  if (weekday === 'Sat' || weekday === 'Sun') {
    return 1.00;
  }

  const marketOpen = 9 * 60 + 15;  // 09:15 IST
  const marketClose = 15 * 60 + 30; // 15:30 IST

  if (currentMinutes >= marketClose) return 1.00;
  if (currentMinutes < marketOpen) return 1.00;

  const elapsed = currentMinutes - marketOpen;

  if (elapsed <= 45) {
    return 0.08 + (elapsed / 45) * 0.17;
  } else if (elapsed <= 105) {
    return 0.25 + ((elapsed - 45) / 60) * 0.15;
  } else if (elapsed <= 270) {
    return 0.40 + ((elapsed - 105) / 165) * 0.30;
  } else {
    return 0.70 + ((elapsed - 270) / 105) * 0.30;
  }
}

export function buildBankNiftyAnalysis(
  rawUpdates: Partial<RawBankStockDefinition>[] = [],
  spotPrice = 55900,
  vix = 14.5,
  spotNetChange?: number,
  spotPrevClose?: number,
  spotOpen?: number,
  spotHigh?: number,
  spotLow?: number,
  isLive = false
) {
  const updateMap = new Map<string, Partial<RawBankStockDefinition>>();
  for (const u of rawUpdates) {
    if (u.symbol) updateMap.set(u.symbol.toUpperCase(), u);
  }

  // Strict Point Impact Invariant: Anchor to BaseSpot = spotPrevClose > 0 ? spotPrevClose : spotPrice
  const baseSpot = (spotPrevClose && spotPrevClose > 0) ? spotPrevClose : spotPrice;
  const expectedVolumeRatio = getIntradayExpectedVolumeRatio(new Date(), isLive);

  // 1. Process all 14 constituent bank stocks
  const analyzedStocks: Nifty50Stock[] = BANK_NIFTY_STOCKS_DATA.map(base => {
    const live = updateMap.get(base.symbol.toUpperCase());
    const hasLiveQuote = !!(live && typeof live.price === 'number' && live.price > 0);

    const price = hasLiveQuote ? live.price! : base.price;

    let changePct = 0;
    if (hasLiveQuote && typeof live?.changePct === 'number') {
      changePct = live.changePct;
    } else if (!isLive) {
      changePct = base.changePct;
    }

    const prevClose = live?.prevClose && live.prevClose > 0
      ? live.prevClose
      : (base.prevClose || Number((price / (1 + (changePct || 0.0001) / 100)).toFixed(2)));

    // Mathematical Point Impact on Bank Nifty: BaseSpot * (Weight / 100) * (ChangePct / 100)
    const pointImpact = Number((baseSpot * (base.weight / 100) * (changePct / 100)).toFixed(2));
    const trend = resolveTrend(changePct);

    // Volume & Dynamic Relative Volume (RVOL)
    const avgVolume = BANK_NIFTY_ADV_20D[base.symbol] || base.avgVolume || 10000000;
    let volume: number | undefined;

    if (hasLiveQuote) {
      volume = typeof live?.volume === 'number' && live.volume > 0 ? live.volume : 0;
    } else if (!isLive) {
      volume = base.volume || BANK_NIFTY_SNAPSHOT_VOLUME[base.symbol] || Math.round(avgVolume * 1.05);
    } else {
      volume = 0;
    }

    const expectedVol = Math.max(1000, avgVolume * expectedVolumeRatio);
    const relativeVolume = volume && volume > 0 ? Number((volume / expectedVol).toFixed(2)) : (isLive ? 0 : 1.0);
    const turnoverCr = volume && volume > 0 ? Number(((price * volume) / 1e7).toFixed(2)) : 0;
    const volumeZScore = relativeVolume > 0 ? Number((Math.log(Math.max(0.05, relativeVolume)) / 0.45).toFixed(2)) : 0;

    return {
      symbol: base.symbol,
      name: base.name,
      sector: base.sector,
      weight: base.weight,
      dynamicWeight: base.uncappedWeight,
      price,
      changePct,
      prevClose,
      high: live?.high || base.high,
      low: live?.low || base.low,
      volume,
      avgVolume,
      turnoverCr,
      relativeVolume,
      pointImpact,
      trend,
      volumeZScore
    };
  });

  // 2. Aggregate Advances / Declines and Free-Float Breadth Weight + Turnover Flow
  let advances = 0;
  let declines = 0;
  let unchanged = 0;
  let advancingWeight = 0;
  let decliningWeight = 0;
  let unchangedWeight = 0;
  let totalPositivePoints = 0;
  let totalNegativePoints = 0;
  let totalTurnoverCr = 0;
  let advancingTurnoverCr = 0;
  let decliningTurnoverCr = 0;

  for (const s of analyzedStocks) {
    const t = s.turnoverCr || 0;
    totalTurnoverCr += t;
    if (s.changePct > 0.001) {
      advances++;
      advancingWeight += s.weight;
      totalPositivePoints += s.pointImpact;
      advancingTurnoverCr += t;
    } else if (s.changePct < -0.001) {
      declines++;
      decliningWeight += s.weight;
      totalNegativePoints += s.pointImpact;
      decliningTurnoverCr += t;
    } else {
      unchanged++;
      unchangedWeight += s.weight;
    }
  }

  advancingWeight = Number(advancingWeight.toFixed(2));
  decliningWeight = Number(decliningWeight.toFixed(2));
  unchangedWeight = Number(unchangedWeight.toFixed(2));
  totalPositivePoints = Number(totalPositivePoints.toFixed(2));
  totalNegativePoints = Number(totalNegativePoints.toFixed(2));
  totalTurnoverCr = Number(totalTurnoverCr.toFixed(2));
  advancingTurnoverCr = Number(advancingTurnoverCr.toFixed(2));
  decliningTurnoverCr = Number(decliningTurnoverCr.toFixed(2));

  const validTurnover = advancingTurnoverCr + decliningTurnoverCr;
  const advancingVolumePct = validTurnover > 0
    ? Number(((advancingTurnoverCr / validTurnover) * 100).toFixed(1))
    : 50.0;
  const decliningVolumePct = validTurnover > 0
    ? Number(((decliningTurnoverCr / validTurnover) * 100).toFixed(1))
    : 50.0;

  const volumeBreadthRatio = decliningTurnoverCr > 0
    ? Number((advancingTurnoverCr / decliningTurnoverCr).toFixed(2))
    : Number((advancingTurnoverCr || 1).toFixed(2));

  let volumeConviction: AdvancesDeclinesSummary['volumeConviction'] = 'NEUTRAL_FLOW';
  if (advancingVolumePct >= 70 && volumeBreadthRatio >= 2.0) volumeConviction = 'STRONG_ACCUMULATION';
  else if (advancingVolumePct >= 58) volumeConviction = 'MODERATE_INFLOW';
  else if (decliningVolumePct >= 70 && volumeBreadthRatio <= 0.5) volumeConviction = 'HEAVY_DISTRIBUTION';
  else if (decliningVolumePct >= 58) volumeConviction = 'MODERATE_OUTFLOW';

  const adRatio = declines > 0 ? Number((advances / declines).toFixed(2)) : advances;

  let breadthVelocity: AdvancesDeclinesSummary['breadthVelocity'] = 'BALANCED';
  if (advancingWeight >= 65 && advances >= 9) breadthVelocity = 'EXPANDING_BULLISH';
  else if (advancingWeight >= 55) breadthVelocity = 'MODERATE_BULLISH';
  else if (decliningWeight >= 65 && declines >= 9) breadthVelocity = 'EXPANDING_BEARISH';
  else if (decliningWeight >= 55) breadthVelocity = 'MODERATE_BEARISH';

  const advancesDeclines: AdvancesDeclinesSummary = {
    advances,
    declines,
    unchanged,
    advancingWeight,
    decliningWeight,
    unchangedWeight,
    adRatio,
    breadthVelocity,
    totalTurnoverCr,
    advancingTurnoverCr,
    decliningTurnoverCr,
    advancingVolumePct,
    decliningVolumePct,
    volumeBreadthRatio,
    volumeConviction
  };

  // 3. Aggregate Sector Analysis: Private Banks vs PSU Banks
  const sectorMap = new Map<string, { weight: number; stocks: Nifty50Stock[]; points: number; adv: number; dec: number; unc: number }>();
  for (const s of analyzedStocks) {
    let sec = sectorMap.get(s.sector);
    if (!sec) {
      sec = { weight: 0, stocks: [], points: 0, adv: 0, dec: 0, unc: 0 };
      sectorMap.set(s.sector, sec);
    }
    sec.weight += s.weight;
    sec.stocks.push(s);
    sec.points += s.pointImpact;
    if (s.changePct > 0.001) sec.adv++;
    else if (s.changePct < -0.001) sec.dec++;
    else sec.unc++;
  }

  const sectors: SectorAnalysis[] = Array.from(sectorMap.entries()).map(([name, data]) => {
    const weightedReturn = Number(
      (data.stocks.reduce((acc, st) => acc + st.changePct * st.weight, 0) / (data.weight || 1)).toFixed(2)
    );
    const sortedByImpact = [...data.stocks].sort((a, b) => Math.abs(b.pointImpact) - Math.abs(a.pointImpact));
    const dominantStock = sortedByImpact[0]?.symbol || '';

    let trend: SectorAnalysis['trend'] = 'NEUTRAL';
    if (weightedReturn >= 0.35 && data.adv >= data.dec) trend = 'BULLISH';
    else if (weightedReturn <= -0.25 && data.dec > data.adv) trend = 'BEARISH';

    return {
      name,
      weight: Number(data.weight.toFixed(2)),
      stockCount: data.stocks.length,
      advances: data.adv,
      declines: data.dec,
      unchanged: data.unc,
      weightedReturn,
      pointImpact: Number(data.points.toFixed(2)),
      trend,
      dominantStock,
      stocks: data.stocks
    };
  }).sort((a, b) => b.weight - a.weight);

  // 4. Volatility-Scaled Prediction Levels
  // Continuous 1-sigma expected move for Bank Nifty: Spot * (VIX / 100) / sqrt(252)
  const effectiveVix = Math.max(9.0, Math.min(60.0, vix));
  const expected1DayMove = Math.max(100, Number((spotPrice * (effectiveVix / 100) / Math.sqrt(252)).toFixed(1)));
  const constituentNetPoints = Number((totalPositivePoints + totalNegativePoints).toFixed(2));
  const netPointImpact = typeof spotNetChange === 'number' && Math.abs(spotNetChange) > 0.001
    ? spotNetChange
    : constituentNetPoints;

  const pivot = spotPrevClose && spotPrevClose > 0 ? spotPrevClose : spotPrice - netPointImpact;
  const r1_sigma = Number((spotPrice + expected1DayMove).toFixed(1));
  const s1_sigma = Number((spotPrice - expected1DayMove).toFixed(1));
  const r2_sigma = Number((spotPrice + 2 * expected1DayMove).toFixed(1));
  const s2_sigma = Number((spotPrice - 2 * expected1DayMove).toFixed(1));

  // Top Drivers & Draggers
  const sortedByPointsDesc = [...analyzedStocks].sort((a, b) => b.pointImpact - a.pointImpact);
  const keyPositiveDrivers = sortedByPointsDesc
    .filter(s => s.pointImpact > 0.1)
    .slice(0, 4)
    .map(s => ({ symbol: s.symbol, weight: s.weight, changePct: s.changePct, points: s.pointImpact }));

  const keyNegativeDraggers = [...sortedByPointsDesc]
    .reverse()
    .filter(s => s.pointImpact < -0.1)
    .slice(0, 4)
    .map(s => ({ symbol: s.symbol, weight: s.weight, changePct: s.changePct, points: s.pointImpact }));

  // Confirmation Signals Matrix
  // Directional threshold derived from continuous volatility scaling (5% of 1-sigma expected move, min 25 pts)
  const directionalThreshold = Math.max(25, Number((expected1DayMove * 0.05).toFixed(1)));
  const isMarketBullish = netPointImpact >= directionalThreshold;
  const isMarketBearish = netPointImpact <= -directionalThreshold;

  function evaluateSignalAlignment(score: number, threshold = 20): 'CONFIRMED' | 'DIVERGENT' | 'NEUTRAL' {
    if (isMarketBullish) {
      if (score >= threshold) return 'CONFIRMED';
      if (score <= -threshold) return 'DIVERGENT';
      return 'NEUTRAL';
    }
    if (isMarketBearish) {
      if (score <= -threshold) return 'CONFIRMED';
      if (score >= threshold) return 'DIVERGENT';
      return 'NEUTRAL';
    }
    if (Math.abs(score) >= threshold * 1.5) return 'DIVERGENT';
    return 'NEUTRAL';
  }

  // -------------------------------------------------------------
  // MICROSTRUCTURE ATTRIBUTION & IMPULSE GOVERNOR
  // -------------------------------------------------------------
  const impulseAttribution = calculateImpulseAttribution({
    indexSymbol: 'BANKNIFTY',
    spotPrice,
    spotNetChange: netPointImpact,
    spotPrevClose: pivot,
    vix: effectiveVix,
    expected1DayMove,
    stocks: analyzedStocks,
    sectors,
    advancesDeclines
  });

  // Signal 1: Big-3 Heavyweights Hegemony (HDFCBANK, ICICIBANK, SBIN ~43.1% weight)
  const top3Symbols = ['HDFCBANK', 'ICICIBANK', 'SBIN'];
  const top3Stocks = analyzedStocks.filter(s => top3Symbols.includes(s.symbol));
  const top3NetPoints = top3Stocks.reduce((sum, s) => sum + s.pointImpact, 0);
  const rawTop3Score = Math.max(-100, Math.min(100, (top3NetPoints / (expected1DayMove * 0.40)) * 100));

  const top3PositiveCount = top3Stocks.filter(s => s.changePct > 0).length;
  const top3NegativeCount = top3Stocks.filter(s => s.changePct < 0).length;
  const top3PositivePoints = top3Stocks.filter(s => s.pointImpact > 0).reduce((sum, s) => sum + s.pointImpact, 0);
  const top3NegativePoints = top3Stocks.filter(s => s.pointImpact < 0).reduce((sum, s) => sum + Math.abs(s.pointImpact), 0);

  const culpritSymbol = impulseAttribution.culprit?.symbol;
  const culpritInTop3 = top3Stocks.find(s => s.symbol === culpritSymbol);
  const isTop3SingleStockSkewed = Boolean(
    impulseAttribution.causeType === 'SINGLE_STOCK_CULPRIT' && (
      (top3NetPoints > 0 && top3PositiveCount <= 1) ||
      (top3NetPoints < 0 && top3NegativeCount <= 1) ||
      (top3NetPoints > 0 && culpritInTop3 && culpritInTop3.pointImpact > 0 && top3PositivePoints > 0 && (culpritInTop3.pointImpact / top3PositivePoints) >= 0.65) ||
      (top3NetPoints < 0 && culpritInTop3 && culpritInTop3.pointImpact < 0 && top3NegativePoints > 0 && (Math.abs(culpritInTop3.pointImpact) / top3NegativePoints) >= 0.65)
    )
  );

  let top3Score = rawTop3Score;
  let top3Status = evaluateSignalAlignment(top3Score, 20);
  let top3Details = `Top 3 banks contribute ${top3NetPoints > 0 ? '+' : ''}${top3NetPoints.toFixed(1)} pts (${top3PositiveCount}/3 positive).`;

  if (isTop3SingleStockSkewed) {
    top3Status = 'DIVERGENT';
    top3Score = Number((rawTop3Score * 0.4).toFixed(1));
    top3Details += ` ⚠️ SKEWED: ${culpritSymbol ?? 'Single bank'} carries move alone; peers divergent.`;
  }

  // Signal 2: Weighted Breadth (Advancing Weight - Declining Weight)
  const breadthScore = advancingWeight - decliningWeight;
  const breadthStatus = evaluateSignalAlignment(breadthScore, 20);

  // Signal 3: Private vs PSU Bank Synchrony
  const privateSector = sectors.find(s => s.name === 'Private Bank');
  const psuSector = sectors.find(s => s.name === 'PSU Bank');
  const pvtReturn = privateSector?.weightedReturn || 0;
  const psuReturn = psuSector?.weightedReturn || 0;
  const isSynchronized = pvtReturn * psuReturn > 0;
  const hasRotationSplit = pvtReturn * psuReturn < -0.05;
  const bankSynchronyScore = Number(Math.max(-100, Math.min(100, (pvtReturn * 50) + (psuReturn * 50))).toFixed(1));
  const bankSynchronyStatus = evaluateSignalAlignment(bankSynchronyScore, 20);

  // Signal 4: Microstructure Volatility Stretch
  const volStretchRatio = netPointImpact / expected1DayMove;
  const volStretchScore = Math.max(-100, Math.min(100, volStretchRatio * 100));
  const volStretchStatus = evaluateSignalAlignment(volStretchScore, 25);

  // Signal 5: Traded Turnover Flow & Institutional RVOL Conviction
  const volumeFlowDelta = advancingVolumePct - decliningVolumePct;
  const top3AvgRvol = top3Stocks.length > 0
    ? Number((top3Stocks.reduce((sum, s) => sum + (s.relativeVolume || 1.0), 0) / top3Stocks.length).toFixed(2))
    : 1.0;
  let volumeScore = Math.max(-100, Math.min(100, volumeFlowDelta));
  let volumeStatus = evaluateSignalAlignment(volumeScore, 20);
  let volumeDetails = `${advancingVolumePct}% Inflow vs ${decliningVolumePct}% Outflow (₹${totalTurnoverCr.toFixed(0)} Cr turnover, Big-3 RVOL: ${top3AvgRvol.toFixed(1)}x).`;

  if (impulseAttribution.liquidityState === 'THIN_AIR_POCKET') {
    if (volumeStatus === 'CONFIRMED') volumeStatus = 'NEUTRAL';
    volumeScore = Number((volumeScore * 0.5).toFixed(1));
    volumeDetails += ` ⚠️ Thin depth: market RVOL ${impulseAttribution.aggregateRvol}x.`;
  }

  const confirmationSignals: ConfirmationSignal[] = [
    {
      id: 'HEAVYWEIGHT_ALIGNMENT',
      name: 'Big-3 Heavyweights Hegemony (HDFC/ICICI/SBI)',
      status: top3Status,
      score: Number(top3Score.toFixed(1)),
      details: top3Details,
      weight: 0.35
    },
    {
      id: 'FREE_FLOAT_BREADTH',
      name: 'Banking Weight Breadth',
      status: breadthStatus,
      score: Number(breadthScore.toFixed(1)),
      details: `${advancingWeight.toFixed(1)}% Advancing vs ${decliningWeight.toFixed(1)}% Declining weight (${advances} Adv / ${declines} Dec).`,
      weight: 0.25
    },
    {
      id: 'VOLUME_TURNOVER_CONFIRMATION',
      name: 'Turnover Flow & Institutional RVOL',
      status: volumeStatus,
      score: Number(volumeScore.toFixed(1)),
      details: volumeDetails,
      weight: 0.20
    },
    {
      id: 'CORE_SECTOR_SYNCHRONY',
      name: 'Private vs PSU Bank Synchrony',
      status: bankSynchronyStatus,
      score: bankSynchronyScore,
      details: `Private: ${pvtReturn > 0 ? '+' : ''}${pvtReturn}% | PSU: ${psuReturn > 0 ? '+' : ''}${psuReturn}%${hasRotationSplit ? ' (Capital Rotation Active)' : isSynchronized ? ' (Synchronous Tide)' : ''}.`,
      weight: 0.12
    },
    {
      id: 'VOLATILITY_ABSORPTION',
      name: '1-Sigma Volatility Stretch',
      status: volStretchStatus,
      score: Number(volStretchScore.toFixed(1)),
      details: `Net move ${netPointImpact > 0 ? '+' : ''}${netPointImpact.toFixed(1)} pts is ${(Math.abs(volStretchRatio) * 100).toFixed(0)}% of 1σ move (±${expected1DayMove} pts).`,
      weight: 0.08
    }
  ];

  // Quantitative Composite Trend Score & Raw Confidence
  const weightedSignalScore = confirmationSignals.reduce((acc, sig) => acc + sig.score * sig.weight, 0);
  const rawTrendScore = Number(Math.max(-100, Math.min(100, weightedSignalScore)).toFixed(1));

  const rawConfidencePct = Math.min(95, Math.max(45, Math.round(
    (Math.abs(breadthScore) * 0.4 + Math.abs(top3Score) * 0.4 + (confirmationSignals.filter(s => s.status === 'CONFIRMED').length / confirmationSignals.length) * 20)
  )));

  // Institutional Microstructure Governor Assessment
  let riskLevel: MicrostructureSafety['riskLevel'] = 'LOW';
  let safetyStatus: MicrostructureSafety['status'] = 'HEALTHY';
  let trapDetected = false;
  let trapReason: string | undefined;
  let governorPenalty = 0;

  if (impulseAttribution.causeType === 'SINGLE_STOCK_CULPRIT') {
    trapDetected = true;
    safetyStatus = 'FAKEMOVE_WARNING';
    const culpritPct = impulseAttribution.culprit?.pctOfNetIndexMove ?? impulseAttribution.concentrationRatio1;
    const isThinLiquidity = impulseAttribution.liquidityState === 'THIN_AIR_POCKET';
    riskLevel = (isThinLiquidity || culpritPct >= 70 || impulseAttribution.concentrationRatio1 >= 60) ? 'CRITICAL' : 'HIGH';
    governorPenalty = isThinLiquidity ? 40 : 35;
    trapReason = `Single-Bank Skew${isThinLiquidity ? ' in Thin Depth' : ''}: ${impulseAttribution.culprit?.symbol ?? 'Leading bank'} accounts for ${culpritPct}% of net move${isThinLiquidity ? ` (${impulseAttribution.aggregateRvol}x RVOL)` : ''}. Snap-back / exhaustion trap risk high.`;
  } else if (impulseAttribution.causeType === 'VACUUM_SLIPPAGE') {
    trapDetected = true;
    safetyStatus = 'LIQUIDITY_VACUUM';
    riskLevel = 'HIGH';
    trapReason = `Thin Air Pocket: Price moved on dry constituent volume (${impulseAttribution.aggregateRvol}x RVOL) without broad order book depth.`;
    governorPenalty = 25;
  } else if (impulseAttribution.causeType === 'SECTOR_ROTATION_BALANCED') {
    safetyStatus = 'ROTATION_CHOP';
    riskLevel = 'ELEVATED';
    trapReason = `Private/PSU Rotation Tug-of-War: Gross churn (${impulseAttribution.grossPoints.toFixed(0)} pts) suppressing net drift (${impulseAttribution.netPoints.toFixed(0)} pts).`;
    governorPenalty = 15;
  }

  // Apply Microstructure Safety Governor adjustments
  let trendScore = rawTrendScore;
  let confidencePct = rawConfidencePct;

  if (trapDetected) {
    trendScore = Number((rawTrendScore * 0.55).toFixed(1));
    confidencePct = Math.min(48, Math.max(25, rawConfidencePct - governorPenalty));
  } else if (safetyStatus === 'ROTATION_CHOP') {
    trendScore = Number((rawTrendScore * 0.75).toFixed(1));
    confidencePct = Math.min(55, Math.max(30, rawConfidencePct - governorPenalty));
  }

  let direction: PredictionLevels['direction'] = 'NEUTRAL_CHOPPY';
  if (trendScore >= 40) direction = 'STRONG_BULLISH';
  else if (trendScore >= 15) direction = 'MODERATE_BULLISH';
  else if (trendScore <= -40) direction = 'STRONG_BEARISH';
  else if (trendScore <= -15) direction = 'MODERATE_BEARISH';

  // Governor Veto: Downgrade false strong breakouts under trap conditions
  if (trapDetected) {
    if (direction === 'STRONG_BULLISH') direction = 'MODERATE_BULLISH';
    if (direction === 'STRONG_BEARISH') direction = 'MODERATE_BEARISH';
  }
  if (safetyStatus === 'ROTATION_CHOP' && Math.abs(trendScore) < 25) {
    direction = 'NEUTRAL_CHOPPY';
  }

  const microstructureSafety: MicrostructureSafety = {
    riskLevel,
    status: safetyStatus,
    trapDetected,
    trapReason,
    governorPenalty,
    rawTrendScore,
    rawConfidencePct,
    culpritSymbol: trapDetected ? impulseAttribution.culprit?.symbol : undefined,
    culpritPctOfMove: trapDetected ? impulseAttribution.culprit?.pctOfNetIndexMove : undefined,
    cr1: impulseAttribution.concentrationRatio1,
    cr2: impulseAttribution.concentrationRatio2,
    marketRvol: impulseAttribution.aggregateRvol,
    liquidityState: impulseAttribution.liquidityState,
    recommendation: impulseAttribution.recommendation
  };

  // Generate Institutional Smart Money Roadmap & Gap Structure for BANK NIFTY
  const smartRoadmap = buildSmartMoneyRoadmap({
    spotPrice,
    prevClose: pivot,
    dayOpen: spotOpen,
    dayHigh: spotHigh,
    dayLow: spotLow,
    vix: effectiveVix,
    symbol: 'BANKNIFTY'
  });

  const tacticalSupport = smartRoadmap.tacticalLevels.find(l => l.type === 'DIP_BUYING_SHELF')?.price;
  const tacticalResistance = smartRoadmap.tacticalLevels.find(l => l.type === 'PULLBACK_RESISTANCE')?.price;
  const tacticalStopLoss = smartRoadmap.actionSignal.invalidationPrice;

  const trapPrefix = trapDetected ? ` [⚠️ ${safetyStatus.replace('_', ' ')}]` : '';

  const prediction: PredictionLevels = {
    direction,
    trendScore,
    confidencePct,
    spotPrice,
    vix,
    expected1DayMove,
    r1_sigma,
    s1_sigma,
    r2_sigma,
    s2_sigma,
    pivot,
    netPointImpact,
    constituentNetPoints,
    totalPositivePoints,
    totalNegativePoints,
    keyPositiveDrivers,
    keyNegativeDraggers,
    confirmationSignals,
    summary: `${direction.replace('_', ' ')}${trapPrefix} (Score: ${trendScore > 0 ? '+' : ''}${trendScore}) | Net ${netPointImpact > 0 ? '+' : ''}${netPointImpact.toFixed(1)} pts | 1σ daily band [${s1_sigma} - ${r1_sigma}].`,
    microstructureSafety,
    smartRoadmap,
    gapAnalysis: smartRoadmap.gapAnalysis,
    tacticalStopLoss,
    tacticalSupport,
    tacticalResistance
  };

  return {
    analyzedStocks,
    advancesDeclines,
    sectors,
    prediction,
    spotPrice,
    spotNetChange: netPointImpact,
    spotPrevClose: pivot,
    spotOpen,
    spotHigh,
    spotLow,
    vix,
    expected1DayMove,
    impulseAttribution
  };
}
