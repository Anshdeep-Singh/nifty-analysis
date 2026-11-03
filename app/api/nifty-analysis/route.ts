import { NextResponse } from 'next/server';
import { NIFTY_50_STOCKS_DATA, buildNifty50Analysis } from '@/lib/engine/nifty50Constituents';
import { buildSectorCoDependencyAnalysis } from '@/lib/engine/sectorCoDependency';
import { scanMicrostructureAnomalies } from '@/lib/engine/anomalyScanner';
import { NiftyAnalysisState } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LiveStockEntry {
  symbol: string;
  price: number;
  changePct: number;
  prevClose?: number;
  high?: number;
  low?: number;
  volume?: number;
}

// In-memory cache to preserve upstream rate limits while enabling sub-second UI refreshing
let cachedPayload: {
  timestamp: number;
  data: NiftyAnalysisState;
} | null = null;

export async function GET(request: Request) {
  try {
    const now = Date.now();
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    // Cache TTL: 2000ms by default, 0ms on forced manual refresh
    const cacheTtl = forceRefresh ? 0 : 2000;
    if (cacheTtl > 0 && cachedPayload && (now - cachedPayload.timestamp) < cacheTtl) {
      return NextResponse.json({
        success: true,
        data: cachedPayload.data,
        cached: true
      });
    }

    let spotPrice = 24500;
    let spotNetChange: number | undefined = undefined;
    let spotPrevClose: number | undefined = undefined;
    let spotOpen: number | undefined = undefined;
    let spotHigh: number | undefined = undefined;
    let spotLow: number | undefined = undefined;
    let vix = 14.5;
    let dataSource: NiftyAnalysisState['dataSource'] = 'AUTHENTIC_SNAPSHOT';

    const liveUpdates: LiveStockEntry[] = [];

    // Query live Nifty 50 and India VIX from public exchange feeds
    try {
      const [indexRes, vixRes] = await Promise.all([
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: AbortSignal.timeout(3500)
        }),
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EINDIAVIX?interval=1d', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: AbortSignal.timeout(3500)
        })
      ]);

      if (indexRes.ok) {
        const indexJson = await indexRes.json();
        const meta = indexJson?.chart?.result?.[0]?.meta;
        if (meta && typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) {
          spotPrice = meta.regularMarketPrice;
          spotPrevClose = meta.chartPreviousClose || meta.previousClose;
          if (spotPrevClose && spotPrevClose > 0) {
            spotNetChange = Number((spotPrice - spotPrevClose).toFixed(2));
          }
          spotOpen = meta.regularMarketDayHigh ? meta.regularMarketDayHigh : undefined;
          spotHigh = meta.regularMarketDayHigh;
          spotLow = meta.regularMarketDayLow;
          dataSource = 'EXCHANGE_LIVE';
        }
      }

      if (vixRes.ok) {
        const vixJson = await vixRes.json();
        const vixMeta = vixJson?.chart?.result?.[0]?.meta;
        if (vixMeta && typeof vixMeta.regularMarketPrice === 'number' && vixMeta.regularMarketPrice > 0) {
          vix = vixMeta.regularMarketPrice;
        }
      }
    } catch {
      // Graceful fallback to snapshot if rate limited
    }

    // Parallel fetch for active top constituents
    try {
      const topSymbols = NIFTY_50_STOCKS_DATA.slice(0, 15);
      const stockFetches = topSymbols.map(async (st) => {
        const ticker = st.symbol === 'TMPV' ? 'TATAMOTORS' : st.symbol;
        try {
          const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}.NS?interval=1d`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(3000)
          });
          if (res.ok) {
            const json = await res.json();
            const meta = json?.chart?.result?.[0]?.meta;
            if (meta && typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) {
              const close = meta.chartPreviousClose || meta.previousClose || st.price;
              const price = meta.regularMarketPrice;
              const changePct = close > 0 ? Number((((price - close) / close) * 100).toFixed(2)) : 0;
              return {
                symbol: st.symbol,
                price,
                changePct,
                prevClose: Number(close.toFixed(2)),
                high: meta.regularMarketDayHigh,
                low: meta.regularMarketDayLow,
                volume: meta.regularMarketVolume
              };
            }
          }
        } catch {
          // ignore individual timeout
        }
        return null;
      });

      const resolved = await Promise.all(stockFetches);
      for (const item of resolved) {
        if (item) liveUpdates.push(item);
      }
    } catch {
      // ignore
    }

    // 1. Synthesize Constituent Analysis
    const analysis = buildNifty50Analysis(
      liveUpdates,
      spotPrice,
      vix,
      spotNetChange,
      spotPrevClose,
      spotOpen,
      spotHigh,
      spotLow
    );

    // 2. Synthesize Sector Co-Dependency & Dispersion
    const coDependency = buildSectorCoDependencyAnalysis(analysis.sectors, spotPrice);

    // 3. Scan Microstructure Anomalies & Anomaly News Alerts
    const anomalies = scanMicrostructureAnomalies(analysis.analyzedStocks, analysis.sectors);

    const fullPayload: NiftyAnalysisState = {
      spotPrice: analysis.spotPrice,
      spotNetChange: analysis.spotNetChange,
      spotChangePct: analysis.spotPrevClose > 0 ? Number((((analysis.spotPrice - analysis.spotPrevClose) / analysis.spotPrevClose) * 100).toFixed(2)) : 0,
      spotPrevClose: analysis.spotPrevClose,
      spotOpen: analysis.spotOpen,
      spotHigh: analysis.spotHigh,
      spotLow: analysis.spotLow,
      timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST',
      dataSource,
      vix: analysis.vix,
      expected1DayMove: analysis.expected1DayMove,
      advancesDeclines: analysis.advancesDeclines,
      prediction: analysis.prediction,
      sectors: analysis.sectors,
      coDependency,
      anomalies,
      stocks: analysis.analyzedStocks
    };

    cachedPayload = {
      timestamp: now,
      data: fullPayload
    };

    return NextResponse.json({
      success: true,
      data: fullPayload,
      cached: false
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis computation failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
