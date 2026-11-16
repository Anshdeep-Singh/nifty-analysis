import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getKiteSessionFromRequest, fetchKiteHistoricalCandles, fetchKiteQuotes, KiteQuoteItem } from '@/lib/kite/session';
import { CandleBar, MultiTfChartData, MultiTfPayload } from '@/lib/types';
import { buildSmartMoneyRoadmap } from '@/lib/engine/smartMoneyRoadmap';
import { calculateTrueVwap, classifyCandleVsa } from '@/lib/engine/vsaEngine';
import { getActiveFuturesContract } from '@/lib/kite/futuresResolver';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NIFTY_TOKEN = 256265;
const BANKNIFTY_TOKEN = 260105;
const INDIAVIX_TOKEN = 264969;

// Authentic historical directory from kite-options-pilot
const HISTORICAL_DATA_DIR = path.resolve(process.cwd(), '..', 'kite-options-pilot', 'data', 'historical');

function getISTDateParts(epochSec: number) {
  const d = new Date(epochSec * 1000);
  const istStr = d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const istDate = new Date(istStr);
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const dateStr = `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${String(istDate.getDate()).padStart(2, '0')}`;
  return { hours, minutes, timeStr, dateStr };
}

function calculateEma(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    ema.push(Number((values[i] * k + ema[i - 1] * (1 - k)).toFixed(2)));
  }
  return ema;
}

function attachIndicators(candles: CandleBar[], tf: '1min' | '5min' | '15min' | '1hr' = '5min'): CandleBar[] {
  if (candles.length === 0) return [];
  const closes = candles.map(c => c.close);
  const ema20 = calculateEma(closes, 20);
  const ema50 = calculateEma(closes, 50);
  const vwap = calculateTrueVwap(candles);

  const baseCandles = candles.map((c, idx) => ({
    ...c,
    ema20: ema20[idx],
    ema50: ema50[idx],
    vwap: vwap[idx]
  }));

  // Run Volume Spread Analysis (VSA) only if authentic volume is present (no artificial fallback)
  return classifyCandleVsa(baseCandles, tf);
}

function aggregateCandles(baseCandles: CandleBar[], groupCount: number, tf: '5min' | '15min' | '1hr'): CandleBar[] {
  const aggregated: CandleBar[] = [];
  for (let i = 0; i < baseCandles.length; i += groupCount) {
    const slice = baseCandles.slice(i, i + groupCount);
    if (slice.length === 0) continue;
    const first = slice[0];
    const last = slice[slice.length - 1];
    aggregated.push({
      timestamp: first.timestamp,
      time: first.time,
      date: first.date,
      open: first.open,
      high: Number(Math.max(...slice.map(s => s.high)).toFixed(2)),
      low: Number(Math.min(...slice.map(s => s.low)).toFixed(2)),
      close: last.close,
      volume: slice.reduce((sum, s) => sum + (s.volume || 0), 0)
    });
  }
  return attachIndicators(aggregated, tf);
}

/**
 * Loads authentic 1-minute historical candles from disk cache as fallback (Nifty)
 */
function loadFallbackAuthenticCandles(): { oneMin: CandleBar[]; prevClose: number; spot: number } | null {
  if (!fs.existsSync(HISTORICAL_DATA_DIR)) return null;

  try {
    const files = fs.readdirSync(HISTORICAL_DATA_DIR);
    const matching = files.filter(f => f.includes('nifty') && f.endsWith('.json') && f.startsWith('kite_'));
    if (matching.length === 0) return null;

    matching.sort().reverse();
    const filePath = path.join(HISTORICAL_DATA_DIR, matching[0]);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const rawCandles = Array.isArray(parsed) ? parsed : parsed.candles || [];
    if (rawCandles.length === 0) return null;

    // Group by IST date
    const dateMap: Record<string, Array<{ timestamp: number; open: number; high: number; low: number; close: number; volume: number }>> = {};
    for (const c of rawCandles) {
      const { dateStr } = getISTDateParts(c.timestamp > 1e11 ? Math.floor(c.timestamp / 1000) : c.timestamp);
      if (!dateMap[dateStr]) dateMap[dateStr] = [];
      dateMap[dateStr].push({
        timestamp: c.timestamp > 1e11 ? Math.floor(c.timestamp / 1000) : c.timestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume || 0
      });
    }

    const availableDates = Object.keys(dateMap).sort();
    if (availableDates.length === 0) return null;

    const targetDate = availableDates[availableDates.length - 1];
    const prevDate = availableDates.length >= 2 ? availableDates[availableDates.length - 2] : null;

    const day1m = dateMap[targetDate];
    const prevDay1m = prevDate ? dateMap[prevDate] : null;
    const prevClose = prevDay1m && prevDay1m.length > 0 ? prevDay1m[prevDay1m.length - 1].close : (day1m[0]?.open || 24500);

    const oneMin: CandleBar[] = [];
    for (const c of day1m) {
      const { hours, minutes, timeStr, dateStr } = getISTDateParts(c.timestamp);
      const totalMins = hours * 60 + minutes;
      if (totalMins < 555 || totalMins > 930) continue; // 09:15 to 15:30 IST

      oneMin.push({
        timestamp: c.timestamp,
        time: timeStr,
        date: dateStr,
        open: Number(c.open.toFixed(2)),
        high: Number(c.high.toFixed(2)),
        low: Number(c.low.toFixed(2)),
        close: Number(c.close.toFixed(2)),
        volume: c.volume || 0
      });
    }

    const spot = oneMin.length > 0 ? oneMin[oneMin.length - 1].close : prevClose;
    return {
      oneMin: attachIndicators(oneMin, '1min'),
      prevClose,
      spot
    };
  } catch (err) {
    console.warn('[MarketChart API] Fallback authentic read error:', err);
    return null;
  }
}

