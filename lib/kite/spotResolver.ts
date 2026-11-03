import { fetchKiteQuotes, getKiteSessionFromRequest } from './session';
import { KiteSession } from '../types';

/**
 * Resolves the genuine current spot price for NIFTY 50.
 * Priority:
 * 1. Kite Connect REST quote (if session is authenticated)
 * 2. Live index market quote (Yahoo Finance API)
 * 3. Latest historical baseline (24,500.0)
 */
export async function resolveLatestIndexSpot(
  sessionOverride?: KiteSession | null
): Promise<{ price: number; netChange?: number; prevClose?: number; open?: number; high?: number; low?: number }> {
  const session = sessionOverride !== undefined ? sessionOverride : getKiteSessionFromRequest();

  // 1. Check Kite Connect REST API if session is active
  if (session && session.accessToken) {
    try {
      const indexKey = 'NSE:NIFTY 50';
      const quotes = await fetchKiteQuotes([indexKey], session);
      const q = quotes[indexKey];
      if (q && q.last_price > 0) {
        return {
          price: q.last_price,
          netChange: q.net_change,
          prevClose: q.ohlc?.close,
          open: q.ohlc?.open,
          high: q.ohlc?.high,
          low: q.ohlc?.low
        };
      }
    } catch (err) {
      console.warn('[SpotResolver] Kite REST quote fetch failed:', err);
    }
  }

  // 2. Fast live exchange quote from public financial API
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const d = await res.json();
      const meta = d?.chart?.result?.[0]?.meta;
      if (typeof meta?.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) {
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose;
        const netChange = prevClose > 0 ? Number((price - prevClose).toFixed(2)) : undefined;
        return {
          price: Number(price.toFixed(2)),
          netChange,
          prevClose: prevClose ? Number(prevClose.toFixed(2)) : undefined,
          open: meta.regularMarketDayHigh ? meta.regularMarketDayHigh : undefined,
          high: meta.regularMarketDayHigh,
          low: meta.regularMarketDayLow
        };
      }
    }
  } catch (err) {
    console.warn('[SpotResolver] Public market spot lookup failed:', err);
  }

  // 3. Fallback baseline
  return { price: 24500.0 };
}

/**
 * Resolves genuine India VIX volatility for continuous options scaling
 */
export async function resolveLatestIndiaVix(
  sessionOverride?: KiteSession | null
): Promise<number> {
  const session = sessionOverride !== undefined ? sessionOverride : getKiteSessionFromRequest();
  if (session && session.accessToken) {
    try {
      const quotes = await fetchKiteQuotes(['NSE:INDIA VIX'], session);
      const q = quotes['NSE:INDIA VIX'];
      if (q && q.last_price > 0) {
        return q.last_price;
      }
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EINDIAVIX?interval=1d', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const d = await res.json();
      const vix = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (typeof vix === 'number' && vix > 0) {
        return Number(vix.toFixed(2));
      }
    }
  } catch {
    // ignore
  }

  return 14.5;
}
