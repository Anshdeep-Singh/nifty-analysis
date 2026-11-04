'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  Compass,
  Grid,
  List,
  BellRing,
  TrendingUp,
  TrendingDown,
  Key,
  BarChart3,
  Landmark
} from 'lucide-react';
import { BankNiftyAnalysisState } from '@/lib/types';
import { PredictionLevelsCard } from './PredictionLevelsCard';
import { SectorCoDependencyMatrix } from './SectorCoDependencyMatrix';
import { AnomalyAlertFeed } from './AnomalyAlertFeed';
import { ConstituentsHeatmap } from './ConstituentsHeatmap';
import { ConstituentsTable } from './ConstituentsTable';
import { KiteAuthModal } from './KiteAuthModal';
import { MultiTfParallelCharts } from './MultiTfParallelCharts';
import { DashboardNav } from './DashboardNav';

export function BankNiftyAnalysisRadar() {
  const [data, setData] = useState<BankNiftyAnalysisState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'overview' | 'charts' | 'heatmap' | 'sectors' | 'anomalies' | 'table'>('overview');
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(3);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Kite Auth State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [kiteAuth, setKiteAuth] = useState<{
    isAuthenticated: boolean;
    userId?: string;
    userName?: string;
    apiKeyConfigured: boolean;
  }>({
    isAuthenticated: false,
    apiKeyConfigured: false
  });

  const checkKiteStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/kite/auth');
      if (res.ok) {
        const json = await res.json();
        setKiteAuth({
          isAuthenticated: !!json.isAuthenticated,
          userId: json.userId,
          userName: json.userName,
          apiKeyConfigured: !!json.apiKeyConfigured
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchAnalysis = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`/api/bank-nifty-analysis?refresh=${isManual ? 'true' : 'false'}&_t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          setLastRefreshed(new Date());
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }
    } catch (err) {
      console.warn('[BankNiftyAnalysisRadar] Live fetch failed:', err);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchAnalysis(false);
    checkKiteStatus();
  }, [fetchAnalysis, checkKiteStatus]);

  // Periodic polling
  useEffect(() => {
    if (refreshIntervalSec <= 0) return;
    const interval = setInterval(() => {
      fetchAnalysis(false);
    }, refreshIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [refreshIntervalSec, fetchAnalysis]);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <DashboardNav
          activeSymbol="BANKNIFTY"
          kiteConnected={kiteAuth.isAuthenticated}
          kiteUser={kiteAuth.userName || kiteAuth.userId}
          onOpenKiteModal={() => setAuthModalOpen(true)}
        />
        <div className="min-h-[65vh] flex flex-col items-center justify-center p-6 text-center bg-slate-900/60 border border-slate-800 rounded-xl">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mb-3" />
          <h2 className="text-lg font-bold text-white tracking-tight">Initializing BANK NIFTY Microstructure Radar...</h2>
          <p className="text-xs text-slate-400 mt-1">
            Aggregating 14 banking constituents, Private vs PSU dynamics, and live market breadth.
          </p>
        </div>
      </div>
    );
  }

  const isNetPositive = data.spotNetChange >= 0;

  return (
    <div className="space-y-4">
      {/* Top Cross-Index Navigation */}
      <DashboardNav
        activeSymbol="BANKNIFTY"
        spotPrice={data.spotPrice}
        spotNetChange={data.spotNetChange}
        kiteConnected={kiteAuth.isAuthenticated}
        kiteUser={kiteAuth.userName || kiteAuth.userId}
        onOpenKiteModal={() => setAuthModalOpen(true)}
      />

      {/* Main Bank Nifty Cockpit Header Bar */}
      <header className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Bank Nifty Spot Quote */}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                <Landmark className="w-3 h-3" />
                BANK NIFTY INDEX
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                data.dataSource === 'KITE_LIVE'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : data.dataSource === 'EXCHANGE_LIVE'
                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {data.dataSource === 'KITE_LIVE' ? '● Kite Live' : data.dataSource === 'EXCHANGE_LIVE' ? 'Exchange Live' : 'Market Snapshot'}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mt-1.5">
              <h1 className="text-3xl font-extrabold tracking-tight font-mono text-white">
                {data.spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h1>
              <div className={`flex items-center gap-1 font-mono font-bold text-sm ${
                isNetPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isNetPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{isNetPositive ? '+' : ''}{data.spotNetChange.toFixed(2)}</span>
                <span>({isNetPositive ? '+' : ''}{data.spotChangePct.toFixed(2)}%)</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
              <span>Prev: ₹{data.spotPrevClose.toFixed(2)}</span>
              <span>•</span>
              <span className="text-sky-400 font-semibold">India VIX: {data.vix.toFixed(2)}</span>
              <span>•</span>
              <span className="text-cyan-300 font-semibold">1σ Move: ±{data.expected1DayMove} pts</span>
            </div>
          </div>

          {/* Advances / Declines & Turnover Flow Breadth Bar */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 w-full lg:w-auto min-w-[340px]">
            {/* Price Weight Breadth */}
            <div className="flex items-center justify-between text-xs mb-1 font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                {data.advancesDeclines.advances} Adv ({data.advancesDeclines.advancingWeight.toFixed(1)}% wt)
              </span>
              <span className="text-rose-400 font-bold flex items-center gap-1">
                {data.advancesDeclines.declines} Dec ({data.advancesDeclines.decliningWeight.toFixed(1)}% wt)
              </span>
            </div>

            {/* Split Progress Bar (Weight) */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex mb-2">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${Math.max(5, data.advancesDeclines.advancingWeight)}%` }}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${Math.max(5, data.advancesDeclines.decliningWeight)}%` }}
              />
            </div>

            {/* Rupee Turnover Flow */}
            <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
              <span className="text-emerald-300 font-semibold">
                Inflow: {data.advancesDeclines.advancingVolumePct.toFixed(0)}% (₹{data.advancesDeclines.advancingTurnoverCr.toFixed(0)} Cr)
              </span>
              <span className="text-rose-300 font-semibold">
                Outflow: {data.advancesDeclines.decliningVolumePct.toFixed(0)}% (₹{data.advancesDeclines.decliningTurnoverCr.toFixed(0)} Cr)
              </span>
            </div>

            {/* Split Progress Bar (Turnover) */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                className="bg-emerald-400 h-full transition-all duration-500"
                style={{ width: `${Math.max(5, data.advancesDeclines.advancingVolumePct)}%` }}
              />
              <div
                className="bg-rose-400 h-full transition-all duration-500"
                style={{ width: `${Math.max(5, data.advancesDeclines.decliningVolumePct)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1.5">
              <span>A/D: <strong className="text-white">{data.advancesDeclines.adRatio}</strong> | Vol: <strong className="text-cyan-300">{data.advancesDeclines.volumeBreadthRatio}x</strong></span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight ${
                data.advancesDeclines.volumeConviction.includes('ACCUMULATION') || data.advancesDeclines.volumeConviction.includes('INFLOW')
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : data.advancesDeclines.volumeConviction.includes('DISTRIBUTION') || data.advancesDeclines.volumeConviction.includes('OUTFLOW')
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {data.advancesDeclines.volumeConviction.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Controls: Kite Auth + Refresh */}
          <div className="flex items-center gap-2 self-end lg:self-center">
            {/* Kite Connect Pill */}
            <button
              onClick={() => setAuthModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                kiteAuth.isAuthenticated
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 shadow-sm shadow-emerald-950/40'
                  : 'border-orange-500/40 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20'
              }`}
              title={kiteAuth.isAuthenticated ? 'Kite Connect Live Session Active' : 'Connect Zerodha Kite Connect for Sub-Second Live Ticks'}
            >
              <Key className="w-3.5 h-3.5" />
              <span className="font-mono">{kiteAuth.isAuthenticated ? (kiteAuth.userId || 'Kite Connected') : 'Connect Kite'}</span>
            </button>

            <select
              value={refreshIntervalSec}
              onChange={(e) => setRefreshIntervalSec(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-sky-500"
            >
              <option value={2}>Auto 2s</option>
              <option value={3}>Auto 3s</option>
              <option value={5}>Auto 5s</option>
              <option value={10}>Auto 10s</option>
              <option value={0}>Manual</option>
            </select>

            <button
              onClick={() => fetchAnalysis(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-800/80 overflow-x-auto">
          {[
            { id: 'overview', label: 'Composite Overview', icon: Activity },
            { id: 'charts', label: 'Multi-TF Charts (5m/15m/1h)', icon: BarChart3 },
            { id: 'heatmap', label: '14 Bank Heatmap', icon: Grid },
            { id: 'sectors', label: 'Private vs PSU Co-Dependency', icon: Compass },
            { id: 'anomalies', label: `Anomalies (${data.anomalies.length})`, icon: BellRing },
            { id: 'table', label: 'All 14 Constituents Table', icon: List }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as typeof viewMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area based on View Mode */}
      {viewMode === 'overview' && (
        <div className="space-y-4">
          <PredictionLevelsCard prediction={data.prediction} />
          <SectorCoDependencyMatrix
            coDependency={data.coDependency}
            title="Private vs PSU Bank Co-Dependency & Transmission"
            subtitle="Quantifies cross-segment elasticity, lead-lag transmission, and capital rotation between Private and PSU banking buckets."
          />
          {data.anomalies.length > 0 && <AnomalyAlertFeed anomalies={data.anomalies} />}
          <ConstituentsHeatmap
            stocks={data.stocks}
            title="14 Bank Constituents Visual Heatmap"
            subtitle="Arranged by official NSE free-float weightage order across Private and PSU banks."
          />
        </div>
      )}

      {viewMode === 'charts' && (
        <MultiTfParallelCharts symbol="BANKNIFTY" />
      )}

      {viewMode === 'heatmap' && (
        <ConstituentsHeatmap
          stocks={data.stocks}
          title="14 Bank Constituents Visual Heatmap"
          subtitle="Arranged by official NSE free-float weightage order across Private and PSU banks."
        />
      )}

      {viewMode === 'sectors' && (
        <SectorCoDependencyMatrix
          coDependency={data.coDependency}
          title="Private vs PSU Bank Co-Dependency & Transmission"
          subtitle="Quantifies cross-segment elasticity, lead-lag transmission, and capital rotation between Private and PSU banking buckets."
        />
      )}

      {viewMode === 'anomalies' && (
        <AnomalyAlertFeed anomalies={data.anomalies} />
      )}

      {viewMode === 'table' && (
        <ConstituentsTable
          stocks={data.stocks}
          sectors={data.sectors}
          title="14 Bank Nifty Constituents Breakdown"
          subtitle="Detailed microstructure metrics, weights, and point impact across all 14 banking constituents."
        />
      )}

      {/* Kite Auth Modal */}
      <KiteAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        isAuthenticated={kiteAuth.isAuthenticated}
        userId={kiteAuth.userId}
        userName={kiteAuth.userName}
        apiKeyConfigured={kiteAuth.apiKeyConfigured}
        onRefreshStatus={() => {
          checkKiteStatus();
          fetchAnalysis(true);
        }}
      />

      {/* Footer Info */}
      <footer className="text-center text-xs text-slate-500 py-4 font-mono">
        BANK NIFTY Microstructure Radar • Source: {data.dataSource} • Last Refreshed: {data.timestamp} • All prices in INR
      </footer>
    </div>
  );
}
