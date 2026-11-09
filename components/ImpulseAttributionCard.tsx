'use client';

import React, { useState } from 'react';
import {
  Zap,
  Flame,
  Activity,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Wind,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { ImpulseAttribution } from '@/lib/types';

interface ImpulseAttributionCardProps {
  attribution?: ImpulseAttribution;
  indexName?: string;
}

export function ImpulseAttributionCard({
  attribution,
  indexName = 'NIFTY 50'
}: ImpulseAttributionCardProps) {
  const [expanded, setExpanded] = useState(true);

  if (!attribution) return null;

  const isBullish = attribution.direction === 'BULLISH_SURGE';
  const isBearish = attribution.direction === 'BEARISH_PLUNGE';
  const isNetPositive = attribution.netPoints >= 0;

  // Badge stylings based on causeType
  const getCauseBadgeStyle = (cause: ImpulseAttribution['causeType']) => {
    switch (cause) {
      case 'SINGLE_STOCK_CULPRIT':
        return {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          indicator: 'bg-amber-400',
          icon: <Flame className="w-4 h-4 text-amber-400" />
        };
      case 'VACUUM_SLIPPAGE':
        return {
          bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
          indicator: 'bg-rose-400',
          icon: <Wind className="w-4 h-4 text-rose-400" />
        };
      case 'BASKET_ARBITRAGE_SWEEP':
        return {
          bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          indicator: 'bg-emerald-400',
          icon: <Zap className="w-4 h-4 text-emerald-400" />
        };
      case 'SECTOR_ROTATION_BALANCED':
        return {
          bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
          indicator: 'bg-purple-400',
          icon: <Scale className="w-4 h-4 text-purple-400" />
        };
      case 'ORDERLY_DRIFT':
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          indicator: 'bg-slate-400',
          icon: <CheckCircle2 className="w-4 h-4 text-cyan-400" />
        };
    }
  };

  const getIntensityBadge = (intensity: ImpulseAttribution['intensity']) => {
    switch (intensity) {
      case 'EXTREME':
        return 'bg-rose-600/30 text-rose-200 border-rose-500/50 animate-pulse';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MODERATE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'LOW':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const badgeStyle = getCauseBadgeStyle(attribution.causeType);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur-md transition-all">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            {badgeStyle.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {indexName} Impulse & Volume Attribution
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeStyle.bg}`}>
                {attribution.causeBadge}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getIntensityBadge(attribution.intensity)}`}>
                {attribution.intensity} IMPULSE
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
              {attribution.headline}
            </h2>
          </div>
        </div>

        {/* Collapsible toggle & time */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <span className="text-[11px] font-mono text-slate-400">
            {attribution.timestamp}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={expanded ? 'Collapse Details' : 'Expand Details'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Main Verdict & Tactical Recommendation Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Verdict Box */}
            <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-300">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Microstructure Diagnostic Verdict:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {attribution.verdict}
              </p>
              <div className="pt-2 border-t border-slate-900 flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Recommendation:</span>
                <span className="text-cyan-300 font-semibold">{attribution.recommendation}</span>
              </div>
            </div>

            {/* Quick Metrics Pillar */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Net vs Gross Force:</span>
                <span className="font-bold text-white">
                  {attribution.netPoints > 0 ? '+' : ''}{attribution.netPoints.toFixed(1)} / {attribution.grossPoints.toFixed(1)} pts
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Breadth Sync:</span>
                <span className={`font-bold ${attribution.marketBreadthSyncPct >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {attribution.marketBreadthSyncPct.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Market RVOL Run-Rate:</span>
                <span className={`font-bold ${
                  attribution.liquidityState === 'THIN_AIR_POCKET'
                    ? 'text-rose-400'
                    : attribution.liquidityState === 'HEALTHY_DEPTH'
                    ? 'text-emerald-400'
                    : 'text-cyan-400'
                }`}>
                  {attribution.aggregateRvol.toFixed(2)}x ({attribution.liquidityState === 'THIN_AIR_POCKET' ? 'Thin Book' : attribution.liquidityState === 'HEALTHY_DEPTH' ? 'High Depth' : 'Normal'})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Top-2 Concentration (CR2):</span>
                <span className="font-bold text-amber-300">
                  {attribution.concentrationRatio2.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Culprit Stock Card (If single-stock or leading heavyweight dislocation exists) */}
          {attribution.culprit && attribution.causeType === 'SINGLE_STOCK_CULPRIT' && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-3.5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-mono font-extrabold text-amber-300 text-sm">
                    {attribution.culprit.symbol.slice(0, 4)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">
                        {attribution.culprit.symbol}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({attribution.culprit.name})
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {attribution.culprit.sector} • Wt: {attribution.culprit.weight.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs font-mono">
                      <span className="text-slate-300">
                        Price: ₹{attribution.culprit.price.toFixed(2)} ({attribution.culprit.changePct >= 0 ? '+' : ''}{attribution.culprit.changePct.toFixed(2)}%)
                      </span>
                      <span>•</span>
                      <span className="text-amber-300 font-bold">
                        Point Impact: {attribution.culprit.pointImpact >= 0 ? '+' : ''}{attribution.culprit.pointImpact.toFixed(1)} pts
                      </span>
                      <span>•</span>
                      <span className="text-cyan-300">
                        RVOL: {attribution.culprit.relativeVolume.toFixed(1)}x (₹{attribution.culprit.turnoverCr.toFixed(0)} Cr)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Culprit Catalyst Verification Action Links */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                  {attribution.actionLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-500/50 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors"
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Thin Order Book Vacuum Alert Box */}
          {attribution.causeType === 'VACUUM_SLIPPAGE' && (
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-3.5">
              <div className="flex items-center gap-2.5 text-xs font-mono text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-bold">LOW-LIQUIDITY AIR POCKET CONFIRMED:</span>
                <span className="text-slate-300 font-sans">
                  Total index volume is trading at only <strong className="text-rose-300">{attribution.aggregateRvol.toFixed(2)}x</strong> of expected intraday pace. The move occurred on wide bid-ask spreads rather than genuine institutional absorption. Expect high slippage and rapid mean-reversion wicks.
                </span>
              </div>
            </div>
          )}

          {/* Top 3 Drivers vs Top 3 Draggers Sub-Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {/* Top Positive Drivers */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs font-mono mb-2 pb-1.5 border-b border-slate-900">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Top Positive Drivers
                </span>
                <span className="text-[11px] text-slate-500">Impact (pts) | RVOL</span>
              </div>
              <div className="space-y-1.5">
                {attribution.topDrivers.length === 0 ? (
                  <div className="text-xs text-slate-500 font-mono py-1">No positive contributors</div>
                ) : (
                  attribution.topDrivers.map((d) => (
                    <div key={d.symbol} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-200 font-bold">{d.symbol}</span>
                        <span className="text-[10px] text-slate-500">({d.weight.toFixed(1)}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-300 font-semibold">+{d.points.toFixed(1)} pts</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-400">
                          {d.rvol.toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Negative Draggers */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs font-mono mb-2 pb-1.5 border-b border-slate-900">
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> Top Negative Draggers
                </span>
                <span className="text-[11px] text-slate-500">Impact (pts) | RVOL</span>
              </div>
              <div className="space-y-1.5">
                {attribution.topDraggers.length === 0 ? (
                  <div className="text-xs text-slate-500 font-mono py-1">No negative contributors</div>
                ) : (
                  attribution.topDraggers.map((d) => (
                    <div key={d.symbol} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-200 font-bold">{d.symbol}</span>
                        <span className="text-[10px] text-slate-500">({d.weight.toFixed(1)}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-rose-300 font-semibold">{d.points.toFixed(1)} pts</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-400">
                          {d.rvol.toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
