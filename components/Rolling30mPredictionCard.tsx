'use client';

import React from 'react';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Target,
  Zap,
  BarChart2,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Lock,
  Compass
} from 'lucide-react';
import { Rolling30mPrediction } from '@/lib/types';

interface Rolling30mPredictionCardProps {
  prediction?: Rolling30mPrediction;
  indexName?: string;
}

export function Rolling30mPredictionCard({
  prediction,
  indexName = 'NIFTY 50'
}: Rolling30mPredictionCardProps) {
  if (!prediction) return null;

  const {
    direction,
    confidencePct,
    score,
    expected30mMovePts,
    targetHigh,
    targetLow,
    tacticalStopLoss,
    primaryDriver,
    verdictHeadline,
    actionablePlaybook,
    netPointImpact = 0,
    drift30mPts = 0,
    greeksMetrics,
    volumeMetrics,
    reconciliationState,
    timeIST
  } = prediction;

  const isBull = direction.includes('BULLISH');
  const isBear = direction.includes('BEARISH');
  const isChop = direction === 'NEUTRAL_CHOPPY';

  const badgeColor = isBull
    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
    : isBear
    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
    : 'bg-amber-500/15 border-amber-500/40 text-amber-300';

  const iconColor = isBull
    ? 'text-emerald-400 bg-emerald-500/10'
    : isBear
    ? 'text-rose-400 bg-rose-500/10'
    : 'text-amber-400 bg-amber-500/10';

  const confidenceColor = confidencePct >= 75
    ? 'text-emerald-400'
    : confidencePct >= 55
    ? 'text-cyan-400'
    : confidencePct >= 45
    ? 'text-amber-400'
    : 'text-rose-400';

  return (
    <div className="bg-slate-900/95 border border-cyan-900/50 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-5 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 ${
        isBull ? 'bg-emerald-500' : isBear ? 'bg-rose-500' : 'bg-cyan-500'
      }`} />

      {/* TOP ROW: Header, Direction Hero & Confidence */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-cyan-950/80 border border-cyan-800/80 text-cyan-300">
              <Clock className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              Upcoming 30-Min Directional Conclusion
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
              Continuous Sliding Window • Updated {timeIST}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {indexName} Spot: <strong className="text-white font-mono">₹{greeksMetrics.spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</strong>
            </span>
          </div>

          {/* Large Directional Verdict */}
          <div className="flex items-center gap-3.5 mt-2.5">
            <div className={`p-3 rounded-xl ${iconColor} border border-slate-700/50`}>
              {isBull ? (
                <TrendingUp className="w-7 h-7" />
              ) : isBear ? (
                <TrendingDown className="w-7 h-7" />
              ) : (
                <Activity className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {direction.replaceAll('_', ' ')}
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${badgeColor}`}>
                  {verdictHeadline}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Force Score: <span className={`font-mono font-bold ${score > 0 ? 'text-emerald-400' : score < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {score > 0 ? '+' : ''}{score}
                </span> / 100 • Primary Driver: <span className="text-slate-300 font-medium">{primaryDriver}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Confidence Meter Hero */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 min-w-[200px] justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase font-semibold text-slate-400">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span>Confidence</span>
            </div>
            <div className="text-3xl font-black font-mono mt-0.5 flex items-baseline gap-1">
              <span className={confidenceColor}>{confidencePct}%</span>
              <span className="text-xs text-slate-500 font-sans font-normal">
                {confidencePct >= 75 ? 'Strong' : confidencePct >= 50 ? 'Moderate' : 'Guarded'}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
            <div
              className={`text-xs font-mono font-bold ${confidenceColor}`}
              style={{
                background: `conic-gradient(currentColor ${confidencePct * 3.6}deg, transparent 0deg)`,
                WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #fff 0)',
                mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #fff 0)',
                position: 'absolute',
                inset: -4,
                borderRadius: '50%'
              }}
            />
            <span className="text-[11px] font-bold text-slate-400">{confidencePct}</span>
          </div>
        </div>
      </div>

      {/* ANOMALY OR GOVERNOR TRAP CALLOUT (If Active) */}
      {volumeMetrics.anomalyDetected && (
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/80 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-rose-300 uppercase tracking-wide">
              {volumeMetrics.anomalyType === 'SINGLE_STOCK_SKEW'
                ? `Microstructure Anomaly: Single-Stock Skew (${volumeMetrics.anomalySymbol ?? 'Leading Heavyweight'})`
                : 'Microstructure Anomaly: Thin Air Pocket Slippage'}
            </span>
            <p className="text-slate-300 mt-0.5">
              {reconciliationState === 'FAKEOUT_EXHAUSTION'
                ? `Leading constituent is pushing the index without broad constituent support. Trend confidence has been penalized and clamped to ${confidencePct}% to guard against breakout traps.`
                : `Move occurred in low constituent volume depth (${volumeMetrics.top5HeavyweightRvol}x RVOL). Risk of rapid mean-reversion is elevated.`}
            </p>
          </div>
        </div>
      )}

      {/* TARGET CORRIDOR & PLAYBOOK ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Expected Move Box */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>30m Expected Move</span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
            ±{expected30mMovePts} pts
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Continuous vol-scaled from VIX {greeksMetrics.vix.toFixed(1)}%
          </p>
        </div>

        {/* 30m Upper Target */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upper Target (30m)</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            ₹{targetHigh.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {greeksMetrics.spotPrice < greeksMetrics.callWall
              ? `Bounded by Call Wall ₹${greeksMetrics.callWall}`
              : `Expansion above Call Wall ₹${greeksMetrics.callWall}`}
          </p>
        </div>

        {/* 30m Lower Target */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
            <span>Lower Target (30m)</span>
          </div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            ₹{targetLow.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {greeksMetrics.spotPrice > greeksMetrics.putWall
              ? `Bounded by Put Wall ₹${greeksMetrics.putWall}`
              : `Cascade below Put Wall ₹${greeksMetrics.putWall}`}
          </p>
        </div>

        {/* Tactical Invalidation / Stop Loss */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Tactical Stop Loss</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">
            ₹{tacticalStopLoss.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Invalidation if 5m candle closes beyond
          </p>
        </div>
      </div>

      {/* 4-PILLAR CONFLUENCE BREAKDOWN */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
          4-Pillar Confluence Breakdown (Order Flow + Greeks)
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Pillar 1: Constituent Net Force */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span>Pillar 1: Constituent Force</span>
              <span className="font-mono font-bold text-slate-200">30% Wt</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Net Points (vs PrevClose):</span>
              <span className={`font-mono font-bold ${netPointImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netPointImpact >= 0 ? '+' : ''}{netPointImpact.toFixed(1)} pts
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">30m Velocity Drift:</span>
              <span className={`font-mono font-bold ${drift30mPts >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {drift30mPts >= 0 ? '+' : ''}{drift30mPts.toFixed(1)} pts
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Anchored to BaseSpot (prevClose) without phantom drift.
            </p>
          </div>

          {/* Pillar 2: Volume Flow & RVOL */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span>Pillar 2: Order Flow Turnover</span>
              <span className="font-mono font-bold text-slate-200">25% Wt</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Advancing Flow:</span>
              <span className={`font-mono font-bold ${volumeMetrics.advancingTurnoverPct >= 55 ? 'text-emerald-400' : volumeMetrics.advancingTurnoverPct <= 45 ? 'text-rose-400' : 'text-amber-400'}`}>
                {volumeMetrics.advancingTurnoverPct}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Top 5 RVOL (U-Curve):</span>
              <span className="font-mono font-bold text-slate-200">
                {volumeMetrics.top5HeavyweightRvol}x
              </span>
            </div>
          </div>

          {/* Pillar 3: Dealer GEX & OI Velocity */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span>Pillar 3: Dealer GEX & OI Velocity</span>
              <span className="font-mono font-bold text-slate-200">25% Wt</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Net GEX:</span>
              <span className={`font-mono font-bold ${greeksMetrics.netGexCr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {greeksMetrics.netGexCr >= 0 ? '+' : ''}₹{greeksMetrics.netGexCr.toFixed(0)} Cr
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">OI Velocity Regime:</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {greeksMetrics.oiVelocityRegime.replaceAll('_', ' ')}
              </span>
            </div>
          </div>

          {/* Pillar 4: Gamma Walls & Barrier Levels */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span>Pillar 4: Gamma Walls</span>
              <span className="font-mono font-bold text-slate-200">20% Wt</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Call Wall (Res):</span>
              <span className="font-mono font-bold text-rose-400">₹{greeksMetrics.callWall}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Put Wall (Supp):</span>
              <span className="font-mono font-bold text-emerald-400">₹{greeksMetrics.putWall}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Gamma Flip Pivot:</span>
              <span className="font-mono text-cyan-300">₹{greeksMetrics.gammaFlip}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONABLE PLAYBOOK RECOMMENDATION */}
      <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/60 flex items-start gap-3">
        <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-cyan-300 uppercase tracking-wide">Actionable Playbook (Upcoming 30m):</span>
          <p className="text-slate-200 mt-0.5 font-medium leading-relaxed">
            {actionablePlaybook}
          </p>
        </div>
      </div>
    </div>
  );
}
