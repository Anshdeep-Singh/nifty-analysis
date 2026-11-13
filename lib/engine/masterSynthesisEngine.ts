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

export interface MasterSynthesisInputs {
  symbol: 'NIFTY' | 'BANKNIFTY';
  spotPrice: number;
  spotNetChange: number;
  spotPrevClose: number;
  spotOpen?: number;
  spotHigh?: number;
  spotLow?: number;
  vix: number;
  advancesDeclines: AdvancesDeclinesSummary;
  stocks: Nifty50Stock[];
  sectors: SectorAnalysis[];
  coDependency?: CoDependencySummary;
  impulseAttribution?: ImpulseAttribution;
  smartRoadmap?: SmartMoneyRoadmapState;
  greeks?: OptionGreeksMetrics;
  rolling30mPrediction?: Rolling30mPrediction;
}

export function synthesizeExecutiveMasterCockpit(inputs: MasterSynthesisInputs): ExecutiveMasterSynthesis {
  const {
    symbol,
    spotPrice,
    spotNetChange,
    spotPrevClose,
    spotHigh = spotPrice,
    spotLow = spotPrice,
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
  const pointScale = isBankNifty ? 2.5 : 1.0;
  const indexLabel = isBankNifty ? 'Bank Nifty' : 'Nifty';
  const totalStocksCount = stocks.length || (isBankNifty ? 12 : 50);

  // 1. Retail Stop-Loss Clustering & Liquidity Sweep Logic
  const slBuffer = isBankNifty ? Math.max(35, Math.round(spotPrice * 0.001)) : Math.max(15, Math.round(spotPrice * 0.0008));
  const effectiveDayLow = Math.min(spotLow, spotPrice);
  const effectiveDayHigh = Math.max(spotHigh, spotPrice);

  const longStopLow = Math.round((effectiveDayLow - slBuffer) / 5) * 5;
  const longStopHigh = Math.round(effectiveDayLow / 5) * 5;

  const shortStopLow = Math.round(effectiveDayHigh / 5) * 5;
  const shortStopHigh = Math.round((effectiveDayHigh + slBuffer) / 5) * 5;

  // Determine Trap / Liquidity Sweep State
  let trapState: RetailLiquidityPool['trapState'] = 'NO_TRAP';
  let trapExplanation = 'Price is trading inside normal session auction limits with no stop runs triggered.';

  const isNearDayLow = spotPrice <= effectiveDayLow + (slBuffer * 0.5);
  const isNearDayHigh = spotPrice >= effectiveDayHigh - (slBuffer * 0.5);

  const hasCulpritConcentration = Boolean(
    impulseAttribution &&
    impulseAttribution.isImpulseDetected &&
    (impulseAttribution.concentrationRatio1 > 0.55 || impulseAttribution.causeType === 'SINGLE_STOCK_CULPRIT')
  );

  const isBreadthDivergent =
    (spotNetChange < 0 && advancesDeclines.advances >= totalStocksCount * 0.45) ||
    (spotNetChange > 0 && advancesDeclines.declines >= totalStocksCount * 0.45);

  const isDealerShortGamma = greeks?.gexRegime === 'DEALER_SHORT_GAMMA_CASCADE';
  const isDealerLongGamma = greeks?.gexRegime === 'DEALER_LONG_GAMMA_PIN';

  if (isNearDayLow) {
    if (hasCulpritConcentration || isBreadthDivergent || isDealerLongGamma) {
      trapState = 'LONG_STOP_HUNT_SWEEP';
      trapExplanation = `Spot is hovering around the Day's Low (${longStopHigh}). Because broad market volume is not participating, institutions are hunting retail stop-loss orders placed just below ${longStopHigh} before a potential snapback.`;
    } else if (isDealerShortGamma && advancesDeclines.decliningVolumePct > 65) {
      trapState = 'CASCADE_CONFIRMED';
      trapExplanation = `Spot has breached retail stop levels at ${longStopHigh} with broad institutional volume flow (${advancesDeclines.decliningVolumePct.toFixed(0)}% declining turnover). This is a confirmed waterfall cascade, not a fakeout.`;
    } else {
      trapState = 'LONG_STOP_HUNT_SWEEP';
      trapExplanation = `Retail traders who bought today have stops clustered between ${longStopLow} and ${longStopHigh}. Watch for quick wick rejections.`;
    }
  } else if (isNearDayHigh) {
    if (hasCulpritConcentration || isBreadthDivergent || isDealerLongGamma) {
      trapState = 'SHORT_SQUEEZE_SWEEP';
      trapExplanation = `Spot is probing Day High (${shortStopLow}). Call sellers are absorbing buying, meaning retail breakout traders risk getting trapped on an exhaustion wick.`;
    } else {
      trapState = 'NO_TRAP';
      trapExplanation = `Spot is testing high of the day with healthy breadth. Retail shorts have stops sitting between ${shortStopLow} and ${shortStopHigh}.`;
    }
  }

  const liquidityPool: RetailLiquidityPool = {
    longStopZone: {
      high: longStopHigh,
      low: longStopLow,
      label: `Retail Long Stops (${longStopLow} – ${longStopHigh})`
    },
    shortStopZone: {
      high: shortStopHigh,
      low: shortStopLow,
      label: `Retail Short Stops (${shortStopLow} – ${shortStopHigh})`
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
  } else if (spotNetChange > (35 * pointScale) && advancesDeclines.advancingVolumePct > 60) {
    headlineStatus = 'BULLISH_TREND';
    badge = '🚀 Clean Bullish Trend (Broad Buying Support)';
    badgeColor = 'emerald';
  } else if (spotNetChange < (-35 * pointScale) && advancesDeclines.decliningVolumePct > 60) {
    headlineStatus = 'BEARISH_CASCADE';
    badge = '📉 Genuine Bearish Trend (Broad Selling)';
    badgeColor = 'rose';
  } else if (coDependency && coDependency.marketRegime === 'INTERNAL_SECTOR_ROTATION') {
    headlineStatus = 'RANGE_TUG_OF_WAR';
    badge = '⚔️ Tug-of-War (Sectors Fighting / Range Bound)';
    badgeColor = 'amber';
  }

  // 3. Plain English Narrative Generation
  const changePtsAbs = Math.abs(spotNetChange).toFixed(0);
  const directionWord = spotNetChange >= 0 ? 'up' : 'down';
  const culprit = impulseAttribution?.culprit;

  let whatsHappening = '';
  if (hasCulpritConcentration && culprit) {
    const culpritPts = Math.abs(culprit.pointImpact).toFixed(0);
    const culpritPct = culprit.pctOfDirectionalMove ? culprit.pctOfDirectionalMove.toFixed(0) : '70+';
    whatsHappening = `${indexLabel} is ${directionWord} ${changePtsAbs} points, but ${culpritPts} points (~${culpritPct}%) of this move is caused by just ${culprit.name || culprit.symbol} (${culprit.changePct > 0 ? '+' : ''}${culprit.changePct.toFixed(1)}%). The move is heavily concentrated rather than broad market participation.`;
  } else if (Math.abs(spotNetChange) < 25 * pointScale) {
    whatsHappening = `${indexLabel} is trading virtually flat (${spotNetChange >= 0 ? '+' : ''}${spotNetChange.toFixed(1)} pts). Neither buyers nor sellers have established intraday control.`;
  } else {
    whatsHappening = `${indexLabel} is ${directionWord} ${changePtsAbs} points (${spotNetChange >= 0 ? '+' : ''}${((spotNetChange / spotPrevClose) * 100).toFixed(2)}%) driven by steady sector-wide movement across key heavyweights.`;
  }

  let broaderMarket = '';
  const advCount = advancesDeclines.advances;
  const decCount = advancesDeclines.declines;
  const inflowPct = advancesDeclines.advancingVolumePct.toFixed(0);
  const outflowPct = advancesDeclines.decliningVolumePct.toFixed(0);

  if (isBreadthDivergent) {
    broaderMarket = `Warning: Divergence between price and market breadth. While the index is ${directionWord}, ${advCount} stocks are green and ${decCount} are red, with ${inflowPct}% of rupee turnover in advancing stocks. This confirms the index move is artificial.`;
  } else if (spotNetChange >= 0 && advCount > decCount * 1.5) {
    broaderMarket = `Broad market is healthy: ${advCount} out of ${totalStocksCount} stocks are green, commanding ${inflowPct}% of total traded rupee volume.`;
  } else if (spotNetChange < 0 && decCount > advCount * 1.5) {
    broaderMarket = `Broad market weakness: ${decCount} out of ${totalStocksCount} stocks are in the red, with ${outflowPct}% of rupee volume in falling stocks.`;
  } else {
    broaderMarket = `Mixed market breadth: ${advCount} advancing vs ${decCount} declining. Money flow is split (${inflowPct}% in green vs ${outflowPct}% in red). Expect choppy rotations.`;
  }

  let bigPlayerPosition = '';
  const putWall = greeks?.putWall || (smartRoadmap?.macro1SigmaLower ? Math.round(smartRoadmap.macro1SigmaLower / 50) * 50 : Math.round((spotPrice - 100 * pointScale) / 50) * 50);
  const callWall = greeks?.callWall || (smartRoadmap?.macro1SigmaUpper ? Math.round(smartRoadmap.macro1SigmaUpper / 50) * 50 : Math.round((spotPrice + 100 * pointScale) / 50) * 50);
  const pcr = greeks?.pcrRatio ? greeks.pcrRatio.toFixed(2) : '1.0';

  if (greeks?.oiVelocityRegime === 'CALL_ADDITION_RESISTANCE') {
    bigPlayerPosition = `Big institutional option writers are actively adding Call positions at ₹${callWall}, capping upside rallies. However, Put sellers are holding firm at ₹${putWall} (PCR: ${pcr}).`;
  } else if (greeks?.oiVelocityRegime === 'PUT_ADDITION_SUPPORT') {
    bigPlayerPosition = `Option sellers are actively building a safety floor with heavy Put additions at ₹${putWall}. Downside dips are likely to get absorbed quickly (PCR: ${pcr}).`;
  } else if (greeks?.oiVelocityRegime === 'BULLISH_SHORT_COVERING') {
    bigPlayerPosition = `Bearish traders are getting squeezed and covering short positions, providing an underlying bid to the market.`;
  } else {
    bigPlayerPosition = `Institutional option sellers have built a hard support floor at ₹${putWall} (Put Wall) and a ceiling at ₹${callWall} (Call Wall). Current market PCR is ${pcr}.`;
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

  if (headlineStatus === 'FAKE_BREAKDOWN_TRAP') {
    actionBias = 'AVOID_PUTS';
    doNotDo = `⚠️ DO NOT chase Put option buys down here. The drop is heavily single-stock driven or hitting the ${hardFloorPrice} Put Wall with high risk of sudden IV crush.`;
    opportunity = `💡 Look for quick bounce scalps or Call debit/credit spreads if price dips to the stop-hunt zone (${longStopLow}–${longStopHigh}) and swiftly reclaims ${effectiveDayLow}.`;
    strictInvalidation = `🛑 If a 15-minute candle firmly closes below ₹${longStopLow}, the trap setup is dead. Exit all long bounce bets immediately.`;
  } else if (headlineStatus === 'FAKE_BREAKOUT_TRAP') {
    actionBias = 'AVOID_CALLS';
    doNotDo = `⚠️ DO NOT chase breakout Call buys near ₹${hardCeilingPrice}. Heavy call writing is capping upside momentum.`;
    opportunity = `💡 Wait for rejection wicks near ₹${shortStopHigh} to sell out-of-the-money Call credit spreads or scalp mean reversion back to VWAP.`;
    strictInvalidation = `🛑 Invalidation: A sustained 15m close above ₹${shortStopHigh} with rising turnover flips the market into a runaway short squeeze.`;
  } else if (headlineStatus === 'BEARISH_CASCADE') {
    actionBias = 'TREND_FOLLOW';
    doNotDo = `⚠️ DO NOT try to catch falling knives or blindly buy calls just because the market 'has fallen a lot'.`;
    opportunity = `💡 Look to sell Bear Call spreads on any weak pullbacks towards VWAP / ₹${Math.round(spotPrice + 35 * pointScale)}.`;
    strictInvalidation = `🛑 Invalidation: A 15m candle reclaim above the session pivot / ₹${Math.round(spotPrice + 50 * pointScale)} halts the cascade.`;
  } else if (headlineStatus === 'BULLISH_TREND') {
    actionBias = 'TREND_FOLLOW';
    doNotDo = `⚠️ DO NOT try to short or pick the top against strong institutional volume flow.`;
    opportunity = `💡 Buy dips into 5m EMA 20 / VWAP support shelves or sell Bull Put spreads safely below ₹${hardFloorPrice}.`;
    strictInvalidation = `🛑 Invalidation: A drop back below ₹${Math.round(spotPrice - 40 * pointScale)} signals momentum exhaustion.`;
  } else {
    actionBias = 'STAND_ASIDE';
    doNotDo = `⚠️ DO NOT overtrade directional momentum. In a chop/rotation regime, naked option buys will suffer severe theta decay.`;
    opportunity = `💡 Premium sellers can harvest sideways carry via OTM Credit Spreads outside the ₹${hardFloorPrice}–₹${hardCeilingPrice} corridor.`;
    strictInvalidation = `🛑 Invalidation: Clean 15m breakout above ₹${hardCeilingPrice} or breakdown below ₹${hardFloorPrice}.`;
  }

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
    techSpecs: {
      gammaFlip: greeks?.gammaFlip || 0,
      putWall: greeks?.putWall || hardFloorPrice,
      callWall: greeks?.callWall || hardCeilingPrice,
      culpritSymbol: culprit?.symbol,
      culpritContributionPct: culprit?.pctOfDirectionalMove,
      dealerRegime: greeks?.gexRegime || 'TRANSITIONAL_BORDER',
      advancingTurnoverPct: advancesDeclines.advancingVolumePct,
      decliningTurnoverPct: advancesDeclines.decliningVolumePct,
      oiVelocityRegime: greeks?.oiVelocityRegime || 'BALANCED_FLOW'
    }
  };
}
