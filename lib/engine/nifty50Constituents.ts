import {
  Nifty50Stock,
  AdvancesDeclinesSummary,
  SectorAnalysis,
  PredictionLevels,
  ConfirmationSignal,
  TrendIntensity
} from '../types';
import { buildSmartMoneyRoadmap } from './smartMoneyRoadmap';

export interface RawStockDefinition {
  symbol: string;
  name: string;
  sector: string;
  weight: number; // Official baseline percentage weight in Nifty 50 (sums strictly to 100.00)
  price: number;
  changePct: number;
  prevClose?: number;
  high?: number;
  low?: number;
  volume?: number;
  avgVolume?: number;
}

/**
 * 20-Day Baseline Average Daily Volume (shares) for all 50 Nifty constituents on NSE.
 * Used for dynamic time-adjusted RVOL (Relative Volume) run-rate calculation.
 */
export const NIFTY_50_ADV_20D: Record<string, number> = {
  HDFCBANK: 22000000,
  ICICIBANK: 16000000,
  SBIN: 26000000,
  AXISBANK: 8500000,
  KOTAKBANK: 7000000,
  BAJFINANCE: 1200000,
  BAJAJFINSV: 1500000,
  BSE: 1800000,
  SHRIRAMFIN: 1400000,
  JIOFIN: 28000000,
  SBILIFE: 1100000,
  HDFCLIFE: 3500000,
  RELIANCE: 8000000,
  ONGC: 18000000,
  COALINDIA: 12000000,
  INFY: 8000000,
  TCS: 3000000,
  HCLTECH: 3500000,
  TECHM: 2500000,
  'M&M': 3000000,
  MARUTI: 450000,
  'BAJAJ-AUTO': 350000,
  EICHERMOT: 400000,
  TMPV: 15000000,
  BHARTIARTL: 7500000,
  ITC: 18000000,
  HINDUNILVR: 1800000,
  NESTLEIND: 850000,
  TATACONSUM: 2200000,
  SUNPHARMA: 2800000,
  CIPLA: 2000000,
  DRREDDY: 1200000,
  APOLLOHOSP: 550000,
  MAXHEALTH: 2500000,
  TATASTEEL: 42000000,
  JSWSTEEL: 2800000,
  HINDALCO: 8500000,
  ADANIENT: 2000000,
  LT: 2200000,
  TRENT: 1500000,
  ETERNAL: 45000000,
  TITAN: 1200000,
  ASIANPAINT: 1400000,
  NTPC: 16000000,
  POWERGRID: 14000000,
  INDIGO: 1200000,
  ADANIPORTS: 3800000,
  ULTRACEMCO: 400000,
  GRASIM: 900000,
  BEL: 16000000
};

/**
 * Baseline snapshot session volumes for authentic offline rendering.
 */
export const NIFTY_50_SNAPSHOT_VOLUME: Record<string, number> = {
  HDFCBANK: 24500000,
  ICICIBANK: 15200000,
  SBIN: 32000000,
  AXISBANK: 7900000,
  KOTAKBANK: 7400000,
  BAJFINANCE: 1350000,
  BAJAJFINSV: 1600000,
  BSE: 1750000,
  SHRIRAMFIN: 1800000,
  JIOFIN: 42000000,
  SBILIFE: 1200000,
  HDFCLIFE: 3600000,
  RELIANCE: 14800000,
  ONGC: 22000000,
  COALINDIA: 18500000,
  INFY: 7200000,
  TCS: 4100000,
  HCLTECH: 4200000,
  TECHM: 2200000,
  'M&M': 3800000,
  MARUTI: 720000,
  'BAJAJ-AUTO': 320000,
  EICHERMOT: 360000,
  TMPV: 24000000,
  BHARTIARTL: 8600000,
  ITC: 21000000,
  HINDUNILVR: 2400000,
  NESTLEIND: 980000,
  TATACONSUM: 2500000,
  SUNPHARMA: 2400000,
  CIPLA: 2100000,
  DRREDDY: 1350000,
  APOLLOHOSP: 490000,
  MAXHEALTH: 4800000,
  TATASTEEL: 68000000,
  JSWSTEEL: 3400000,
  HINDALCO: 11000000,
  ADANIENT: 2200000,
  LT: 2800000,
  TRENT: 1350000,
  ETERNAL: 55000000,
  TITAN: 1100000,
  ASIANPAINT: 1900000,
  NTPC: 24000000,
  POWERGRID: 16500000,
  INDIGO: 1550000,
  ADANIPORTS: 3200000,
  ULTRACEMCO: 520000,
  GRASIM: 1100000,
  BEL: 21000000
};

