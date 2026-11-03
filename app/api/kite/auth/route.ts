import { NextResponse } from 'next/server';
import {
  getKiteSessionFromRequest,
  getKiteConfigFromRequest,
  setManualKiteToken,
  clearKiteSession,
  getKiteLoginUrl,
  sealData,
  createKiteSessionCookieOptions,
  createKiteConfigCookieOptions
} from '@/lib/kite/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = getKiteSessionFromRequest(request);
    const isAuth = Boolean(session && session.accessToken && Date.now() < session.expiresAtMs);
    const config = getKiteConfigFromRequest(request);

    return NextResponse.json({
      isAuthenticated: isAuth,
      userId: session?.userId,
      userName: session?.userName,
      expiresAt: session ? new Date(session.expiresAtMs).toISOString() : null,
      apiKeyConfigured: Boolean(config?.apiKey),
      apiKey: config?.apiKey ? `${config.apiKey.slice(0, 4)}••••${config.apiKey.slice(-4)}` : null,
      hasSecret: Boolean(config?.apiSecret)
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch Kite auth status';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Save API Key and Secret
    if (action === 'save_config') {
      const { apiKey, apiSecret } = body;
      if (!apiKey) {
        return NextResponse.json({ error: 'Kite API Key is required' }, { status: 400 });
      }

      const sealedConfig = sealData({
        apiKey: (apiKey || '').trim(),
        apiSecret: (apiSecret || '').trim()
      });

      const response = NextResponse.json({
        success: true,
        message: 'Kite credentials saved securely in browser session.'
      });

      response.cookies.set('kite_config', sealedConfig, createKiteConfigCookieOptions());
      return response;
    }

    // 2. Generate Kite Login URL
    if (action === 'get_login_url') {
      const { redirectUri } = body;
      const loginUrl = getKiteLoginUrl(redirectUri, request);
      return NextResponse.json({
        success: true,
        loginUrl
      });
    }

    // 3. Manual Token Paste
    if (action === 'manual_token') {
      const { apiKey, accessToken, userId, userName } = body;
      if (!apiKey || !accessToken) {
        return NextResponse.json({ error: 'API Key and Access Token are required' }, { status: 400 });
      }

      const session = setManualKiteToken(apiKey, accessToken, userId, userName);
      const sealedSession = sealData(session);

      const response = NextResponse.json({
        success: true,
        session: {
          userId: session.userId,
          userName: session.userName,
          expiresAt: new Date(session.expiresAtMs).toISOString()
        }
      });

      response.cookies.set('kite_session', sealedSession, createKiteSessionCookieOptions(session.expiresAtMs));
      return response;
    }

    // 4. Disconnect
    if (action === 'disconnect') {
      clearKiteSession();
      const response = NextResponse.json({
        success: true,
        message: 'Kite session disconnected.'
      });

      response.cookies.set('kite_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0
      });

      return response;
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Kite action failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
