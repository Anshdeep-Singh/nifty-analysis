import {
  Nifty50Stock,
  AdvancesDeclinesSummary,
  ImpulseAttribution,
  OptionGreeksMetrics,
  Rolling30mPrediction,
  AnomalyAlert
} from '../types';

export interface SnapshotEntry {
  timestampMs: number;
  timeIST: string;
  spotPrice: number;
  netPointImpact: number;
  advancingTurnoverPct: number;
  top5HeavyweightRvol: number;
  netGexCr: number;
  callOiTotal: number;
  putOiTotal: number;
  callWall: number;
  putWall: number;
  gammaFlip: number;
  hasSingleStockAnomaly: boolean;
  hasVacuumSlippage: boolean;
  hasRotationChop: boolean;
}

// In-memory sliding buffer preserved across API invocations (up to 60 snapshots = 1-2 hours)
const globalRollingState = globalThis as unknown as {
  __HERMES_30M_ROLLING_SNAPSHOTS__?: Record<string, SnapshotEntry[]>;
};

if (!globalRollingState.__HERMES_30M_ROLLING_SNAPSHOTS__) {
  globalRollingState.__HERMES_30M_ROLLING_SNAPSHOTS__ = {
    NIFTY: [],
    BANKNIFTY: []
  };
}

export function getRollingBuffer(symbol: 'NIFTY' | 'BANKNIFTY'): SnapshotEntry[] {
  const store = globalRollingState.__HERMES_30M_ROLLING_SNAPSHOTS__!;
  if (!store[symbol]) {
    store[symbol] = [];
  }
  return store[symbol];
}

export function clearRollingBuffer(symbol?: 'NIFTY' | 'BANKNIFTY'): void {
  const store = globalRollingState.__HERMES_30M_ROLLING_SNAPSHOTS__;
  if (!store) return;
  if (symbol) {
    store[symbol] = [];
  } else {
    store.NIFTY = [];
    store.BANKNIFTY = [];
  }
}

export interface CalculateRolling30mParams {
  symbol: 'NIFTY' | 'BANKNIFTY';
  spotPrice: number;
  spotNetChange: number;
  spotPrevClose: number;
  vix: number;
  advancesDeclines: AdvancesDeclinesSummary;
  stocks: Nifty50Stock[];
  greeks: OptionGreeksMetrics;
  impulseAttribution?: ImpulseAttribution;
  anomalies?: AnomalyAlert[];
}

/**
 * Calculates continuous Expected 30-Minute Volatility Move (Points)
 * Spot * (VIX / 100) / sqrt(252 * 12.5 half-hour sessions) = Spot * (VIX / 100) / sqrt(3150)
 */
export function calculateExpected30mMove(spotPrice: number, vix: number): number {
  const safeSpot = Number.isFinite(spotPrice) && spotPrice > 0 ? spotPrice : 24500;
  const safeVix = Number.isFinite(vix) && vix > 0 ? Math.max(8.0, vix) : 13.5;
  const sigmaAnnual = safeVix / 100.0;
  const sqrtAnnualHalfHours = Math.sqrt(252 * 12.5); // ~56.1248
  const move = (safeSpot * sigmaAnnual) / sqrtAnnualHalfHours;
  return Number(Math.max(15, move).toFixed(1));
}

/**
 * 30-Minute Continuous Rolling Adaptive Regime & Directional Engine
 *
 * Integrates:
 * 1. Constituent Order Flow & Heavyweight Force (BaseSpot Point Impact, RVOL)
 * 2. Traded Turnover Breadth (Aggressive Buy vs Sell Volume Flow)
 * 3. Index Option Greeks (Dealer Net GEX, Gamma Flip, Gamma Walls)
 * 4. Rolling 30-minute Open Interest Velocity (dOI/dt)
 * 5. Microstructure Anomaly & Trap Interceptor (Single Stock Skew, Thin Air Pockets)
 */
