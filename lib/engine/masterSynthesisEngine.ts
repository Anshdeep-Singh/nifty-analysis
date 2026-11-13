import {
  AdvancesDeclinesSummary,
  CoDependencySummary,
  ExecutiveMasterSynthesis,
  ImpulseAttribution,
  Nifty50Stock,
  OptionGreeksMetrics,
  RetailLiquidityPool,
  Rolling30mPrediction,
  SectorAnalysis,
  SmartMoneyRoadmapState
} from '../types';
import { evaluateGapProbability, GapPredictionResult, DailyCandleBar } from './gapProbabilityEngine';

export interface MasterSynthesisInputs {
  symbol: 'NIFTY' | 'BANKNIFTY';
  spotPrice: number;
  spotNetChange?: number;
  spotPrevClose?: number;
  spotOpen?: number;
  spotHigh?: number;
  spotLow?: number;
  vix?: number;
  advancesDeclines?: AdvancesDeclinesSummary;
  stocks?: Nifty50Stock[];
  sectors?: SectorAnalysis[];
  coDependency?: CoDependencySummary;
  impulseAttribution?: ImpulseAttribution;
  smartRoadmap?: SmartMoneyRoadmapState;
  greeks?: OptionGreeksMetrics;
  rolling30mPrediction?: Rolling30mPrediction;
  gapDynamics?: GapPredictionResult;
  dailyCandles?: DailyCandleBar[];
}

