'use client';

import React, { useState } from 'react';
import {
  Layers,
  Repeat,
  Compass,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import { CoDependencySummary, SectorCoDependency } from '@/lib/types';

interface SectorCoDependencyMatrixProps {
  coDependency: CoDependencySummary;
}

export function SectorCoDependencyMatrix({ coDependency }: SectorCoDependencyMatrixProps) {
  const [expandedSector, setExpandedSector] = useState<string | null>('Financial Services');

  const getRegimeBadge = (regime: CoDependencySummary['marketRegime']) => {
    switch (regime) {
      case 'UNIFORM_BETA_EXPANSION':
        return { label: 'Uniform Beta Tide (Bullish Expansion)', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'UNIFORM_BETA_CONTRACTION':
        return { label: 'Uniform Beta Tide (Bearish Contraction)', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'INTERNAL_SECTOR_ROTATION':
        return { label: 'Internal Sector Rotation (Defensive Absorption)', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      case 'FRAGMENTED_CHOP':
      default:
        return { label: 'Fragmented Sector Equilibrium', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
  };

  const badge = getRegimeBadge(coDependency.marketRegime);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
      {/* Header & Regime Indicator */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Sector Co-Dependency & Spillover Radar</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quantifies cross-sector elasticity, lead-lag transmission, and capital rotation across the 15 Nifty sectors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs flex items-center gap-2">
            <span className="text-slate-400">Dispersion:</span>
            <span className={`font-mono font-bold ${
              coDependency.dispersionScore > 60 ? 'text-amber-400' : 'text-cyan-400'
            }`}>
              {coDependency.dispersionScore} / 100
            </span>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${badge.bg}`}>
            {badge.label}
          </div>
        </div>
      </div>

      {/* Dominant Transmission Chain Banner */}
      <div className="my-4 bg-slate-950/60 border border-cyan-900/30 rounded-lg p-3.5 flex items-start gap-3">
        <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-cyan-400">
            Microstructure Lead-Lag & Transmission Chain
          </div>
          <p className="text-xs text-slate-200 mt-0.5 font-medium leading-relaxed">
            {coDependency.dominantInterSectorChain}
          </p>
          {coDependency.impliedIndexDriftPoints !== 0 && (
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Implied Cascading Index Impact: <span className={coDependency.impliedIndexDriftPoints > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {coDependency.impliedIndexDriftPoints > 0 ? '+' : ''}{coDependency.impliedIndexDriftPoints} pts
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sector Cards Grid with Interactive Spillovers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {coDependency.sectors.map((sec) => {
          const isExpanded = expandedSector === sec.name;
          const isPositive = sec.weightedReturn > 0;
          const isNeutral = Math.abs(sec.weightedReturn) < 0.1;

          return (
            <div
              key={sec.name}
              className={`rounded-lg border transition-all ${
                isExpanded ? 'bg-slate-950/80 border-cyan-500/40 shadow-lg' : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div
                className="p-3 cursor-pointer flex items-center justify-between"
                onClick={() => setExpandedSector(isExpanded ? null : sec.name)}
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-white truncate max-w-[170px]">{sec.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{sec.weight.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs font-mono">
                    <span className={`font-bold flex items-center ${
                      isNeutral ? 'text-slate-400' : isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isPositive ? '+' : ''}{sec.weightedReturn.toFixed(2)}%
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className={sec.pointImpact >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                      {sec.pointImpact >= 0 ? '+' : ''}{sec.pointImpact.toFixed(1)} pts
                    </span>
                    <span className="text-[10px] text-slate-500">β {sec.betaWithNifty.toFixed(2)}</span>
                  </div>
                </div>

                <button className="text-slate-400 hover:text-white p-1">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Spillover Drawer */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-2 border-t border-slate-800/60 bg-slate-900/40 rounded-b-lg">
                  <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold mb-2 flex items-center justify-between">
                    <span>Cross-Sector Elasticity Spillovers</span>
                    <span className="text-[9px] text-cyan-400">{sec.spillovers.length} linkages</span>
                  </div>
                  {sec.spillovers.length === 0 ? (
                    <div className="text-[11px] text-slate-500 italic py-1">
                      Idiosyncratic sector with low direct inter-sector spillover elasticity.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {sec.spillovers.map((sp) => (
                        <div
                          key={sp.targetSector}
                          className="flex items-center justify-between text-[11px] bg-slate-950/60 px-2 py-1.5 rounded border border-slate-800/40"
                        >
                          <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                            <ArrowRight className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                            <span className="text-slate-300 truncate">{sp.targetSector}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono shrink-0">
                            <span className={`text-[10px] px-1 rounded ${
                              sp.relationship === 'POSITIVE_CO_MOVE'
                                ? 'bg-blue-500/10 text-blue-300'
                                : sp.relationship === 'CAPITAL_ROTATION_DEFENSE'
                                ? 'bg-purple-500/10 text-purple-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {sp.relationship === 'CAPITAL_ROTATION_DEFENSE' ? 'Rotation' : 'Co-Move'}
                            </span>
                            <span className={sp.expectedImpactPct >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                              {sp.expectedImpactPct >= 0 ? '+' : ''}{sp.expectedImpactPct}%
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({sp.expectedPoints >= 0 ? '+' : ''}{sp.expectedPoints} pts)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
