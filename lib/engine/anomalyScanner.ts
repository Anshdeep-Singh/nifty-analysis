import { Nifty50Stock, SectorAnalysis, AnomalyAlert } from '../types';

export function scanMicrostructureAnomalies(
  stocks: Nifty50Stock[],
  sectors: SectorAnalysis[]
): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  const sectorReturnMap = new Map<string, number>();
  for (const s of sectors) {
    sectorReturnMap.set(s.name, s.weightedReturn);
  }

  for (const stock of stocks) {
    const secReturn = sectorReturnMap.get(stock.sector) || 0;
    const divergence = stock.changePct - secReturn;

    // Direct Action Links for User News & Filing Verification
    const actionLinks = [
      {
        label: 'NSE Filings & Announcements',
        url: `https://www.nseindia.com/companies-listing/corporate-filings-announcements?symbol=${encodeURIComponent(stock.symbol)}`
      },
      {
        label: 'Google Finance News',
        url: `https://www.google.com/finance/quote/${encodeURIComponent(stock.symbol)}:NSE`
      },
      {
        label: 'TradingView Chart',
        url: `https://www.tradingview.com/chart/?symbol=NSE:${encodeURIComponent(stock.symbol)}`
      }
    ];

    // Case 1: Extreme Bullish / Bearish Drift (|ChangePct| >= 2.2% scaled to constituent price deviation)
    if (Math.abs(stock.changePct) >= 2.2) {
      const isBull = stock.changePct > 0;
      const isCritical = Math.abs(stock.changePct) >= 3.5 || (Math.abs(stock.changePct) >= 2.5 && Math.abs(stock.pointImpact) >= 20);
      alerts.push({
        id: `DRIFT_${stock.symbol}_${Date.now()}`,
        symbol: stock.symbol,
        companyName: stock.name,
        sector: stock.sector,
        severity: isCritical ? 'CRITICAL' : 'WARNING',
        type: 'EXTREME_DRIFT',
        headline: `${stock.symbol} ${isBull ? 'SUPER BULLISH' : 'SUPER BEARISH'} (${isBull ? '+' : ''}${stock.changePct.toFixed(2)}%)`,
        description: `Contributing ${stock.pointImpact > 0 ? '+' : ''}${stock.pointImpact.toFixed(1)} Nifty points (${stock.weight.toFixed(1)}% weight). High momentum price drift detected. Check news disclosures for corporate actions or earnings releases.`,
        changePct: stock.changePct,
        pointImpact: stock.pointImpact,
        timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
        actionLinks
      });
      stock.isAnomaly = true;
      stock.anomalyType = isBull ? 'SUPER_BULL' : 'SUPER_BEAR';
      stock.anomalyDesc = `Extreme ${isBull ? 'bullish' : 'bearish'} move (${isBull ? '+' : ''}${stock.changePct.toFixed(1)}%). Check corporate announcements.`;
      continue;
    }

    // Case 2: Sector Divergence (Stock moving opposite to sector by >= 1.8%)
    if (Math.abs(divergence) >= 1.8 && Math.abs(stock.changePct) >= 1.2) {
      const isPositiveDivergence = divergence > 0;
      alerts.push({
        id: `DIVERGENCE_${stock.symbol}_${Date.now()}`,
        symbol: stock.symbol,
        companyName: stock.name,
        sector: stock.sector,
        severity: 'WARNING',
        type: 'SECTOR_DIVERGENCE',
        headline: `${stock.symbol} Decoupled from ${stock.sector} (${isPositiveDivergence ? 'Rallying against sector' : 'Plunging against sector'})`,
        description: `${stock.symbol} is ${stock.changePct > 0 ? '+' : ''}${stock.changePct.toFixed(2)}% while sector is ${secReturn > 0 ? '+' : ''}${secReturn.toFixed(2)}% (${Math.abs(divergence).toFixed(2)}% divergence). Strong company-specific catalyst likely.`,
        changePct: stock.changePct,
        pointImpact: stock.pointImpact,
        timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
        actionLinks
      });
      stock.isAnomaly = true;
      stock.anomalyType = 'SECTOR_DECOUPLING';
      stock.anomalyDesc = `Decoupled from sector by ${Math.abs(divergence).toFixed(1)}%.`;
      continue;
    }

    // Case 3: Heavyweight Impact Outlier (Top 5 heavyweights driving index)
    if (['HDFCBANK', 'RELIANCE', 'ICICIBANK', 'INFY', 'TCS'].includes(stock.symbol) && Math.abs(stock.pointImpact) >= 8) {
      alerts.push({
        id: `HEAVYWEIGHT_${stock.symbol}_${Date.now()}`,
        symbol: stock.symbol,
        companyName: stock.name,
        sector: stock.sector,
        severity: Math.abs(stock.pointImpact) >= 20 ? 'WARNING' : 'NOTICE',
        type: 'HEAVYWEIGHT_PIVOT',
        headline: `${stock.symbol} Heavyweight Driver (${stock.pointImpact > 0 ? '+' : ''}${stock.pointImpact.toFixed(1)} pts)`,
        description: `Holding ${stock.weight}% Nifty weight and exerting decisive directional pull on market index.`,
        changePct: stock.changePct,
        pointImpact: stock.pointImpact,
        timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
        actionLinks
      });
    }

    // Case 4: Institutional Volume Surge (RVOL >= 1.8x and noticeable price action)
    const rvol = stock.relativeVolume ?? (stock.avgVolume && stock.volume ? stock.volume / stock.avgVolume : undefined);
    if (rvol && rvol >= 1.8 && Math.abs(stock.changePct) >= 0.5) {
      const isBullSurge = stock.changePct > 0;
      const isCritical = rvol >= 2.8 || Math.abs(stock.pointImpact) >= 15;
      alerts.push({
        id: `VOLSURGE_${stock.symbol}_${Date.now()}`,
        symbol: stock.symbol,
        companyName: stock.name,
        sector: stock.sector,
        severity: isCritical ? 'CRITICAL' : 'WARNING',
        type: 'VOLUME_SURGE',
        headline: `${stock.symbol} Institutional Volume Surge (${rvol.toFixed(1)}x RVOL, ${isBullSurge ? '+' : ''}${stock.changePct.toFixed(2)}%)`,
        description: `Trading at ${rvol.toFixed(1)}x normal volume pace (${stock.volume ? (stock.volume / 100000).toFixed(1) : '0'}L shares, ₹${(stock.turnoverCr ?? 0).toFixed(0)} Cr turnover). Strong institutional ${isBullSurge ? 'accumulation / buying pressure' : 'liquidation / selling pressure'} detected.`,
        changePct: stock.changePct,
        pointImpact: stock.pointImpact,
        volumeMultiplier: Number(rvol.toFixed(2)),
        timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
        actionLinks
      });
      if (!stock.isAnomaly) {
        stock.isAnomaly = true;
        stock.anomalyType = isBullSurge ? 'VOLUME_ACCUMULATION' : 'VOLUME_DISTRIBUTION';
        stock.anomalyDesc = `${rvol.toFixed(1)}x volume surge with ${isBullSurge ? '+' : ''}${stock.changePct.toFixed(1)}% move.`;
      }
    }
  }

  // Sort alerts: CRITICAL first, then WARNING, then NOTICE
  const severityOrder = { CRITICAL: 0, WARNING: 1, NOTICE: 2 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
