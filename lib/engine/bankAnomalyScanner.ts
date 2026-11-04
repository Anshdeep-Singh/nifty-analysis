import { Nifty50Stock, SectorAnalysis, AnomalyAlert } from '../types';

export function scanBankMicrostructureAnomalies(
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

    // Case 1: Extreme Bullish / Bearish Drift (|ChangePct| >= 2.5% or Point Impact >= 40 pts on Bank Nifty)
    if (Math.abs(stock.changePct) >= 2.5 || Math.abs(stock.pointImpact) >= 40) {
      const isBull = stock.changePct > 0;
      alerts.push({
        id: `DRIFT_${stock.symbol}_${Date.now()}`,
        symbol: stock.symbol,
        companyName: stock.name,
        sector: stock.sector,
        severity: Math.abs(stock.changePct) >= 4.0 || Math.abs(stock.pointImpact) >= 70 ? 'CRITICAL' : 'WARNING',
        type: 'EXTREME_DRIFT',
        headline: `${stock.symbol} ${isBull ? 'SUPER BULLISH' : 'SUPER BEARISH'} (${isBull ? '+' : ''}${stock.changePct.toFixed(2)}%)`,
        description: `Contributing ${stock.pointImpact > 0 ? '+' : ''}${stock.pointImpact.toFixed(1)} Bank Nifty points. High momentum impulse detected. Check news disclosures for corporate actions, credit growth updates, or quarterly asset quality prints.`,
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

    // Case 2: Peer Sector Decoupling (Stock moving opposite to its peer segment by >= 1.5%)
    if (Math.abs(divergence) >= 1.5 && Math.abs(stock.changePct) >= 1.0) {
      const isPositiveDivergence = divergence > 0;
      alerts.push({
        id: `DIVERGENCE_${stock.symbol}_${Date.now()}`,
        symbol: stock.symbol,
        companyName: stock.name,
        sector: stock.sector,
        severity: 'WARNING',
        type: 'SECTOR_DIVERGENCE',
        headline: `${stock.symbol} Decoupled from ${stock.sector} Peers (${isPositiveDivergence ? 'Rallying against peers' : 'Lagging peer segment'})`,
        description: `${stock.symbol} is ${stock.changePct > 0 ? '+' : ''}${stock.changePct.toFixed(2)}% while ${stock.sector} average is ${secReturn > 0 ? '+' : ''}${secReturn.toFixed(2)}% (${Math.abs(divergence).toFixed(2)}% spread). Bank-specific catalyst active.`,
        changePct: stock.changePct,
        pointImpact: stock.pointImpact,
        timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
        actionLinks
      });
      stock.isAnomaly = true;
      stock.anomalyType = 'SECTOR_DECOUPLING';
      stock.anomalyDesc = `Decoupled from ${stock.sector} by ${Math.abs(divergence).toFixed(1)}%.`;
      continue;
    }

    // Case 3: Heavyweight Hegemony Outlier (Top 5 banks: HDFCBANK, ICICIBANK, SBIN, KOTAKBANK, AXISBANK)
    if (['HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'AXISBANK'].includes(stock.symbol) && Math.abs(stock.pointImpact) >= 30) {
      alerts.push({
        id: `HEAVYWEIGHT_${stock.symbol}_${Date.now()}`,
        symbol: stock.symbol,
        companyName: stock.name,
        sector: stock.sector,
        severity: Math.abs(stock.pointImpact) >= 60 ? 'CRITICAL' : 'NOTICE',
        type: 'HEAVYWEIGHT_PIVOT',
        headline: `${stock.symbol} Heavyweight Driver (${stock.pointImpact > 0 ? '+' : ''}${stock.pointImpact.toFixed(1)} Bank Nifty Pts)`,
        description: `Single-handedly steering Bank Nifty by ${stock.pointImpact > 0 ? '+' : ''}${stock.pointImpact.toFixed(1)} points (${stock.weight.toFixed(1)}% index weight). Institutional positioning pivot.`,
        changePct: stock.changePct,
        pointImpact: stock.pointImpact,
        timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
        actionLinks
      });
      stock.isAnomaly = true;
      stock.anomalyType = 'HEAVYWEIGHT_PIVOT';
      stock.anomalyDesc = `Heavyweight driving ${stock.pointImpact > 0 ? '+' : ''}${stock.pointImpact.toFixed(1)} index points.`;
      continue;
    }

    // Case 4: Institutional Volume Surge (RVOL >= 2.0x)
    if (stock.relativeVolume && stock.relativeVolume >= 2.0 && Math.abs(stock.changePct) >= 0.7) {
      alerts.push({
        id: `VOLUME_${stock.symbol}_${Date.now()}`,
        symbol: stock.symbol,
        companyName: stock.name,
        sector: stock.sector,
        severity: 'WARNING',
        type: 'VOLUME_SURGE',
        headline: `${stock.symbol} Institutional Volume Surge (${stock.relativeVolume.toFixed(1)}x RVOL)`,
        description: `Trading at ${stock.relativeVolume.toFixed(1)}x expected intraday volume run-rate (₹${(stock.turnoverCr || 0).toFixed(0)} Cr turnover). Institutional block order flow detected.`,
        changePct: stock.changePct,
        pointImpact: stock.pointImpact,
        volumeMultiplier: stock.relativeVolume,
        timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
        actionLinks
      });
      stock.isAnomaly = true;
      stock.anomalyType = 'VOLUME_SURGE';
      stock.anomalyDesc = `Abnormal volume run-rate (${stock.relativeVolume.toFixed(1)}x RVOL).`;
      continue;
    }
  }

  return alerts;
}
