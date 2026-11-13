import { OptionGreeksMetrics } from '../types';

export type OptionType = 'CE' | 'PE';

export interface GreekValues {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface OptionStrikeItem {
  strike: number;
  callOi: number;
  putOi: number;
  callIv: number;
  putIv: number;
  callGreeks: GreekValues;
  putGreeks: GreekValues;
  callGexCr: number;
  putGexCr: number;
  netGexCr: number;
}

// Abramowitz and Stegun erf approximation
export function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const a = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * a);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-a * a);
  return sign * y;
}

export function normCdf(x: number): number {
  return 0.5 * (1.0 + erf(x / Math.SQRT2));
}

export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export function getTimeToExpiry(dte: number, minutesLeftInDay: number = 300): number {
  const safeDte = Math.max(0.001, dte);
  const calendarDays = Math.floor(safeDte);
  const mins = Math.max(0, Math.min(375, minutesLeftInDay));
  const sessionFraction = mins / 375.0;
  const totalDays = Math.max(0.0005, calendarDays + sessionFraction);
  return Math.max(0.00002, totalDays / 365.25);
}

export function calculateGreeks(
  spot: number,
  strike: number,
  dte: number,
  ivPct: number,
  optionType: OptionType,
  riskFreeRate: number = 0.068,
  minutesLeftInDay: number = 300
): GreekValues {
  const S = Number.isFinite(spot) && spot > 0 ? spot : (Number.isFinite(strike) && strike > 0 ? strike : 24500);
  const K = Number.isFinite(strike) && strike > 0 ? strike : S;
  const safeIv = Number.isFinite(ivPct) && ivPct > 0 ? ivPct : 13.5;
  const sigma = Math.max(0.01, safeIv / 100.0);
  const r = Number.isFinite(riskFreeRate) ? riskFreeRate : 0.068;

  const T = getTimeToExpiry(dte, minutesLeftInDay);
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const pdfD1 = normPdf(d1);
  const cdfD1 = normCdf(d1);
  const cdfD2 = normCdf(d2);
  const expNegRT = Math.exp(-r * T);

  // Gamma is identical for CE and PE
  const gamma = pdfD1 / (S * sigma * sqrtT);
  // Vega: ₹ change in price per 1% change in IV
  const vega = (S * pdfD1 * sqrtT) / 100.0;

  let price: number;
  let delta: number;
  let theta: number;

  if (optionType === 'CE') {
    price = S * cdfD1 - K * expNegRT * cdfD2;
    delta = cdfD1;
    theta = (-(S * pdfD1 * sigma) / (2.0 * sqrtT) - r * K * expNegRT * cdfD2) / 365.0;
  } else {
    const cdfNegD1 = normCdf(-d1);
    const cdfNegD2 = normCdf(-d2);
    price = K * expNegRT * cdfNegD2 - S * cdfNegD1;
    delta = cdfD1 - 1.0;
    theta = (-(S * pdfD1 * sigma) / (2.0 * sqrtT) + r * K * expNegRT * cdfNegD2) / 365.0;
  }

  const intrinsic = optionType === 'CE' ? Math.max(0, S - K) : Math.max(0, K - S);
  const finalPrice = Math.max(intrinsic, price);

  return {
    price: Number(Math.max(0.05, finalPrice).toFixed(2)),
    delta: Number(delta.toFixed(4)),
    gamma: Number(gamma.toFixed(6)),
    theta: Number(theta.toFixed(2)),
    vega: Number(vega.toFixed(2))
  };
}

export interface LiveOptionQuote {
  strike: number;
  type: OptionType;
  openInterest: number;
  impliedVolatility?: number;
  lastPrice?: number;
}

