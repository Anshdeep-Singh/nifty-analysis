'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  Zap,
  Target,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Maximize2
} from 'lucide-react';
import { PredictionLevels } from '@/lib/types';

interface PredictionLevelsCardProps {
  prediction: PredictionLevels;
}

export function PredictionLevelsCard({ prediction }: PredictionLevelsCardProps) {
  const [showMacroExplainer, setShowMacroExplainer] = useState(false);
  const isBull = prediction.trendScore > 0;
  const isNeutral = Math.abs(prediction.trendScore) < 15;
  const roadmap = prediction.smartRoadmap;
  const gap = prediction.gapAnalysis;
  const actionSignal = roadmap?.actionSignal;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md space-y-5">
      {/* 1. Header & Bias Score */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Institutional Trend Synthesis & Bias</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
              Confidence: {prediction.confidencePct}%
            </span>
            {roadmap?.regimeTag && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
                {roadmap.regimeTag}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <div className={`p-2.5 rounded-xl ${
              isNeutral
                ? 'bg-amber-500/10 text-amber-400'
                : isBull
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400'
            }`}>
              {isNeutral ? (
                <Activity className="w-6 h-6" />
              ) : isBull ? (
                <TrendingUp className="w-6 h-6" />
              ) : (
                <TrendingDown className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                {prediction.direction.replace('_', ' ')}
              </h2>
              <p className="text-xs text-slate-400">
                Institutional composite score: <span className={`font-mono font-bold ${
                  isNeutral ? 'text-amber-400' : isBull ? 'text-emerald-400' : 'text-rose-400'
                }`}>{prediction.trendScore > 0 ? '+' : ''}{prediction.trendScore}</span> / 100
                <span className="text-slate-600 mx-2">•</span>
                Spot: <span className="font-mono font-bold text-white">₹{prediction.spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tactical Invalidation & Stop Loss Callout */}
        {actionSignal && (
          <div className={`p-3.5 rounded-xl border w-full lg:w-auto min-w-[280px] ${
            actionSignal.variant === 'emerald'
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
              : actionSignal.variant === 'amber'
              ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
              : actionSignal.variant === 'rose'
              ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
              : 'bg-slate-950/40 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                {actionSignal.badge}
              </span>
              {actionSignal.invalidationPrice && (
                <span className="font-mono text-[11px] bg-slate-900/80 px-2 py-0.5 rounded text-white border border-slate-700">
                  Tight SL: ₹{actionSignal.invalidationPrice.toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-200 leading-snug">
              {actionSignal.headline}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {actionSignal.detail}
            </p>
          </div>
        )}
      </div>

      {/* 2. Gap Regime Alert (If Market Opened with Gap) */}
      {gap && gap.hasGap && (
        <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          gap.gapType === 'GAP_UP'
            ? 'bg-emerald-950/20 border-emerald-900/50 text-slate-200'
            : 'bg-rose-950/20 border-rose-900/50 text-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${gap.gapType === 'GAP_UP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {gap.gapType === 'GAP_UP' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold font-mono">
                <span className={gap.gapType === 'GAP_UP' ? 'text-emerald-400' : 'text-rose-400'}>
                  {gap.gapType.replace('_', ' ')}: {gap.gapPts > 0 ? '+' : ''}{gap.gapPts} pts ({gap.gapPct > 0 ? '+' : ''}{gap.gapPct}%)
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-sans font-medium text-[11px]">{gap.regime.replace('_', ' ')}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{gap.verdict}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono shrink-0">
            <div className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Day Open Support</span>
              <span className="font-bold text-cyan-400">₹{gap.gapSupportPrice.toFixed(1)}</span>
            </div>
            <div className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Gap Fill Base</span>
              <span className="font-bold text-amber-400">₹{gap.gapFillTargetPrice.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. TACTICAL INTRADAY STRUCTURE LEVELS (Tight 15-35 pt Stops, NOT 236 pt abyss!) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Tactical Intraday Trade Levels & Invalidation
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Directly actionable • 15–35 pt structural risk
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Tactical Resistance */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 hover:border-emerald-700/50 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400 mb-1">
              <span>Tactical Resistance</span>
              <span className="text-[10px] font-mono text-slate-500">Target 1</span>
            </div>
            <div className="text-lg font-mono font-extrabold text-white">
              ₹{prediction.tacticalResistance ? prediction.tacticalResistance.toFixed(1) : (prediction.spotPrice + 30).toFixed(1)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              +{prediction.tacticalResistance ? Math.max(0, prediction.tacticalResistance - prediction.spotPrice).toFixed(1) : '30.0'} pts from spot
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Pullback resistance / session high shelf
            </div>
          </div>

          {/* Decision Pivot */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 hover:border-cyan-700/50 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-400 mb-1">
              <span>Session Decision Pivot</span>
              <span className="text-[10px] font-mono text-slate-500">Equilibrium</span>
            </div>
            <div className="text-lg font-mono font-extrabold text-white">
              ₹{roadmap?.anchorPrice ? roadmap.anchorPrice.toFixed(1) : prediction.pivot.toFixed(1)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              {prediction.netPointImpact >= 0 ? '+' : ''}{prediction.netPointImpact.toFixed(1)} pts net today
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Day Open reference • Bull/bear divider
            </div>
          </div>

          {/* Tactical Support */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 hover:border-amber-700/50 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400 mb-1">
              <span>Tactical Support</span>
              <span className="text-[10px] font-mono text-slate-500">Dip Buying Shelf</span>
            </div>
            <div className="text-lg font-mono font-extrabold text-white">
              ₹{prediction.tacticalSupport ? prediction.tacticalSupport.toFixed(1) : (prediction.spotPrice - 25).toFixed(1)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              -{prediction.tacticalSupport ? Math.max(0, prediction.spotPrice - prediction.tacticalSupport).toFixed(1) : '25.0'} pts from spot
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Opening range floor / demand zone
            </div>
          </div>

          {/* Actionable Stop Loss */}
          {(() => {
            const rawSl = prediction.tacticalStopLoss || (isBull ? prediction.spotPrice - 35 : prediction.spotPrice + 35);
            const isShortTrade = rawSl > prediction.spotPrice;
            const riskPts = Math.abs(prediction.spotPrice - rawSl);
            return (
              <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-rose-400 mb-1">
                  <span>Trade Invalidation SL</span>
                  <span className="text-[10px] font-mono text-rose-400 font-bold">Strict SL</span>
                </div>
                <div className="text-lg font-mono font-extrabold text-rose-300">
                  ₹{rawSl.toFixed(1)}
                </div>
                <div className="text-[11px] text-rose-400/80 font-mono mt-1">
                  Risk: {riskPts.toFixed(1)} pts
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {isShortTrade ? 'Exit short if 5m closes above this level' : 'Exit long if 5m closes below this level'}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 4. MACRO VOLATILITY ENVELOPE (Clearly Separated from Intraday Stop Loss!) */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Macro 1-Day Volatility Envelope (Continuous 1σ / 2σ Bands)
            </span>
            <button
              onClick={() => setShowMacroExplainer(!showMacroExplainer)}
              className="text-slate-500 hover:text-cyan-400 transition-colors"
              title="Why this is NOT an intraday stop loss"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[11px] font-mono text-cyan-400">
            India VIX: {prediction.vix.toFixed(1)} • 1σ Move: ±{prediction.expected1DayMove} pts
          </div>
        </div>

        {showMacroExplainer && (
          <div className="mb-3 p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-200 leading-relaxed">
            <strong>⚠️ Architecture Note:</strong> The ±{prediction.expected1DayMove} pt 1-sigma move is a <em>daily Black-Scholes lognormal dispersion cone</em> [Spot × (VIX / 100) / √252] predicting where 68% of daily bars close. On a gap-up day, waiting for -1σ (-{prediction.expected1DayMove} pts) to cut a trade means taking a full 1% index wipeout. Use the <strong>Tactical Support &amp; Invalidation SL</strong> above (15–35 pts) for trade execution, and use this Macro Envelope for options strangle strikes &amp; tail risk guards.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="bg-slate-900/60 border border-rose-950/40 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-mono text-rose-400 font-semibold flex items-center justify-between">
              <span>-2σ Tail Floor</span>
              <span className="text-[9px] text-slate-500">Extreme</span>
            </div>
            <div className="text-sm font-mono font-bold text-rose-300 mt-1">{prediction.s2_sigma}</div>
            <div className="text-[10px] text-slate-500">-{ (prediction.expected1DayMove * 2).toFixed(0) } pts</div>
          </div>

          <div className="bg-slate-900/60 border border-rose-900/40 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-mono text-rose-400 font-semibold flex items-center justify-between">
              <span>-1σ Macro Floor</span>
              <span className="text-[9px] text-slate-500">68% Band</span>
            </div>
            <div className="text-sm font-mono font-bold text-rose-400 mt-1">{prediction.s1_sigma}</div>
            <div className="text-[10px] text-slate-500">-{ prediction.expected1DayMove.toFixed(0) } pts</div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-900/80 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold flex items-center justify-between">
              <span>Prev Close</span>
              <Target className="w-3 h-3 text-slate-500" />
            </div>
            <div className="text-sm font-mono font-bold text-white mt-1">{prediction.pivot.toFixed(1)}</div>
            <div className="text-[10px] text-slate-400 font-mono">
              Net: <span className={prediction.netPointImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {prediction.netPointImpact >= 0 ? '+' : ''}{prediction.netPointImpact.toFixed(1)} pts
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-emerald-900/40 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-mono text-emerald-400 font-semibold flex items-center justify-between">
              <span>+1σ Macro Ceiling</span>
              <span className="text-[9px] text-slate-500">68% Band</span>
            </div>
            <div className="text-sm font-mono font-bold text-emerald-400 mt-1">{prediction.r1_sigma}</div>
            <div className="text-[10px] text-slate-500">+{ prediction.expected1DayMove.toFixed(0) } pts</div>
          </div>

          <div className="bg-slate-900/60 border border-emerald-950/40 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-mono text-emerald-400 font-semibold flex items-center justify-between">
              <span>+2σ Tail Ceiling</span>
              <span className="text-[9px] text-slate-500">Extreme</span>
            </div>
            <div className="text-sm font-mono font-bold text-emerald-300 mt-1">{prediction.r2_sigma}</div>
            <div className="text-[10px] text-slate-500">+{ (prediction.expected1DayMove * 2).toFixed(0) } pts</div>
          </div>
        </div>
      </div>

      {/* 5. Multi-Signal Confirmation Engine */}
      <div className="pt-1">
        <div className="flex items-center gap-2 mb-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Multi-Signal Confirmation Engine
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {prediction.confirmationSignals.map((signal) => (
            <div
              key={signal.id}
              className={`p-3 rounded-lg border text-xs transition-colors ${
                signal.status === 'CONFIRMED'
                  ? signal.score >= 0
                    ? 'bg-slate-950/60 border-emerald-900/40 text-slate-200'
                    : 'bg-slate-950/60 border-rose-900/40 text-slate-200'
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
                      ? signal.score >= 0
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                      : signal.status === 'DIVERGENT'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {signal.status === 'CONFIRMED'
                    ? signal.score >= 0
                      ? 'BULL CONFIRMED'
                      : 'BEAR CONFIRMED'
                    : signal.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{signal.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Key Drivers vs Draggers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800/80">
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