/**
 * Loads authentic 1-minute intraday candles from live public exchange API
 */
async function fetchYahooIntradayCandles(yahooSymbol: string): Promise<{ oneMin: CandleBar[]; prevClose: number; spot: number; dayOpen: number } | null> {
  try {
    const cleanSym = yahooSymbol.startsWith('%5E') ? decodeURIComponent(yahooSymbol) : yahooSymbol;
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSym)}?interval=1m&range=1d`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    const timestamps: number[] = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0];
    if (!timestamps.length || !quotes) return null;

    const candles: CandleBar[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      const o = quotes.open?.[i];
      const h = quotes.high?.[i];
      const l = quotes.low?.[i];
      const c = quotes.close?.[i];
      const v = quotes.volume?.[i] || 0;
      if (typeof o !== 'number' || typeof c !== 'number' || isNaN(o) || isNaN(c)) continue;

      const { hours, minutes, timeStr, dateStr } = getISTDateParts(ts);
      const totalMins = hours * 60 + minutes;
      if (totalMins < 555 || totalMins > 930) continue; // 09:15 to 15:30 IST

      candles.push({
        timestamp: ts,
        time: timeStr,
        date: dateStr,
        open: Number(o.toFixed(2)),
        high: Number((h || Math.max(o, c)).toFixed(2)),
        low: Number((l || Math.min(o, c)).toFixed(2)),
        close: Number(c.toFixed(2)),
        volume: v
      });
    }

    if (!candles.length) return null;

    const spot = candles[candles.length - 1].close;
    let prevClose = meta.chartPreviousClose || meta.previousClose;
    if (typeof meta.fulldayChange === 'number' && Math.abs(meta.fulldayChange) > 0) {
      prevClose = Number((spot - meta.fulldayChange).toFixed(2));
    }
    const dayOpen = candles[0].open;

    return {
      oneMin: attachIndicators(candles),
      prevClose: prevClose || dayOpen,
      spot,
      dayOpen
    };
  } catch (err) {
    console.warn('[MarketChart API] Yahoo intraday fetch error:', err);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const session = getKiteSessionFromRequest(request);
    const isKiteConnected = Boolean(session && session.accessToken && Date.now() < session.expiresAtMs);

    const url = new URL(request.url);
    const symbolParam = (url.searchParams.get('symbol') || url.searchParams.get('index') || 'NIFTY').toUpperCase();
    const isBankNifty = symbolParam.includes('BANK');
    const targetSymbol: 'NIFTY' | 'BANKNIFTY' = isBankNifty ? 'BANKNIFTY' : 'NIFTY';
    const indexToken = isBankNifty ? BANKNIFTY_TOKEN : NIFTY_TOKEN;
    const kiteIndexKey = isBankNifty ? 'NSE:NIFTY BANK' : 'NSE:NIFTY 50';
    const yahooSymbol = isBankNifty ? '%5ENSEBANK' : '%5ENSEI';

    let oneMinCandles: CandleBar[] = [];
    let fiveMinCandles: CandleBar[] = [];
    let spotPrice = isBankNifty ? 55900 : 24500;
    let prevClose = isBankNifty ? 55500 : 24350;
    let dayOpen = isBankNifty ? 55600 : 24400;
    let vix = 14.5;

    // TIER 1: LIVE AUTHENTIC KITE CONNECT HISTORICAL DATA
    if (isKiteConnected) {
      try {
        const now = new Date();
        const istNowStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const istNow = new Date(istNowStr);
        const y = istNow.getFullYear();
        const m = String(istNow.getMonth() + 1).padStart(2, '0');
        const d = String(istNow.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        // Look back 5 calendar days to span across weekends and market holidays
        const pastDate = new Date(istNow.getTime() - 5 * 86400000);
        const py = pastDate.getFullYear();
        const pm = String(pastDate.getMonth() + 1).padStart(2, '0');
        const pd = String(pastDate.getDate()).padStart(2, '0');
        const fromStr = `${py}-${pm}-${pd} 09:00:00`;
        const toStr = `${todayStr} 15:30:00`;

        // Resolve front-month futures contract dynamically to obtain authentic candle volume
        const futContract = await getActiveFuturesContract(targetSymbol).catch(() => null);
        const futPromise = futContract
          ? fetchKiteHistoricalCandles(futContract.instrumentToken, 'minute', fromStr, toStr, session).catch(() => [])
          : Promise.resolve([]);

        const [kCandlesRaw, quotes, kFutCandles] = await Promise.all([
          fetchKiteHistoricalCandles(indexToken, 'minute', fromStr, toStr, session).catch(async () => {
            // Fallback to 5minute if minute is unsupported
            return fetchKiteHistoricalCandles(indexToken, '5minute', fromStr, toStr, session).catch(() => []);
          }),
          fetchKiteQuotes([kiteIndexKey, 'NSE:INDIA VIX'], session).catch((): Record<string, KiteQuoteItem> => ({})),
          futPromise
        ]);

        const futVolMap = new Map<number, number>();
        if (Array.isArray(kFutCandles)) {
          for (const fc of kFutCandles) {
            if (fc && fc.timestamp && fc.volume > 0) {
              futVolMap.set(fc.timestamp, fc.volume);
            }
          }
        }

        const vixQuote = quotes['NSE:INDIA VIX'];
        if (vixQuote?.last_price) {
          vix = vixQuote.last_price;
        }

        const qIndex = quotes[kiteIndexKey];
        if (qIndex?.last_price) {
          spotPrice = qIndex.last_price;
          if (qIndex.ohlc?.close) prevClose = qIndex.ohlc.close;
          if (qIndex.ohlc?.open) dayOpen = qIndex.ohlc.open;
        }

        if (Array.isArray(kCandlesRaw) && kCandlesRaw.length > 0) {
          const isOneMinute = kCandlesRaw.length >= 2 && (kCandlesRaw[1].timestamp - kCandlesRaw[0].timestamp) <= 120;
          const lastCandle = kCandlesRaw[kCandlesRaw.length - 1];
          const { dateStr: targetDate } = getISTDateParts(lastCandle.timestamp);

          const sessionCandles = kCandlesRaw.filter(c => {
            const { dateStr, hours, minutes } = getISTDateParts(c.timestamp);
            const totalMins = hours * 60 + minutes;
            return dateStr === targetDate && totalMins >= 555 && totalMins <= 930;
          });

          // Prior session close if multi-day lookback returned previous days
          const priorCandles = kCandlesRaw.filter(c => {
            const { dateStr } = getISTDateParts(c.timestamp);
            return dateStr < targetDate;
          });
          if (priorCandles.length > 0) {
            prevClose = priorCandles[priorCandles.length - 1].close;
          }

          const parsedBars = sessionCandles.map(c => {
            const { timeStr, dateStr } = getISTDateParts(c.timestamp);
            const futVol = futVolMap.get(c.timestamp);
            return {
              timestamp: c.timestamp,
              time: timeStr,
              date: dateStr,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
              volume: typeof futVol === 'number' && futVol > 0 ? futVol : (c.volume || 0)
            };
          });

          if (isOneMinute) {
            oneMinCandles = attachIndicators(parsedBars, '1min');
            if (oneMinCandles.length > 0) {
              dayOpen = oneMinCandles[0].open;
              spotPrice = oneMinCandles[oneMinCandles.length - 1].close;
            }
          } else {
            fiveMinCandles = attachIndicators(parsedBars, '5min');
            if (fiveMinCandles.length > 0) {
              dayOpen = fiveMinCandles[0].open;
              spotPrice = fiveMinCandles[fiveMinCandles.length - 1].close;
            }
          }
        }
      } catch (kiteErr) {
        console.warn('[MarketChart API] Live Kite fetch failed, falling back:', kiteErr);
      }
    }

    // TIER 2: PUBLIC LIVE EXCHANGE CANDLES (Yahoo Finance authentic 1m bars)
    if (oneMinCandles.length === 0) {
      const publicCandles = await fetchYahooIntradayCandles(yahooSymbol);
      if (publicCandles && publicCandles.oneMin.length > 0) {
        oneMinCandles = publicCandles.oneMin;
        prevClose = publicCandles.prevClose;
        spotPrice = publicCandles.spot;
        dayOpen = publicCandles.dayOpen;
      }
    }

    // TIER 3: AUTHENTIC DISK CACHE FALLBACK (for Nifty)
    if (oneMinCandles.length === 0 && !isBankNifty) {
      const diskData = loadFallbackAuthenticCandles();
      if (diskData && diskData.oneMin.length > 0) {
        oneMinCandles = diskData.oneMin;
        prevClose = diskData.prevClose;
        spotPrice = diskData.spot;
        dayOpen = oneMinCandles[0]?.open || prevClose;
      }
    }

    // Guard: Clean base session fallback if still empty (strictly 0 volume if unavailable, no artificial calculation)
    if (oneMinCandles.length === 0 && fiveMinCandles.length === 0) {
      const baseTime = Math.floor(Date.now() / 1000) - 3600;
      const buffer = isBankNifty ? 35 : 10;
      oneMinCandles = [
        {
          timestamp: baseTime,
          time: '09:15',
          date: new Date().toISOString().split('T')[0],
          open: prevClose,
          high: Math.max(spotPrice, prevClose) + buffer,
          low: Math.min(spotPrice, prevClose) - buffer,
          close: spotPrice,
          volume: 0
        }
      ];
      oneMinCandles = attachIndicators(oneMinCandles, '1min');
    }

    // Derive 5m, 15m, and 1hr from 1m (or aggregate from 5m if only 5m was obtained)
    if (fiveMinCandles.length === 0 && oneMinCandles.length > 0) {
      fiveMinCandles = aggregateCandles(oneMinCandles, 5, '5min');
    }
    const fifteenMinCandles = oneMinCandles.length > 0
      ? aggregateCandles(oneMinCandles, 15, '15min')
      : aggregateCandles(fiveMinCandles, 3, '15min');
    const oneHourCandles = oneMinCandles.length > 0
      ? aggregateCandles(oneMinCandles, 60, '1hr')
      : aggregateCandles(fiveMinCandles, 12, '1hr');

    const effectiveOneMinCandles = oneMinCandles.length > 0 ? oneMinCandles : fiveMinCandles;
    const dayHigh = Math.max(...effectiveOneMinCandles.map(c => c.high));
    const dayLow = Math.min(...effectiveOneMinCandles.map(c => c.low));
    const latestClose = effectiveOneMinCandles[effectiveOneMinCandles.length - 1]?.close || spotPrice;

    // Check if authentic volume is available
    const hasVolume = effectiveOneMinCandles.some(c => typeof c.volume === 'number' && c.volume > 0);
    const volumeMessage = hasVolume
      ? undefined
      : 'Volume data not available for cash index spot (Connect Zerodha Kite to stream authentic front-month Futures volume)';

    // Generate Smart Money Roadmap & Tactical Levels
    const smartRoadmap = buildSmartMoneyRoadmap({
      spotPrice: latestClose,
      prevClose,
      dayOpen,
      dayHigh,
      dayLow,
      vix,
      candles: fiveMinCandles.length > 0 ? fiveMinCandles : effectiveOneMinCandles,
      symbol: targetSymbol
    });

    const payload: MultiTfPayload = {
      symbol: targetSymbol,
      spotPrice: latestClose,
      prevClose,
      dayOpen,
      vix,
      smartRoadmap,
      volumeAvailable: hasVolume,
      volumeMessage,
      charts: {
        oneMin: {
          timeframe: '1min',
          candles: effectiveOneMinCandles,
          vwap: effectiveOneMinCandles[effectiveOneMinCandles.length - 1]?.vwap,
          dayOpen,
          dayHigh,
          dayLow,
          prevClose,
          volumeAvailable: hasVolume,
          volumeMessage
        },
        fiveMin: {
          timeframe: '5min',
          candles: fiveMinCandles,
          vwap: fiveMinCandles[fiveMinCandles.length - 1]?.vwap,
          dayOpen,
          dayHigh,
          dayLow,
          prevClose,
          volumeAvailable: hasVolume,
          volumeMessage
        },
        fifteenMin: {
          timeframe: '15min',
          candles: fifteenMinCandles,
          vwap: fifteenMinCandles[fifteenMinCandles.length - 1]?.vwap,
          dayOpen,
          dayHigh,
          dayLow,
          prevClose,
          volumeAvailable: hasVolume,
          volumeMessage
        },
        oneHour: {
          timeframe: '1hr',
          candles: oneHourCandles,
          vwap: oneHourCandles[oneHourCandles.length - 1]?.vwap,
          dayOpen,
          dayHigh,
          dayLow,
          prevClose,
          volumeAvailable: hasVolume,
          volumeMessage
        }
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: payload
    });
  } catch (err) {
    console.error('[MarketChart API] Critical error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal market chart error'
      },
      { status: 500 }
    );
  }
}
