'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  Zap,
  Target,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { PredictionLevels } from '@/lib/types';

interface PredictionLevelsCardProps {
  prediction: PredictionLevels;
}

export function PredictionLevelsCard({ prediction }: PredictionLevelsCardProps) {
  const isBull = prediction.trendScore > 0;
  const isNeutral = Math.abs(prediction.trendScore) < 15;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
      {/* Header & Direction Score */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trend Synthesis & Bias</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
              Confidence: {prediction.confidencePct}%
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className={`p-2 rounded-lg ${
              isNeutral
                ? 'bg-amber-500/10 text-amber-400'
                : isBull
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400'
            }`}>
              {isNeutral ? (
                <Activity className="w-5 h-5" />
              ) : isBull ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                {prediction.direction.replace('_', ' ')}
              </h2>
              <p className="text-xs text-slate-400">
                Composite institutional score: <span className={`font-mono font-bold ${
                  isNeutral ? 'text-amber-400' : isBull ? 'text-emerald-400' : 'text-rose-400'
                }`}>{prediction.trendScore > 0 ? '+' : ''}{prediction.trendScore}</span> / 100
              </p>
            </div>
          </div>
        </div>

        {/* 1-Sigma Expected Move Banner */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 w-full sm:w-auto min-w-[220px]">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Continuous 1-Sigma Move</span>
            <span className="font-mono text-cyan-400">VIX: {prediction.vix.toFixed(1)}</span>
          </div>
          <div className="text-lg font-mono font-extrabold text-cyan-300 mt-0.5">
            ±{prediction.expected1DayMove} pts
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Daily band: {prediction.s1_sigma} — {prediction.r1_sigma}
          </div>
        </div>
      </div>

      {/* Volatility Bound Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-4">
        <div className="bg-slate-950/40 border border-rose-950/40 rounded-lg p-2.5">
          <div className="text-[10px] uppercase font-mono text-rose-400 font-semibold flex items-center justify-between">
            <span>S2 (-2σ)</span>
            <span className="text-[9px] text-slate-500">Extreme</span>
          </div>
          <div className="text-sm font-mono font-bold text-rose-300 mt-1">{prediction.s2_sigma}</div>
          <div className="text-[10px] text-slate-500">-{ (prediction.expected1DayMove * 2).toFixed(0) } pts</div>
        </div>

        <div className="bg-slate-950/40 border border-rose-900/40 rounded-lg p-2.5">
          <div className="text-[10px] uppercase font-mono text-rose-400 font-semibold flex items-center justify-between">
            <span>S1 (-1σ)</span>
            <span className="text-[9px] text-slate-500">Expected</span>
          </div>
          <div className="text-sm font-mono font-bold text-rose-400 mt-1">{prediction.s1_sigma}</div>
          <div className="text-[10px] text-slate-500">-{ prediction.expected1DayMove.toFixed(0) } pts</div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
          <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold flex items-center justify-between">
            <span>Baseline / Prev</span>
            <Target className="w-3 h-3 text-slate-500" />
          </div>
          <div className="text-sm font-mono font-bold text-white mt-1">{prediction.pivot.toFixed(1)}</div>
          <div className="text-[10px] text-slate-400 font-mono">
            Net: <span className={prediction.netPointImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {prediction.netPointImpact >= 0 ? '+' : ''}{prediction.netPointImpact.toFixed(1)} pts
            </span>
          </div>
        </div>

        <div className="bg-slate-950/40 border border-emerald-900/40 rounded-lg p-2.5">
          <div className="text-[10px] uppercase font-mono text-emerald-400 font-semibold flex items-center justify-between">
            <span>R1 (+1σ)</span>
            <span className="text-[9px] text-slate-500">Expected</span>
          </div>
          <div className="text-sm font-mono font-bold text-emerald-400 mt-1">{prediction.r1_sigma}</div>
          <div className="text-[10px] text-slate-500">+{ prediction.expected1DayMove.toFixed(0) } pts</div>
        </div>

        <div className="bg-slate-950/40 border border-emerald-950/40 rounded-lg p-2.5">
          <div className="text-[10px] uppercase font-mono text-emerald-400 font-semibold flex items-center justify-between">
            <span>R2 (+2σ)</span>
            <span className="text-[9px] text-slate-500">Extreme</span>
          </div>
          <div className="text-sm font-mono font-bold text-emerald-300 mt-1">{prediction.r2_sigma}</div>
          <div className="text-[10px] text-slate-500">+{ (prediction.expected1DayMove * 2).toFixed(0) } pts</div>
        </div>
      </div>

      {/* Confirmation Signals Row */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Multi-Signal Confirmation Engine
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {prediction.confirmationSignals.map((signal) => (
            <div
              key={signal.id}
              className={`p-3 rounded-lg border text-xs transition-colors ${
                signal.status === 'CONFIRMED'
                  ? 'bg-slate-950/60 border-emerald-900/40 text-slate-200'
                  : signal.status === 'DIVERGENT'
                  ? 'bg-slate-950/60 border-amber-900/40 text-slate-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold truncate pr-2 text-slate-200">{signal.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                    signal.status === 'CONFIRMED'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : signal.status === 'DIVERGENT'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {signal.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{signal.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Drivers vs Draggers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800/80">
        {/* Drivers */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 mb-2">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Key Positive Drivers (+{prediction.totalPositivePoints.toFixed(1)} pts)
            </span>
          </div>
          <div className="space-y-1.5">
            {prediction.keyPositiveDrivers.length === 0 ? (
              <div className="text-xs text-slate-500 italic">No significant positive drivers</div>
            ) : (
              prediction.keyPositiveDrivers.map((d) => (
                <div key={d.symbol} className="flex items-center justify-between text-xs bg-slate-900/60 px-2 py-1.5 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{d.symbol}</span>
                    <span className="text-[10px] text-slate-400 font-mono">wt: {d.weight}%</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-emerald-400">+{d.changePct.toFixed(2)}%</span>
                    <span className="font-bold text-emerald-300">+{d.points.toFixed(1)} pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Draggers */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-400 mb-2">
            <span className="flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5" />
              Key Negative Draggers ({prediction.totalNegativePoints.toFixed(1)} pts)
            </span>
          </div>
          <div className="space-y-1.5">
            {prediction.keyNegativeDraggers.length === 0 ? (
              <div className="text-xs text-slate-500 italic">No significant negative draggers</div>
            ) : (
              prediction.keyNegativeDraggers.map((d) => (
                <div key={d.symbol} className="flex items-center justify-between text-xs bg-slate-900/60 px-2 py-1.5 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{d.symbol}</span>
                    <span className="text-[10px] text-slate-400 font-mono">wt: {d.weight}%</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-rose-400">{d.changePct.toFixed(2)}%</span>
                    <span className="font-bold text-rose-300">{d.points.toFixed(1)} pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
