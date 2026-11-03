import crypto from 'crypto';
import { KiteSession, KiteConfig } from '../types';

const COOKIE_ENCRYPTION_SECRET =
  process.env.KITE_COOKIE_SECRET ||
  process.env.KITE_API_SECRET ||
  '@nshdeep111_nifty_analysis_session_secret_2026';

const COOKIE_KEY = crypto.createHash('sha256').update(COOKIE_ENCRYPTION_SECRET).digest();

// In-memory global fallback state for Node server runtime
const globalKiteState = globalThis as unknown as {
  __NIFTY_ANALYSIS_KITE_SESSION__?: KiteSession | null;
  __NIFTY_ANALYSIS_KITE_CONFIG__?: KiteConfig | null;
};

if (!globalKiteState.__NIFTY_ANALYSIS_KITE_SESSION__) {
  globalKiteState.__NIFTY_ANALYSIS_KITE_SESSION__ = null;
}
if (!globalKiteState.__NIFTY_ANALYSIS_KITE_CONFIG__) {
  globalKiteState.__NIFTY_ANALYSIS_KITE_CONFIG__ = null;
}

/**
 * Seals payload with AES-256-GCM for tamper-proof HttpOnly browser cookies
 */
export function sealData(data: unknown): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', COOKIE_KEY, iv);
  const jsonStr = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

/**
 * Unseals and decrypts AES-256-GCM payload. Returns null if invalid or tampered.
 */
export function unsealData<T>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [ivB64, tagB64, encB64] = parts;
    const iv = Buffer.from(ivB64, 'base64url');
    const tag = Buffer.from(tagB64, 'base64url');
    const enc = Buffer.from(encB64, 'base64url');

    const decipher = crypto.createDecipheriv('aes-256-gcm', COOKIE_KEY, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

/**
 * Parses raw Cookie header string into key-value map
 */
export function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  const items = cookieHeader.split(';');
  for (const item of items) {
    const [name, ...rest] = item.trim().split('=');
    if (name) {
      cookies[name] = decodeURIComponent(rest.join('='));
    }
  }
  return cookies;
}

export function createKiteSessionCookieOptions(expiresAtMs: number) {
  const maxAgeSec = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSec
  };
}

export function createKiteConfigCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 365 * 24 * 60 * 60 // 1 year
  };
}

/**
 * Calculates next 06:00 AM IST (00:30 UTC) expiration for Zerodha Kite session tokens.
 * Accurately prevents token desynchronization across timezones.
 */
export function getNextKiteExpiry6AM(): number {
  const now = Date.now();
  const d = new Date(now);
  // 06:00 AM IST = 00:30 UTC
  const expiry = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 30, 0, 0));
  if (expiry.getTime() <= now) {
    expiry.setUTCDate(expiry.getUTCDate() + 1);
  }
  return expiry.getTime();
}

/**
 * Extracts active Kite Session from request cookies, headers, or memory
 */
export function getKiteSessionFromRequest(request?: Request | null): KiteSession | null {
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) {
        return {
          apiKey: process.env.KITE_API_KEY || '',
          accessToken: token,
          loginTimeMs: Date.now(),
          expiresAtMs: getNextKiteExpiry6AM()
        };
      }
    }

    const cookieHeader = request.headers.get('cookie');
    const cookies = parseCookieHeader(cookieHeader);
    const sealedSession = cookies['kite_session'];
    if (sealedSession) {
      const session = unsealData<KiteSession>(sealedSession);
      if (session && session.accessToken && Date.now() < session.expiresAtMs) {
        return session;
      }
    }
  }

  // Fallback to memory state
  const memSession = globalKiteState.__NIFTY_ANALYSIS_KITE_SESSION__;
  if (memSession && memSession.accessToken && Date.now() < memSession.expiresAtMs) {
    return memSession;
  }

  // Fallback to environment variables if provided
  if (process.env.KITE_API_KEY && process.env.KITE_ACCESS_TOKEN) {
    return {
      apiKey: process.env.KITE_API_KEY,
      apiSecret: process.env.KITE_API_SECRET,
      accessToken: process.env.KITE_ACCESS_TOKEN,
      loginTimeMs: Date.now(),
      expiresAtMs: getNextKiteExpiry6AM()
    };
  }

  return null;
}

