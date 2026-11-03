import { NextResponse } from 'next/server';
import {
  exchangeKiteToken,
  getKiteConfigFromRequest,
  setManualKiteToken,
  sealData,
  createKiteSessionCookieOptions
} from '@/lib/kite/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = url.origin || '';
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  // 1. Direct Access Token Import (e.g. from developer console or bridge redirect from nifty.anshdeepsingh.com)
  const directToken = url.searchParams.get('access_token') || url.searchParams.get('token');
  if (directToken) {
    const config = getKiteConfigFromRequest(request);
    const apiKey = url.searchParams.get('api_key') || config?.apiKey || process.env.KITE_API_KEY || 'configured';
    const userId = url.searchParams.get('user_id') || 'Trader';
    const userName = url.searchParams.get('user_name') || userId;

    const session = setManualKiteToken(apiKey, directToken, userId, userName);
    const redirectRes = NextResponse.redirect(
      `${baseUrl}/?kite_success=true&user=${encodeURIComponent(userName)}`
    );

    const sealedSession = sealData(session);
    redirectRes.cookies.set(
      'kite_session',
      sealedSession,
      createKiteSessionCookieOptions(session.expiresAtMs)
    );
    return redirectRes;
  }

  // 2. Standard Zerodha OAuth Request Token Callback
  const requestToken = url.searchParams.get('request_token');
  const status = url.searchParams.get('status');

  if (status !== 'success' || !requestToken) {
    const errorMsg = url.searchParams.get('message') || 'Login cancelled or failed at Zerodha';
    return NextResponse.redirect(`${baseUrl}/?kite_error=${encodeURIComponent(errorMsg)}`);
  }

  try {
    const config = getKiteConfigFromRequest(request);
    const session = await exchangeKiteToken(requestToken, config);
    const sealedSession = sealData(session);

    // If callback landed on production domain (e.g. nifty.anshdeepsingh.com) because developers.kite.trade
    // has the production URL registered, support seamless bridge to local development environment
    const isProductionDomain = !isLocalhost && (url.hostname.includes('anshdeepsingh.com') || url.hostname.includes('nifty'));
    const isLocalRequested = url.searchParams.get('to_local') === 'true' || url.searchParams.get('target') === 'localhost';

    if (isProductionDomain) {
      // Build bridge URL to sync access_token with http://localhost:3000
      const localSyncUrl = `http://localhost:3000/api/kite/callback?access_token=${encodeURIComponent(session.accessToken)}&api_key=${encodeURIComponent(session.apiKey)}&user_id=${encodeURIComponent(session.userId || 'Trader')}&user_name=${encodeURIComponent(session.userName || 'Trader')}`;

      // If explicit local target was requested, redirect to local immediately
      if (isLocalRequested) {
        const localRedirect = NextResponse.redirect(localSyncUrl);
        localRedirect.cookies.set(
          'kite_session',
          sealedSession,
          createKiteSessionCookieOptions(session.expiresAtMs)
        );
        return localRedirect;
      }

      // Render dual-connection bridge HTML: establishes session on production AND gives 1-click sync to localhost:3000
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Zerodha Kite Connected - Nifty Analysis</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      background-color: #0b0f17;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
    }
    .card {
      background-color: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 32px;
      max-width: 460px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 8px;
      color: #ffffff;
    }
    p {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
      margin: 0 0 24px;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 12px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      box-sizing: border-box;
      margin-bottom: 12px;
      transition: all 0.2s;
    }
    .btn-prod {
      background: #0891b2;
      color: #ffffff;
    }
    .btn-prod:hover {
      background: #06b6d4;
    }
    .btn-local {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .btn-local:hover {
      background: rgba(99, 102, 241, 0.25);
    }
    .token-box {
      background: #0b0f17;
      border: 1px solid #1f2937;
      border-radius: 8px;
      padding: 10px;
      font-family: monospace;
      font-size: 11px;
      color: #cbd5e1;
      word-break: break-all;
      margin-bottom: 16px;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">✓ KITE CONNECT AUTHENTICATED</div>
    <h1>Welcome, ${session.userName || session.userId || 'Trader'}</h1>
    <p>Your Zerodha Kite session is established securely on <strong>nifty.anshdeepsingh.com</strong>.</p>
    
    <a href="/?kite_success=true&user=${encodeURIComponent(session.userName || session.userId || '')}" class="btn btn-prod">
      ⚡ Continue on nifty.anshdeepsingh.com
    </a>

    <a href="${localSyncUrl}" class="btn btn-local">
      💻 Sync Session to Localhost (http://localhost:3000)
    </a>

    <div class="token-box">
      <strong>Access Token:</strong><br />
      ${session.accessToken}
    </div>
  </div>
  <script>
    // If opened from a localhost referral, automatically redirect to local sync
    if (document.referrer && (document.referrer.includes('localhost') || document.referrer.includes('127.0.0.1'))) {
      window.location.href = "${localSyncUrl}";
    }
  </script>
</body>
</html>`;

      const response = new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });

      response.cookies.set(
        'kite_session',
        sealedSession,
        createKiteSessionCookieOptions(session.expiresAtMs)
      );

      return response;
    }

    // Standard localhost flow
    const redirectRes = NextResponse.redirect(
      `${baseUrl}/?kite_success=true&user=${encodeURIComponent(session.userName || session.userId || '')}`
    );

    redirectRes.cookies.set(
      'kite_session',
      sealedSession,
      createKiteSessionCookieOptions(session.expiresAtMs)
    );

    return redirectRes;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Token exchange failed';
    return NextResponse.redirect(`${baseUrl}/?kite_error=${encodeURIComponent(msg)}`);
  }
}