/**
 * Authoritative 50 stocks with official NSE weights and authentic session snapshot prices
 * Strictly verified: 50 constituents, weights sum to 100.00%
 */
export const NIFTY_50_STOCKS_DATA: RawStockDefinition[] = [
  // Financial Services (12 stocks — 37.13% weight)
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', sector: 'Financial Services', weight: 9.95, price: 694.90, changePct: 0.30 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', sector: 'Financial Services', weight: 9.39, price: 1395.40, changePct: -0.19 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Financial Services', weight: 3.73, price: 974.20, changePct: 1.28 },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', sector: 'Financial Services', weight: 3.28, price: 1214.70, changePct: -0.19 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', sector: 'Financial Services', weight: 3.19, price: 463.10, changePct: 0.32 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', sector: 'Financial Services', weight: 2.40, price: 943.25, changePct: 0.44 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd.', sector: 'Financial Services', weight: 1.15, price: 1674.60, changePct: 0.42 },
  { symbol: 'BSE', name: 'BSE Ltd.', sector: 'Financial Services', weight: 0.98, price: 3510.00, changePct: -0.01 },
  { symbol: 'SHRIRAMFIN', name: 'Shriram Finance Ltd.', sector: 'Financial Services', weight: 0.92, price: 835.95, changePct: 1.56 },
  { symbol: 'JIOFIN', name: 'Jio Financial Services Ltd.', sector: 'Financial Services', weight: 0.82, price: 211.75, changePct: 3.55 },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Company Ltd.', sector: 'Financial Services', weight: 0.78, price: 1667.10, changePct: 0.51 },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Company Ltd.', sector: 'Financial Services', weight: 0.55, price: 525.45, changePct: 0.10 },

  // Oil, Gas & Consumable Fuels (3 stocks — 9.00% weight)
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', sector: 'Oil Gas & Consumable Fuels', weight: 7.30, price: 1238.40, changePct: 6.31 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd.', sector: 'Oil Gas & Consumable Fuels', weight: 0.95, price: 228.59, changePct: 1.42 },
  { symbol: 'COALINDIA', name: 'Coal India Ltd.', sector: 'Oil Gas & Consumable Fuels', weight: 0.75, price: 400.75, changePct: 3.02 },

  // Information Technology (4 stocks — 8.80% weight)
  { symbol: 'INFY', name: 'Infosys Ltd.', sector: 'Information Technology', weight: 3.92, price: 1180.30, changePct: -0.40 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', sector: 'Information Technology', weight: 2.92, price: 2547.00, changePct: 1.77 },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd.', sector: 'Information Technology', weight: 1.36, price: 1452.00, changePct: 1.67 },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd.', sector: 'Information Technology', weight: 0.60, price: 1785.30, changePct: -0.31 },

  // Automobile and Auto Components (5 stocks — 6.28% weight)
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd.', sector: 'Automobile and Auto Components', weight: 2.15, price: 2884.00, changePct: 1.54 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', sector: 'Automobile and Auto Components', weight: 1.62, price: 11746.00, changePct: 3.06 },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd.', sector: 'Automobile and Auto Components', weight: 0.98, price: 10333.00, changePct: -0.16 },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd.', sector: 'Automobile and Auto Components', weight: 0.88, price: 7190.00, changePct: -0.42 },
  { symbol: 'TMPV', name: 'Tata Motors Passenger Vehicles Ltd.', sector: 'Automobile and Auto Components', weight: 0.65, price: 273.40, changePct: 3.01 },

  // Telecommunication (1 stock — 5.63% weight)
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', sector: 'Telecommunication', weight: 5.63, price: 1994.10, changePct: 1.03 },

  // Fast Moving Consumer Goods (4 stocks — 5.36% weight)
  { symbol: 'ITC', name: 'ITC Ltd.', sector: 'Fast Moving Consumer Goods', weight: 2.26, price: 267.80, changePct: 0.83 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', sector: 'Fast Moving Consumer Goods', weight: 1.82, price: 1892.90, changePct: 1.52 },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd.', sector: 'Fast Moving Consumer Goods', weight: 0.76, price: 1180.00, changePct: 1.11 },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products Ltd.', sector: 'Fast Moving Consumer Goods', weight: 0.52, price: 1032.10, changePct: 0.60 },

  // Healthcare (5 stocks — 4.68% weight)
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd.', sector: 'Healthcare', weight: 1.48, price: 1759.90, changePct: -1.00 },
  { symbol: 'CIPLA', name: 'Cipla Ltd.', sector: 'Healthcare', weight: 0.92, price: 1382.80, changePct: 0.28 },
  { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories Ltd.", sector: 'Healthcare', weight: 0.82, price: 1359.30, changePct: 0.54 },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd.', sector: 'Healthcare', weight: 0.78, price: 8375.00, changePct: -0.86 },
  { symbol: 'MAXHEALTH', name: 'Max Healthcare Institute Ltd.', sector: 'Healthcare', weight: 0.68, price: 894.35, changePct: 3.99 },

  // Metals & Mining (4 stocks — 4.45% weight)
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', sector: 'Metals & Mining', weight: 1.37, price: 174.50, changePct: 4.12 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd.', sector: 'Metals & Mining', weight: 1.18, price: 1263.40, changePct: 1.40 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd.', sector: 'Metals & Mining', weight: 1.05, price: 896.80, changePct: 1.37 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', sector: 'Metals & Mining', weight: 0.84, price: 2590.00, changePct: 0.41 },

  // Construction (1 stock — 4.25% weight)
  { symbol: 'LT', name: 'Larsen & Toubro Ltd.', sector: 'Construction', weight: 4.25, price: 3913.90, changePct: 1.09 },

  // Consumer Services (2 stocks — 3.28% weight)
  { symbol: 'TRENT', name: 'Trent Ltd.', sector: 'Consumer Services', weight: 1.88, price: 3007.80, changePct: -0.31 },
  { symbol: 'ETERNAL', name: 'Eternal Ltd.', sector: 'Consumer Services', weight: 1.40, price: 347.90, changePct: 1.24 },

  // Consumer Durables (2 stocks — 2.70% weight)
  { symbol: 'TITAN', name: 'Titan Company Ltd.', sector: 'Consumer Durables', weight: 1.62, price: 4433.80, changePct: -0.06 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd.', sector: 'Consumer Durables', weight: 1.08, price: 2359.00, changePct: 1.68 },

  // Power (2 stocks — 2.53% weight)
  { symbol: 'NTPC', name: 'NTPC Ltd.', sector: 'Power', weight: 1.43, price: 325.95, changePct: 3.07 },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd.', sector: 'Power', weight: 1.10, price: 268.15, changePct: 1.19 },

  // Services (2 stocks — 2.39% weight)
  { symbol: 'INDIGO', name: 'InterGlobe Aviation Ltd.', sector: 'Services', weight: 1.25, price: 4947.30, changePct: 1.43 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports and Special Economic Zone Ltd.', sector: 'Services', weight: 1.14, price: 1839.70, changePct: -0.56 },

  // Construction Materials (2 stocks — 2.28% weight)
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd.', sector: 'Construction Materials', weight: 1.20, price: 11220.00, changePct: 1.58 },
  { symbol: 'GRASIM', name: 'Grasim Industries Ltd.', sector: 'Construction Materials', weight: 1.08, price: 3008.30, changePct: 0.90 },

  // Capital Goods (1 stock — 1.24% weight)
  { symbol: 'BEL', name: 'Bharat Electronics Ltd.', sector: 'Capital Goods', weight: 1.24, price: 375.00, changePct: 1.38 }
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

  // On weekends (Saturday, Sunday), market is closed. Quotes represent completed Friday session.
  if (weekday === 'Sat' || weekday === 'Sun') {
    return 1.00;
  }

  const marketOpen = 9 * 60 + 15;  // 09:15 IST (555 mins)
  const marketClose = 15 * 60 + 30; // 15:30 IST (930 mins)

  // Outside regular market hours:
  // After 15:30 IST: Session is complete.
  if (currentMinutes >= marketClose) return 1.00;

  // Before 09:15 IST:
  // When market has not opened yet, quotes reflect previous day's complete session.
  if (currentMinutes < marketOpen) {
    return 1.00;
  }

  const elapsed = currentMinutes - marketOpen; // 0 to 375 minutes

  // IST U-Curve:
  // 0 - 45m (09:15-10:00): Opening burst ~25% of day's volume
  // 45 - 105m (10:00-11:00): Morning continuation ~15% (total 40%)
  // 105 - 270m (11:00-13:45): Midday lull ~30% (total 70%)
  // 270 - 375m (13:45-15:30): Afternoon sprint ~30% (total 100%)
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

export function buildNifty50Analysis(
  rawUpdates: Partial<RawStockDefinition>[] = [],
  spotPrice = 24500,
  vix = 14.5,
  spotNetChange?: number,
  spotPrevClose?: number,
  spotOpen?: number,
  spotHigh?: number,
  spotLow?: number,
  isLive = false
) {
  const updateMap = new Map<string, Partial<RawStockDefinition>>();
  for (const u of rawUpdates) {
    if (u.symbol) updateMap.set(u.symbol.toUpperCase(), u);
  }

  // Strict Point Impact Invariant: Anchor to BaseSpot = spotPrevClose > 0 ? spotPrevClose : spotPrice
  // Prevents point drift divergence where sum(pointImpact) != spotNetChange
  const baseSpot = (spotPrevClose && spotPrevClose > 0) ? spotPrevClose : spotPrice;
  const expectedVolumeRatio = getIntradayExpectedVolumeRatio(new Date(), isLive);

  // 1. Process all 50 constituent stocks
  const analyzedStocks: Nifty50Stock[] = NIFTY_50_STOCKS_DATA.map(base => {
    const live = updateMap.get(base.symbol.toUpperCase());
    const hasLiveQuote = !!(live && typeof live.price === 'number' && live.price > 0);

    const price = hasLiveQuote ? live.price! : base.price;

    // Zero-Contamination Live Guard: When live streaming is active, unquoted stocks
    // must strictly report 0.00% (neutral), never polluting live calculations with static snapshot percentages
    let changePct = 0;
    if (hasLiveQuote && typeof live?.changePct === 'number') {
      changePct = live.changePct;
    } else if (!isLive) {
      changePct = base.changePct;
    }

    const prevClose = live?.prevClose && live.prevClose > 0
      ? live.prevClose
      : (base.prevClose || Number((price / (1 + (changePct || 0.0001) / 100)).toFixed(2)));

    // Mathematical Point Impact: BaseSpot * (Weight / 100) * (ChangePct / 100)
    const pointImpact = Number((baseSpot * (base.weight / 100) * (changePct / 100)).toFixed(2));
    const trend = resolveTrend(changePct);

    // Volume & Dynamic Relative Volume (RVOL)
    const avgVolume = NIFTY_50_ADV_20D[base.symbol] || base.avgVolume || 2000000;
    let volume: number | undefined;

    if (hasLiveQuote) {
      volume = typeof live?.volume === 'number' && live.volume > 0 ? live.volume : 0;
    } else if (!isLive) {
      volume = base.volume || NIFTY_50_SNAPSHOT_VOLUME[base.symbol] || Math.round(avgVolume * 1.05);
    } else {
      // In live mode with no quote, strictly 0 volume (zero contamination)
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
  if (advancingWeight >= 65 && advances >= 32) breadthVelocity = 'EXPANDING_BULLISH';
  else if (advancingWeight >= 55) breadthVelocity = 'MODERATE_BULLISH';
  else if (decliningWeight >= 65 && declines >= 32) breadthVelocity = 'EXPANDING_BEARISH';
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

  // 3. Aggregate Sector Analysis across all official sectors
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
  // Continuous 1-sigma expected move: Spot * (VIX / 100) / sqrt(252)
  const effectiveVix = Math.max(9.0, Math.min(60.0, vix));
  const expected1DayMove = Math.max(40, Number((spotPrice * (effectiveVix / 100) / Math.sqrt(252)).toFixed(1)));
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
    .filter(s => s.pointImpact > 0.05)
    .slice(0, 4)
    .map(s => ({ symbol: s.symbol, weight: s.weight, changePct: s.changePct, points: s.pointImpact }));

  const keyNegativeDraggers = [...sortedByPointsDesc]
    .reverse()
    .filter(s => s.pointImpact < -0.05)
    .slice(0, 4)
    .map(s => ({ symbol: s.symbol, weight: s.weight, changePct: s.changePct, points: s.pointImpact }));

  // Confirmation Signals Matrix
  // Signal 1: Heavyweight Hegemony (Top 5: HDFCBANK, RELIANCE, ICICIBANK, INFY, TCS ~33.5% weight)
  const top5Symbols = ['HDFCBANK', 'RELIANCE', 'ICICIBANK', 'INFY', 'TCS'];
  const top5Stocks = analyzedStocks.filter(s => top5Symbols.includes(s.symbol));
  const top5NetPoints = top5Stocks.reduce((sum, s) => sum + s.pointImpact, 0);
  const top5Score = Math.max(-100, Math.min(100, (top5NetPoints / (expected1DayMove * 0.40)) * 100));
  const top5Status = top5Score > 20 ? 'CONFIRMED' : top5Score < -20 ? 'CONFIRMED' : 'DIVERGENT';

  // Signal 2: Weighted Breadth (Advancing Weight - Declining Weight)
  const breadthScore = advancingWeight - decliningWeight;
  const breadthStatus = Math.abs(breadthScore) >= 20 ? 'CONFIRMED' : 'DIVERGENT';

  // Signal 3: Sector Synchrony (Leading sectors alignment)
  const financialSector = sectors.find(s => s.name === 'Financial Services');
  const itSector = sectors.find(s => s.name === 'Information Technology');
  const energySector = sectors.find(s => s.name.includes('Oil Gas'));
  const sectorCountBullish = [financialSector, itSector, energySector].filter(s => s && s.weightedReturn > 0.1).length;
  const sectorCountBearish = [financialSector, itSector, energySector].filter(s => s && s.weightedReturn < -0.1).length;
  
  let sectorScore = 0;
  if (sectorCountBullish >= 2) sectorScore = 65;
  else if (sectorCountBearish >= 2) sectorScore = -65;
  const sectorStatus = Math.abs(sectorScore) >= 50 ? 'CONFIRMED' : 'NEUTRAL';

  // Signal 4: Microstructure Volatility Stretch
  const volStretchRatio = netPointImpact / expected1DayMove;
  const volStretchScore = Math.max(-100, Math.min(100, volStretchRatio * 100));

  // Signal 5: Traded Turnover Flow & Institutional RVOL Conviction
  const volumeFlowDelta = advancingVolumePct - decliningVolumePct; // -100 to +100
  const top5AvgRvol = top5Stocks.length > 0
    ? Number((top5Stocks.reduce((sum, s) => sum + (s.relativeVolume || 1.0), 0) / top5Stocks.length).toFixed(2))
    : 1.0;

  let volumeStatus: ConfirmationSignal['status'] = 'NEUTRAL';
  const volumeScore = Math.max(-100, Math.min(100, volumeFlowDelta));

  if (netPointImpact > 10) {
    if (volumeFlowDelta >= 15) {
      volumeStatus = 'CONFIRMED';
    } else if (volumeFlowDelta <= -15) {
      volumeStatus = 'DIVERGENT';
    }
  } else if (netPointImpact < -10) {
    if (volumeFlowDelta <= -15) {
      volumeStatus = 'CONFIRMED';
    } else if (volumeFlowDelta >= 15) {
      volumeStatus = 'DIVERGENT';
    }
  } else {
    volumeStatus = Math.abs(volumeFlowDelta) >= 30 ? 'CONFIRMED' : 'NEUTRAL';
  }

  const confirmationSignals: ConfirmationSignal[] = [
    {
      id: 'HEAVYWEIGHT_ALIGNMENT',
      name: 'Top-5 Heavyweights Hegemony',
      status: top5Status,
      score: Number(top5Score.toFixed(1)),
      details: `Top 5 constituents contribute ${top5NetPoints > 0 ? '+' : ''}${top5NetPoints.toFixed(1)} pts (${top5Stocks.filter(s => s.changePct > 0).length}/5 positive).`,
      weight: 0.30
    },
    {
      id: 'FREE_FLOAT_BREADTH',
      name: 'Free-Float Weight Breadth',
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
      details: `${advancingVolumePct}% Inflow vs ${decliningVolumePct}% Outflow (₹${totalTurnoverCr.toFixed(0)} Cr turnover, Top-5 RVOL: ${top5AvgRvol.toFixed(1)}x).`,
      weight: 0.20
    },
    {
      id: 'CORE_SECTOR_SYNCHRONY',
      name: 'Core Sector Synchrony (Bank/IT/Energy)',
      status: sectorStatus,
      score: sectorScore,
      details: `Fin: ${financialSector?.weightedReturn ?? 0}% | IT: ${itSector?.weightedReturn ?? 0}% | Energy: ${energySector?.weightedReturn ?? 0}%.`,
      weight: 0.15
    },
    {
      id: 'VOLATILITY_ABSORPTION',
      name: '1-Sigma Volatility Stretch',
      status: Math.abs(volStretchScore) >= 35 ? 'CONFIRMED' : 'NEUTRAL',
      score: Number(volStretchScore.toFixed(1)),
      details: `Net move ${netPointImpact > 0 ? '+' : ''}${netPointImpact.toFixed(1)} pts is ${(Math.abs(volStretchRatio) * 100).toFixed(0)}% of 1σ move (±${expected1DayMove} pts).`,
      weight: 0.10
    }
  ];

  // Quantitative Trend Score (-100 to +100)
  const weightedSignalScore = confirmationSignals.reduce((acc, sig) => acc + sig.score * sig.weight, 0);
  const trendScore = Number(Math.max(-100, Math.min(100, weightedSignalScore)).toFixed(1));

  let direction: PredictionLevels['direction'] = 'NEUTRAL_CHOPPY';
  if (trendScore >= 40) direction = 'STRONG_BULLISH';
  else if (trendScore >= 15) direction = 'MODERATE_BULLISH';
  else if (trendScore <= -40) direction = 'STRONG_BEARISH';
  else if (trendScore <= -15) direction = 'MODERATE_BEARISH';

  const confidencePct = Math.min(95, Math.max(45, Math.round(
    (Math.abs(breadthScore) * 0.4 + Math.abs(top5Score) * 0.4 + (confirmationSignals.filter(s => s.status === 'CONFIRMED').length / confirmationSignals.length) * 20)
  )));

  // Generate Institutional Smart Money Roadmap & Gap Structure
  const smartRoadmap = buildSmartMoneyRoadmap({
    spotPrice,
    prevClose: pivot,
    dayOpen: spotOpen,
    dayHigh: spotHigh,
    dayLow: spotLow,
    vix: effectiveVix
  });

  const tacticalSupport = smartRoadmap.tacticalLevels.find(l => l.type === 'DIP_BUYING_SHELF')?.price;
  const tacticalResistance = smartRoadmap.tacticalLevels.find(l => l.type === 'PULLBACK_RESISTANCE')?.price;
  const tacticalStopLoss = smartRoadmap.actionSignal.invalidationPrice;

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
    summary: `${direction.replace('_', ' ')} (Score: ${trendScore > 0 ? '+' : ''}${trendScore}) | Net ${netPointImpact > 0 ? '+' : ''}${netPointImpact.toFixed(1)} pts | 1σ daily band [${s1_sigma} - ${r1_sigma}].`,
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
    expected1DayMove
  };
}
