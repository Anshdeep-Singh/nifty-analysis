'use client';

import React, { useState } from 'react';
import { X, Key, ShieldCheck, LogIn, Unlink, AlertTriangle, ExternalLink, Laptop, Globe } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  userId?: string;
  userName?: string;
  apiKeyConfigured: boolean;
  onRefreshStatus: () => void;
}

export function KiteAuthModal({
  isOpen,
  onClose,
  isAuthenticated,
  userId,
  userName,
  apiKeyConfigured,
  onRefreshStatus
}: Props) {
  const [tab, setTab] = useState<'oauth' | 'manual' | 'config'>('oauth');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [manualUserId, setManualUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/kite/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', apiKey, apiSecret })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save credentials');
      setMessage({ text: 'Credentials saved securely in browser session.', type: 'success' });
      onRefreshStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleKiteLoginRedirect = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      // Pass origin redirect_url (User profile invariant: port 3000 on localhost, nifty.anshdeepsingh.com in prod)
      const redirectUri = `${window.location.origin}/api/kite/callback`;
      const res = await fetch('/api/kite/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_login_url', redirectUri })
      });
      const data = await res.json();
      if (!res.ok || !data.loginUrl) throw new Error(data.error || 'Failed to get login URL');
      window.location.href = data.loginUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to redirect to Kite';
      setMessage({ text: msg, type: 'error' });
      setLoading(false);
    }
  };

  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/kite/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual_token',
          apiKey: apiKey.trim() || 'configured',
          accessToken: accessToken.trim(),
          userId: manualUserId.trim() || 'Trader'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set token');
      setMessage({ text: 'Token validated and session established!', type: 'success' });
      onRefreshStatus();
      setTimeout(onClose, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetch('/api/kite/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' })
      });
      onRefreshStatus();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0d121d] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100 tracking-wide">Zerodha Kite Connectivity</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isAuthenticated && (
          <div className="my-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Active Kite Session</p>
                <p className="text-sm font-medium text-slate-200">
                  {userName || userId} <span className="text-xs text-slate-400">({userId})</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
            >
              <Unlink className="h-3.5 w-3.5" />
              Disconnect
            </button>
          </div>
        )}

        <div className="flex gap-2 my-4 border-b border-slate-800 pb-2">
          <button
            onClick={() => setTab('oauth')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              tab === 'oauth' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1-Click OAuth Login
          </button>
          <button
            onClick={() => setTab('manual')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              tab === 'manual' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste Daily Token
          </button>
          <button
            onClick={() => setTab('config')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              tab === 'config' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            API Credentials
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-lg p-3 text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border border-red-500/30 bg-red-500/10 text-red-300'
            }`}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {tab === 'oauth' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Authenticate directly via Zerodha Kite Connect login. Exchanging the single-use request token establishes sub-second live market feeds.
            </p>
            <button
              onClick={handleKiteLoginRedirect}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Initiating Zerodha Login...' : 'Login with Kite Connect'}
            </button>
            {!apiKeyConfigured && (
              <p className="text-[11px] text-amber-400/90 text-center">
                Note: Configure your Kite API Key in the &quot;API Credentials&quot; tab first.
              </p>
            )}

            {/* Dual Localhost & nifty.anshdeepsingh.com Architecture Guide */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5 text-[11px] text-slate-400">
              <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <Laptop className="h-3.5 w-3.5" />
                Dual Connection: Localhost (Port 3000) & nifty.anshdeepsingh.com
              </p>
              <p className="leading-relaxed">
                Zerodha Kite Connect strictly redirects to the single authoritative <strong className="text-slate-200">Redirect URL</strong> registered in your <a href="https://developers.kite.trade" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">developers.kite.trade</a> console:
              </p>
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800 font-mono text-[10px] space-y-1 text-slate-300">
                <div>• Production: <code>https://nifty.anshdeepsingh.com/api/kite/callback</code></div>
                <div>• Localhost: <code>http://localhost:3000/api/kite/callback</code></div>
              </div>
              <p className="leading-relaxed text-slate-300">
                <strong>How Dual Sync Works:</strong> If your console is registered with <code className="text-cyan-300">nifty.anshdeepsingh.com</code>, completing login on the web automatically provides a 1-click bridge to immediately sync today&apos;s session to your local app at <code className="text-cyan-300">http://localhost:3000</code>.
              </p>
            </div>
          </div>
        )}

        {tab === 'manual' && (
          <form onSubmit={handleManualTokenSubmit} className="space-y-3">
            <p className="text-xs text-slate-300">
              Already have today&apos;s generated <code className="text-cyan-300">access_token</code>? Paste it here for immediate zero-redirect connection.
            </p>
            <div>
              <label className="text-[11px] font-medium text-slate-400">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your Kite API Key"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400">Access Token (Required)</label>
              <input
                type="text"
                required
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="e.g. 32-character hex token"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400">User ID / Label (Optional)</label>
              <input
                type="text"
                value={manualUserId}
                onChange={(e) => setManualUserId(e.target.value)}
                placeholder="e.g. AB1234"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !accessToken}
              className="mt-2 w-full rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Validating...' : 'Set Active Session'}
            </button>
          </form>
        )}

        {tab === 'config' && (
          <form onSubmit={handleSaveConfig} className="space-y-3">
            <p className="text-xs text-slate-300">
              Stored securely in an AES-256-GCM encrypted HttpOnly cookie in your browser session.
            </p>
            <div>
              <label className="text-[11px] font-medium text-slate-400">Kite API Key</label>
              <input
                type="text"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="e.g. 11-character key"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400">Kite API Secret</label>
              <input
                type="password"
                required
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="e.g. 32-character secret"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !apiKey}
              className="mt-2 w-full rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save API Credentials'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