/**
 * Extracts saved Kite Config (API key/secret) from request cookies or environment
 */
export function getKiteConfigFromRequest(request?: Request | null): KiteConfig | null {
  if (request) {
    const cookieHeader = request.headers.get('cookie');
    const cookies = parseCookieHeader(cookieHeader);
    const sealedConfig = cookies['kite_config'];
    if (sealedConfig) {
      const config = unsealData<KiteConfig>(sealedConfig);
      if (config && config.apiKey) {
        return config;
      }
    }
  }

  if (globalKiteState.__NIFTY_ANALYSIS_KITE_CONFIG__?.apiKey) {
    return globalKiteState.__NIFTY_ANALYSIS_KITE_CONFIG__;
  }

  if (process.env.KITE_API_KEY) {
    return {
      apiKey: process.env.KITE_API_KEY,
      apiSecret: process.env.KITE_API_SECRET
    };
  }

  return null;
}

export function isKiteAuthenticated(reqOrSession?: Request | KiteSession | null): boolean {
  if (!reqOrSession) {
    const s = getKiteSessionFromRequest();
    return Boolean(s && s.accessToken && Date.now() < s.expiresAtMs);
  }
  if ('accessToken' in reqOrSession) {
    return Boolean(reqOrSession.accessToken && Date.now() < reqOrSession.expiresAtMs);
  }
  const s = getKiteSessionFromRequest(reqOrSession);
  return Boolean(s && s.accessToken && Date.now() < s.expiresAtMs);
}

export function setKiteSession(session: KiteSession): void {
  globalKiteState.__NIFTY_ANALYSIS_KITE_SESSION__ = session;
}

export function clearKiteSession(): void {
  globalKiteState.__NIFTY_ANALYSIS_KITE_SESSION__ = null;
}

export function setKiteConfig(apiKey: string, apiSecret?: string): void {
  globalKiteState.__NIFTY_ANALYSIS_KITE_CONFIG__ = { apiKey, apiSecret };
}

export function getKiteLoginUrl(redirectUri?: string, request?: Request | null): string {
  const config = getKiteConfigFromRequest(request);
  const apiKey = config?.apiKey;
  if (!apiKey) {
    throw new Error('Kite API Key is not configured. Please save API credentials first.');
  }

  const base = 'https://kite.zerodha.com/connect/login';
  const params = new URLSearchParams();
  params.append('v', '3');
  params.append('api_key', apiKey);
  // User Profile Invariant: Must strictly use query parameter redirect_url (not redirect_uri)
  if (redirectUri) {
    params.append('redirect_url', redirectUri);
  }
  return `${base}?${params.toString()}`;
}

export function setManualKiteToken(
  apiKey: string,
  accessToken: string,
  userId?: string,
  userName?: string
): KiteSession {
  const now = Date.now();
  const session: KiteSession = {
    apiKey: apiKey.trim(),
    accessToken: accessToken.trim(),
    userId: userId?.trim() || 'Trader',
    userName: userName?.trim() || userId?.trim() || 'Trader',
    loginTimeMs: now,
    expiresAtMs: getNextKiteExpiry6AM()
  };

  setKiteSession(session);
  return session;
}