export function synthesizeOrComputeOptionChainGreeks(
  symbol: 'NIFTY' | 'BANKNIFTY',
  spotPrice: number,
  vix: number,
  dte: number = 3.5, // near weekly contract default ~3-4 days
  liveOptionQuotes?: LiveOptionQuote[]
): {
  metrics: OptionGreeksMetrics;
  strikes: OptionStrikeItem[];
} {
  const strikeStep = symbol === 'BANKNIFTY' ? 100 : 50;
  const safeSpot = Number.isFinite(spotPrice) && spotPrice > 0
    ? spotPrice
    : (symbol === 'BANKNIFTY' ? 52000 : 24500);
  const atmStrike = Math.round(safeSpot / strikeStep) * strikeStep;
  const numStrikesEachSide = 10;
  const baseIv = Number.isFinite(vix) && vix > 0 ? Math.max(8.0, vix) : 13.5;

  const quoteMap = new Map<string, LiveOptionQuote>();
  if (liveOptionQuotes && liveOptionQuotes.length > 0) {
    for (const q of liveOptionQuotes) {
      quoteMap.set(`${q.strike}_${q.type}`, q);
    }
  }

  const strikes: OptionStrikeItem[] = [];
  let totalCallOi = 0;
  let totalPutOi = 0;
  let totalCallGexCr = 0;
  let totalPutGexCr = 0;
  let weightedDeltaSum = 0;
  let totalOiSum = 0;

  let maxCallOi = -1;
  let callWallStrike = atmStrike + strikeStep * 2;
  let maxPutOi = -1;
  let putWallStrike = atmStrike - strikeStep * 2;

  for (let i = -numStrikesEachSide; i <= numStrikesEachSide; i++) {
    const strike = atmStrike + i * strikeStep;
    const distanceSteps = i;

    // IV Skew curve (put skew higher for OTM downside protection)
    const callSkew = distanceSteps > 0 ? distanceSteps * 0.12 : distanceSteps * 0.18;
    const putSkew = distanceSteps < 0 ? Math.abs(distanceSteps) * 0.22 : -distanceSteps * 0.10;
    const callIv = Math.max(7.0, baseIv + callSkew);
    const putIv = Math.max(7.0, baseIv + putSkew);

    // OI Resolution: Live quote or institutional statistical distribution
    const callQuote = quoteMap.get(`${strike}_CE`);
    const putQuote = quoteMap.get(`${strike}_PE`);

    const resolvedCallIv = (callQuote && callQuote.impliedVolatility && callQuote.impliedVolatility > 0)
      ? callQuote.impliedVolatility
      : callIv;
    const resolvedPutIv = (putQuote && putQuote.impliedVolatility && putQuote.impliedVolatility > 0)
      ? putQuote.impliedVolatility
      : putIv;

    const callGreeks = calculateGreeks(safeSpot, strike, dte, resolvedCallIv, 'CE');
    const putGreeks = calculateGreeks(safeSpot, strike, dte, resolvedPutIv, 'PE');

    // Realistic bell-curved OI distribution peaked around ATM and key round strikes
    const decayFactor = Math.exp(-Math.pow(distanceSteps / 4.8, 2));
    const roundStrikeBonus = strike % (strikeStep * 5) === 0 ? 1.45 : (strike % (strikeStep * 2) === 0 ? 1.15 : 1.0);
    const baseContracts = symbol === 'BANKNIFTY' ? 450000 : 1800000;
    // Asymmetric positioning: Puts heavier on downside (hedging), Calls heavier on upside (yield writing)
    const callSideMultiplier = distanceSteps >= 0 ? 1.25 : 0.75;
    const putSideMultiplier = distanceSteps <= 0 ? 1.35 : 0.70;

    let callOi = Math.round(baseContracts * decayFactor * roundStrikeBonus * callSideMultiplier);
    let putOi = Math.round(baseContracts * decayFactor * roundStrikeBonus * putSideMultiplier);

    if (callQuote && callQuote.openInterest > 0) {
      callOi = callQuote.openInterest;
    }
    if (putQuote && putQuote.openInterest > 0) {
      putOi = putQuote.openInterest;
    }

    // Call GEX = (OI * Gamma * Spot) / 100,000 (Dealer Long Gamma in ₹ Crores)
    // Put GEX = (OI * Gamma * Spot) / 100,000 (Dealer Short Gamma in ₹ Crores)
    const callGexCr = Number(((callOi * callGreeks.gamma * safeSpot) / 100000).toFixed(2));
    const putGexCr = Number(((putOi * putGreeks.gamma * safeSpot) / 100000).toFixed(2));
    const netGexCr = Number((callGexCr - putGexCr).toFixed(2));

    totalCallOi += callOi;
    totalPutOi += putOi;
    totalCallGexCr += callGexCr;
    totalPutGexCr += putGexCr;

    // Delta Vector aggregation
    weightedDeltaSum += (callOi * callGreeks.delta) + (putOi * putGreeks.delta);
    totalOiSum += (callOi + putOi);

    // Call Wall & Put Wall detection
    // Prefer overhead resistance (strike >= safeSpot) for Call Wall
    if (strike >= safeSpot && callOi > maxCallOi) {
      maxCallOi = callOi;
      callWallStrike = strike;
    }
    // Prefer downside support (strike <= safeSpot) for Put Wall
    if (strike <= safeSpot && putOi > maxPutOi) {
      maxPutOi = putOi;
      putWallStrike = strike;
    }

    strikes.push({
      strike,
      callOi,
      putOi,
      callIv: Number(callIv.toFixed(2)),
      putIv: Number(putIv.toFixed(2)),
      callGreeks,
      putGreeks,
      callGexCr,
      putGexCr,
      netGexCr
    });
  }

  // Fallbacks if one side was empty or uninitialized
  if (callWallStrike <= safeSpot || callWallStrike <= putWallStrike) {
    let fallbackMaxCall = -1;
    let fallbackCallStrike = atmStrike + strikeStep;
    for (const s of strikes) {
      if (s.strike > safeSpot && s.callOi > fallbackMaxCall) {
        fallbackMaxCall = s.callOi;
        fallbackCallStrike = s.strike;
      }
    }
    callWallStrike = fallbackCallStrike;
  }

  if (putWallStrike >= safeSpot || putWallStrike >= callWallStrike) {
    let fallbackMaxPut = -1;
    let fallbackPutStrike = atmStrike - strikeStep;
    for (const s of strikes) {
      if (s.strike < safeSpot && s.putOi > fallbackMaxPut) {
        fallbackMaxPut = s.putOi;
        fallbackPutStrike = s.strike;
      }
    }
    putWallStrike = fallbackPutStrike;
  }

  const netGexTotalCr = Number((totalCallGexCr - totalPutGexCr).toFixed(2));
  const pcrRatio = totalCallOi > 0 ? Number((totalPutOi / totalCallOi).toFixed(2)) : 1.0;
  const deltaVector = totalOiSum > 0 ? Number((weightedDeltaSum / totalOiSum).toFixed(3)) : 0;

  // Gamma Flip Strike: Strike where cumulative/strike net GEX crosses 0
  let gammaFlip = atmStrike;
  for (let k = 1; k < strikes.length; k++) {
    const prev = strikes[k - 1];
    const curr = strikes[k];
    if ((prev.netGexCr < 0 && curr.netGexCr >= 0) || (prev.netGexCr > 0 && curr.netGexCr <= 0)) {
      gammaFlip = curr.strike;
      break;
    }
  }

  // Determine Dealer GEX Regime
  let gexRegime: OptionGreeksMetrics['gexRegime'] = 'DEALER_LONG_GAMMA_PIN';
  if (Math.abs(safeSpot - gammaFlip) <= strikeStep * 0.4) {
    gexRegime = 'TRANSITIONAL_BORDER';
  } else if (netGexTotalCr < 0 || safeSpot < gammaFlip) {
    gexRegime = 'DEALER_SHORT_GAMMA_CASCADE';
  } else {
    gexRegime = 'DEALER_LONG_GAMMA_PIN';
  }

  const metrics: OptionGreeksMetrics = {
    spotPrice: safeSpot,
    vix: Number(baseIv.toFixed(2)),
    gammaFlip,
    callWall: callWallStrike,
    putWall: putWallStrike,
    netGexCr: netGexTotalCr,
    callGexCr: Number(totalCallGexCr.toFixed(2)),
    putGexCr: Number(totalPutGexCr.toFixed(2)),
    gexRegime,
    callOiTotal: totalCallOi,
    putOiTotal: totalPutOi,
    pcrRatio,
    atmIv: Number(baseIv.toFixed(2)),
    deltaVector,
    rolling30mCallOiChangePct: 0,
    rolling30mPutOiChangePct: 0,
    oiVelocityRegime: 'BALANCED_FLOW'
  };

  return { metrics, strikes };
}
