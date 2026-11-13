'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Target,
  Zap,
  Layers,
  Sparkles,
  Info,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { ExecutiveMasterSynthesis } from '@/lib/types';

interface ExecutiveMasterCockpitProps {
  synthesis?: ExecutiveMasterSynthesis;
  indexName?: string;
  spotPrice?: number;
}

export function ExecutiveMasterCockpit({
  synthesis,
  indexName = 'NIFTY 50',
  spotPrice
}: ExecutiveMasterCockpitProps) {
  const [showTechDetails, setShowTechDetails] = useState(false);

  if (!synthesis) return null;

  const {
    headlineState,
    plainSummary,
    keyLevels,
    playbook,
    liquidityPool,
    gapDynamics,
    techSpecs
  } = synthesis;

  const isRose = headlineState.badgeColor === 'rose';
  const isEmerald = headlineState.badgeColor === 'emerald';
  const isAmber = headlineState.badgeColor === 'amber';

  const badgeBg = isRose
    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
    : isEmerald
    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
    : isAmber
    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
    : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300';

  const heroIcon = isRose ? (
    <ShieldAlert className="w-6 h-6 text-rose-400" />
  ) : isEmerald ? (
    <TrendingUp className="w-6 h-6 text-emerald-400" />
  ) : isAmber ? (
    <AlertTriangle className="w-6 h-6 text-amber-400" />
  ) : (
    <ShieldCheck className="w-6 h-6 text-cyan-400" />
  );

  return (
    <div className="bg-slate-900/95 border-2 border-cyan-800/40 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md space-y-5 relative overflow-hidden">
      {/* Decorative ambient background blur */}
      <div
        className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isRose ? 'bg-rose-500' : isEmerald ? 'bg-emerald-500' : isAmber ? 'bg-amber-500' : 'bg-cyan-500'
        }`}
      />

      {/* TOP HEADER: Layman Verdict */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-cyan-950/80 border border-cyan-800/70 text-cyan-300">
              Executive Summary • {indexName}
            </span>
            {typeof spotPrice === 'number' && spotPrice > 0 && (
              <span className="text-xs text-slate-300 font-mono">
                Spot: <strong className="text-white">₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className={`p-2.5 rounded-xl border border-slate-700/60 bg-slate-800/80`}>
              {heroIcon}
            </div>
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold border ${badgeBg}`}>
                {headlineState.badge}
              </span>
            </div>
          </div>
        </div>

        {/* Retail Trap Warning Alert (if active) */}
        {liquidityPool.trapState !== 'NO_TRAP' && (
          <div className={`px-3.5 py-2.5 rounded-xl border text-xs max-w-md ${
            liquidityPool.trapState === 'LONG_STOP_HUNT_SWEEP'
              ? 'bg-rose-950/40 border-rose-700/60 text-rose-200'
              : liquidityPool.trapState === 'SHORT_SQUEEZE_SWEEP'
              ? 'bg-amber-950/40 border-amber-700/60 text-amber-200'
              : 'bg-rose-950/60 border-rose-600 text-rose-100 font-semibold'
          }`}>
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>Retail Stop-Loss Alert</span>
            </div>
            <p className="leading-relaxed opacity-90">{liquidityPool.explanation}</p>
          </div>
        )}
      </div>

      {/* PLAIN ENGLISH NARRATIVE (3 Bullet Points with zero jargons) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
            <Info className="w-3.5 h-3.5" />
            <span>1. What is Happening</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {plainSummary.whatsHappening}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
            <Layers className="w-3.5 h-3.5" />
            <span>2. Broader Market Reality</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {plainSummary.broaderMarket}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Big Players Positioning</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {plainSummary.bigPlayerPosition}
          </p>
        </div>
      </div>

      {/* KEY NUMBERS TO WATCH: 3 Pillars */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-cyan-400" />
          <span>Key Numbers to Watch Right Now</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Hard Floor */}
          <div className="bg-slate-900/90 border border-emerald-900/50 rounded-lg p-3">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight flex items-center justify-between">
              <span>🛡️ Hard Floor (Support)</span>
            </div>
            <div className="text-xl font-black font-mono text-emerald-300 mt-1">
              {keyLevels.hardFloor.label}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 leading-tight">
              {keyLevels.hardFloor.reason}
            </div>
          </div>

          {/* Stop Hunt Zone */}
          <div className="bg-slate-900/90 border border-amber-900/50 rounded-lg p-3">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-tight flex items-center justify-between">
              <span>🎯 Retail Stop-Loss Trap Zone</span>
            </div>
            <div className="text-xl font-black font-mono text-amber-300 mt-1">
              {keyLevels.stopHuntZone.range}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 leading-tight">
              {keyLevels.stopHuntZone.reason}
            </div>
          </div>

          {/* Hard Ceiling */}
          <div className="bg-slate-900/90 border border-rose-900/50 rounded-lg p-3">
            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-tight flex items-center justify-between">
              <span>🏰 Hard Ceiling (Resistance)</span>
            </div>
            <div className="text-xl font-black font-mono text-rose-300 mt-1">
              {keyLevels.hardCeiling.label}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 leading-tight">
              {keyLevels.hardCeiling.reason}
            </div>
          </div>
        </div>
      </div>

      {/* OPENING PROBABILITY & GAP FILL RADAR */}
      {gapDynamics && (
        <div className="bg-slate-950/85 border border-cyan-900/50 rounded-xl p-4 space-y-3.5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Next Open Probability & Gap Dynamics Radar
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                gapDynamics.streakAnalysis.exhaustionState === 'OVERBOUGHT_DIGESTION'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : gapDynamics.streakAnalysis.exhaustionState === 'EXTENDED_EXHAUSTION'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              }`}>
                {gapDynamics.streakAnalysis.exhaustionState.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Three-Way Probability Segmented Bar */}
          <div className="space-y-1.5 bg-slate-900/70 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Gap Up: {gapDynamics.openingProbability.gapUpPct}%
              </span>
              <span className="text-cyan-300 flex items-center gap-1">
                <Minus className="w-3.5 h-3.5" /> Flat Open: {gapDynamics.openingProbability.flatPct}%
              </span>
              <span className="text-rose-400 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" /> Gap Down: {gapDynamics.openingProbability.gapDownPct}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${Math.max(4, gapDynamics.openingProbability.gapUpPct)}%` }}
                title={`Gap Up: ${gapDynamics.openingProbability.gapUpPct}%`}
              />
              <div
                className="bg-cyan-500 h-full transition-all duration-500"
                style={{ width: `${Math.max(4, gapDynamics.openingProbability.flatPct)}%` }}
                title={`Flat Open: ${gapDynamics.openingProbability.flatPct}%`}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${Math.max(4, gapDynamics.openingProbability.gapDownPct)}%` }}
                title={`Gap Down: ${gapDynamics.openingProbability.gapDownPct}%`}
              />
            </div>
          </div>

          {/* 3 Detail Columns: Expected Band, Gap Fill Odds, Streak Health */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Column 1: Expected Opening Range */}
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-3 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                🎯 Expected Opening Corridor
              </div>
              <div className="text-lg font-black font-mono text-cyan-300">
                ₹{gapDynamics.expectedOpeningRange.low.toLocaleString('en-IN')} – ₹{gapDynamics.expectedOpeningRange.high.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 leading-tight">
                Central: <strong className="text-white">₹{gapDynamics.expectedOpeningRange.centralPoint.toLocaleString('en-IN')}</strong> (1σ Move: ±{gapDynamics.expectedOpeningRange.dailyExpectedMovePts} pts)
              </div>
            </div>

            {/* Column 2: Gap Fill vs Continuation Odds */}
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-3 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center justify-between">
                <span>🔄 Fill vs Continuation Odds</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  {gapDynamics.gapFillDynamics.gapClassification.replace('_', ' ')}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-200 pt-0.5 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-normal">Same-Day Gap Fill:</span>
                  <span className="text-amber-300">{gapDynamics.gapFillDynamics.sameDayFillProbabilityPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-normal">Trend Continuation:</span>
                  <span className="text-emerald-400">{gapDynamics.gapFillDynamics.continuationProbabilityPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-normal">Fade / Snapback:</span>
                  <span className="text-rose-400">{gapDynamics.gapFillDynamics.fadeProbabilityPct}%</span>
                </div>
              </div>
            </div>

            {/* Column 3: Streak & Microstructure Digestion */}
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-3 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                ⚡ Momentum Streak Health
              </div>
              <div className="text-sm font-bold font-mono text-white pt-0.5">
                {gapDynamics.streakAnalysis.consecutiveGaps > 0
                  ? `${gapDynamics.streakAnalysis.consecutiveGaps} Consecutive ${gapDynamics.streakAnalysis.streakType === 'BULLISH_GAP' ? 'Bullish Gaps' : 'Bearish Gaps'}`
                  : 'Balanced Equilibrium'}
              </div>
              <div className="text-[11px] text-slate-400 leading-tight">
                Close Location Value (CLV): <strong className="text-cyan-300">{(gapDynamics.streakAnalysis.clv * 100).toFixed(0)}%</strong>
                {gapDynamics.streakAnalysis.atrCompression ? ' • Daily ATR Compressing' : ' • Normal Range Expansion'}
              </div>
            </div>
          </div>

          {/* Educational Myth-Buster Callout Box */}
          <div className="p-3 rounded-lg bg-cyan-950/25 border border-cyan-800/40 text-cyan-200 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Quantitative Reality: Do All Gaps Get Covered?</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
              {gapDynamics.gapFillDynamics.gapMythVerdict}
            </p>
            <div className="text-[11px] text-cyan-300/90 font-mono pt-1 border-t border-cyan-900/40 leading-relaxed">
              {gapDynamics.gapFillDynamics.structuralVerbiage}
            </div>
          </div>
        </div>
      )}

      {/* ACTIONABLE TRADER PLAYBOOK (DOs and DONTs) */}
      <div className="bg-slate-950/70 border border-cyan-900/40 rounded-xl p-4 space-y-2.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Actionable Playbook (What You Should Do)</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-200">
            <span className="font-semibold">{playbook.doNotDo}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-200">
            <span className="font-semibold">{playbook.opportunity}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 font-mono text-[11px]">
            <span>{playbook.strictInvalidation}</span>
          </div>
        </div>
      </div>

      {/* OPTIONAL ACCORDION: Technical & Greek Details */}
      <div className="pt-1 border-t border-slate-800/60">
        <button
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
        >
          {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{showTechDetails ? 'Hide Technical Market-Maker Details' : 'View Technical Institutional & Greek Details'}</span>
        </button>

        {showTechDetails && techSpecs && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300 animate-in fade-in duration-200">
            <div>
              <span className="text-slate-500 block">Gamma Flip:</span>
              <strong className="text-cyan-300">
                {techSpecs.gammaFlip ? `₹${techSpecs.gammaFlip.toLocaleString('en-IN')}` : 'N/A'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Dealer Regime:</span>
              <strong className="text-white">{techSpecs.dealerRegime.replaceAll('_', ' ')}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Put Wall / Call Wall:</span>
              <strong className="text-white">
                ₹{techSpecs.putWall.toLocaleString('en-IN')} / ₹{techSpecs.callWall.toLocaleString('en-IN')}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">OI Velocity Flow:</span>
              <strong className="text-emerald-300">{techSpecs.oiVelocityRegime.replaceAll('_', ' ')}</strong>
            </div>
            {techSpecs.culpritSymbol && (
              <div className="col-span-2">
                <span className="text-slate-500 block">Primary Culprit Concentration:</span>
                <strong className="text-amber-300">
                  {techSpecs.culpritSymbol} ({typeof techSpecs.culpritContributionPct === 'number' ? `${techSpecs.culpritContributionPct.toFixed(0)}% of move` : 'Dominant'})
                </strong>
              </div>
            )}
            <div className="col-span-2">
              <span className="text-slate-500 block">Rupee Volume Split:</span>
              <strong className="text-emerald-400">{(techSpecs.advancingTurnoverPct ?? 0).toFixed(0)}% Inflow</strong>
              <span className="text-slate-500"> vs </span>
              <strong className="text-rose-400">{(techSpecs.decliningTurnoverPct ?? 0).toFixed(0)}% Outflow</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