export async function exchangeKiteToken(
  requestToken: string,
  configOverride?: KiteConfig | null
): Promise<KiteSession> {
  const cfg = configOverride || getKiteConfigFromRequest();
  const apiKey = cfg?.apiKey;
  const apiSecret = cfg?.apiSecret;

  if (!apiKey || !apiSecret) {
    throw new Error('Kite API Key and API Secret are required to exchange request token.');
  }

  const hash = crypto.createHash('sha256');
  hash.update(apiKey + requestToken.trim() + apiSecret);
  const checksum = hash.digest('hex');

  const bodyParams = new URLSearchParams();
  bodyParams.append('api_key', apiKey);
  bodyParams.append('request_token', requestToken.trim());
  bodyParams.append('checksum', checksum);

  const res = await fetch('https://api.kite.trade/session/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Kite-Version': '3'
    },
    body: bodyParams.toString(),
    signal: AbortSignal.timeout(10000)
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    const msg = errJson.message || `Kite token exchange failed (HTTP ${res.status})`;
    throw new Error(msg);
  }

  const json = await res.json();
  const data = json.data;
  const accessToken = data.access_token;
  const publicToken = data.public_token;
  const userId = data.user_id;
  const userName = data.user_name || data.user_shortname || userId;

  const now = Date.now();
  const session: KiteSession = {
    apiKey,
    apiSecret,
    accessToken,
    publicToken,
    userId,
    userName,
    loginTimeMs: now,
    expiresAtMs: getNextKiteExpiry6AM()
  };

  setKiteSession(session);
  return session;
}

export interface KiteQuoteItem {
  instrument_token: number;
  timestamp: string;
  last_price: number;
  net_change: number;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  volume?: number;
  oi?: number;
  depth?: {
    buy: Array<{ price: number; quantity: number; orders: number }>;
    sell: Array<{ price: number; quantity: number; orders: number }>;
  };
}

/**
 * Fetch live market quotes for indices and stocks directly from Zerodha Kite Connect REST API.
 * Uses chunks of 200 instruments to stay well within Kite's limits.
 */
export async function fetchKiteQuotes(
  queryKeys: string[],
  sessionOverride?: KiteSession | null
): Promise<Record<string, KiteQuoteItem>> {
  const session = sessionOverride || getKiteSessionFromRequest();
  if (!session || !session.accessToken || queryKeys.length === 0) {
    return {};
  }

  const { apiKey, accessToken } = session;
  const quotesMap: Record<string, KiteQuoteItem> = {};
  const CHUNK_SIZE = 200;

  for (let i = 0; i < queryKeys.length; i += CHUNK_SIZE) {
    const chunk = queryKeys.slice(i, i + CHUNK_SIZE);
    const params = chunk.map((s) => `i=${encodeURIComponent(s)}`).join('&');
    try {
      const res = await fetch(`https://api.kite.trade/quote?${params}`, {
        headers: {
          'X-Kite-Version': '3',
          Authorization: `token ${apiKey}:${accessToken}`
        },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const json = await res.json();
        const data = json?.data || {};
        for (const [k, v] of Object.entries(data)) {
          quotesMap[k] = v as KiteQuoteItem;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch Kite quote chunk:', err);
    }
  }

  return quotesMap;
}

export interface KiteHistoricalCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Fetch 5-minute, 15-minute, 60-minute, or minute historical candles from Zerodha Kite Connect
 */
export async function fetchKiteHistoricalCandles(
  instrumentToken: number,
  interval: 'minute' | '3minute' | '5minute' | '10minute' | '15minute' | '30minute' | '60minute' | 'day',
  fromStr: string,
  toStr: string,
  sessionOverride?: KiteSession | null
): Promise<KiteHistoricalCandle[]> {
  const session = sessionOverride || getKiteSessionFromRequest();
  if (!session || !session.accessToken) {
    throw new Error('Kite session is not active. Please authenticate Kite Connect.');
  }

  const { apiKey, accessToken } = session;
  const url = `https://api.kite.trade/instruments/historical/${instrumentToken}/${interval}?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}`;

  const res = await fetch(url, {
    headers: {
      'X-Kite-Version': '3',
      Authorization: `token ${apiKey}:${accessToken}`,
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(20000)
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson?.message) {
        errMsg = errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(`Kite Historical API error: ${errMsg}`);
  }

  const json = await res.json();
  const rawCandles = json?.data?.candles;
  if (!Array.isArray(rawCandles)) {
    return [];
  }

  return rawCandles.map((c: [string, number, number, number, number, number]) => ({
    timestamp: Math.floor(new Date(c[0]).getTime() / 1000),
    open: Number(c[1]),
    high: Number(c[2]),
    low: Number(c[3]),
    close: Number(c[4]),
    volume: Number(c[5]) || 0
  }));
}

