'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  Compass,
  Grid,
  List,
  Layers,
  BellRing,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles
} from 'lucide-react';
import { NiftyAnalysisState } from '@/lib/types';
import { PredictionLevelsCard } from './PredictionLevelsCard';
import { SectorCoDependencyMatrix } from './SectorCoDependencyMatrix';
import { AnomalyAlertFeed } from './AnomalyAlertFeed';
import { ConstituentsHeatmap } from './ConstituentsHeatmap';
import { ConstituentsTable } from './ConstituentsTable';

export function NiftyAnalysisRadar() {
  const [data, setData] = useState<NiftyAnalysisState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'overview' | 'heatmap' | 'sectors' | 'anomalies' | 'table'>('overview');
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(3);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchAnalysis = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`/api/nifty-analysis?refresh=${isManual ? 'true' : 'false'}&_t=${Date.now()}`, {
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
      console.warn('[NiftyAnalysisRadar] Live fetch failed:', err);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchAnalysis(false);
  }, [fetchAnalysis]);

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
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <h2 className="text-lg font-bold text-white tracking-tight">Initializing NIFTY 50 Microstructure Radar...</h2>
        <p className="text-xs text-slate-400 mt-1">
          Aggregating 50 constituents, sector co-dependencies, and live market breadth.
        </p>
      </div>
    );
  }

  const isNetPositive = data.spotNetChange >= 0;

  return (
    <div className="space-y-5">
      {/* Top Cockpit Header Bar */}
      <header className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Nifty 50 Spot Quote */}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                NIFTY 50 INDEX
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                data.dataSource === 'KITE_LIVE'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : data.dataSource === 'EXCHANGE_LIVE'
                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {data.dataSource === 'KITE_LIVE' ? 'Kite Live' : data.dataSource === 'EXCHANGE_LIVE' ? 'Exchange Live' : 'Market Snapshot'}
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
              <span className="text-cyan-400 font-semibold">India VIX: {data.vix.toFixed(2)}</span>
              <span>•</span>
              <span>1σ Move: ±{data.expected1DayMove} pts</span>
            </div>
          </div>

          {/* Advances / Declines Breadth Bar */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 w-full lg:w-auto min-w-[320px]">
            <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                {data.advancesDeclines.advances} Advances ({data.advancesDeclines.advancingWeight.toFixed(1)}% wt)
              </span>
              <span className="text-rose-400 font-bold flex items-center gap-1">
                {data.advancesDeclines.declines} Declines ({data.advancesDeclines.decliningWeight.toFixed(1)}% wt)
              </span>
            </div>

            {/* Split Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${Math.max(5, data.advancesDeclines.advancingWeight)}%` }}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${Math.max(5, data.advancesDeclines.decliningWeight)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1.5">
              <span>A/D Ratio: <strong className="text-white">{data.advancesDeclines.adRatio}</strong></span>
              <span className="text-cyan-300 uppercase font-semibold">{data.advancesDeclines.breadthVelocity.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Refresh & Auto-Sync Controls */}
          <div className="flex items-center gap-2 self-end lg:self-center">
            <select
              value={refreshIntervalSec}
              onChange={(e) => setRefreshIntervalSec(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md"
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
            { id: 'heatmap', label: '50 Heatmap', icon: Grid },
            { id: 'sectors', label: 'Sectors & Co-Dependency', icon: Compass },
            { id: 'anomalies', label: `Anomalies (${data.anomalies.length})`, icon: BellRing },
            { id: 'table', label: 'All Constituents Table', icon: List }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as typeof viewMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
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
        <div className="space-y-5">
          <PredictionLevelsCard prediction={data.prediction} />
          <SectorCoDependencyMatrix coDependency={data.coDependency} />
          {data.anomalies.length > 0 && <AnomalyAlertFeed anomalies={data.anomalies} />}
          <ConstituentsHeatmap stocks={data.stocks} />
        </div>
      )}

      {viewMode === 'heatmap' && (
        <ConstituentsHeatmap stocks={data.stocks} />
      )}

      {viewMode === 'sectors' && (
        <SectorCoDependencyMatrix coDependency={data.coDependency} />
      )}

      {viewMode === 'anomalies' && (
        <AnomalyAlertFeed anomalies={data.anomalies} />
      )}

      {viewMode === 'table' && (
        <ConstituentsTable stocks={data.stocks} sectors={data.sectors} />
      )}

      {/* Footer Info */}
      <footer className="text-center text-xs text-slate-500 py-4 font-mono">
        NIFTY 50 Microstructure Radar • Last Refreshed: {data.timestamp} • All prices in INR
      </footer>
    </div>
  );
}