export function evaluate30mRollingRegime({
  symbol,
  spotPrice,
  spotNetChange,
  spotPrevClose,
  vix,
  advancesDeclines,
  stocks,
  greeks,
  impulseAttribution,
  anomalies
}: CalculateRolling30mParams): {
  prediction: Rolling30mPrediction;
  updatedGreeks: OptionGreeksMetrics;
} {
  const now = Date.now();
  const timeIST = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  const buffer = getRollingBuffer(symbol);

  // 1. Identify Top 5 Heavyweights RVOL (HDFCBANK, RELIANCE, ICICIBANK, INFY, TCS)
  const top5Symbols = symbol === 'BANKNIFTY'
    ? ['HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'AXISBANK']
    : ['HDFCBANK', 'RELIANCE', 'ICICIBANK', 'INFY', 'TCS'];

  const top5Stocks = stocks.filter(s => top5Symbols.includes(s.symbol));
  let top5WeightedRvolSum = 0;
  let top5WeightSum = 0;
  for (const s of top5Stocks) {
    const rvol = (s.relativeVolume != null && Number.isFinite(s.relativeVolume) && s.relativeVolume > 0)
      ? s.relativeVolume
      : 1.0;
    top5WeightedRvolSum += rvol * s.weight;
    top5WeightSum += s.weight;
  }
  const top5HeavyweightRvol = top5WeightSum > 0 ? Number((top5WeightedRvolSum / top5WeightSum).toFixed(2)) : 1.0;

  // 2. Anomaly Flags
  const hasSingleStockAnomaly = Boolean(
    impulseAttribution?.causeType === 'SINGLE_STOCK_CULPRIT'
  );
  const hasVacuumSlippage = Boolean(
    impulseAttribution?.liquidityState === 'THIN_AIR_POCKET' ||
    impulseAttribution?.causeType === 'VACUUM_SLIPPAGE'
  );
  const hasRotationChop = Boolean(
    impulseAttribution?.causeType === 'SECTOR_ROTATION_BALANCED'
  );

  // 3. Register Current Snapshot into Rolling Circular Buffer
  const currentSnapshot: SnapshotEntry = {
    timestampMs: now,
    timeIST,
    spotPrice,
    netPointImpact: spotNetChange,
    advancingTurnoverPct: advancesDeclines.advancingVolumePct,
    top5HeavyweightRvol,
    netGexCr: greeks.netGexCr,
    callOiTotal: greeks.callOiTotal,
    putOiTotal: greeks.putOiTotal,
    callWall: greeks.callWall,
    putWall: greeks.putWall,
    gammaFlip: greeks.gammaFlip,
    hasSingleStockAnomaly,
    hasVacuumSlippage,
    hasRotationChop
  };

  // Only record new snapshot if at least 45 seconds have passed since last snapshot
  const lastSnap = buffer.length > 0 ? buffer[buffer.length - 1] : null;
  if (!lastSnap || (now - lastSnap.timestampMs) >= 45000) {
    buffer.push(currentSnapshot);
    // Prune entries older than 90 minutes (5,400,000 ms)
    while (buffer.length > 0 && (now - buffer[0].timestampMs) > 5400000) {
      buffer.shift();
    }
  }

  // 4. Find the snapshot closest to (T - 30 minutes)
  const targetTimeMs = now - 30 * 60 * 1000;
  let referenceSnap: SnapshotEntry = buffer[0] || currentSnapshot;
  let minTimeDiff = Math.abs(referenceSnap.timestampMs - targetTimeMs);

  for (const snap of buffer) {
    const diff = Math.abs(snap.timestampMs - targetTimeMs);
    if (diff < minTimeDiff) {
      minTimeDiff = diff;
      referenceSnap = snap;
    }
  }

  // 5. Compute Continuous Rolling 30m Deltas
  const pointDelta30m = Number((currentSnapshot.netPointImpact - referenceSnap.netPointImpact).toFixed(1));
  const callOiChangePct = referenceSnap.callOiTotal > 0
    ? Number((((currentSnapshot.callOiTotal - referenceSnap.callOiTotal) / referenceSnap.callOiTotal) * 100).toFixed(2))
    : 0;
  const putOiChangePct = referenceSnap.putOiTotal > 0
    ? Number((((currentSnapshot.putOiTotal - referenceSnap.putOiTotal) / referenceSnap.putOiTotal) * 100).toFixed(2))
    : 0;

  // Classify OI Velocity Regime
  let oiVelocityRegime: OptionGreeksMetrics['oiVelocityRegime'] = 'BALANCED_FLOW';
  if (callOiChangePct <= -0.8 && putOiChangePct >= -0.2) {
    oiVelocityRegime = 'BULLISH_SHORT_COVERING';
  } else if (putOiChangePct <= -0.8 && callOiChangePct >= -0.2) {
    oiVelocityRegime = 'BEARISH_LONG_UNWINDING';
  } else if (callOiChangePct >= 1.2) {
    oiVelocityRegime = 'CALL_ADDITION_RESISTANCE';
  } else if (putOiChangePct >= 1.2) {
    oiVelocityRegime = 'PUT_ADDITION_SUPPORT';
  }

  const updatedGreeks: OptionGreeksMetrics = {
    ...greeks,
    rolling30mCallOiChangePct: callOiChangePct,
    rolling30mPutOiChangePct: putOiChangePct,
    oiVelocityRegime
  };

  // 6. Expected 30-Minute Volatility Move & Target Corridors
  const expected30mMove = calculateExpected30mMove(spotPrice, vix);

  // 7. QUANTITATIVE 4-PILLAR SCORING (-100 to +100)

  // PILLAR 1: Constituent Force & 30m Drift (30% weight)
  // Scale net points against 30m expected move
  const netPointsRatio = spotNetChange / expected30mMove;
  const driftRatio = pointDelta30m / Math.max(10, expected30mMove * 0.5);
  const constituentScore = Math.max(-100, Math.min(100, (netPointsRatio * 50) + (driftRatio * 50)));

  // PILLAR 2: Order Flow Turnover Breadth & RVOL (25% weight)
  // Advancing turnover %: 50% is neutral, >65% is strong bull, <35% is strong bear
  const advTurnoverPct = advancesDeclines.advancingVolumePct;
  const turnoverDelta = (advTurnoverPct - 50) * 2.0; // range [-100, 100]
  // RVOL dampener / amplifier:
  const rvolMultiplier = top5HeavyweightRvol >= 1.3 ? 1.15 : (top5HeavyweightRvol < 0.8 ? 0.75 : 1.0);
  const volumeFlowScore = Math.max(-100, Math.min(100, turnoverDelta * rvolMultiplier));

  // PILLAR 3: Dealer GEX & 30m OI Velocity (25% weight)
  let gexOiScore = 0;
  if (greeks.gexRegime === 'DEALER_SHORT_GAMMA_CASCADE') {
    // In short gamma, dealer hedging amplifies the move in the direction of the market
    if (oiVelocityRegime === 'BULLISH_SHORT_COVERING' || spotNetChange > 0) {
      gexOiScore = 80; // Upward gamma squeeze
    } else if (oiVelocityRegime === 'BEARISH_LONG_UNWINDING' || spotNetChange < 0) {
      gexOiScore = -80; // Downward gamma cascade
    } else {
      gexOiScore = spotPrice > greeks.gammaFlip ? 45 : -45;
    }
  } else if (greeks.gexRegime === 'DEALER_LONG_GAMMA_PIN') {
    // In long gamma, dealer hedging dampens volatility and pins the market
    if (oiVelocityRegime === 'CALL_ADDITION_RESISTANCE') {
      gexOiScore = -30; // Resistance firmly holding
    } else if (oiVelocityRegime === 'PUT_ADDITION_SUPPORT') {
      gexOiScore = 30; // Support firmly holding
    } else {
      // Mean reversion pull toward Gamma Flip / midpoint
      const midpoint = (greeks.callWall + greeks.putWall) / 2;
      gexOiScore = spotPrice > midpoint ? -25 : 25;
    }
  } else {
    // Transitional Border
    gexOiScore = spotNetChange > 0 ? 20 : -20;
  }

  // PILLAR 4: Gamma Walls & Barrier Proximity (20% weight)
  let barrierScore = 0;
  const proximityThreshold = (symbol === 'BANKNIFTY' ? 100 : 50) * 0.7;
  const distToCallWall = greeks.callWall - spotPrice;
  const distToPutWall = spotPrice - greeks.putWall;

  if (distToCallWall > 0 && distToCallWall <= proximityThreshold) {
    // Spot right at Call Wall: In Long Gamma, high rejection probability; in Short Gamma, squeeze target
    barrierScore = greeks.gexRegime === 'DEALER_LONG_GAMMA_PIN' ? -50 : 40;
  } else if (distToPutWall > 0 && distToPutWall <= proximityThreshold) {
    // Spot right at Put Wall: In Long Gamma, high support bounce probability; in Short Gamma, cascade target
    barrierScore = greeks.gexRegime === 'DEALER_LONG_GAMMA_PIN' ? 50 : -40;
  } else {
    barrierScore = (constituentScore > 0 ? 25 : -25);
  }

  // Composite Weighted Score (-100 to +100)
  const compositeScore = Number((
    constituentScore * 0.30 +
    volumeFlowScore * 0.25 +
    gexOiScore * 0.25 +
    barrierScore * 0.20
  ).toFixed(1));

  // 8. Raw Confidence Calculation (Derived from Pillar Confluence)
  const pillarSigns = [
    Math.sign(constituentScore),
    Math.sign(volumeFlowScore),
    Math.sign(gexOiScore),
    Math.sign(barrierScore)
  ];
  const dominantSign = Math.sign(compositeScore);
  const alignedPillarsCount = pillarSigns.filter(s => s === dominantSign && s !== 0).length;

  let rawConfidence = 50 + alignedPillarsCount * 10 + Math.min(25, Math.abs(compositeScore) * 0.25);
  rawConfidence = Math.min(94, Math.max(35, Math.round(rawConfidence)));

  // 9. Institutional Microstructure Governor & Trap Veto
  let finalScore = compositeScore;
  let finalConfidence = rawConfidence;
  let reconciliationState: Rolling30mPrediction['reconciliationState'] = 'CONFLUENT_TREND';
  let primaryDriver = 'Confluent Constituent & Dealer Order Flow';
  let verdictHeadline = '';
  let actionablePlaybook = '';

  if (hasSingleStockAnomaly) {
    reconciliationState = 'FAKEOUT_EXHAUSTION';
    finalScore = Number((compositeScore * 0.50).toFixed(1));
    finalConfidence = Math.min(48, finalConfidence - 35);
    const culpritSym = impulseAttribution?.culprit?.symbol;
    const culpritPts = impulseAttribution?.culprit?.pointImpact;
    const isDownMove = spotNetChange < 0 || compositeScore < 0 || (culpritPts != null && culpritPts < 0);

    if (isDownMove) {
      primaryDriver = culpritSym && culpritPts != null
        ? `Single-Stock Dislocation: ${culpritSym} dragging index down alone (${culpritPts > 0 ? '+' : ''}${culpritPts.toFixed(1)} pts) against divergent breadth`
        : `Single-Stock Dislocation Trap: Leading constituent dragging move alone against divergent breadth`;
      verdictHeadline = `⚠️ FAKEOUT WARNING: Anemic Breadth (Confidence ${finalConfidence}%)`;
      actionablePlaybook = `Do NOT chase breakdown panic. High statistical probability of snap-back within 30m once single-stock block selling exhausts.`;
    } else {
      primaryDriver = culpritSym && culpritPts != null
        ? `Single-Stock Dislocation: ${culpritSym} lifting index up alone (${culpritPts > 0 ? '+' : ''}${culpritPts.toFixed(1)} pts) against divergent breadth`
        : `Single-Stock Dislocation Trap: Leading constituent carrying move alone against divergent breadth`;
      verdictHeadline = `⚠️ FAKEOUT WARNING: Anemic Breadth (Confidence ${finalConfidence}%)`;
      actionablePlaybook = `Do NOT chase breakout momentum. High statistical probability of mean-reversion within 30m once single-stock block buying exhausts.`;
    }
  } else if (hasVacuumSlippage) {
    reconciliationState = 'AIR_POCKET_SLIPPAGE';
    finalScore = Number((compositeScore * 0.65).toFixed(1));
    finalConfidence = Math.min(52, finalConfidence - 25);
    primaryDriver = `Thin Air Pocket: Price sweeping thin limit order book on dry constituent volume (${top5HeavyweightRvol}x RVOL)`;
    verdictHeadline = `⚠️ AIR POCKET SLIPPAGE: Low Depth (Confidence ${finalConfidence}%)`;
    actionablePlaybook = `Move propelled by lack of liquidity rather than institutional buying. Tighten stops; avoid new directional entries.`;
  } else if (greeks.gexRegime === 'DEALER_LONG_GAMMA_PIN') {
    reconciliationState = 'FORTRESS_PIN';
    if (Math.abs(compositeScore) < 40) {
      finalScore = Number((compositeScore * 0.60).toFixed(1));
      finalConfidence = Math.min(65, Math.max(45, finalConfidence));
      primaryDriver = `Dealer Shock Absorber (+₹${greeks.netGexCr.toFixed(0)} Cr): Dampening swings between ₹${greeks.putWall} Put Wall and ₹${greeks.callWall} Call Wall`;
      verdictHeadline = `⚖️ FORTRESS PIN: Range Containment (Confidence ${finalConfidence}%)`;
      actionablePlaybook = `Market makers actively re-hedging to absorb moves. Sell premium via Credit Spreads / Iron Condors; expect pinning.`;
    }
  } else if (greeks.gexRegime === 'DEALER_SHORT_GAMMA_CASCADE') {
    reconciliationState = 'VOLATILITY_EXPANSION';
    primaryDriver = `Dealer Accelerator Mode (-₹${Math.abs(greeks.netGexCr).toFixed(0)} Cr): Forced hedging accelerates drops`;
  } else if (hasRotationChop) {
    reconciliationState = 'FORTRESS_PIN';
    finalScore = Number((compositeScore * 0.75).toFixed(1));
    finalConfidence = Math.min(60, Math.max(40, finalConfidence - 15));
    primaryDriver = `Sector Rotation Tug-of-War: High gross churn absorbing net directional momentum`;
  }

  // 10. Directional Classification
  let direction: Rolling30mPrediction['direction'] = 'NEUTRAL_CHOPPY';
  if (finalScore >= 35) {
    direction = 'STRONG_BULLISH';
  } else if (finalScore >= 15) {
    direction = 'MODERATE_BULLISH';
  } else if (finalScore <= -35) {
    direction = 'STRONG_BEARISH';
  } else if (finalScore <= -15) {
    direction = 'MODERATE_BEARISH';
  } else {
    direction = 'NEUTRAL_CHOPPY';
  }

  // Governor Veto: Downgrade false strong breakouts under trap conditions
  if (hasSingleStockAnomaly || hasVacuumSlippage) {
    if (direction === 'STRONG_BULLISH') direction = 'MODERATE_BULLISH';
    if (direction === 'STRONG_BEARISH') direction = 'MODERATE_BEARISH';
  }
  if (reconciliationState === 'FORTRESS_PIN' && Math.abs(finalScore) < 25) {
    direction = 'NEUTRAL_CHOPPY';
  }

  // Construct Headlines & Playbooks for Normal Confluent States
  if (!verdictHeadline) {
    if (direction === 'STRONG_BULLISH') {
      verdictHeadline = `🚀 BULLISH SQUEEZE: ${finalConfidence}% Confidence (Next 30m)`;
      actionablePlaybook = `Advancing Turnover ${advTurnoverPct.toFixed(0)}% + ${oiVelocityRegime === 'BULLISH_SHORT_COVERING' ? 'Call Shedding' : 'Positive Drift'}. Favor Bull Put Credit Spreads or Long Delta targeting ${Math.round(Math.min(spotPrice + expected30mMove, greeks.callWall))}.`;
    } else if (direction === 'MODERATE_BULLISH') {
      verdictHeadline = `📈 UPWARD BIAS: ${finalConfidence}% Confidence (Next 30m)`;
      actionablePlaybook = `Moderate upward drift supported by heavyweights. Buy dips near anchored support; resistance at Call Wall ${greeks.callWall}.`;
    } else if (direction === 'STRONG_BEARISH') {
      verdictHeadline = `📉 BEARISH CASCADE: ${finalConfidence}% Confidence (Next 30m)`;
      actionablePlaybook = `Declining Turnover ${(100 - advTurnoverPct).toFixed(0)}% + Short Gamma acceleration. Favor Bear Call Spreads targeting Put Wall ${greeks.putWall}.`;
    } else if (direction === 'MODERATE_BEARISH') {
      verdictHeadline = `📉 DOWNWARD BIAS: ${finalConfidence}% Confidence (Next 30m)`;
      actionablePlaybook = `Distribution pressure active. Sell rallies into resistance; watch Put Wall ${greeks.putWall} for support.`;
    } else {
      verdictHeadline = `⚖️ BALANCED PIN: ${finalConfidence}% Confidence (Next 30m)`;
      actionablePlaybook = `Two-way volume balance with Gamma Pin. High probability of chop between ${greeks.putWall} and ${greeks.callWall}.`;
    }
  }

  // 11. Target Corridors & Tactical Invalidation Level
  const strikeStep = symbol === 'BANKNIFTY' ? 100 : 50;
  const wallBuffer = strikeStep * 0.3;
  const stopBuffer = strikeStep * 0.4;

  const rawTargetHigh = greeks.callWall > spotPrice
    ? Math.round(Math.min(spotPrice + expected30mMove, greeks.callWall + wallBuffer))
    : Math.round(spotPrice + expected30mMove);

  const rawTargetLow = greeks.putWall < spotPrice
    ? Math.round(Math.max(spotPrice - expected30mMove, greeks.putWall - wallBuffer))
    : Math.round(spotPrice - expected30mMove);

  const targetHigh = Math.max(Math.round(spotPrice + 5), rawTargetHigh);
  const targetLow = Math.min(Math.round(spotPrice - 5), rawTargetLow);

  let tacticalStopLoss: number;
  if (direction === 'STRONG_BULLISH' || direction === 'MODERATE_BULLISH') {
    tacticalStopLoss = Math.round(spotPrice - expected30mMove * 0.65);
  } else if (direction === 'STRONG_BEARISH' || direction === 'MODERATE_BEARISH') {
    tacticalStopLoss = Math.round(spotPrice + expected30mMove * 0.65);
  } else {
    tacticalStopLoss = Math.min(
      Math.round(spotPrice - expected30mMove * 0.5),
      Math.round(greeks.putWall - stopBuffer)
    );
  }

  const prediction: Rolling30mPrediction = {
    timestamp: new Date().toISOString(),
    timeIST,
    windowMinutes: 30,
    isContinuous: true,
    direction,
    confidencePct: finalConfidence,
    score: finalScore,
    expected30mMovePts: expected30mMove,
    targetHigh,
    targetLow,
    tacticalStopLoss,
    primaryDriver,
    verdictHeadline,
    actionablePlaybook,
    netPointImpact: spotNetChange,
    drift30mPts: pointDelta30m,
    greeksMetrics: updatedGreeks,
    volumeMetrics: {
      advancingTurnoverPct: Number(advTurnoverPct.toFixed(1)),
      decliningTurnoverPct: Number(advancesDeclines.decliningVolumePct.toFixed(1)),
      volumeConviction: advancesDeclines.volumeConviction,
      top5HeavyweightRvol,
      anomalyDetected: hasSingleStockAnomaly || hasVacuumSlippage,
      anomalyType: hasSingleStockAnomaly ? 'SINGLE_STOCK_SKEW' : (hasVacuumSlippage ? 'THIN_AIR_POCKET' : undefined),
      anomalySymbol: impulseAttribution?.culprit?.symbol
    },
    reconciliationState
  };

  return { prediction, updatedGreeks };
}
