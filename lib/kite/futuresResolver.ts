/**
 * Resolves active near-month NIFTY and BANKNIFTY Futures contracts from Zerodha Kite Connect NFO instruments.
 * Dynamic Invariant: Strictly zero hardcoded dates or tokens; contracts are discovered from live exchange master.
 */

export interface ActiveFuturesContract {
  symbol: 'NIFTY' | 'BANKNIFTY';
  instrumentToken: number;
  tradingSymbol: string;
  expiry: string;
}

interface FuturesCache {
  timestamp: number;
  contracts: Record<'NIFTY' | 'BANKNIFTY', ActiveFuturesContract | null>;
}

const globalFuturesCache = globalThis as unknown as {
  __NIFTY_FUTURES_CACHE__?: FuturesCache | null;
};

if (!globalFuturesCache.__NIFTY_FUTURES_CACHE__) {
  globalFuturesCache.__NIFTY_FUTURES_CACHE__ = null;
}

/**
 * Downloads and parses live Zerodha Kite NFO instruments CSV to extract front-month futures tokens.
 */
export async function getActiveFuturesContract(
  symbol: 'NIFTY' | 'BANKNIFTY',
  forceRefresh = false
): Promise<ActiveFuturesContract | null> {
  const now = Date.now();
  const cached = globalFuturesCache.__NIFTY_FUTURES_CACHE__;

  // 4-hour in-memory cache
  if (!forceRefresh && cached && now - cached.timestamp < 4 * 60 * 60 * 1000) {
    if (cached.contracts[symbol]) {
      return cached.contracts[symbol];
    }
  }

  try {
    const res = await fetch('https://api.kite.trade/instruments/NFO', {
      headers: { Accept: 'text/csv' },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      if (cached?.contracts[symbol]) return cached.contracts[symbol];
      return null;
    }

    const text = await res.text();
    const lines = text.split('\n');

    // Current IST date (YYYY-MM-DD)
    const istDate = new Date(Date.now() + 5.5 * 3600 * 1000);
    const todayStr = istDate.toISOString().split('T')[0];
    const currentTotalMins = istDate.getUTCHours() * 60 + istDate.getUTCMinutes();

    // If past 15:30 IST market close on expiry day, advance minimum valid expiry to tomorrow
    const minExpiryStr = currentTotalMins >= 15 * 60 + 30
      ? new Date(Date.now() + 5.5 * 3600 * 1000 + 86400000).toISOString().split('T')[0]
      : todayStr;

    const matchedContracts: {
      NIFTY: ActiveFuturesContract[];
      BANKNIFTY: ActiveFuturesContract[];
    } = {
      NIFTY: [],
      BANKNIFTY: []
    };

    // Header: instrument_token,exchange_token,tradingsymbol,name,last_price,expiry,strike,tick_size,lot_size,instrument_type,segment,exchange
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length < 10) continue;

      const name = parts[3]?.replace(/^"|"$/g, '').trim();
      if (name !== 'NIFTY' && name !== 'BANKNIFTY') continue;

      const instType = parts[9]?.trim();
      if (instType !== 'FUT') continue;

      const expiry = parts[5]?.trim();
      if (!expiry || expiry < minExpiryStr) continue;

      const instToken = parseInt(parts[0], 10);
      const tradingSymbol = parts[2]?.trim();

      if (instToken > 0 && tradingSymbol) {
        matchedContracts[name].push({
          symbol: name,
          instrumentToken: instToken,
          tradingSymbol,
          expiry
        });
      }
    }

    // Sort by expiry ascending to select the front-month contract
    matchedContracts.NIFTY.sort((a, b) => a.expiry.localeCompare(b.expiry));
    matchedContracts.BANKNIFTY.sort((a, b) => a.expiry.localeCompare(b.expiry));

    const frontNifty = matchedContracts.NIFTY[0] || null;
    const frontBankNifty = matchedContracts.BANKNIFTY[0] || null;

    globalFuturesCache.__NIFTY_FUTURES_CACHE__ = {
      timestamp: now,
      contracts: {
        NIFTY: frontNifty,
        BANKNIFTY: frontBankNifty
      }
    };

    return symbol === 'NIFTY' ? frontNifty : frontBankNifty;
  } catch (err) {
    console.warn('[FuturesResolver] Could not resolve front-month futures:', err);
    if (cached?.contracts[symbol]) return cached.contracts[symbol];
    return null;
  }
}