export function synthesizeExecutiveMasterCockpit(inputs: MasterSynthesisInputs): ExecutiveMasterSynthesis {
  const {
    symbol,
    spotPrice,
    spotNetChange,
    spotPrevClose,
    spotOpen,
    spotHigh,
    spotLow,
    vix,
    advancesDeclines,
    stocks,
    sectors,
    coDependency,
    impulseAttribution,
    smartRoadmap,
    greeks,
    rolling30mPrediction
  } = inputs;

  const isBankNifty = symbol === 'BANKNIFTY';
  const strikeStep = isBankNifty ? 100 : 50;
  const pointScale = isBankNifty ? 2.5 : 1.0;
  const indexLabel = isBankNifty ? 'Bank Nifty' : 'Nifty';
  const totalStocksCount = (stocks && stocks.length > 0) ? stocks.length : (isBankNifty ? 12 : 50);

  // 0. Strict input sanitization against zero / NaN / uninitialized broker feeds
  const safeSpot = typeof spotPrice === 'number' && Number.isFinite(spotPrice) && spotPrice > 0 ? spotPrice : (isBankNifty ? 55000 : 25000);
  const safePrevClose = typeof spotPrevClose === 'number' && Number.isFinite(spotPrevClose) && spotPrevClose > 0 ? spotPrevClose : safeSpot;
  const safeNetChange = typeof spotNetChange === 'number' && Number.isFinite(spotNetChange)
    ? spotNetChange
    : Number((safeSpot - safePrevClose).toFixed(2));
  const safeVix = typeof vix === 'number' && Number.isFinite(vix) && vix > 0 ? vix : 15.0;

  const validLow = typeof spotLow === 'number' && Number.isFinite(spotLow) && spotLow > 0 ? spotLow : safeSpot;
  const validHigh = typeof spotHigh === 'number' && Number.isFinite(spotHigh) && spotHigh > 0 ? spotHigh : safeSpot;
  const effectiveDayLow = Math.min(validLow, safeSpot);
  const effectiveDayHigh = Math.max(validHigh, safeSpot);

  const safeAD: AdvancesDeclinesSummary = advancesDeclines || {
    advances: 0,
    declines: 0,
    unchanged: totalStocksCount,
    advancingWeight: 0,
    decliningWeight: 0,
    unchangedWeight: 100,
    adRatio: 1.0,
    breadthVelocity: 'BALANCED',
    totalTurnoverCr: 0,
    advancingTurnoverCr: 0,
    decliningTurnoverCr: 0,
    advancingVolumePct: 50,
    decliningVolumePct: 50,
    volumeBreadthRatio: 1.0,
    volumeConviction: 'NEUTRAL_FLOW'
  };

  // 1. Retail Stop-Loss Clustering & Liquidity Sweep Logic
  const slBuffer = isBankNifty ? Math.max(35, Math.round(safeSpot * 0.001)) : Math.max(15, Math.round(safeSpot * 0.0008));
  const longStopLow = Math.round((effectiveDayLow - slBuffer) / 5) * 5;
  const longStopHigh = Math.round(effectiveDayLow / 5) * 5;

  const shortStopLow = Math.round(effectiveDayHigh / 5) * 5;
  const shortStopHigh = Math.round((effectiveDayHigh + slBuffer) / 5) * 5;

  // Determine Trap / Liquidity Sweep State
  let trapState: RetailLiquidityPool['trapState'] = 'NO_TRAP';
  let trapExplanation = 'Price is trading inside normal session auction limits with no stop runs triggered.';

  const isNearDayLow = safeSpot <= effectiveDayLow + (slBuffer * 0.5);
  const isNearDayHigh = safeSpot >= effectiveDayHigh - (slBuffer * 0.5);

  const hasCulpritConcentration = Boolean(
    impulseAttribution &&
    impulseAttribution.isImpulseDetected &&
    (impulseAttribution.concentrationRatio1 >= 0.55 || impulseAttribution.causeType === 'SINGLE_STOCK_CULPRIT')
  );

  const isBreadthDivergent =
    (safeNetChange < 0 && safeAD.advances >= totalStocksCount * 0.45) ||
    (safeNetChange > 0 && safeAD.declines >= totalStocksCount * 0.45);

  const isDealerShortGamma = greeks?.gexRegime === 'DEALER_SHORT_GAMMA_CASCADE';
  const isDealerLongGamma = greeks?.gexRegime === 'DEALER_LONG_GAMMA_PIN';

  if (isNearDayLow) {
    if (hasCulpritConcentration || isBreadthDivergent || (isDealerLongGamma && safeAD.decliningVolumePct < 55)) {
      trapState = 'LONG_STOP_HUNT_SWEEP';
      trapExplanation = `Spot is probing the Day's Low (₹${longStopHigh.toLocaleString('en-IN')}). Because broad market volume is divergent (${safeAD.advancingVolumePct.toFixed(0)}% advancing turnover), institutions are hunting retail stop-loss orders just below ₹${longStopHigh.toLocaleString('en-IN')} before a potential snapback.`;
    } else if (safeAD.decliningVolumePct >= 60 || safeAD.declines >= totalStocksCount * 0.6 || (isDealerShortGamma && safeAD.decliningVolumePct > 55)) {
      trapState = 'CASCADE_CONFIRMED';
      trapExplanation = `Spot has breached retail stop levels at ₹${longStopHigh.toLocaleString('en-IN')} with broad institutional volume flow (${safeAD.decliningVolumePct.toFixed(0)}% declining turnover, ${safeAD.declines} stocks down). Confirmed waterfall cascade in progress.`;
    } else {
      trapState = 'NO_TRAP';
      trapExplanation = `Spot is trading near session low. Retail stop-loss clusters sit between ₹${longStopLow.toLocaleString('en-IN')} and ₹${longStopHigh.toLocaleString('en-IN')}. Awaiting directional breakout confirmation.`;
    }
  } else if (isNearDayHigh) {
    if (hasCulpritConcentration || isBreadthDivergent || (isDealerLongGamma && safeAD.advancingVolumePct < 55)) {
      trapState = 'SHORT_SQUEEZE_SWEEP';
      trapExplanation = `Spot is probing Day High (₹${shortStopLow.toLocaleString('en-IN')}). Lack of broad buying participation (${safeAD.decliningVolumePct.toFixed(0)}% declining volume) indicates an exhaustion wick or retail breakout trap.`;
    } else if (safeAD.advancingVolumePct >= 60 || safeAD.advances >= totalStocksCount * 0.6) {
      trapState = 'NO_TRAP';
      trapExplanation = `Spot is breaking Day High with solid broad participation (${safeAD.advancingVolumePct.toFixed(0)}% advancing turnover, ${safeAD.advances} stocks up). Upside continuation supported.`;
    } else {
      trapState = 'NO_TRAP';
      trapExplanation = `Spot is testing high of the day. Retail shorts have stops sitting between ₹${shortStopLow.toLocaleString('en-IN')} and ₹${shortStopHigh.toLocaleString('en-IN')}.`;
    }
  }

  const liquidityPool: RetailLiquidityPool = {
    longStopZone: {
      high: longStopHigh,
      low: longStopLow,
      label: `Retail Long Stops (₹${longStopLow.toLocaleString('en-IN')} – ₹${longStopHigh.toLocaleString('en-IN')})`
    },
    shortStopZone: {
      high: shortStopHigh,
      low: shortStopLow,
      label: `Retail Short Stops (₹${shortStopLow.toLocaleString('en-IN')} – ₹${shortStopHigh.toLocaleString('en-IN')})`
    },
    trapState,
    explanation: trapExplanation
  };

  // 2. Headline State Classification (Layman Category)
  let headlineStatus: ExecutiveMasterSynthesis['headlineState']['status'] = 'ORDERLY_CONSOLIDATION';
  let badge = '⚪ Range Consolidation / Waiting for Trigger';
  let badgeColor: ExecutiveMasterSynthesis['headlineState']['badgeColor'] = 'cyan';

  if (trapState === 'LONG_STOP_HUNT_SWEEP') {
    headlineStatus = 'FAKE_BREAKDOWN_TRAP';
    badge = '🔴 Falling, but High Risk of a Trap / Fake Breakdown';
    badgeColor = 'rose';
  } else if (trapState === 'SHORT_SQUEEZE_SWEEP') {
    headlineStatus = 'FAKE_BREAKOUT_TRAP';
    badge = '🟢 Rising, but Looks like a Trap / Fake Breakout';
    badgeColor = 'amber';
  } else if (trapState === 'CASCADE_CONFIRMED') {
    headlineStatus = 'BEARISH_CASCADE';
    badge = '⚠️ Heavy Selling Cascade (Sellers in Full Control)';
    badgeColor = 'rose';
  } else if (safeNetChange > (35 * pointScale) && safeAD.advancingVolumePct > 60) {
    headlineStatus = 'BULLISH_TREND';
    badge = '🚀 Clean Bullish Trend (Broad Buying Support)';
    badgeColor = 'emerald';
  } else if (safeNetChange < (-35 * pointScale) && safeAD.decliningVolumePct > 60) {
    headlineStatus = 'BEARISH_CASCADE';
    badge = '📉 Genuine Bearish Trend (Broad Selling)';
    badgeColor = 'rose';
  } else if (coDependency && coDependency.marketRegime === 'INTERNAL_SECTOR_ROTATION') {
    headlineStatus = 'RANGE_TUG_OF_WAR';
    badge = '⚔️ Tug-of-War (Sectors Fighting / Range Bound)';
    badgeColor = 'amber';
  }

  // 3. Plain English Narrative Generation
  const changePtsAbs = Math.abs(safeNetChange).toFixed(0);
  const directionWord = safeNetChange >= 0 ? 'up' : 'down';
  const culprit = impulseAttribution?.culprit;

  let whatsHappening = '';
  if (hasCulpritConcentration && culprit) {
    const culpritPts = Math.abs(culprit.pointImpact).toFixed(0);
    const culpritPct = culprit.pctOfDirectionalMove ? culprit.pctOfDirectionalMove.toFixed(0) : '70+';
    whatsHappening = `${indexLabel} is ${directionWord} ${changePtsAbs} points, but ${culpritPts} points (~${culpritPct}%) of this move is caused by just ${culprit.name || culprit.symbol} (${culprit.changePct > 0 ? '+' : ''}${culprit.changePct.toFixed(1)}%). The move is heavily concentrated rather than broad market participation.`;
  } else if (Math.abs(safeNetChange) < 25 * pointScale) {
    whatsHappening = `${indexLabel} is trading virtually flat (${safeNetChange >= 0 ? '+' : ''}${safeNetChange.toFixed(1)} pts). Neither buyers nor sellers have established intraday control.`;
  } else {
    const pctStr = safePrevClose > 0 ? ((safeNetChange / safePrevClose) * 100).toFixed(2) : '0.00';
    whatsHappening = `${indexLabel} is ${directionWord} ${changePtsAbs} points (${safeNetChange >= 0 ? '+' : ''}${pctStr}%) driven by steady sector-wide movement across key heavyweights.`;
  }

  let broaderMarket = '';
  const advCount = safeAD.advances;
  const decCount = safeAD.declines;
  const inflowPct = safeAD.advancingVolumePct.toFixed(0);
  const outflowPct = safeAD.decliningVolumePct.toFixed(0);

  if (isBreadthDivergent) {
    broaderMarket = `Warning: Divergence between price and market breadth. While the index is ${directionWord}, ${advCount} stocks are green and ${decCount} are red, with ${inflowPct}% of rupee turnover in advancing stocks. This confirms the index move is artificial.`;
  } else if (safeNetChange >= 0 && advCount > decCount * 1.5) {
    broaderMarket = `Broad market is healthy: ${advCount} out of ${totalStocksCount} stocks are green, commanding ${inflowPct}% of total traded rupee volume.`;
  } else if (safeNetChange < 0 && decCount > advCount * 1.5) {
    broaderMarket = `Broad market weakness: ${decCount} out of ${totalStocksCount} stocks are in the red, with ${outflowPct}% of rupee volume in falling stocks.`;
  } else {
    broaderMarket = `Mixed market breadth: ${advCount} advancing vs ${decCount} declining. Money flow is split (${inflowPct}% in green vs ${outflowPct}% in red). Expect choppy rotations.`;
  }

  // Calculate Put Wall and Call Wall ensuring strict support / resistance separation
  let putWall = greeks?.putWall || (smartRoadmap?.macro1SigmaLower ? Math.round(smartRoadmap.macro1SigmaLower / strikeStep) * strikeStep : Math.round((safeSpot - 100 * pointScale) / strikeStep) * strikeStep);
  let callWall = greeks?.callWall || (smartRoadmap?.macro1SigmaUpper ? Math.round(smartRoadmap.macro1SigmaUpper / strikeStep) * strikeStep : Math.round((safeSpot + 100 * pointScale) / strikeStep) * strikeStep);

  // Guarantee Put Wall is strictly below Spot, and Call Wall is strictly above Spot
  if (putWall >= safeSpot) {
    putWall = Math.floor((safeSpot - (isBankNifty ? 50 : 20)) / strikeStep) * strikeStep;
  }
  if (callWall <= safeSpot) {
    callWall = Math.ceil((safeSpot + (isBankNifty ? 50 : 20)) / strikeStep) * strikeStep;
  }
  if (callWall <= putWall) {
    callWall = putWall + strikeStep * 2;
  }

  const pcr = greeks?.pcrRatio ? greeks.pcrRatio.toFixed(2) : '1.0';

  let bigPlayerPosition = '';
  if (greeks?.oiVelocityRegime === 'CALL_ADDITION_RESISTANCE') {
    bigPlayerPosition = `Big institutional option writers are actively adding Call positions at ₹${callWall.toLocaleString('en-IN')}, capping upside rallies. However, Put sellers are holding firm at ₹${putWall.toLocaleString('en-IN')} (PCR: ${pcr}).`;
  } else if (greeks?.oiVelocityRegime === 'PUT_ADDITION_SUPPORT') {
    bigPlayerPosition = `Option sellers are actively building a safety floor with heavy Put additions at ₹${putWall.toLocaleString('en-IN')}. Downside dips are likely to get absorbed quickly (PCR: ${pcr}).`;
  } else if (greeks?.oiVelocityRegime === 'BULLISH_SHORT_COVERING') {
    bigPlayerPosition = `Bearish traders are getting squeezed and covering short positions, providing an underlying bid to the market.`;
  } else {
    bigPlayerPosition = `Institutional option sellers have built a hard support floor at ₹${putWall.toLocaleString('en-IN')} (Put Wall) and a ceiling at ₹${callWall.toLocaleString('en-IN')} (Call Wall). Current market PCR is ${pcr}.`;
  }

  // 4. Key Numbers to Watch
  const hardFloorPrice = putWall;
  const hardCeilingPrice = callWall;

  const keyLevels = {
    hardFloor: {
      price: hardFloorPrice,
      label: `₹${hardFloorPrice.toLocaleString('en-IN')}`,
      reason: 'Institutional Put Wall & Primary Demand Shelf (Major buyers defending here)'
    },
    stopHuntZone: {
      range: `₹${longStopLow.toLocaleString('en-IN')} – ₹${longStopHigh.toLocaleString('en-IN')}`,
      reason: 'Retail Stop-Loss Cluster below Day Low (Vulnerable to quick institutional wick sweeps)'
    },
    hardCeiling: {
      price: hardCeilingPrice,
      label: `₹${hardCeilingPrice.toLocaleString('en-IN')}`,
      reason: 'Institutional Call Wall & Resistance Shelf (Sellers cap upside rallies here)'
    }
  };

  // 5. Actionable Playbook (Clear Do's and Don'ts)
  let actionBias: ExecutiveMasterSynthesis['playbook']['actionBias'] = 'STAND_ASIDE';
  let doNotDo = '';
  let opportunity = '';
  let strictInvalidation = '';

  const pullbackRef = Math.round(safeSpot + 35 * pointScale);
  const pivotRef = Math.round(safeSpot + 50 * pointScale);
  const exhaustRef = Math.round(safeSpot - 40 * pointScale);

  if (headlineStatus === 'FAKE_BREAKDOWN_TRAP') {
    actionBias = 'AVOID_PUTS';
    doNotDo = `⚠️ DO NOT chase Put option buys down here. The drop is heavily single-stock driven or hitting the ₹${hardFloorPrice.toLocaleString('en-IN')} Put Wall with high risk of sudden IV crush.`;
    opportunity = `💡 Look for quick bounce scalps or Call debit/credit spreads if price dips to the stop-hunt zone (₹${longStopLow.toLocaleString('en-IN')}–₹${longStopHigh.toLocaleString('en-IN')}) and swiftly reclaims ₹${effectiveDayLow.toLocaleString('en-IN')}.`;
    strictInvalidation = `🛑 If a 15-minute candle firmly closes below ₹${longStopLow.toLocaleString('en-IN')}, the trap setup is dead. Exit all long bounce bets immediately.`;
  } else if (headlineStatus === 'FAKE_BREAKOUT_TRAP') {
    actionBias = 'AVOID_CALLS';
    doNotDo = `⚠️ DO NOT chase breakout Call buys near ₹${hardCeilingPrice.toLocaleString('en-IN')}. Heavy call writing is capping upside momentum.`;
    opportunity = `💡 Wait for rejection wicks near ₹${shortStopHigh.toLocaleString('en-IN')} to sell out-of-the-money Call credit spreads or scalp mean reversion back to VWAP.`;
    strictInvalidation = `🛑 Invalidation: A sustained 15m close above ₹${shortStopHigh.toLocaleString('en-IN')} with rising turnover flips the market into a runaway short squeeze.`;
  } else if (headlineStatus === 'BEARISH_CASCADE') {
    actionBias = 'TREND_FOLLOW';
    doNotDo = `⚠️ DO NOT try to catch falling knives or blindly buy calls just because the market 'has fallen a lot'.`;
    opportunity = `💡 Look to sell Bear Call spreads on any weak pullbacks towards VWAP / ₹${pullbackRef.toLocaleString('en-IN')}.`;
    strictInvalidation = `🛑 Invalidation: A 15m candle reclaim above the session pivot / ₹${pivotRef.toLocaleString('en-IN')} halts the cascade.`;
  } else if (headlineStatus === 'BULLISH_TREND') {
    actionBias = 'TREND_FOLLOW';
    doNotDo = `⚠️ DO NOT try to short or pick the top against strong institutional volume flow.`;
    opportunity = `💡 Buy dips into 5m EMA 20 / VWAP support shelves or sell Bull Put spreads safely below ₹${hardFloorPrice.toLocaleString('en-IN')}.`;
    strictInvalidation = `🛑 Invalidation: A drop back below ₹${exhaustRef.toLocaleString('en-IN')} signals momentum exhaustion.`;
  } else {
    actionBias = 'STAND_ASIDE';
    doNotDo = `⚠️ DO NOT overtrade directional momentum. In a chop/rotation regime, naked option buys will suffer severe theta decay.`;
    opportunity = `💡 Premium sellers can harvest sideways carry via OTM Credit Spreads outside the ₹${hardFloorPrice.toLocaleString('en-IN')}–₹${hardCeilingPrice.toLocaleString('en-IN')} corridor.`;
    strictInvalidation = `🛑 Invalidation: Clean 15m breakout above ₹${hardCeilingPrice.toLocaleString('en-IN')} or breakdown below ₹${hardFloorPrice.toLocaleString('en-IN')}.`;
  }

  const gapDynamics = inputs.gapDynamics || evaluateGapProbability({
    symbol,
    spotPrice: safeSpot,
    spotPrevClose: safePrevClose,
    spotOpen,
    spotHigh,
    spotLow,
    vix: safeVix,
    dailyCandles: inputs.dailyCandles,
    resistanceLevel: hardCeilingPrice,
    supportLevel: hardFloorPrice
  });

  return {
    headlineState: {
      status: headlineStatus,
      badge,
      badgeColor
    },
    plainSummary: {
      whatsHappening,
      broaderMarket,
      bigPlayerPosition
    },
    keyLevels,
    playbook: {
      actionBias,
      doNotDo,
      opportunity,
      strictInvalidation
    },
    liquidityPool,
    gapDynamics,
    techSpecs: {
      gammaFlip: greeks?.gammaFlip || 0,
      putWall: hardFloorPrice,
      callWall: hardCeilingPrice,
      culpritSymbol: culprit?.symbol,
      culpritContributionPct: culprit?.pctOfDirectionalMove,
      dealerRegime: greeks?.gexRegime || 'TRANSITIONAL_BORDER',
      advancingTurnoverPct: safeAD.advancingVolumePct ?? 50,
      decliningTurnoverPct: safeAD.decliningVolumePct ?? 50,
      oiVelocityRegime: greeks?.oiVelocityRegime || 'BALANCED_FLOW'
    }
  };
}
