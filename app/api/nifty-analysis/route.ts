import { NextResponse } from 'next/server';
import { getKiteSessionFromRequest, fetchKiteQuotes } from '@/lib/kite/session';
import { NIFTY_50_STOCKS_DATA, buildNifty50Analysis } from '@/lib/engine/nifty50Constituents';
import { buildSectorCoDependencyAnalysis } from '@/lib/engine/sectorCoDependency';
import { scanMicrostructureAnomalies } from '@/lib/engine/anomalyScanner';
import { synthesizeOrComputeOptionChainGreeks } from '@/lib/engine/optionGreeksEngine';
import { evaluate30mRollingRegime } from '@/lib/engine/rolling30mRegimeEngine';
import { synthesizeExecutiveMasterCockpit } from '@/lib/engine/masterSynthesisEngine';
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
    const session = getKiteSessionFromRequest(request);
    const isKiteConnected = Boolean(session && session.accessToken && now < session.expiresAtMs);

    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    // Dynamic Cache TTL:
    // Manual force refresh: 0ms
    // Kite connected: 1500ms (1.5s) to allow rapid 2s-3s live polling without stale lock
    // Unauthenticated public feed: 3000ms (3s) to prevent upstream rate limits
    const cacheTtl = forceRefresh ? 0 : (isKiteConnected ? 1500 : 3000);
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

    // TIER 1: Authenticated Zerodha Kite Connect REST API (Instant ~60ms batch query)
    if (isKiteConnected) {
      try {
        const indexKey = 'NSE:NIFTY 50';
        const vixKey = 'NSE:INDIA VIX';
        const queryKeys: string[] = [indexKey, vixKey];

        for (const s of NIFTY_50_STOCKS_DATA) {
          queryKeys.push(`NSE:${s.symbol}`);
          if (s.symbol === 'TMPV') queryKeys.push('NSE:TATAMOTORS');
          if (s.symbol === 'ETERNAL') queryKeys.push('NSE:ZOMATO');
        }

        const quotes = await fetchKiteQuotes(queryKeys, session);

        // Extract live Nifty Index Spot, Net Change, and Previous Close
        const qIndex = quotes[indexKey];
        if (qIndex && qIndex.last_price > 0) {
          spotPrice = qIndex.last_price;
          spotNetChange = typeof qIndex.net_change === 'number' ? qIndex.net_change : undefined;
          spotPrevClose = qIndex.ohlc?.close || (spotNetChange !== undefined ? spotPrice - spotNetChange : undefined);
          spotOpen = qIndex.ohlc?.open;
          spotHigh = qIndex.ohlc?.high;
          spotLow = qIndex.ohlc?.low;
        }

        // Extract live India VIX
        const qVix = quotes[vixKey];
        if (qVix && qVix.last_price > 0) {
          vix = qVix.last_price;
        }

        // Extract quotes for all 50 constituent stocks
        for (const stock of NIFTY_50_STOCKS_DATA) {
          let q = quotes[`NSE:${stock.symbol}`];
          if (!q && stock.symbol === 'TMPV') q = quotes['NSE:TATAMOTORS'];
          if (!q && stock.symbol === 'ETERNAL') q = quotes['NSE:ZOMATO'];

          if (q && q.last_price > 0) {
            const close = q.ohlc?.close || (q.last_price - (q.net_change || 0));
            const changePct = close > 0 ? Number((((q.last_price - close) / close) * 100).toFixed(2)) : 0;
            liveUpdates.push({
              symbol: stock.symbol,
              price: q.last_price,
              changePct,
              prevClose: close > 0 ? Number(close.toFixed(2)) : undefined,
              high: q.ohlc?.high && q.ohlc.high > 0 ? q.ohlc.high : undefined,
              low: q.ohlc?.low && q.ohlc.low > 0 ? q.ohlc.low : undefined,
              volume: q.volume && q.volume > 0 ? q.volume : undefined
            });
          }
        }

        if (liveUpdates.length >= 35) {
          dataSource = 'KITE_LIVE';
        }
      } catch (err) {
        console.warn('[NiftyAnalysisRoute] Kite quotes batch query failed:', err);
      }
    }

    // TIER 2: Public Exchange Feeds (Fallback if Kite is unauthenticated or has network dropouts)
    if (dataSource !== 'KITE_LIVE') {
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
          const result = indexJson?.chart?.result?.[0];
          const meta = result?.meta;
          const quote = result?.indicators?.quote?.[0];
          if (meta && typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) {
            spotPrice = meta.regularMarketPrice;
            spotPrevClose = meta.chartPreviousClose || meta.previousClose;
            if (spotPrevClose && spotPrevClose > 0) {
              spotNetChange = Number((spotPrice - spotPrevClose).toFixed(2));
            }
            const openVal = quote?.open?.find((v: number | null) => typeof v === 'number' && v > 0);
            spotOpen = openVal ? Number(openVal.toFixed(2)) : undefined;
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

      // Parallel batch fetch for all 50 constituent stocks (chunks of 10)
      try {
        const CHUNK_SIZE = 10;
        for (let i = 0; i < NIFTY_50_STOCKS_DATA.length; i += CHUNK_SIZE) {
          const chunk = NIFTY_50_STOCKS_DATA.slice(i, i + CHUNK_SIZE);
          const stockFetches = chunk.map(async (st) => {
            const ticker = st.symbol === 'TMPV' ? 'TATAMOTORS' : st.symbol === 'ETERNAL' ? 'ZOMATO' : st.symbol;
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
        }

        if (liveUpdates.length >= 25) {
          dataSource = 'EXCHANGE_LIVE';
        }
      } catch {
        // ignore
      }
    }

    const isLive = dataSource === 'KITE_LIVE' || dataSource === 'EXCHANGE_LIVE';

    // 1. Synthesize Constituent Analysis with strict BaseSpot anchoring and Zero-Contamination Live Guard
    const analysis = buildNifty50Analysis(
      liveUpdates,
      spotPrice,
      vix,
      spotNetChange,
      spotPrevClose,
      spotOpen,
      spotHigh,
      spotLow,
      isLive
    );

    // 2. Synthesize Sector Co-Dependency & Dispersion
    const coDependency = buildSectorCoDependencyAnalysis(analysis.sectors, spotPrice, analysis.spotPrevClose);

    // 3. Scan Microstructure Anomalies & Anomaly News Alerts
    const anomalies = scanMicrostructureAnomalies(analysis.analyzedStocks, analysis.sectors);

    // 4. Compute Option Greeks & Dealer GEX Positioning
    const { metrics: greeksMetrics } = synthesizeOrComputeOptionChainGreeks(
      'NIFTY',
      analysis.spotPrice,
      analysis.vix
    );

    // 5. Evaluate Continuous 30-Minute Rolling Directional Prediction
    const { prediction: rolling30mPrediction, updatedGreeks } = evaluate30mRollingRegime({
      symbol: 'NIFTY',
      spotPrice: analysis.spotPrice,
      spotNetChange: analysis.spotNetChange,
      spotPrevClose: analysis.spotPrevClose,
      vix: analysis.vix,
      advancesDeclines: analysis.advancesDeclines,
      stocks: analysis.analyzedStocks,
      greeks: greeksMetrics,
      impulseAttribution: analysis.impulseAttribution,
      anomalies
    });

    // 6. Synthesize Executive Master Cockpit (Layman Synthesis + Retail Liquidity Pools)
    const masterSynthesis = synthesizeExecutiveMasterCockpit({
      symbol: 'NIFTY',
      spotPrice: analysis.spotPrice,
      spotNetChange: analysis.spotNetChange,
      spotPrevClose: analysis.spotPrevClose,
      spotOpen: analysis.spotOpen,
      spotHigh: analysis.spotHigh,
      spotLow: analysis.spotLow,
      vix: analysis.vix,
      advancesDeclines: analysis.advancesDeclines,
      stocks: analysis.analyzedStocks,
      sectors: analysis.sectors,
      coDependency,
      impulseAttribution: analysis.impulseAttribution,
      smartRoadmap: analysis.prediction.smartRoadmap,
      greeks: updatedGreeks,
      rolling30mPrediction
    });

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
      stocks: analysis.analyzedStocks,
      impulseAttribution: analysis.impulseAttribution,
      rolling30mPrediction,
      greeks: updatedGreeks,
      masterSynthesis
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
