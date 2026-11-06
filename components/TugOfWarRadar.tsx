'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Swords,
  ArrowLeft,
  Flame,
  Zap,
  ChevronUp,
  ChevronDown,
  Scale,
  Maximize2
} from 'lucide-react';
import { SectorAnalysis, Nifty50Stock } from '@/lib/types';

interface TugOfWarRadarProps {
  sectors: SectorAnalysis[];
  indexName?: string;
  spotNetChange?: number;
}

export function TugOfWarRadar({
  sectors,
  indexName = 'NIFTY 50',
  spotNetChange
}: TugOfWarRadarProps) {
  const [selectedSectorName, setSelectedSectorName] = useState<string | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  // Keyboard navigation: Escape key returns from drilldown
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && selectedSectorName) {
      setSelectedSectorName(null);
    }
  }, [selectedSectorName]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const selectedSector = useMemo(() => {
    if (!selectedSectorName) return null;
    return sectors.find((s) => s.name === selectedSectorName) || null;
  }, [sectors, selectedSectorName]);

  // Compute macro arena data (Option A: Net Sector point impact)
  const macroArena = useMemo(() => {
    const bulls: SectorAnalysis[] = [];
    const bears: SectorAnalysis[] = [];
    const neutral: SectorAnalysis[] = [];

    let totalBullPoints = 0;
    let totalBearPoints = 0;

    for (const sec of sectors) {
      if (sec.pointImpact > 0.05) {
        bulls.push(sec);
        totalBullPoints += sec.pointImpact;
      } else if (sec.pointImpact < -0.05) {
        bears.push(sec);
        totalBearPoints += Math.abs(sec.pointImpact);
      } else {
        neutral.push(sec);
      }
    }

    bulls.sort((a, b) => b.pointImpact - a.pointImpact);
    bears.sort((a, b) => Math.abs(b.pointImpact) - Math.abs(a.pointImpact));

    const netPoints = Number((totalBullPoints - totalBearPoints).toFixed(2));
    const totalForce = totalBullPoints + totalBearPoints;
    const bullForcePct = totalForce > 0 ? (totalBullPoints / totalForce) * 100 : 50;
    const bearForcePct = totalForce > 0 ? (totalBearPoints / totalForce) * 100 : 50;

    const maxAbsPoints = Math.max(
      ...sectors.map((s) => Math.abs(s.pointImpact)),
      1
    );

    return {
      bulls,
      bears,
      neutral,
      totalBullPoints: Number(totalBullPoints.toFixed(2)),
      totalBearPoints: Number(totalBearPoints.toFixed(2)),
      netPoints,
      bullForcePct: Number(bullForcePct.toFixed(1)),
      bearForcePct: Number(bearForcePct.toFixed(1)),
      maxAbsPoints
    };
  }, [sectors]);

  // Compute constituent stock drilldown arena if a sector is selected
  const drilldownArena = useMemo(() => {
    if (!selectedSector) return null;

    const bulls: Nifty50Stock[] = [];
    const bears: Nifty50Stock[] = [];
    const neutral: Nifty50Stock[] = [];

    let totalBullPoints = 0;
    let totalBearPoints = 0;

    for (const stock of selectedSector.stocks) {
      if (stock.pointImpact > 0.02) {
        bulls.push(stock);
        totalBullPoints += stock.pointImpact;
      } else if (stock.pointImpact < -0.02) {
        bears.push(stock);
        totalBearPoints += Math.abs(stock.pointImpact);
      } else {
        neutral.push(stock);
      }
    }

    bulls.sort((a, b) => b.pointImpact - a.pointImpact);
    bears.sort((a, b) => Math.abs(b.pointImpact) - Math.abs(a.pointImpact));

    const netPoints = Number((totalBullPoints - totalBearPoints).toFixed(2));
    const totalForce = totalBullPoints + totalBearPoints;
    const bullForcePct = totalForce > 0 ? (totalBullPoints / totalForce) * 100 : 50;
    const bearForcePct = totalForce > 0 ? (totalBearPoints / totalForce) * 100 : 50;

    const maxAbsPoints = Math.max(
      ...selectedSector.stocks.map((s) => Math.abs(s.pointImpact)),
      0.5
    );

    return {
      bulls,
      bears,
      neutral,
      totalBullPoints: Number(totalBullPoints.toFixed(2)),
      totalBearPoints: Number(totalBearPoints.toFixed(2)),
      netPoints,
      bullForcePct: Number(bullForcePct.toFixed(1)),
      bearForcePct: Number(bearForcePct.toFixed(1)),
      maxAbsPoints
    };
  }, [selectedSector]);

  const activeData = selectedSector ? drilldownArena! : macroArena;
  const isDrilldown = !!selectedSector;

  // Visual card size tier based on relative point impact within the arena (continuous & scale-invariant)
  const getCardSizeTier = (absImpact: number, maxImpact: number) => {
    const ratio = absImpact / (maxImpact || 1);
    if (ratio >= 0.60) {
      return {
        wrapper: 'p-3.5 sm:p-4 min-w-[210px] sm:min-w-[240px] flex-1 max-w-[340px]',
        title: 'text-sm sm:text-base font-extrabold',
        points: 'text-lg sm:text-xl font-black font-mono',
        badge: 'text-xs',
        isTitan: true
      };
    }
    if (ratio >= 0.35) {
      return {
        wrapper: 'p-3 min-w-[170px] sm:min-w-[200px] flex-1 max-w-[280px]',
        title: 'text-xs sm:text-sm font-bold',
        points: 'text-sm sm:text-base font-bold font-mono',
        badge: 'text-[11px]',
        isTitan: false
      };
    }
    if (ratio >= 0.15) {
      return {
        wrapper: 'p-2.5 min-w-[140px] sm:min-w-[170px] flex-1 max-w-[230px]',
        title: 'text-xs font-semibold',
        points: 'text-xs sm:text-sm font-bold font-mono',
        badge: 'text-[10px]',
        isTitan: false
      };
    }
    return {
      wrapper: 'p-2 min-w-[120px] sm:min-w-[140px] flex-1 max-w-[190px]',
      title: 'text-[11px] font-medium',
      points: 'text-xs font-semibold font-mono',
      badge: 'text-[9px]',
      isTitan: false
    };
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all duration-300">
      {/* Background ambient tactical glows */}
      <div className="absolute top-0 left-1/4 w-96 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-40 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Cockpit Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/90">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Swords className="w-4 h-4" />
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                {isDrilldown ? (
                  <>
                    <span className="text-cyan-400 font-mono">{selectedSector?.name}</span>
                    <span className="text-slate-400 font-normal">Constituent Tug-of-War</span>
                  </>
                ) : (
                  <>
                    <span>Sector Tug-of-War</span>
                    <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      LIVE INDEX POINT WAR
                    </span>
                  </>
                )}
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isDrilldown ? (
              <span>
                Visualizing internal stock tug-of-war pulling <strong className="text-slate-200">{selectedSector?.name}</strong>. Node size scales with absolute point impact on {indexName}.
              </span>
            ) : (
              <span>
                Real-time directional battle across {indexName} sectors. Advancing sectors pull <strong className="text-emerald-400">UP</strong>, declining pull <strong className="text-rose-400">DOWN</strong>. Bubble size = point impact. Click any sector to inspect its constituent stocks.
              </span>
            )}
          </p>
        </div>

        {/* Action Controls / Breadcrumb Return */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {isDrilldown && (
            <button
              onClick={() => setSelectedSectorName(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all shadow-sm"
              title="Return to Macro Sector Arena (Esc)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Sectors</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 ml-1">
                ESC
              </span>
            </button>
          )}

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {typeof spotNetChange === 'number' && !isDrilldown && (
              <>
                <span
                  className={`px-2 py-1 rounded-lg border font-bold hidden sm:inline-flex items-center gap-1 ${
                    spotNetChange >= 0
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}
                  title={`Official ${indexName} Cash Net Change`}
                >
                  <span className="text-[10px] text-slate-400 font-normal">Index:</span>
                  <span>{spotNetChange >= 0 ? '+' : ''}{spotNetChange.toFixed(1)}</span>
                </span>
                <span className="text-slate-600 font-bold hidden sm:inline">•</span>
              </>
            )}
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
              <ChevronUp className="w-3.5 h-3.5" />
              <span>+{activeData.totalBullPoints} pts</span>
            </span>
            <span className="text-slate-600 font-bold">•</span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold flex items-center gap-1">
              <ChevronDown className="w-3.5 h-3.5" />
              <span>-{activeData.totalBearPoints} pts</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Tug-of-War Battle Arena */}
      <div className="mt-5 space-y-4">
        
        {/* ============================================================== */}
        {/* ZONE 1: BULLS ARENA (PULLING UPWARD)                           */}
        {/* ============================================================== */}
        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3.5 sm:p-5 relative transition-all duration-300 shadow-inner">
          {/* Header indicator */}
          <div className="flex items-center justify-between mb-3 text-xs font-mono font-bold text-emerald-400">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-emerald-400 animate-pulse">
                <ChevronUp className="w-4 h-4" />
                <ChevronUp className="w-4 h-4 -ml-2" />
              </div>
              <span className="tracking-wider uppercase">
                BULLS / ADVANCES PULLING UP ({activeData.bulls.length} {isDrilldown ? 'Stocks' : 'Sectors'})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-emerald-300/80 font-normal hidden sm:inline">
                Combined Lift Force:
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-extrabold text-sm">
                +{activeData.totalBullPoints} pts
              </span>
            </div>
          </div>

          {/* Cards Container */}
          {activeData.bulls.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 font-mono">
              No positive contributors in this segment. Bears have complete pull.
            </div>
          ) : (
            <div className="flex flex-wrap items-stretch gap-2.5 sm:gap-3">
              {activeData.bulls.map((item) => {
                const absPoints = Math.abs(item.pointImpact);
                const size = getCardSizeTier(absPoints, activeData.maxAbsPoints);
                const isSector = !isDrilldown;
                const sec = isSector ? (item as SectorAnalysis) : null;
                const stock = !isSector ? (item as Nifty50Stock) : null;
                const name = isSector ? sec!.name : stock!.symbol;
                const changePct = isSector ? sec!.weightedReturn : stock!.changePct;
                const weight = isSector ? sec!.weight : stock!.weight;
                const isHovered = hoveredEntity === name;

                return (
                  <div
                    key={name}
                    onClick={() => {
                      if (isSector) setSelectedSectorName(sec!.name);
                    }}
                    onMouseEnter={() => setHoveredEntity(name)}
                    onMouseLeave={() => setHoveredEntity(null)}
                    className={`group relative rounded-xl border transition-all duration-200 select-none ${size.wrapper} ${
                      isSector ? 'cursor-pointer' : 'cursor-default'
                    } ${
                      size.isTitan
                        ? 'bg-gradient-to-b from-emerald-900/40 to-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/50 hover:border-emerald-400 hover:shadow-emerald-500/20'
                        : 'bg-slate-900/80 border-emerald-500/25 hover:border-emerald-400/60 hover:bg-slate-900/95 shadow-md shadow-emerald-950/20'
                    }`}
                  >
                    {/* Titan badge indicator */}
                    {size.isTitan && (
                      <div className="absolute -top-2.5 right-3 px-2 py-0.2 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-sm flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5 fill-current" />
                        <span>Titan Pull</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`${size.title} text-white truncate group-hover:text-emerald-300 transition-colors`}
                          title={name}
                        >
                          {name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400 font-mono mt-0.5">
                          <span className="text-emerald-400 font-bold">+{changePct.toFixed(2)}%</span>
                          <span>•</span>
                          <span>{weight.toFixed(1)}% wt</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`${size.points} text-emerald-400 flex items-center justify-end gap-0.5`}>
                          <span>+{item.pointImpact.toFixed(2)}</span>
                          <span className="text-[10px] text-emerald-500/80 font-normal">pts</span>
                        </div>
                        {isSector && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sec!.advances}A / {sec!.declines}D
                          </span>
                        )}
                        {!isSector && stock?.turnoverCr && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ₹{stock.turnoverCr.toFixed(0)} Cr
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Relative share bar inside card */}
                    <div className="w-full bg-slate-800/80 rounded-full h-1 mt-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(8, (absPoints / (activeData.totalBullPoints || 1)) * 100)
                          )}%`
                        }}
                      />
                    </div>

                    {/* Sector click hint */}
                    {isSector && (
                      <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 group-hover:text-cyan-300 transition-colors font-mono">
                        <span className="truncate">Lead: {sec!.dominantStock}</span>
                        <span className="flex items-center gap-0.5 text-cyan-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Drilldown</span>
                          <Maximize2 className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* ZONE 2: CENTER ROPE & LIVE TENSION KNOT                        */}
        {/* ============================================================== */}
        <div className="relative py-3 sm:py-4 select-none">
          {/* Tension Rope Track */}
          <div className="relative h-6 sm:h-7 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center p-1 shadow-inner">
            {/* Visual Rope with Green vs Red force fill */}
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400/80 rounded-l-lg transition-all duration-500"
              style={{ width: `${activeData.bullForcePct}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-rose-400/80 via-rose-500 to-rose-600 rounded-r-lg transition-all duration-500"
              style={{ width: `${activeData.bearForcePct}%` }}
            />

            {/* Tension center zero-line marker */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/40 -translate-x-1/2 z-10" />

            {/* Dynamic Center Knot Badge positioned along the rope */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-500 flex items-center shadow-xl"
              style={{
                left: `${Math.min(85, Math.max(15, activeData.bullForcePct))}%`
              }}
            >
              <div
                className={`px-3 py-1 rounded-full text-xs font-extrabold font-mono flex items-center gap-1.5 border shadow-lg ${
                  activeData.netPoints >= 0
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-emerald-500/40'
                    : 'bg-rose-500 text-white border-rose-300 shadow-rose-500/40'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>
                  NET {activeData.netPoints >= 0 ? '+' : ''}{activeData.netPoints} PTS
                </span>
                <span className="text-[10px] opacity-80">
                  ({activeData.netPoints >= 0 ? 'BULLS LIFT' : 'BEARS DRAG'})
                </span>
              </div>
            </div>
          </div>

          {/* Rope Labels & Status */}
          <div className="flex items-center justify-between text-xs font-mono mt-2 px-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span>▲ BULL FORCE: {activeData.bullForcePct}%</span>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                ({activeData.totalBullPoints} pts lift)
              </span>
            </div>

            <div className="text-center text-[10px] text-slate-400 font-mono hidden md:block">
              {activeData.bullForcePct >= 55 ? (
                <span className="text-emerald-300 font-semibold">
                  ⚡ Bulls controlling session momentum with +{activeData.netPoints} pts net lift ({activeData.bullForcePct}% force)
                </span>
              ) : activeData.bearForcePct >= 55 ? (
                <span className="text-rose-300 font-semibold">
                  ⚠️ Heavy distribution dragging session by {activeData.netPoints} pts ({activeData.bearForcePct}% force)
                </span>
              ) : (
                <span className="text-amber-300 font-semibold">
                  ⚖️ Near Equilibrium: Forces evenly matched (Bulls {activeData.bullForcePct}% vs Bears {activeData.bearForcePct}%)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                (-{activeData.totalBearPoints} pts drag)
              </span>
              <span>BEAR FORCE: {activeData.bearForcePct}% ▼</span>
            </div>
          </div>

          {/* Equilibrium / Stalled Entities (near 0 pts) */}
          {activeData.neutral.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Equilibrium / Flat:
              </span>
              {activeData.neutral.map((item) => {
                const name = !isDrilldown ? (item as SectorAnalysis).name : (item as Nifty50Stock).symbol;
                return (
                  <span
                    key={name}
                    onClick={() => {
                      if (!isDrilldown) setSelectedSectorName(name);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-600 transition-colors cursor-pointer"
                    title={`Points: ${item.pointImpact.toFixed(2)} pts`}
                  >
                    {name} ({item.pointImpact >= 0 ? '+' : ''}{item.pointImpact.toFixed(2)} pts)
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* ZONE 3: BEARS ARENA (PULLING DOWNWARD)                         */}
        {/* ============================================================== */}
        <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-3.5 sm:p-5 relative transition-all duration-300 shadow-inner">
          {/* Header indicator */}
          <div className="flex items-center justify-between mb-3 text-xs font-mono font-bold text-rose-400">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-rose-400 animate-pulse">
                <ChevronDown className="w-4 h-4" />
                <ChevronDown className="w-4 h-4 -ml-2" />
              </div>
              <span className="tracking-wider uppercase">
                BEARS / DECLINES PULLING DOWN ({activeData.bears.length} {isDrilldown ? 'Stocks' : 'Sectors'})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-rose-300/80 font-normal hidden sm:inline">
                Combined Drag Force:
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 font-extrabold text-sm">
                -{activeData.totalBearPoints} pts
              </span>
            </div>
          </div>

          {/* Cards Container */}
          {activeData.bears.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 font-mono">
              No declining contributors in this segment. Bulls have uncontested lift.
            </div>
          ) : (
            <div className="flex flex-wrap items-stretch gap-2.5 sm:gap-3">
              {activeData.bears.map((item) => {
                const absPoints = Math.abs(item.pointImpact);
                const size = getCardSizeTier(absPoints, activeData.maxAbsPoints);
                const isSector = !isDrilldown;
                const sec = isSector ? (item as SectorAnalysis) : null;
                const stock = !isSector ? (item as Nifty50Stock) : null;
                const name = isSector ? sec!.name : stock!.symbol;
                const changePct = isSector ? sec!.weightedReturn : stock!.changePct;
                const weight = isSector ? sec!.weight : stock!.weight;
                const isHovered = hoveredEntity === name;

                return (
                  <div
                    key={name}
                    onClick={() => {
                      if (isSector) setSelectedSectorName(sec!.name);
                    }}
                    onMouseEnter={() => setHoveredEntity(name)}
                    onMouseLeave={() => setHoveredEntity(null)}
                    className={`group relative rounded-xl border transition-all duration-200 select-none ${size.wrapper} ${
                      isSector ? 'cursor-pointer' : 'cursor-default'
                    } ${
                      size.isTitan
                        ? 'bg-gradient-to-b from-rose-900/40 to-slate-900/90 border-rose-500/40 shadow-lg shadow-rose-950/50 hover:border-rose-400 hover:shadow-rose-500/20'
                        : 'bg-slate-900/80 border-rose-500/25 hover:border-rose-400/60 hover:bg-slate-900/95 shadow-md shadow-rose-950/20'
                    }`}
                  >
                    {/* Titan badge indicator */}
                    {size.isTitan && (
                      <div className="absolute -top-2.5 right-3 px-2 py-0.2 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-wider bg-rose-500 text-white shadow-sm flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        <span>Heavy Drag</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`${size.title} text-white truncate group-hover:text-rose-300 transition-colors`}
                          title={name}
                        >
                          {name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400 font-mono mt-0.5">
                          <span className="text-rose-400 font-bold">{changePct.toFixed(2)}%</span>
                          <span>•</span>
                          <span>{weight.toFixed(1)}% wt</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`${size.points} text-rose-400 flex items-center justify-end gap-0.5`}>
                          <span>{item.pointImpact.toFixed(2)}</span>
                          <span className="text-[10px] text-rose-500/80 font-normal">pts</span>
                        </div>
                        {isSector && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sec!.advances}A / {sec!.declines}D
                          </span>
                        )}
                        {!isSector && stock?.turnoverCr && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ₹{stock.turnoverCr.toFixed(0)} Cr
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Relative share bar inside card */}
                    <div className="w-full bg-slate-800/80 rounded-full h-1 mt-2.5 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(8, (absPoints / (activeData.totalBearPoints || 1)) * 100)
                          )}%`
                        }}
                      />
                    </div>

                    {/* Sector click hint */}
                    {isSector && (
                      <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 group-hover:text-cyan-300 transition-colors font-mono">
                        <span className="truncate">Lag: {sec!.dominantStock}</span>
                        <span className="flex items-center gap-0.5 text-cyan-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Drilldown</span>
                          <Maximize2 className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
