'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Info,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Layers,
  Zap,
  Crosshair,
  Sparkles,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Gauge,
  BarChart2,
  Lock,
  Compass,
  Scale,
  Sliders,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw
} from 'lucide-react';
import { ExecutiveMasterSynthesis } from '@/lib/types';

export type MicrostructureTopicId =
  | 'gap-common'
  | 'gap-breakaway'
  | 'gap-runaway'
  | 'gap-exhaustion'
  | 'clv'
  | 'vsa-microstructure'
  | 'stop-hunt'
  | 'culprit-divergence'
  | 'put-call-walls'
  | 'oi-velocity'
  | 'air-pocket'
  | 'gamma-regime'
  | 'gamma-flip'
  | 'expected-move';

interface MicrostructureVisualModalProps {
  isOpen: boolean;
  initialTopic?: MicrostructureTopicId;
  onClose: () => void;
  synthesis?: ExecutiveMasterSynthesis;
  spotPrice?: number;
  indexName?: string;
}

interface TopicMeta {
  id: MicrostructureTopicId;
  title: string;
  badge: string;
  category: 'Gaps' | 'Price Action' | 'Microstructure';
  fillOdds?: string;
  contOdds?: string;
}

const TOPICS: TopicMeta[] = [
  { id: 'gap-common', title: 'Common Gap', badge: 'Range-Bound / Chop', category: 'Gaps', fillOdds: '64%', contOdds: '24%' },
  { id: 'gap-breakaway', title: 'Breakaway Gap', badge: 'Structural Breakout', category: 'Gaps', fillOdds: '32%', contOdds: '54%' },
  { id: 'gap-runaway', title: 'Runaway Gap', badge: 'Mid-Trend Carry', category: 'Gaps', fillOdds: '28%', contOdds: '62%' },
  { id: 'gap-exhaustion', title: 'Exhaustion Gap', badge: 'Late Trap / Reversal', category: 'Gaps', fillOdds: '78%', contOdds: '12%' },
  { id: 'clv', title: 'Close Location Value (CLV)', badge: 'Closing Auction Control', category: 'Price Action' },
  { id: 'vsa-microstructure', title: 'Volume Spread Analysis (VSA)', badge: 'False Spikes vs Absorption', category: 'Price Action' },
  { id: 'stop-hunt', title: 'Stop-Loss Hunt / Sweep', badge: 'Liquidity Grab', category: 'Price Action' },
  { id: 'culprit-divergence', title: 'Single-Stock Skew & Breadth Trap', badge: 'Heavyweight Divergence', category: 'Price Action' },
  { id: 'put-call-walls', title: 'Put Wall & Call Wall', badge: 'Open Interest Concentration', category: 'Microstructure' },
  { id: 'oi-velocity', title: 'OI Velocity & Order Flow', badge: 'Writing vs Covering', category: 'Microstructure' },
  { id: 'air-pocket', title: 'Air Pocket & Institutional Floor', badge: 'Volume Vacuum & POC', category: 'Microstructure' },
  { id: 'gamma-regime', title: 'Market Maker Gamma Regimes', badge: 'Cascade vs Pin', category: 'Microstructure' },
  { id: 'gamma-flip', title: 'Trend Danger Line (Gamma Flip)', badge: 'Regime Boundary', category: 'Microstructure' },
  { id: 'expected-move', title: '1-Sigma Expected Move Corridor', badge: 'Daily Volatility Envelope', category: 'Microstructure' },
];

export function MicrostructureVisualModal({
  isOpen,
  initialTopic = 'gap-common',
  onClose,
  synthesis,
  spotPrice,
  indexName = 'NIFTY 50'
}: MicrostructureVisualModalProps) {
  const [selectedTopic, setSelectedTopic] = useState<MicrostructureTopicId>(initialTopic);
  const [viewMode, setViewMode] = useState<'benchmark' | 'live-match'>('benchmark');

  useEffect(() => {
    if (initialTopic) {
      setSelectedTopic(initialTopic);
    }
  }, [initialTopic]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const gapDynamics = synthesis?.gapDynamics;
  const liveClassification = gapDynamics?.gapFillDynamics?.gapClassification || 'COMMON';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Microstructure Visual Guide"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-7xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Visual Market Microstructure &amp; Greeks Guide
                <span className="text-[10px] font-mono font-normal uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  Candle &amp; Flow Analysis
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authentic price-action patterns, institutional order flow &amp; live chart correlation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle Bar: Benchmark vs Live Market Match */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Analysis Mode:</span>
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('benchmark')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'benchmark'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Educational Benchmark</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('live-match')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'live-match'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Today&apos;s Live Market Match ({indexName})</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              </button>
            </div>
          </div>

          {/* Quick Real-Time Pill */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            {typeof spotPrice === 'number' && spotPrice > 0 && (
              <>
                <span className="text-slate-400">Live Spot:</span>
                <strong className="text-white">₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</strong>
                <span className="text-slate-600">•</span>
              </>
            )}
            <span className="text-slate-400">Current Session:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
              liveClassification === 'BREAKAWAY'
                ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                : liveClassification === 'EXHAUSTION'
                ? 'bg-rose-950 border-rose-700 text-rose-300'
                : liveClassification === 'RUNAWAY'
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                : 'bg-cyan-950 border-cyan-800 text-cyan-300'
            }`}>
              {liveClassification} GAP
            </span>
          </div>
        </div>

        {/* Topic Selector Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 mr-1 shrink-0">Gap Types:</span>
            {TOPICS.filter((t) => t.category === 'Gaps').map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTopic(t.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                  selectedTopic === t.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                }`}
              >
                {t.title}
              </button>
            ))}

            <span className="text-[10px] font-mono uppercase text-slate-500 mx-2 shrink-0">Price Action:</span>
            {TOPICS.filter((t) => t.category === 'Price Action').map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTopic(t.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                  selectedTopic === t.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                }`}
              >
                {t.title}
              </button>
            ))}

            <span className="text-[10px] font-mono uppercase text-slate-500 mx-2 shrink-0">Microstructure:</span>
            {TOPICS.filter((t) => t.category === 'Microstructure').map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTopic(t.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                  selectedTopic === t.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {selectedTopic === 'gap-common' && (
            <CommonGapVisual viewMode={viewMode} synthesis={synthesis} spotPrice={spotPrice} />
          )}
          {selectedTopic === 'gap-breakaway' && (
            <BreakawayGapVisual viewMode={viewMode} synthesis={synthesis} spotPrice={spotPrice} />
          )}
          {selectedTopic === 'gap-runaway' && (
            <RunawayGapVisual viewMode={viewMode} synthesis={synthesis} spotPrice={spotPrice} />
          )}
          {selectedTopic === 'gap-exhaustion' && (
            <ExhaustionGapVisual viewMode={viewMode} synthesis={synthesis} spotPrice={spotPrice} />
          )}
          {selectedTopic === 'clv' && (
            <ClvVisual viewMode={viewMode} synthesis={synthesis} spotPrice={spotPrice} />
          )}
          {selectedTopic === 'vsa-microstructure' && (
            <VsaVisual viewMode={viewMode} synthesis={synthesis} spotPrice={spotPrice} />
          )}
          {selectedTopic === 'stop-hunt' && (
            <StopHuntVisual viewMode={viewMode} synthesis={synthesis} spotPrice={spotPrice} />
          )}
          {selectedTopic === 'culprit-divergence' && (
            <CulpritDivergenceVisual viewMode={viewMode} synthesis={synthesis} spotPrice={spotPrice} />
          )}
          {selectedTopic === 'put-call-walls' && (
            <PutCallWallsVisual viewMode={viewMode} synthesis={synthesis} spotPrice={spotPrice} />
          )}
          {selectedTopic === 'oi-velocity' && (
            <OiVelocityVisual viewMode={viewMode} synthesis={synthesis} spotPrice={spotPrice} />
          )}
          {selectedTopic === 'air-pocket' && (
            <AirPocketVisual viewMode={viewMode} synthesis={synthesis} spotPrice={spotPrice} />
          )}
          {selectedTopic === 'gamma-regime' && (
            <GammaRegimeVisual viewMode={viewMode} synthesis={synthesis} spotPrice={spotPrice} />
          )}
          {selectedTopic === 'gamma-flip' && (
            <GammaFlipVisual viewMode={viewMode} synthesis={synthesis} spotPrice={spotPrice} />
          )}
          {selectedTopic === 'expected-move' && (
            <ExpectedMoveVisual viewMode={viewMode} synthesis={synthesis} spotPrice={spotPrice} />
          )}
        </div>
      </div>
    </div>
  );
}

interface VisualBaseProps {
  viewMode: 'benchmark' | 'live-match';
  synthesis?: ExecutiveMasterSynthesis;
  spotPrice?: number;
}

// ==========================================
// 1. COMMON GAP VISUAL
// ==========================================
function CommonGapVisual({ viewMode, synthesis, spotPrice }: VisualBaseProps) {
  const gapDynamics = synthesis?.gapDynamics;
  const isLiveMatch = gapDynamics?.gapFillDynamics?.gapClassification === 'COMMON';
  const liveFillOdds = gapDynamics?.gapFillDynamics?.sameDayFillProbabilityPct ?? 64;
  const liveContOdds = gapDynamics?.gapFillDynamics?.continuationProbabilityPct ?? 24;
  const corridorLow = gapDynamics?.expectedOpeningRange?.low ?? 24900;
  const corridorHigh = gapDynamics?.expectedOpeningRange?.high ?? 25100;
  const currentSpot = spotPrice ?? gapDynamics?.expectedOpeningRange?.centralPoint ?? 25000;

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Common Gap (Range-Bound / Balance Area)</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              viewMode === 'live-match'
                ? isLiveMatch
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold'
                  : 'bg-amber-950 border-amber-700 text-amber-300 font-bold'
                : 'bg-cyan-950 border-cyan-800 text-cyan-300'
            }`}>
              {viewMode === 'live-match'
                ? isLiveMatch ? '🟢 Live Match Confirmed' : '⚠️ Live Regime Mismatch'
                : 'High Fill Odds: 64%'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {viewMode === 'live-match'
              ? isLiveMatch
                ? 'Today’s market is trading inside a confirmed Common Gap regime. High odds of same-day fill.'
                : `Today’s session is actively classified as a ${gapDynamics?.gapFillDynamics?.gapClassification || 'BREAKOUT'} (not a Common Gap).`
              : 'Price opens slightly outside yesterday’s close but remains trapped inside the standard range.'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300">
            {viewMode === 'live-match' ? `Today's Fill Odds: ${liveFillOdds}%` : 'Fill Probability: 64%'}
          </span>
          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">
            {viewMode === 'live-match' ? `Continuation: ${liveContOdds}%` : 'Continuation: 24%'}
          </span>
        </div>
      </div>

      {/* Live Match Comparison Banner (when in Live Match mode) */}
      {viewMode === 'live-match' && (
        <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
          isLiveMatch
            ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
            : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
        }`}>
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              {isLiveMatch ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
              <span>{isLiveMatch ? 'Correlating with Live Market' : 'How Today Differs from a Common Gap'}</span>
            </span>
            <span className="font-mono text-[11px] bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 text-white">
              Spot: ₹{currentSpot.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90 font-normal">
            {isLiveMatch
              ? `Today’s session exhibits characteristic low relative volume and opens within the expected volatility corridor (₹${corridorLow.toLocaleString('en-IN')} – ₹${corridorHigh.toLocaleString('en-IN')}). Our engine predicts a ${liveFillOdds}% probability of filling the opening gap back toward the previous close.`
              : `Caution: The active engine classified today as a ${gapDynamics?.gapFillDynamics?.gapClassification || 'BREAKOUT'} with ${liveContOdds}% continuation odds. Fading today’s open expecting a routine common gap fill carries elevated risk because institutional volume is driving directional momentum.`}
          </p>
        </div>
      )}

      {/* SVG Candlestick Chart */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 760 220" className="w-full h-auto min-w-[550px] select-none">
          <line x1="40" y1="40" x2="560" y2="40" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="40" y1="90" x2="560" y2="90" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="40" y1="140" x2="560" y2="140" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="40" y1="180" x2="560" y2="180" stroke="#1e293b" strokeDasharray="3 3" />

          {/* Price Labels on Right */}
          <text x="575" y="44" fill="#64748b" fontSize="10" fontFamily="monospace">
            {viewMode === 'live-match' ? `₹${Math.round(currentSpot + 50).toLocaleString('en-IN')}` : '25,050'}
          </text>
          <text x="575" y="94" fill="#64748b" fontSize="10" fontFamily="monospace">
            {viewMode === 'live-match' ? `₹${Math.round(currentSpot).toLocaleString('en-IN')} (Spot)` : '25,000'}
          </text>
          <text x="575" y="144" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
            {viewMode === 'live-match' ? `₹${Math.round(corridorLow).toLocaleString('en-IN')} (Floor)` : '24,950 (Prev Close)'}
          </text>
          <text x="575" y="184" fill="#64748b" fontSize="10" fontFamily="monospace">
            {viewMode === 'live-match' ? `₹${Math.round(corridorLow - 50).toLocaleString('en-IN')}` : '24,900'}
          </text>

          {/* Session Divider */}
          <line x1="260" y1="20" x2="260" y2="200" stroke="#334155" strokeDasharray="4 4" />
          <text x="130" y="25" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">YESTERDAY SESSION</text>
          <text x="420" y="25" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
            {viewMode === 'live-match' ? 'TODAY LIVE CORRIDOR & FILL' : 'TODAY SESSION (OPEN & FILL)'}
          </text>

          <rect x="50" y="55" width="200" height="130" fill="#334155" fillOpacity="0.12" rx="4" />
          <text x="55" y="70" fill="#64748b" fontSize="9" fontFamily="monospace">Consolidation Range</text>

          {/* Yesterday Candles */}
          <line x1="90" y1="65" x2="90" y2="160" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="82" y="80" width="16" height="60" fill="#e11d48" rx="1" />

          <line x1="140" y1="75" x2="140" y2="175" stroke="#10b981" strokeWidth="1.5" />
          <rect x="132" y="95" width="16" height="65" fill="#059669" rx="1" />

          <line x1="190" y1="100" x2="190" y2="165" stroke="#10b981" strokeWidth="1.5" />
          <rect x="182" y="110" width="16" height="30" fill="#059669" rx="1" />
          <line x1="190" y1="140" x2="560" y2="140" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />

          {/* Gap Zone Bracket */}
          <rect x="290" y="92" width="60" height="48" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" rx="2" />
          <text x="320" y="118" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle">
            {viewMode === 'live-match' ? 'LIVE GAP' : 'GAP (+45 pts)'}
          </text>

          {/* Today Candles */}
          <line x1="320" y1="65" x2="320" y2="115" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="312" y="92" width="16" height="20" fill="#e11d48" rx="1" />
          <text x="320" y="58" fill="#fda4af" fontSize="9" textAnchor="middle">09:15 Open Rejection</text>

          <line x1="375" y1="85" x2="375" y2="155" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="367" y="105" width="16" height="42" fill="#e11d48" rx="1" />

          <circle cx="375" cy="140" r="4" fill="#38bdf8" />
          <text x="385" y="152" fill="#38bdf8" fontSize="10" fontWeight="bold">GAP FILLED (Target Reached)</text>

          <line x1="430" y1="125" x2="430" y2="160" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="422" y="138" width="16" height="6" fill="#64748b" rx="1" />
          <text x="430" y="175" fill="#94a3b8" fontSize="9" textAnchor="middle">Mean-Reversion Chop</text>

          <line x1="480" y1="110" x2="480" y2="150" stroke="#10b981" strokeWidth="1.5" />
          <rect x="472" y="120" width="16" height="25" fill="#059669" rx="1" />

          {/* Low RVOL Subtitle */}
          <rect x="312" y="185" width="16" height="15" fill="#475569" rx="1" />
          <rect x="367" y="185" width="16" height="18" fill="#475569" rx="1" />
          <text x="400" y="198" fill="#64748b" fontSize="9">
            {viewMode === 'live-match'
              ? `Live Engine: ${liveFillOdds}% Fill vs ${liveContOdds}% Continuation`
              : 'Low / Normal Opening Volume (No institutional urgency)'}
          </text>
        </svg>
      </div>

      {/* Explanatory Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-cyan-300 block">1. Microstructure Dynamic</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Caused by overnight retail orders or minor global cues, not aggressive institutional re-pricing. Relative Volume (RVOL) remains under 1.2x.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-amber-300 block">2. Why It Fills Rapidly</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            No institutional buyer steps in to defend the higher price. Market makers fade the opening euphoria, quickly dragging price back to the previous close.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-emerald-300 block">3. Playbook Execution</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Do not chase the opening direction. Target a gap-fill scalp toward yesterday’s close, or wait for the fill to initiate range-bound option selling spreads.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. BREAKAWAY GAP VISUAL
// ==========================================
function BreakawayGapVisual({ viewMode, synthesis, spotPrice }: VisualBaseProps) {
  const gapDynamics = synthesis?.gapDynamics;
  const isLiveMatch = gapDynamics?.gapFillDynamics?.gapClassification === 'BREAKAWAY';
  const liveContOdds = gapDynamics?.gapFillDynamics?.continuationProbabilityPct ?? 54;
  const liveFillOdds = gapDynamics?.gapFillDynamics?.sameDayFillProbabilityPct ?? 32;
  const ceilingPrice = synthesis?.keyLevels?.hardCeiling?.price ?? synthesis?.techSpecs?.callWall ?? 25000;
  const currentSpot = spotPrice ?? 25000;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Breakaway Gap (Structural Breakout)</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              viewMode === 'live-match'
                ? isLiveMatch
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-emerald-950 border-emerald-800 text-emerald-300'
            }`}>
              {viewMode === 'live-match'
                ? isLiveMatch ? '🟢 Live Breakaway Active' : 'ℹ️ Not Active Today'
                : 'Continuation Odds: 54%'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {viewMode === 'live-match'
              ? isLiveMatch
                ? 'Institutional breakout detected! Price has cleared key overhead barriers on aggressive volume.'
                : `Today’s session is not classified as a Breakaway Gap (Active regime: ${gapDynamics?.gapFillDynamics?.gapClassification || 'COMMON'}).`
              : 'Price gaps clean over multi-day consolidation or a heavy Call Wall with massive institutional volume.'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
            {viewMode === 'live-match' ? `Live Continuation: ${liveContOdds}%` : 'Continuation: 54%'}
          </span>
          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">
            {viewMode === 'live-match' ? `Same-Day Fill: ${liveFillOdds}%` : 'Same-Day Fill: 32% (Low)'}
          </span>
        </div>
      </div>

      {viewMode === 'live-match' && (
        <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
          isLiveMatch
            ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              {isLiveMatch ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Info className="w-4 h-4 text-cyan-400" />}
              <span>{isLiveMatch ? 'Confirmed Structural Breakaway Regime' : 'How Today Relates to Breakaway Thresholds'}</span>
            </span>
            <span className="font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-700 text-white">
              Resistance: ₹{ceilingPrice.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90 font-normal">
            {isLiveMatch
              ? `Spot price (₹${currentSpot.toLocaleString('en-IN')}) has gapped decisively over the structural ceiling (₹${ceilingPrice.toLocaleString('en-IN')}). Delta-hedging mechanics force option market makers to buy index futures, creating a protected floor on intraday pullbacks.`
              : `Spot (₹${currentSpot.toLocaleString('en-IN')}) remains contained below structural resistance (₹${ceilingPrice.toLocaleString('en-IN')}). Without a high-volume gap clearing this ceiling, do not anticipate runaway breakaway continuation.`}
          </p>
        </div>
      )}

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 760 220" className="w-full h-auto min-w-[550px] select-none">
          <line x1="40" y1="120" x2="560" y2="120" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5 3" />
          <text x="575" y="124" fill="#f43f5e" fontSize="10" fontFamily="monospace" fontWeight="bold">
            {viewMode === 'live-match' ? `Key Barrier: ₹${ceilingPrice.toLocaleString('en-IN')}` : 'Key Resistance (25,000)'}
          </text>

          <rect x="50" y="122" width="190" height="75" fill="#334155" fillOpacity="0.15" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" rx="4" />
          <text x="60" y="137" fill="#94a3b8" fontSize="9" fontFamily="monospace">Multi-Day Accumulation Base</text>

          <line x1="80" y1="130" x2="80" y2="185" stroke="#10b981" strokeWidth="1.5" />
          <rect x="73" y="145" width="14" height="30" fill="#059669" rx="1" />

          <line x1="125" y1="125" x2="125" y2="180" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="118" y="130" width="14" height="40" fill="#e11d48" rx="1" />

          <line x1="170" y1="122" x2="170" y2="170" stroke="#10b981" strokeWidth="1.5" />
          <rect x="163" y="135" width="14" height="25" fill="#059669" rx="1" />

          <line x1="235" y1="20" x2="235" y2="200" stroke="#334155" strokeDasharray="4 4" />

          <rect x="250" y="75" width="55" height="45" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" rx="2" />
          <text x="278" y="100" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">CLEAN GAP</text>

          <line x1="280" y1="40" x2="280" y2="80" stroke="#10b981" strokeWidth="2" />
          <rect x="270" y="45" width="20" height="30" fill="#10b981" rx="2" />
          <text x="280" y="32" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">09:15 Breakout Open</text>

          <line x1="350" y1="25" x2="350" y2="115" stroke="#10b981" strokeWidth="2" />
          <rect x="340" y="35" width="20" height="45" fill="#059669" rx="2" />
          <circle cx="350" cy="115" r="4" fill="#34d399" />
          <text x="360" y="114" fill="#34d399" fontSize="9" fontWeight="bold">Dip Defended Above Ceiling</text>

          <line x1="420" y1="15" x2="420" y2="50" stroke="#10b981" strokeWidth="2" />
          <rect x="410" y="20" width="20" height="25" fill="#10b981" rx="2" />

          <rect x="268" y="165" width="24" height="35" fill="#10b981" rx="1" />
          <rect x="338" y="172" width="24" height="28" fill="#10b981" rx="1" />
          <text x="350" y="160" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">3x Institutional RVOL Spike</text>

          <path d="M 440 25 L 530 15" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow)" fill="none" />
          <text x="545" y="20" fill="#34d399" fontSize="10" fontWeight="bold">Trend Continuation</text>
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-cyan-300 block">1. Structural Invalidation</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Signals that market equilibrium has abruptly broken. Market makers caught short calls are forced into immediate delta hedging, buying index futures to cover.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-emerald-300 block">2. The Defense Zone</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            The prior resistance barrier flips into an institutional floor. Intraday dips into the gap zone are aggressively bought by institutions.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-amber-300 block">3. Playbook Execution</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            NEVER fade or short a breakaway gap on day 1. Look for shallow morning pullbacks to the gap ceiling for high-probability trend-following longs.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. RUNAWAY GAP VISUAL
// ==========================================
function RunawayGapVisual({ viewMode, synthesis, spotPrice }: VisualBaseProps) {
  const gapDynamics = synthesis?.gapDynamics;
  const isLiveMatch = gapDynamics?.gapFillDynamics?.gapClassification === 'RUNAWAY';
  const consecutiveGaps = gapDynamics?.streakAnalysis?.consecutiveGaps ?? 0;
  const streakType = gapDynamics?.streakAnalysis?.streakType ?? 'ALTERNATING_CHOP';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Runaway Gap (Mid-Trend Carry)</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              viewMode === 'live-match'
                ? isLiveMatch
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-emerald-950 border-emerald-800 text-emerald-300'
            }`}>
              {viewMode === 'live-match'
                ? isLiveMatch ? '🟢 Live Runaway Active' : 'ℹ️ Not Active Today'
                : 'Continuation Odds: 62%'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {viewMode === 'live-match'
              ? isLiveMatch
                ? `Mid-trend acceleration confirmed with ${consecutiveGaps} consecutive gaps in ${streakType.replaceAll('_', ' ')}.`
                : `Current streak analysis shows ${consecutiveGaps} consecutive gaps (${streakType.replaceAll('_', ' ')}). Not currently in runaway mode.`
              : 'Occurs in the middle of an established, fast-moving trend. Panic buyers jump in without waiting for pullbacks.'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
            Continuation: <strong>62%</strong>
          </span>
          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">
            Same-Day Fill: <strong>28% (Rare)</strong>
          </span>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 760 220" className="w-full h-auto min-w-[550px] select-none">
          <line x1="50" y1="190" x2="530" y2="40" stroke="#334155" strokeDasharray="3 3" />
          <line x1="50" y1="140" x2="530" y2="10" stroke="#334155" strokeDasharray="3 3" />

          <line x1="80" y1="145" x2="80" y2="185" stroke="#10b981" strokeWidth="1.5" />
          <rect x="72" y="150" width="16" height="30" fill="#059669" rx="1" />

          <line x1="140" y1="110" x2="140" y2="160" stroke="#10b981" strokeWidth="1.5" />
          <rect x="132" y="120" width="16" height="35" fill="#059669" rx="1" />

          <line x1="200" y1="85" x2="200" y2="130" stroke="#10b981" strokeWidth="1.5" />
          <rect x="192" y="90" width="16" height="35" fill="#059669" rx="1" />

          <line x1="260" y1="20" x2="260" y2="200" stroke="#334155" strokeDasharray="4 4" />
          <text x="160" y="25" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">STRONG UPTREND ACTIVE</text>
          <text x="420" y="25" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle">RUNAWAY ACCELERATION GAP</text>

          <rect x="290" y="45" width="55" height="40" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" rx="2" />
          <text x="318" y="68" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">MID-AIR GAP</text>

          <line x1="320" y1="20" x2="320" y2="45" stroke="#10b981" strokeWidth="2" />
          <rect x="310" y="22" width="20" height="23" fill="#10b981" rx="2" />

          <line x1="390" y1="8" x2="390" y2="30" stroke="#10b981" strokeWidth="2" />
          <rect x="380" y="10" width="20" height="18" fill="#10b981" rx="2" />

          <text x="480" y="75" fill="#94a3b8" fontSize="10">Often marks the 50% midpoint</text>
          <text x="480" y="92" fill="#38bdf8" fontSize="10">of the total trend distance</text>
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-cyan-300 block">1. Microstructure Dynamic</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Short sellers panic-cover and sidelined longs capitulate, entering at any market price. Volume is moderate to high, but steady across bars.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-emerald-300 block">2. The Measuring Principle</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Classically referred to as a &quot;measuring gap&quot; because it tends to occur approximately halfway through the overall impulse leg.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-amber-300 block">3. Playbook Execution</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Trail stop losses using the previous day’s high or 5m EMA 20. Do not attempt counter-trend fades until clear exhaustion forms.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. EXHAUSTION GAP VISUAL
// ==========================================
function ExhaustionGapVisual({ viewMode, synthesis, spotPrice }: VisualBaseProps) {
  const gapDynamics = synthesis?.gapDynamics;
  const trapTracker = gapDynamics?.exhaustionTrapTracker;
  const isTrapActive = trapTracker?.trapStatus === 'ACTIVE_EXHAUSTION_TRAP' || trapTracker?.trapStatus === 'EXHAUSTION_CONFIRMED_GAP_FILLED';
  const score = trapTracker?.exhaustionScorePct ?? 0;
  const floorPrice = trapTracker?.institutionalFloorPrice ?? synthesis?.keyLevels?.hardFloor?.price ?? 25000;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Exhaustion Gap (Late Trap / Climax Reversal)</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              viewMode === 'live-match'
                ? isTrapActive
                  ? 'bg-rose-950 border-rose-700 text-rose-300 font-bold animate-pulse'
                  : 'bg-emerald-950 border-emerald-800 text-emerald-300'
                : 'bg-rose-950 border-rose-800 text-rose-300'
            }`}>
              {viewMode === 'live-match'
                ? isTrapActive ? `🚨 Live Trap Active (${score}%)` : '✅ Momentum Healthy'
                : 'Fill & Reverse Odds: 78%'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {viewMode === 'live-match'
              ? isTrapActive
                ? trapTracker?.plainEnglishBriefing?.headline || 'Exhaustion trap detected! Retail trapped at highs.'
                : 'No active exhaustion trap detected today. Current trend exhibits healthy momentum or standard digestion.'
              : 'Price gaps aggressively after an extended multi-day rally straight into an institutional ceiling, then collapses.'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-rose-950/60 border border-rose-800/60 text-rose-300">
            Reversal Fill: <strong>78%</strong>
          </span>
          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">
            Continuation: <strong>12% (Trap)</strong>
          </span>
        </div>
      </div>

      {viewMode === 'live-match' && isTrapActive && (
        <div className="p-3 bg-rose-950/30 border border-rose-800/60 rounded-xl text-xs space-y-1.5 text-rose-200">
          <div className="font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Real-Time Exhaustion Warning Active</span>
            </span>
            <span className="font-mono text-[11px] bg-rose-900/60 px-2 py-0.5 rounded text-white border border-rose-700">
              Score: {score}%
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {trapTracker?.plainEnglishBriefing?.actionPlan || `Retail bought the climax open. Price is falling through an air pocket toward the institutional floor at ₹${floorPrice.toLocaleString('en-IN')}.`}
          </p>
        </div>
      )}

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 760 220" className="w-full h-auto min-w-[550px] select-none">
          <line x1="40" y1="50" x2="560" y2="50" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" />
          <text x="575" y="54" fill="#f43f5e" fontSize="10" fontFamily="monospace" fontWeight="bold">Overhead Institutional Ceiling</text>

          <line x1="80" y1="125" x2="80" y2="185" stroke="#10b981" strokeWidth="1.5" />
          <rect x="72" y="135" width="16" height="40" fill="#059669" rx="1" />

          <line x1="140" y1="95" x2="140" y2="155" stroke="#10b981" strokeWidth="1.5" />
          <rect x="132" y="105" width="16" height="40" fill="#059669" rx="1" />

          <line x1="200" y1="75" x2="200" y2="125" stroke="#10b981" strokeWidth="1.5" />
          <rect x="192" y="80" width="16" height="35" fill="#059669" rx="1" />

          <line x1="260" y1="20" x2="260" y2="200" stroke="#334155" strokeDasharray="4 4" />

          <rect x="280" y="45" width="60" height="35" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" rx="2" />
          <text x="310" y="65" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle">CLIMAX GAP</text>

          <line x1="310" y1="25" x2="310" y2="85" stroke="#f43f5e" strokeWidth="2" />
          <rect x="302" y="65" width="16" height="15" fill="#e11d48" rx="1" />
          <circle cx="310" cy="25" r="4" fill="#f43f5e" />
          <text x="325" y="28" fill="#fda4af" fontSize="9" fontWeight="bold">Shooting Star (Wick Trap)</text>

          <line x1="380" y1="65" x2="380" y2="160" stroke="#f43f5e" strokeWidth="2" />
          <rect x="370" y="75" width="20" height="75" fill="#e11d48" rx="2" />

          <circle cx="380" cy="80" r="4" fill="#f43f5e" />
          <text x="400" y="85" fill="#fda4af" fontSize="9" fontWeight="bold">Gap Erased Completely</text>

          <path d="M 390 120 L 480 170" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" fill="none" />
          <text x="495" y="175" fill="#f43f5e" fontSize="10" fontWeight="bold">Violent Liquidation Flush</text>
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-rose-300 block">1. The Trap Mechanism</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Retail buyers pile in after days of gains. Smart money unloads massive blocks into this morning liquidity, forming a long upper rejection wick.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-amber-300 block">2. Fast Air Pocket Drop</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Because price rose quickly without building order volume, zero bids exist below the gap. The fill triggers a rapid cascading stop-hunt down to the POC.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-emerald-300 block">3. Playbook Execution</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            When an exhaustion gap forms a rejection wick within the first 15 minutes, sell calls or execute an aggressive gap-fill mean-reversion short.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. CLOSE LOCATION VALUE (CLV) VISUAL
// ==========================================
function ClvVisual({ viewMode, synthesis }: VisualBaseProps) {
  const liveClv = synthesis?.gapDynamics?.streakAnalysis?.clv ?? 0.5;
  const liveClvPct = Math.round(liveClv * 100);
  const clvTier = liveClv >= 0.7 ? 'BULLISH' : liveClv < 0.3 ? 'BEARISH' : 'NEUTRAL';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Close Location Value (CLV)</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              viewMode === 'live-match'
                ? clvTier === 'BULLISH'
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold'
                  : clvTier === 'BEARISH'
                  ? 'bg-rose-950 border-rose-700 text-rose-300 font-bold'
                  : 'bg-cyan-950 border-cyan-700 text-cyan-300 font-bold'
                : 'bg-cyan-950 border-cyan-800 text-cyan-300'
            }`}>
              {viewMode === 'live-match' ? `Today's CLV: ${liveClvPct}% (${clvTier})` : 'Institutional Closing Auction'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {viewMode === 'live-match'
              ? `Today's calculated Close Location Value is ${liveClvPct}%, indicating ${clvTier === 'BULLISH' ? 'institutional accumulation into the close' : clvTier === 'BEARISH' ? 'institutional liquidation down to the lows' : 'balanced equilibrium chop'}.`
              : 'CLV measures exactly where the day’s closing print landed relative to the session’s high and low.'}
          </p>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 flex items-center justify-between">
          <span>CLV Formula = ((Close - Low) - (High - Close)) / (High - Low)</span>
          <span className="text-slate-400">Scale: -1.0 to +1.0 (or 0% to 100%)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`bg-slate-900 border rounded-xl p-3 flex flex-col items-center text-center transition-all ${
            viewMode === 'live-match' && clvTier === 'BULLISH'
              ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20'
              : 'border-emerald-900/60'
          }`}>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              Bullish CLV (&gt; 70%)
              {viewMode === 'live-match' && clvTier === 'BULLISH' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </span>
            <span className="text-[10px] text-slate-400">Institutional Accumulation</span>
            <svg viewBox="0 0 100 130" className="w-24 h-32 my-2 select-none">
              <line x1="50" y1="20" x2="50" y2="110" stroke="#10b981" strokeWidth="2" />
              <rect x="40" y="25" width="20" height="60" fill="#10b981" rx="2" />
              <circle cx="50" cy="25" r="3" fill="#ffffff" />
              <text x="65" y="28" fill="#34d399" fontSize="9" fontWeight="bold">Close</text>
              <text x="50" y="15" fill="#94a3b8" fontSize="8" textAnchor="middle">High</text>
              <text x="50" y="122" fill="#94a3b8" fontSize="8" textAnchor="middle">Low</text>
            </svg>
            <p className="text-[11px] text-slate-300 leading-tight">
              Buyers absorbed intraday supply and closed near session highs.
            </p>
          </div>

          <div className={`bg-slate-900 border rounded-xl p-3 flex flex-col items-center text-center transition-all ${
            viewMode === 'live-match' && clvTier === 'NEUTRAL'
              ? 'border-cyan-500 ring-2 ring-cyan-500/30 bg-cyan-950/20'
              : 'border-slate-800'
          }`}>
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
              Neutral CLV (30% - 70%)
              {viewMode === 'live-match' && clvTier === 'NEUTRAL' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
            </span>
            <span className="text-[10px] text-slate-400">Equilibrium / Indecision</span>
            <svg viewBox="0 0 100 130" className="w-24 h-32 my-2 select-none">
              <line x1="50" y1="15" x2="50" y2="115" stroke="#94a3b8" strokeWidth="2" />
              <rect x="40" y="55" width="20" height="20" fill="#64748b" rx="2" />
              <circle cx="50" cy="65" r="3" fill="#ffffff" />
              <text x="65" y="68" fill="#cbd5e1" fontSize="9" fontWeight="bold">Close</text>
              <text x="50" y="12" fill="#94a3b8" fontSize="8" textAnchor="middle">High</text>
              <text x="50" y="124" fill="#94a3b8" fontSize="8" textAnchor="middle">Low</text>
            </svg>
            <p className="text-[11px] text-slate-300 leading-tight">
              Price closed in the middle of the range. Indecision balance.
            </p>
          </div>

          <div className={`bg-slate-900 border rounded-xl p-3 flex flex-col items-center text-center transition-all ${
            viewMode === 'live-match' && clvTier === 'BEARISH'
              ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-950/20'
              : 'border-rose-900/60'
          }`}>
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
              Bearish CLV (&lt; 30%)
              {viewMode === 'live-match' && clvTier === 'BEARISH' && <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />}
            </span>
            <span className="text-[10px] text-slate-400">Institutional Distribution</span>
            <svg viewBox="0 0 100 130" className="w-24 h-32 my-2 select-none">
              <line x1="50" y1="20" x2="50" y2="110" stroke="#f43f5e" strokeWidth="2" />
              <rect x="40" y="45" width="20" height="60" fill="#e11d48" rx="2" />
              <circle cx="50" cy="105" r="3" fill="#ffffff" />
              <text x="65" y="108" fill="#fda4af" fontSize="9" fontWeight="bold">Close</text>
              <text x="50" y="15" fill="#94a3b8" fontSize="8" textAnchor="middle">High</text>
              <text x="50" y="122" fill="#94a3b8" fontSize="8" textAnchor="middle">Low</text>
            </svg>
            <p className="text-[11px] text-slate-300 leading-tight">
              Sellers controlled the closing auction, flushing down to lows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5.5 VOLUME SPREAD ANALYSIS (VSA) VISUAL
// ==========================================
function VsaVisual({ viewMode, synthesis }: VisualBaseProps) {
  const [selectedCard, setSelectedCard] = useState<'climax' | 'absorption' | 'impulse' | 'trap'>('climax');
  const [climaxSubTab, setClimaxSubTab] = useState<'selling-capitulation' | 'buying-climax'>('selling-capitulation');
  const [absorptionSubTab, setAbsorptionSubTab] = useState<'bid-support' | 'ask-ceiling'>('bid-support');
  const [impulseSubTab, setImpulseSubTab] = useState<'bullish' | 'bearish'>('bullish');
  const [trapSubTab, setTrapSubTab] = useState<'bull-trap' | 'bear-trap'>('bull-trap');

  // Dynamic Deep Dive Content Resolution
  let deepDiveData = {
    title: 'Deep Dive: What Does "Selling Capitulation Wick" Mean? (Will Market Go UP or DOWN?)',
    pulseColor: 'bg-amber-400',
    directionBadge: 'Expected Direction: UP / BOUNCE 🟢',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderClass: 'border-amber-500/50',
    bgGradient: 'from-amber-950/40 via-slate-900 to-emerald-950/40',
    point1Title: '1. What Happened In That Candle?',
    point1Color: 'text-amber-300',
    point1Content: (
      <>
        A violent panic sell-off pushed price down sharply on heavy volume (<strong className="text-white">&ge; 1.5x 20-SMA</strong>). Retail traders panicked and stop-losses were triggered. However, large institutions stepped in with massive <strong className="text-cyan-300">passive limit BUY orders</strong>, absorbing all the selling and fiercely driving price back up before the 5m bar closed, leaving a massive lower rejection wick (&ge; 50%).
      </>
    ),
    point2Title: '2. Is Market Going Up or Down?',
    point2Color: 'text-emerald-300',
    point2Content: (
      <>
        <strong className="text-emerald-400">The market is about to go UP (reversal or strong bounce).</strong> &quot;Capitulation&quot; means sellers threw in the towel and dumped all their inventory. Because institutions absorbed that supply, the market is now in a <em>seller exhaustion</em> state: there are no sellers left to push price lower, so the path of least resistance flips upward.
      </>
    ),
    point3Title: '3. How to Trade It (Action Rule)',
    point3Color: 'text-cyan-300',
    point3Content: (
      <>
        • <strong className="text-rose-400">NEVER SHORT</strong> into a yellow capitulation wick.<br />
        • The <em>low of the wick</em> is your <strong className="text-white">institutional defense floor</strong> and strict invalidation/stop-loss.<br />
        • If the next 5m candle confirms by holding above the body, look for mean-reversion recovery targeting VWAP or the Decision Pivot.
      </>
    )
  };

  if (selectedCard === 'climax' && climaxSubTab === 'buying-climax') {
    deepDiveData = {
      title: 'Deep Dive: What Does "Buying Climax Rejection" Mean? (Will Market Go UP or DOWN?)',
      pulseColor: 'bg-amber-400',
      directionBadge: 'Expected Direction: DOWN / DROP 🔴',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      borderClass: 'border-amber-500/50',
      bgGradient: 'from-amber-950/40 via-slate-900 to-rose-950/40',
      point1Title: '1. What Happened In That Candle?',
      point1Color: 'text-amber-300',
      point1Content: (
        <>
          A euphoric FOMO breakout drove price up sharply on heavy volume (<strong className="text-white">&ge; 1.5x 20-SMA</strong>). Retail buyers chased new highs. However, smart money unloaded massive <strong className="text-rose-300">passive limit SELL orders</strong>, completely absorbing buying power and rejecting price down to leave a huge upper wick (&ge; 50%).
        </>
      ),
      point2Title: '2. Is Market Going Up or Down?',
      point2Color: 'text-rose-300',
      point2Content: (
        <>
          <strong className="text-rose-400">The market is about to go DOWN (bearish rollover / sharp fade).</strong> &quot;Buying Climax&quot; marks complete buyer exhaustion. All eager buyers have already bought and are trapped at the top. Once aggressive buying runs out, lack of bids causes price to collapse under its own weight.
        </>
      ),
      point3Title: '3. How to Trade It (Action Rule)',
      point3Color: 'text-rose-300',
      point3Content: (
        <>
          • <strong className="text-rose-400">NEVER BUY CALLS</strong> or chase breakouts into a buying climax wick.<br />
          • The <em>high of the wick</em> is your <strong className="text-white">institutional resistance ceiling</strong> and strict invalidation/stop-loss.<br />
          • Target mean-reversion downward toward VWAP or the nearest demand shelf.
        </>
      )
    };
  } else if (selectedCard === 'absorption') {
    const isSupport = absorptionSubTab === 'bid-support';
    deepDiveData = {
      title: `Deep Dive: What Does "Institutional Absorption (${isSupport ? 'Bid Wall' : 'Ask Ceiling'})" Mean?`,
      pulseColor: 'bg-cyan-400',
      directionBadge: isSupport ? 'Expected Direction: IMMINENT BRAKE / UP PIVOT ⚡' : 'Expected Direction: IMMINENT BRAKE / DOWN PIVOT ⚡',
      badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      borderClass: 'border-cyan-500/50',
      bgGradient: 'from-cyan-950/40 via-slate-900 to-cyan-950/40',
      point1Title: '1. What Happened In That Candle?',
      point1Color: 'text-cyan-300',
      point1Content: (
        <>
          An extreme volume surge (<strong className="text-white">&ge; 1.7x 20-SMA</strong>) was trapped inside a very tight price spread (<strong className="text-white">&le; 0.7x ATR</strong>). In VSA theory, this is the classic <em>&quot;Effort Without Result&quot;</em>. Huge volume traded, yet price was completely unable to move.
        </>
      ),
      point2Title: '2. Is Market Going Up or Down?',
      point2Color: 'text-cyan-300',
      point2Content: (
        <>
          <strong className="text-cyan-400">The existing trend is hitting an immovable institutional barrier.</strong> Smart money has stacked massive passive limit blocks (e.g., at Put Wall support or Call Wall resistance), absorbing 100% of incoming aggressive orders. Expect momentum to halt dead and stage a violent pivot.
        </>
      ),
      point3Title: '3. How to Trade It (Action Rule)',
      point3Color: 'text-cyan-300',
      point3Content: (
        <>
          • <strong className="text-amber-300">DO NOT CHASE</strong> the direction entering this bar.<br />
          • At Put Walls / support: prepare for an upward mean-reversion bounce.<br />
          • At Call Walls / resistance: prepare for a downward rejection fade.<br />
          • Enter once a subsequent candle closes outside the narrow absorption range.
        </>
      )
    };
  } else if (selectedCard === 'impulse') {
    const isBull = impulseSubTab === 'bullish';
    deepDiveData = {
      title: `Deep Dive: What Does "Confirmed Institutional Impulse (${isBull ? 'Bullish' : 'Bearish'})" Mean?`,
      pulseColor: isBull ? 'bg-emerald-400' : 'bg-rose-400',
      directionBadge: isBull ? 'Expected Direction: UP / CONTINUATION 🚀' : 'Expected Direction: DOWN / CONTINUATION 🚀',
      badgeClass: isBull ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      borderClass: isBull ? 'border-emerald-500/50' : 'border-rose-500/50',
      bgGradient: isBull ? 'from-emerald-950/40 via-slate-900 to-emerald-950/40' : 'from-rose-950/40 via-slate-900 to-rose-950/40',
      point1Title: '1. What Happened In That Candle?',
      point1Color: isBull ? 'text-emerald-300' : 'text-rose-300',
      point1Content: (
        <>
          A wide price spread (<strong className="text-white">&ge; 1.25x ATR</strong>) expanded hand-in-hand with heavy authentic volume (<strong className="text-white">&ge; 1.45x 20-SMA</strong>) and decisive closing control (<strong className="text-white">|CLV| &ge; 0.35</strong>). High institutional effort directly generated large price distance (<em>&quot;Effort Matches Result&quot;</em>).
        </>
      ),
      point2Title: '2. Is Market Going Up or Down?',
      point2Color: isBull ? 'text-emerald-300' : 'text-rose-300',
      point2Content: (
        <>
          <strong className={isBull ? 'text-emerald-400' : 'text-rose-400'}>High probability of continuation in the direction of the bar.</strong> Large institutional players are aggressively using market orders to push the index through structural levels, creating order-book imbalances that favor trend expansion.
        </>
      ),
      point3Title: '3. How to Trade It (Action Rule)',
      point3Color: isBull ? 'text-emerald-300' : 'text-rose-300',
      point3Content: (
        <>
          • <strong className="text-white">RIDE THE MOMENTUM.</strong> Never fade or counter-trade a confirmed institutional impulse.<br />
          • Enter on minor 1m retests toward the 5m candle&apos;s midpoint (50% level).<br />
          • Invalidation / stop-loss sits at the opposite extreme of the impulse bar.
        </>
      )
    };
  } else if (selectedCard === 'trap') {
    const isBullTrap = trapSubTab === 'bull-trap';
    deepDiveData = {
      title: `Deep Dive: What Does "Air Pocket Spike / Trap (${isBullTrap ? 'Bull Trap' : 'Bear Trap'})" Mean?`,
      pulseColor: 'bg-rose-400',
      directionBadge: isBullTrap ? 'Expected Direction: DOWN / SNAPBACK REVERSAL 🪤' : 'Expected Direction: UP / SNAPBACK REVERSAL 🪤',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      borderClass: 'border-rose-500/50',
      bgGradient: 'from-rose-950/40 via-slate-900 to-amber-950/40',
      point1Title: '1. What Happened In That Candle?',
      point1Color: 'text-rose-300',
      point1Content: (
        <>
          Price moved across a deceptively wide spread (<strong className="text-white">&ge; 1.35x ATR</strong>), but volume was severely dry and faded (<strong className="text-white">&le; 0.75x 20-SMA</strong>). This represents <em>&quot;Result Without Effort&quot;</em>—the market moved not because buyers were strong, but because the order book was thin and empty.
        </>
      ),
      point2Title: '2. Will The Move Hold Or Fail?',
      point2Color: 'text-rose-300',
      point2Content: (
        <>
          <strong className="text-rose-400">The breakout is a liquidity trap. Expect a rapid snapback.</strong> Market makers easily sweep thin air pockets to grab retail stop orders. Because there are no real institutional buyers or sellers backing the move, price collapses back into the prior trading range as soon as liquidity normalizes.
        </>
      ),
      point3Title: '3. How to Trade It (Action Rule)',
      point3Color: 'text-rose-300',
      point3Content: (
        <>
          • <strong className="text-rose-400">DO NOT BUY</strong> breakout highs on faded green volume, and <strong className="text-rose-400">DO NOT SHORT</strong> on faded red volume.<br />
          • Prepare to trade the snapback reversal back toward equilibrium (VWAP).<br />
          • Place stop-loss just outside the trap bar&apos;s high/low and target complete retracement.
        </>
      )
    };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Volume Spread Analysis (VSA)</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded border bg-amber-950/80 border-amber-700/60 text-amber-300 font-bold">
              Effort vs Result Microstructure
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Decodes institutional intentions by comparing candle spread (price progress) against authentic volume (institutional effort).
          </p>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
        {/* Core Law Banner */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 flex items-center justify-between flex-wrap gap-2">
          <span>Core VSA Law: Volume = Fuel (Effort) • Candle Spread = Distance Traveled (Result)</span>
          <span className="text-slate-400">Baseline: 20-ATR Spread & 20-SMA Volume</span>
        </div>

        {/* 4 VSA Pattern Cards Grid - Pixel Aligned */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch">
          {/* Card 1: Climax Exhaustion (Amber / Yellow Bar) */}
          <div
            onClick={() => setSelectedCard('climax')}
            className={`rounded-xl p-3 flex flex-col justify-between relative overflow-hidden transition-all cursor-pointer ${
              selectedCard === 'climax'
                ? 'bg-slate-900 border-2 border-amber-500 shadow-xl shadow-amber-950/40 ring-1 ring-amber-400'
                : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-1 min-h-[44px]">
                <div className="text-left flex-1">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    🔄 Climax Exhaustion Wick
                  </span>
                  <span className="text-[10px] text-amber-200/70 font-mono block">
                    Vol ≥ 1.5x SMA + Wick ≥ 50%
                  </span>
                </div>
                <span className="bg-amber-500 text-slate-950 text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded shrink-0">
                  YELLOW BAR
                </span>
              </div>

              {/* Sub-selector */}
              <div className="flex items-center gap-1 my-2 bg-slate-950 p-0.5 rounded-lg border border-slate-800 w-full text-[10px] font-mono h-8">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCard('climax');
                    setClimaxSubTab('selling-capitulation');
                  }}
                  className={`flex-1 py-1 rounded transition-colors ${
                    climaxSubTab === 'selling-capitulation'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Capitulation (UP)
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCard('climax');
                    setClimaxSubTab('buying-climax');
                  }}
                  className={`flex-1 py-1 rounded transition-colors ${
                    climaxSubTab === 'buying-climax'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Buying Climax (DN)
                </button>
              </div>

              {/* Candle Graphic */}
              <div className="h-36 w-full flex items-center justify-center my-1 select-none">
                {climaxSubTab === 'selling-capitulation' ? (
                  <svg viewBox="0 0 100 150" className="w-24 h-36 select-none">
                    <line x1="50" y1="20" x2="50" y2="100" stroke="#10b981" strokeWidth="2" />
                    <rect x="40" y="20" width="20" height="22" fill="#10b981" rx="2" />
                    <text x="65" y="70" fill="#34d399" fontSize="8" fontWeight="bold">65% Wick</text>
                    <text x="65" y="32" fill="#94a3b8" fontSize="7">Close</text>
                    <line x1="15" y1="108" x2="85" y2="108" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                    <rect x="40" y="112" width="20" height="28" fill="#f59e0b" opacity="0.95" rx="1" />
                    <text x="50" y="148" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle">1.9x Vol</text>
                  </svg>
                ) : (
                  <svg viewBox="0 0 100 150" className="w-24 h-36 select-none">
                    <line x1="50" y1="15" x2="50" y2="95" stroke="#f43f5e" strokeWidth="2" />
                    <rect x="40" y="70" width="20" height="22" fill="#f43f5e" rx="2" />
                    <text x="65" y="45" fill="#fb7185" fontSize="8" fontWeight="bold">60% Wick</text>
                    <text x="65" y="85" fill="#94a3b8" fontSize="7">Close</text>
                    <line x1="15" y1="108" x2="85" y2="108" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                    <rect x="40" y="112" width="20" height="28" fill="#f59e0b" opacity="0.95" rx="1" />
                    <text x="50" y="148" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle">1.8x Vol</text>
                  </svg>
                )}
              </div>

              {/* Bias Box */}
              {climaxSubTab === 'selling-capitulation' ? (
                <div className="w-full text-left bg-emerald-950/40 border border-emerald-800/40 rounded p-2 mb-2 min-h-[58px] flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                    <span>🟢 Bias:</span> <strong>BULLISH REVERSAL (UP)</strong>
                  </div>
                  <div className="text-[9px] text-slate-300 mt-0.5">
                    Panic selling absorbed by institutional buy limits. Sellers exhausted.
                  </div>
                </div>
              ) : (
                <div className="w-full text-left bg-rose-950/40 border border-rose-800/40 rounded p-2 mb-2 min-h-[58px] flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-rose-300 flex items-center gap-1">
                    <span>🔴 Bias:</span> <strong>BEARISH REVERSAL (DOWN)</strong>
                  </div>
                  <div className="text-[9px] text-slate-300 mt-0.5">
                    Breakout buying dumped into institutional sell orders. Buyers trapped.
                  </div>
                </div>
              )}

              {/* Narrative */}
              <p className="text-[10px] text-slate-300 leading-tight min-h-[40px] flex items-center text-center justify-center">
                Aggressive market orders were decisively absorbed by contrary institutional liquidity, creating an exhaustion pivot.
              </p>
            </div>

            {/* Deep Dive Action Pill */}
            <div className={`mt-2.5 py-1 px-2 rounded text-[10px] font-mono flex items-center justify-center gap-1 transition-colors ${
              selectedCard === 'climax'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-slate-400 bg-slate-950/60 border border-slate-800'
            }`}>
              {selectedCard === 'climax' ? 'Deep Dive Active ▼' : 'Click to Deep Dive →'}
            </div>
          </div>

          {/* Card 2: Institutional Absorption (Cyan Bar) */}
          <div
            onClick={() => setSelectedCard('absorption')}
            className={`rounded-xl p-3 flex flex-col justify-between relative overflow-hidden transition-all cursor-pointer ${
              selectedCard === 'absorption'
                ? 'bg-slate-900 border-2 border-cyan-500 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-400'
                : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-1 min-h-[44px]">
                <div className="text-left flex-1">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                    ⚡ Institutional Absorption
                  </span>
                  <span className="text-[10px] text-cyan-200/70 font-mono block">
                    Tight Spread (&le; 0.7x) + Vol &ge; 1.7x
                  </span>
                </div>
                <span className="bg-cyan-600 text-slate-950 text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded shrink-0">
                  CYAN BAR
                </span>
              </div>

              {/* Sub-selector */}
              <div className="flex items-center gap-1 my-2 bg-slate-950 p-0.5 rounded-lg border border-slate-800 w-full text-[10px] font-mono h-8">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCard('absorption');
                    setAbsorptionSubTab('bid-support');
                  }}
                  className={`flex-1 py-1 rounded transition-colors ${
                    absorptionSubTab === 'bid-support'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Support Pin (Bids)
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCard('absorption');
                    setAbsorptionSubTab('ask-ceiling');
                  }}
                  className={`flex-1 py-1 rounded transition-colors ${
                    absorptionSubTab === 'ask-ceiling'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ceiling Pin (Asks)
                </button>
              </div>

              {/* Candle Graphic */}
              <div className="h-36 w-full flex items-center justify-center my-1 select-none">
                {absorptionSubTab === 'bid-support' ? (
                  <svg viewBox="0 0 100 150" className="w-24 h-36 select-none">
                    <line x1="50" y1="35" x2="50" y2="90" stroke="#06b6d4" strokeWidth="2" />
                    <rect x="42" y="45" width="16" height="15" fill="#06b6d4" rx="2" />
                    <text x="65" y="55" fill="#67e8f9" fontSize="8" fontWeight="bold">8 pts</text>
                    <line x1="15" y1="108" x2="85" y2="108" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                    <rect x="40" y="112" width="20" height="28" fill="#06b6d4" opacity="0.95" rx="1" />
                    <text x="50" y="148" fill="#67e8f9" fontSize="8" fontWeight="bold" textAnchor="middle">2.2x Vol</text>
                  </svg>
                ) : (
                  <svg viewBox="0 0 100 150" className="w-24 h-36 select-none">
                    <line x1="50" y1="35" x2="50" y2="90" stroke="#06b6d4" strokeWidth="2" />
                    <rect x="42" y="65" width="16" height="15" fill="#06b6d4" rx="2" />
                    <text x="65" y="75" fill="#67e8f9" fontSize="8" fontWeight="bold">7 pts</text>
                    <line x1="15" y1="108" x2="85" y2="108" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                    <rect x="40" y="112" width="20" height="28" fill="#06b6d4" opacity="0.95" rx="1" />
                    <text x="50" y="148" fill="#67e8f9" fontSize="8" fontWeight="bold" textAnchor="middle">2.1x Vol</text>
                  </svg>
                )}
              </div>

              {/* Bias Box */}
              <div className="w-full text-left bg-cyan-950/40 border border-cyan-800/40 rounded p-2 mb-2 min-h-[58px] flex flex-col justify-center">
                <div className="text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                  <span>🔄 Bias:</span> <strong>IMMINENT PIVOT / BRAKE</strong>
                </div>
                <div className="text-[9px] text-slate-300 mt-0.5">
                  {absorptionSubTab === 'bid-support'
                    ? 'Smart money limits absorb sell orders at support. Trend stalls.'
                    : 'Smart money limits absorb buy orders at ceiling. Momentum stalls.'}
                </div>
              </div>

              {/* Narrative */}
              <p className="text-[10px] text-slate-300 leading-tight min-h-[40px] flex items-center text-center justify-center">
                Effort without result. Giant institutional order blocks pin price, stopping momentum dead in its tracks.
              </p>
            </div>

            {/* Deep Dive Action Pill */}
            <div className={`mt-2.5 py-1 px-2 rounded text-[10px] font-mono flex items-center justify-center gap-1 transition-colors ${
              selectedCard === 'absorption'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 bg-slate-950/60 border border-slate-800'
            }`}>
              {selectedCard === 'absorption' ? 'Deep Dive Active ▼' : 'Click to Deep Dive →'}
            </div>
          </div>

          {/* Card 3: Confirmed Institutional Impulse (Solid Green/Red Bar) */}
          <div
            onClick={() => setSelectedCard('impulse')}
            className={`rounded-xl p-3 flex flex-col justify-between relative overflow-hidden transition-all cursor-pointer ${
              selectedCard === 'impulse'
                ? 'bg-slate-900 border-2 border-emerald-500 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-400'
                : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-1 min-h-[44px]">
                <div className="text-left flex-1">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                    ✅ Institutional Impulse
                  </span>
                  <span className="text-[10px] text-emerald-200/70 font-mono block">
                    Wide Spread (&ge; 1.25x) + Vol &ge; 1.45x
                  </span>
                </div>
                <span className="bg-emerald-600 text-slate-950 text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded shrink-0">
                  BRIGHT SOLID
                </span>
              </div>

              {/* Sub-selector */}
              <div className="flex items-center gap-1 my-2 bg-slate-950 p-0.5 rounded-lg border border-slate-800 w-full text-[10px] font-mono h-8">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCard('impulse');
                    setImpulseSubTab('bullish');
                  }}
                  className={`flex-1 py-1 rounded transition-colors ${
                    impulseSubTab === 'bullish'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bullish (+40 pts)
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCard('impulse');
                    setImpulseSubTab('bearish');
                  }}
                  className={`flex-1 py-1 rounded transition-colors ${
                    impulseSubTab === 'bearish'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bearish (-40 pts)
                </button>
              </div>

              {/* Candle Graphic */}
              <div className="h-36 w-full flex items-center justify-center my-1 select-none">
                {impulseSubTab === 'bullish' ? (
                  <svg viewBox="0 0 100 150" className="w-24 h-36 select-none">
                    <line x1="50" y1="15" x2="50" y2="95" stroke="#10b981" strokeWidth="2" />
                    <rect x="40" y="20" width="20" height="70" fill="#10b981" rx="2" />
                    <text x="66" y="55" fill="#34d399" fontSize="8" fontWeight="bold">+40 pts</text>
                    <line x1="15" y1="108" x2="85" y2="108" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                    <rect x="40" y="114" width="20" height="26" fill="#10b981" opacity="0.95" rx="1" />
                    <text x="50" y="148" fill="#34d399" fontSize="8" fontWeight="bold" textAnchor="middle">1.8x Vol</text>
                  </svg>
                ) : (
                  <svg viewBox="0 0 100 150" className="w-24 h-36 select-none">
                    <line x1="50" y1="15" x2="50" y2="95" stroke="#f43f5e" strokeWidth="2" />
                    <rect x="40" y="20" width="20" height="70" fill="#f43f5e" rx="2" />
                    <text x="66" y="55" fill="#fb7185" fontSize="8" fontWeight="bold">-40 pts</text>
                    <line x1="15" y1="108" x2="85" y2="108" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                    <rect x="40" y="114" width="20" height="26" fill="#f43f5e" opacity="0.95" rx="1" />
                    <text x="50" y="148" fill="#fb7185" fontSize="8" fontWeight="bold" textAnchor="middle">1.8x Vol</text>
                  </svg>
                )}
              </div>

              {/* Bias Box */}
              <div className={`w-full text-left rounded p-2 mb-2 min-h-[58px] flex flex-col justify-center border ${
                impulseSubTab === 'bullish'
                  ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/40 text-rose-300'
              }`}>
                <div className="text-[10px] font-bold flex items-center gap-1">
                  <span>🚀 Bias:</span> <strong>TREND CONTINUATION ({impulseSubTab === 'bullish' ? 'UP' : 'DOWN'})</strong>
                </div>
                <div className="text-[9px] text-slate-300 mt-0.5">
                  Institutional volume drives directional expansion. Follow direction.
                </div>
              </div>

              {/* Narrative */}
              <p className="text-[10px] text-slate-300 leading-tight min-h-[40px] flex items-center text-center justify-center">
                Effort matches result. Real institutional participation confirms genuine directional intent with high follow-through odds.
              </p>
            </div>

            {/* Deep Dive Action Pill */}
            <div className={`mt-2.5 py-1 px-2 rounded text-[10px] font-mono flex items-center justify-center gap-1 transition-colors ${
              selectedCard === 'impulse'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-slate-400 bg-slate-950/60 border border-slate-800'
            }`}>
              {selectedCard === 'impulse' ? 'Deep Dive Active ▼' : 'Click to Deep Dive →'}
            </div>
          </div>

          {/* Card 4: Air Pocket Spike / False Move (Faded Bar) */}
          <div
            onClick={() => setSelectedCard('trap')}
            className={`rounded-xl p-3 flex flex-col justify-between relative overflow-hidden transition-all cursor-pointer ${
              selectedCard === 'trap'
                ? 'bg-slate-900 border-2 border-rose-500 shadow-xl shadow-rose-950/40 ring-1 ring-rose-400'
                : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-1 min-h-[44px]">
                <div className="text-left flex-1">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                    ⚠️ Air Pocket Spike / Trap
                  </span>
                  <span className="text-[10px] text-rose-300/70 font-mono block">
                    Wide Spread (&ge; 1.35x) + Low Vol (&le; 0.75x)
                  </span>
                </div>
                <span className="bg-slate-700 text-slate-300 text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded shrink-0">
                  FADED / DIM
                </span>
              </div>

              {/* Sub-selector */}
              <div className="flex items-center gap-1 my-2 bg-slate-950 p-0.5 rounded-lg border border-slate-800 w-full text-[10px] font-mono h-8">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCard('trap');
                    setTrapSubTab('bull-trap');
                  }}
                  className={`flex-1 py-1 rounded transition-colors ${
                    trapSubTab === 'bull-trap'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bull Trap (Spike)
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCard('trap');
                    setTrapSubTab('bear-trap');
                  }}
                  className={`flex-1 py-1 rounded transition-colors ${
                    trapSubTab === 'bear-trap'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bear Trap (Drop)
                </button>
              </div>

              {/* Candle Graphic */}
              <div className="h-36 w-full flex items-center justify-center my-1 select-none">
                {trapSubTab === 'bull-trap' ? (
                  <svg viewBox="0 0 100 150" className="w-24 h-36 select-none">
                    <line x1="50" y1="15" x2="50" y2="95" stroke="#10b981" strokeWidth="2" />
                    <rect x="40" y="25" width="20" height="60" fill="#10b981" rx="2" />
                    <text x="66" y="55" fill="#34d399" fontSize="8" fontWeight="bold">+35 pts</text>
                    <line x1="15" y1="108" x2="85" y2="108" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                    <rect x="42" y="125" width="16" height="15" fill="#f43f5e" opacity="0.35" rx="1" />
                    <text x="50" y="148" fill="#fda4af" fontSize="8" textAnchor="middle">0.5x Vol</text>
                  </svg>
                ) : (
                  <svg viewBox="0 0 100 150" className="w-24 h-36 select-none">
                    <line x1="50" y1="15" x2="50" y2="95" stroke="#f43f5e" strokeWidth="2" />
                    <rect x="40" y="25" width="20" height="60" fill="#f43f5e" rx="2" />
                    <text x="66" y="55" fill="#fb7185" fontSize="8" fontWeight="bold">-35 pts</text>
                    <line x1="15" y1="108" x2="85" y2="108" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                    <rect x="42" y="125" width="16" height="15" fill="#10b981" opacity="0.35" rx="1" />
                    <text x="50" y="148" fill="#6ee7b7" fontSize="8" textAnchor="middle">0.5x Vol</text>
                  </svg>
                )}
              </div>

              {/* Bias Box */}
              <div className="w-full text-left bg-rose-950/40 border border-rose-800/40 rounded p-2 mb-2 min-h-[58px] flex flex-col justify-center">
                <div className="text-[10px] font-bold text-rose-300 flex items-center gap-1">
                  <span>🪤 Bias:</span> <strong>SNAPBACK TRAP ({trapSubTab === 'bull-trap' ? 'DOWN' : 'UP'})</strong>
                </div>
                <div className="text-[9px] text-slate-300 mt-0.5">
                  Thin liquidity sweep without buyers. Breakout will fail.
                </div>
              </div>

              {/* Narrative */}
              <p className="text-[10px] text-slate-300 leading-tight min-h-[40px] flex items-center text-center justify-center">
                Result without effort. Price moved because the order book was empty, not because buyers entered. High odds of rapid snapback.
              </p>
            </div>

            {/* Deep Dive Action Pill */}
            <div className={`mt-2.5 py-1 px-2 rounded text-[10px] font-mono flex items-center justify-center gap-1 transition-colors ${
              selectedCard === 'trap'
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                : 'text-slate-400 bg-slate-950/60 border border-slate-800'
            }`}>
              {selectedCard === 'trap' ? 'Deep Dive Active ▼' : 'Click to Deep Dive →'}
            </div>
          </div>
        </div>

        {/* DYNAMIC DEEP-DIVE: Synchronized with Active Card Selection */}
        <div className={`p-4 bg-gradient-to-r ${deepDiveData.bgGradient} border ${deepDiveData.borderClass} rounded-xl space-y-3 transition-all`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${deepDiveData.pulseColor} animate-pulse`} />
              <h4 className="text-sm font-extrabold text-white">
                {deepDiveData.title}
              </h4>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${deepDiveData.badgeClass}`}>
              {deepDiveData.directionBadge}
            </span>
          </div>

          {/* Quick Deep Dive Topic Switcher Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pb-1 border-t border-b border-slate-800/60">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">Deep Dive Focus:</span>
            <button
              type="button"
              onClick={() => {
                setSelectedCard('climax');
                setClimaxSubTab('selling-capitulation');
              }}
              className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${
                selectedCard === 'climax' && climaxSubTab === 'selling-capitulation'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              🟡 Selling Capitulation (UP 🟢)
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCard('climax');
                setClimaxSubTab('buying-climax');
              }}
              className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${
                selectedCard === 'climax' && climaxSubTab === 'buying-climax'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              🟡 Buying Climax (DOWN 🔴)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCard('absorption')}
              className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${
                selectedCard === 'absorption'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              🔵 Absorption Wall (Pivot ⚡)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCard('impulse')}
              className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${
                selectedCard === 'impulse'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              🟢 Confirmed Impulse (Trend 🚀)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCard('trap')}
              className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${
                selectedCard === 'trap'
                  ? 'bg-rose-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              ⚠️ Air Pocket Trap (Snapback 🪤)
            </button>
          </div>

          {/* 3 Actionable Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/90 space-y-1">
              <strong className={`${deepDiveData.point1Color} block font-mono text-[11px]`}>
                {deepDiveData.point1Title}
              </strong>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {deepDiveData.point1Content}
              </p>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/90 space-y-1">
              <strong className={`${deepDiveData.point2Color} block font-mono text-[11px]`}>
                {deepDiveData.point2Title}
              </strong>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {deepDiveData.point2Content}
              </p>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/90 space-y-1">
              <strong className={`${deepDiveData.point3Color} block font-mono text-[11px]`}>
                {deepDiveData.point3Title}
              </strong>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {deepDiveData.point3Content}
              </p>
            </div>
          </div>
        </div>

        {/* Master VSA Tags & Colors Reference Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                VSA Volume Bar Color & Tag Reference Master Table
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">NIFTY & BANK NIFTY Authentic Futures Volume</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50 text-[11px]">
                  <th className="py-2.5 px-3.5 whitespace-nowrap min-w-[150px]">Volume Bar Color</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap min-w-[210px]">Hover Tag Label</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap min-w-[200px]">Formula Condition</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap min-w-[170px]">Directional Bias</th>
                  <th className="py-2.5 px-3.5 min-w-[300px]">Institutional Microstructure Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3.5 font-bold text-amber-400 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                      <span>Yellow / Amber</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 font-bold text-emerald-400 whitespace-nowrap">
                    Selling Capitulation Wick
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-300 whitespace-nowrap font-sans">
                    Vol &ge; 1.5x &amp; Lower Wick &ge; 50%
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 shadow-sm whitespace-nowrap">
                      <span>BULLISH (UP)</span>
                      <span>🟢</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 font-sans text-slate-300 leading-relaxed">
                    Panic selling absorbed by institutional buy orders. Seller exhaustion; bottoming reversal likely.
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3.5 font-bold text-amber-400 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                      <span>Yellow / Amber</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 font-bold text-rose-400 whitespace-nowrap">
                    Buying Climax Rejection
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-300 whitespace-nowrap font-sans">
                    Vol &ge; 1.5x &amp; Upper Wick &ge; 50%
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950 text-rose-300 font-bold border border-rose-800 shadow-sm whitespace-nowrap">
                      <span>BEARISH (DOWN)</span>
                      <span>🔴</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 font-sans text-slate-300 leading-relaxed">
                    Breakout buying dumped into institutional sell orders. Buyer exhaustion; topping reversal likely.
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3.5 font-bold text-cyan-400 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
                      <span>Vibrant Cyan</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 font-bold text-cyan-300 whitespace-nowrap">
                    Institutional Absorption (Pin)
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-300 whitespace-nowrap font-sans">
                    Vol &ge; 1.7x &amp; Spread &le; 0.7x ATR
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 shadow-sm whitespace-nowrap">
                      <span>PIVOT / PIN</span>
                      <span>⚡</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 font-sans text-slate-300 leading-relaxed">
                    Passive limit orders absorb heavy market flow without price moving. Trend brake; preceding sharp reversal.
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3.5 font-bold text-emerald-400 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Solid Bright Green</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 font-bold text-emerald-300 whitespace-nowrap">
                    Confirmed Bullish Impulse
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-300 whitespace-nowrap font-sans">
                    Vol &ge; 1.45x &amp; Spread &ge; 1.25x &amp; CLV &ge; +0.35
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 shadow-sm whitespace-nowrap">
                      <span>BULLISH EXP (UP)</span>
                      <span>🟢</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 font-sans text-slate-300 leading-relaxed">
                    Effort matches result. Genuine institutional buying power drives expansion. Safe to ride continuation.
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3.5 font-bold text-rose-400 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Solid Bright Red</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 font-bold text-rose-300 whitespace-nowrap">
                    Confirmed Bearish Impulse
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-300 whitespace-nowrap font-sans">
                    Vol &ge; 1.45x &amp; Spread &ge; 1.25x &amp; CLV &le; -0.35
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950 text-rose-300 font-bold border border-rose-800 shadow-sm whitespace-nowrap">
                      <span>BEARISH EXP (DOWN)</span>
                      <span>🔴</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 font-sans text-slate-300 leading-relaxed">
                    Effort matches result. Aggressive institutional selling breaks support. Safe to ride continuation.
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3.5 font-bold text-rose-300/80 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40 border border-rose-500/60 shrink-0" />
                      <span>Faded / Dim Red</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 font-bold text-rose-400 whitespace-nowrap">
                    Air Pocket Spike / Drop
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-300 whitespace-nowrap font-sans">
                    Vol &le; 0.75x &amp; Spread &ge; 1.35x ATR
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950 text-amber-300 font-bold border border-amber-800 shadow-sm whitespace-nowrap">
                      <span>TRAP WARNING</span>
                      <span>⚠️</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 font-sans text-slate-300 leading-relaxed">
                    Result without effort. Price swept retail stops through thin liquidity. High odds of false breakout snapback.
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3.5 text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-700 shrink-0" />
                      <span>Muted Green / Red</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-300 whitespace-nowrap">
                    Normal Auction
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-400 whitespace-nowrap font-sans">
                    Within normal ATR &amp; SMA bounds
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-slate-400 font-bold whitespace-nowrap">
                      <span>NEUTRAL</span>
                      <span>⚪</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 font-sans text-slate-400 leading-relaxed">
                    Standard two-way continuous auction. Normal liquidity flow.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tactical Playbook Matrix */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tactical Execution Playbook for VSA Signals</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
            <div className="p-2.5 rounded bg-slate-950 border border-amber-900/40 text-slate-300">
              <strong className="text-amber-400 block mb-0.5">🟡 Climax Exhaustion Wick:</strong>
              Do NOT chase the direction of the spike. If lower wick &ge; 50% (Capitulation), prepare for an upward bounce. Use the wick low as your stop-loss floor. If upper wick &ge; 50% (Buying Climax), prepare for a drop.
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-cyan-900/40 text-slate-300">
              <strong className="text-cyan-400 block mb-0.5">🔵 Institutional Absorption:</strong>
              Stop trying to push direction in that zone. Smart money has placed massive passive limits (absorbing sellers at Put Wall or buyers at Call Wall); position for a reversal.
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-rose-900/40 text-slate-300">
              <strong className="text-rose-400 block mb-0.5">⚠️ Air Pocket Spikes:</strong>
              Do NOT place breakout market orders when volume is thin. Wait for the snapback back inside the range to fade the false move.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. STOP HUNT / LIQUIDITY SWEEP VISUAL
// ==========================================
function StopHuntVisual({ viewMode, synthesis }: VisualBaseProps) {
  const trapState = synthesis?.liquidityPool?.trapState ?? 'NO_TRAP';
  const isSweepActive = trapState === 'LONG_STOP_HUNT_SWEEP' || trapState === 'SHORT_SQUEEZE_SWEEP';
  const stopZone = synthesis?.keyLevels?.stopHuntZone?.range ?? '24,960 – 25,000';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Retail Stop-Loss Hunt / Liquidity Sweep</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              viewMode === 'live-match'
                ? isSweepActive
                  ? 'bg-rose-950 border-rose-700 text-rose-300 font-bold animate-pulse'
                  : 'bg-emerald-950 border-emerald-800 text-emerald-300'
                : 'bg-amber-950 border-amber-800 text-amber-300'
            }`}>
              {viewMode === 'live-match'
                ? isSweepActive ? `🎯 Active Stop Sweep: ${trapState.replaceAll('_', ' ')}` : '✅ Order Book Clean'
                : 'Institutional Absorption'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {viewMode === 'live-match'
              ? isSweepActive
                ? synthesis?.liquidityPool?.explanation || 'Market makers have swept retail stops below key support!'
                : `Monitored retail stop-loss cluster: ${stopZone}. No active sweep in progress.`
              : 'How smart money pierces obvious retail support levels to trigger stops before reversing.'}
          </p>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 760 220" className="w-full h-auto min-w-[550px] select-none">
          <line x1="40" y1="120" x2="560" y2="120" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 3" />
          <text x="570" y="124" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">Obvious Support (25,000)</text>

          <rect x="220" y="122" width="220" height="40" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" rx="4" />
          <text x="330" y="145" fill="#fda4af" fontSize="9" fontWeight="bold" textAnchor="middle">
            {viewMode === 'live-match' ? `Stop Trap: ${stopZone}` : 'Retail Stop-Loss Cluster (Sell Orders)'}
          </text>

          <line x1="100" y1="70" x2="100" y2="120" stroke="#10b981" strokeWidth="1.5" />
          <rect x="92" y="80" width="16" height="38" fill="#059669" rx="1" />

          <line x1="160" y1="80" x2="160" y2="120" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="152" y="85" width="16" height="33" fill="#e11d48" rx="1" />

          <line x1="280" y1="75" x2="280" y2="175" stroke="#10b981" strokeWidth="2.5" />
          <rect x="270" y="85" width="20" height="30" fill="#10b981" rx="2" />
          <circle cx="280" cy="175" r="4" fill="#ef4444" />
          <text x="295" y="180" fill="#fca5a5" fontSize="9" fontWeight="bold">Stop Sweep Low (Pierces Support)</text>

          <text x="280" y="65" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">Rejection Hammer</text>

          <line x1="360" y1="40" x2="360" y2="90" stroke="#10b981" strokeWidth="2" />
          <rect x="350" y="45" width="20" height="40" fill="#10b981" rx="2" />

          <line x1="430" y1="20" x2="430" y2="65" stroke="#10b981" strokeWidth="2" />
          <rect x="420" y="25" width="20" height="35" fill="#10b981" rx="2" />
          <text x="450" y="45" fill="#34d399" fontSize="10" fontWeight="bold">Sharp Squeeze Higher</text>

          <rect x="270" y="185" width="20" height="30" fill="#10b981" rx="1" />
          <text x="360" y="202" fill="#38bdf8" fontSize="9">Institutions buy the panic into limit orders</text>
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-rose-300 block">1. The Retail Trap</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Retail puts stop losses 5-15 points below round numbers. Market makers push spot down to trigger these market sell orders.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-cyan-300 block">2. Institutional Liquidity Grab</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Institutions need massive volume to fill long positions without slippage. Retail stops supply this exact liquidity instantly.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-emerald-300 block">3. Playbook Execution</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Never place stops directly below visible pivot lows. If you see a sweep hammer reclaim support within 5 minutes, enter long with the institutions.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. SINGLE-STOCK SKEW & BREADTH TRAP VISUAL
// ==========================================
function CulpritDivergenceVisual({ viewMode, synthesis }: VisualBaseProps) {
  const culprit = synthesis?.techSpecs?.culpritSymbol;
  const culpritPct = synthesis?.techSpecs?.culpritContributionPct ?? 0;
  const advanceTurnover = synthesis?.techSpecs?.advancingTurnoverPct ?? 50;
  const declineTurnover = synthesis?.techSpecs?.decliningTurnoverPct ?? 50;
  const isSkewed = Boolean(culprit && culpritPct > 35);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Single-Stock Skew &amp; Breadth Divergence Trap</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              viewMode === 'live-match'
                ? isSkewed
                  ? 'bg-rose-950 border-rose-700 text-rose-300 font-bold animate-pulse'
                  : 'bg-emerald-950 border-emerald-800 text-emerald-300 font-bold'
                : 'bg-amber-950 border-amber-800 text-amber-300'
            }`}>
              {viewMode === 'live-match'
                ? isSkewed ? `⚠️ Culprit Skew Active: ${culprit} (${culpritPct.toFixed(0)}%)` : '✅ Balanced Breadth'
                : 'The Heavyweight Illusion'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {viewMode === 'live-match'
              ? isSkewed
                ? `${culprit} is single-handedly driving ${culpritPct.toFixed(0)}% of today's net index move. Breadth shows ${advanceTurnover.toFixed(0)}% inflow vs ${declineTurnover.toFixed(0)}% outflow.`
                : `Today’s market turnover is balanced (${advanceTurnover.toFixed(0)}% advancing vs ${declineTurnover.toFixed(0)}% declining) with no single heavyweight distorting the index.`
              : 'When Nifty appears green and bullish solely due to 1 pumped heavyweight while 80% of stocks fall.'}
          </p>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 760 220" className="w-full h-auto min-w-[550px] select-none">
          <line x1="380" y1="20" x2="380" y2="200" stroke="#334155" strokeDasharray="4 4" />

          {/* LEFT: The Headline Illusion */}
          <text x="190" y="32" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">
            THE HEADLINE ILLUSION (Index Chart)
          </text>
          <rect x="50" y="45" width="280" height="150" fill="#0f172a" stroke="#334155" strokeWidth="1" rx="4" />
          
          <line x1="190" y1="65" x2="190" y2="155" stroke="#10b981" strokeWidth="2.5" />
          <rect x="175" y="75" width="30" height="65" fill="#10b981" rx="2" />
          <text x="190" y="170" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle">
            {viewMode === 'live-match' ? `Index: ₹${(synthesis?.techSpecs?.gammaFlip ?? 25000).toLocaleString('en-IN')}` : 'Nifty 50: +65 pts (+0.26%) 🚀'}
          </text>
          <text x="190" y="185" fill="#94a3b8" fontSize="9" textAnchor="middle">
            Retail sees green and FOMO buys calls
          </text>

          {/* RIGHT: The Microstructure Reality */}
          <text x="570" y="32" fill="#f43f5e" fontSize="12" fontWeight="bold" textAnchor="middle">
            THE REALITY (Market Breadth &amp; Turnover)
          </text>
          <rect x="430" y="45" width="280" height="150" fill="#1e1015" stroke="#881337" strokeWidth="1" rx="4" />

          <rect x="445" y="60" width="250" height="32" fill="#059669" fillOpacity="0.2" stroke="#10b981" strokeWidth="1" rx="3" />
          <text x="455" y="76" fill="#34d399" fontSize="10" fontWeight="bold">
            {viewMode === 'live-match' && culprit
              ? `Culprit (${culprit}): ~${culpritPct.toFixed(0)}% of move`
              : '1 Culprit (RELIANCE): +3.4% (+68 pts!)'}
          </text>
          <text x="455" y="88" fill="#a7f3d0" fontSize="8">
            Single-handedly holding up the entire index
          </text>

          <rect x="445" y="98" width="250" height="42" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="1" rx="3" />
          <text x="455" y="114" fill="#f87171" fontSize="10" fontWeight="bold">
            {viewMode === 'live-match'
              ? `Rupee Split: ${advanceTurnover.toFixed(0)}% Inflow vs ${declineTurnover.toFixed(0)}% Outflow`
              : 'Remaining 49 Stocks: 11 Up vs 39 Down'}
          </text>
          <text x="455" y="128" fill="#fda4af" fontSize="8">
            Rupee Volume Outflow across broader constituent basket
          </text>

          <text x="570" y="165" fill="#f43f5e" fontSize="10" fontWeight="bold" textAnchor="middle">
            ⚠️ Breadth Divergence: Fake Breakout Risk
          </text>
          <text x="570" y="180" fill="#fda4af" fontSize="9" textAnchor="middle">
            When the single pillar tires, the index plunges
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-cyan-300 block">1. Market-Cap Weighting Distortion</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Nifty is weighted by market capitalization. The top 5 stocks control ~40% of the entire index. A +3% rally in one giant can disguise heavy selling across 40 other stocks.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-rose-300 block">2. Distribution into Retail</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Institutions often buy one heavyweight to keep index levels pinned or green while quietly liquidating their broader equity holdings into retail breakout buyers.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-emerald-300 block">3. Playbook Execution</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            When the dashboard highlights a &quot;Culprit Symbol&quot; carrying &gt; 40% of the net move, never buy index breakout calls. Either stay cash or prepare for a sharp mean-reversion flush.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. PUT WALL & CALL WALL VISUAL
// ==========================================
function PutCallWallsVisual({ viewMode, synthesis, spotPrice }: VisualBaseProps) {
  const putWall = synthesis?.techSpecs?.putWall ?? 24800;
  const callWall = synthesis?.techSpecs?.callWall ?? 25300;
  const currentSpot = spotPrice ?? 25050;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Put Wall &amp; Call Wall (Institutional S/R Boundaries)</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
              Open Interest Concentrations
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {viewMode === 'live-match'
              ? `Live Institutional Boundaries: Put Wall at ₹${putWall.toLocaleString('en-IN')} | Call Wall at ₹${callWall.toLocaleString('en-IN')}.`
              : 'The strikes with the absolute highest Open Interest on Puts and Calls where smart money has massive capital at stake.'}
          </p>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 760 220" className="w-full h-auto min-w-[550px] select-none">
          {/* Top: Call Wall */}
          <rect x="40" y="25" width="670" height="40" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" rx="4" />
          <text x="55" y="47" fill="#f87171" fontSize="11" fontWeight="bold">
            🏰 INSTITUTIONAL CALL WALL: ₹{callWall.toLocaleString('en-IN')} CE (Heavy Call Writing Ceiling)
          </text>
          <text x="55" y="59" fill="#fda4af" fontSize="9">
            Option sellers defend this strike; market makers sell futures into upward tests
          </text>

          {/* Middle: Live Spot Trading Corridor */}
          <rect x="40" y="75" width="670" height="65" fill="#0f172a" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" rx="4" />
          <line x1="60" y1="108" x2="690" y2="108" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />

          <line x1="140" y1="85" x2="140" y2="125" stroke="#10b981" strokeWidth="1.5" />
          <rect x="134" y="92" width="12" height="25" fill="#059669" rx="1" />

          <line x1="220" y1="80" x2="220" y2="130" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="214" y="85" width="12" height="35" fill="#e11d48" rx="1" />

          <line x1="300" y1="90" x2="300" y2="132" stroke="#10b981" strokeWidth="1.5" />
          <rect x="294" y="95" width="12" height="25" fill="#059669" rx="1" />

          {/* Spot Tracker Pill */}
          <circle cx="410" cy="108" r="5" fill="#38bdf8" />
          <text x="425" y="112" fill="#38bdf8" fontSize="11" fontWeight="bold">
            Current Spot (₹{currentSpot.toLocaleString('en-IN')}) • Oscillating in {callWall - putWall} pt Corridor
          </text>

          {/* Bottom: Put Wall */}
          <rect x="40" y="150" width="670" height="40" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" rx="4" />
          <text x="55" y="172" fill="#34d399" fontSize="11" fontWeight="bold">
            🛡️ INSTITUTIONAL PUT WALL: ₹{putWall.toLocaleString('en-IN')} PE (Primary Demand Floor)
          </text>
          <text x="55" y="184" fill="#6ee7b7" fontSize="9">
            Put sellers absorb dips and buy futures to protect collected premiums
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-cyan-300 block">1. What Are The Walls?</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            The Put Wall and Call Wall represent the strikes with the largest outstanding position size in the market. Big institutional option writers have billions at stake defending these boundaries.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-emerald-300 block">2. The Magnetic Pinning Effect</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            As expiry approaches, market makers stay long gamma between the walls, absorbing dips toward the Put Wall and dampening rallies into the Call Wall to maximize theta decay.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-rose-300 block">3. The Wall Breach Cascade</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            If spot decisively slices past a wall on heavy volume, the trapped writers must panic-close. Market makers flip short gamma, causing a violent runaway squeeze in that direction.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 9. OPEN INTEREST VELOCITY FLOW VISUAL
// ==========================================
function OiVelocityVisual({ viewMode, synthesis }: VisualBaseProps) {
  const liveFlow = synthesis?.techSpecs?.oiVelocityRegime ?? 'BALANCED_FLOW';

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">Open Interest Velocity &amp; Real Money Flow</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
            {viewMode === 'live-match' ? `Live Flow: ${liveFlow.replaceAll('_', ' ')}` : 'Order Flow Decoding'}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {viewMode === 'live-match'
            ? `Current live order flow regime: ${liveFlow.replaceAll('_', ' ')}.`
            : 'How to tell whether a rally is genuine smart-money accumulation or a fragile mechanical short-covering bounce.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className={`bg-slate-950 border rounded-xl p-3.5 space-y-2 transition-all ${
          viewMode === 'live-match' && liveFlow === 'PUT_ADDITION_SUPPORT'
            ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20'
            : 'border-emerald-900/60'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Put Writing (Addition) • True Floor
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300">
              Price ↗ | Put OI ↗
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Institutions aggressively sell Put contracts into dips. They are willing to take delivery at this strike and collect maximum premium. <strong>Signals rock-solid demand.</strong>
          </p>
        </div>

        <div className={`bg-slate-950 border rounded-xl p-3.5 space-y-2 transition-all ${
          viewMode === 'live-match' && liveFlow === 'BULLISH_SHORT_COVERING'
            ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-950/20'
            : 'border-amber-900/60'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Short Covering • Mechanical Squeeze
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300">
              Price ↗ | Call OI ↘
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Price rises fast, but Call OI plunges. Trapped bears are simply panic-closing their losses. <strong>No new buyers are entering.</strong> Prone to sharp, sudden exhaustion.
          </p>
        </div>

        <div className={`bg-slate-950 border rounded-xl p-3.5 space-y-2 transition-all ${
          viewMode === 'live-match' && liveFlow === 'CALL_ADDITION_RESISTANCE'
            ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-950/20'
            : 'border-rose-900/60'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Call Writing (Addition) • Concrete Ceiling
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300">
              Price ↘ | Call OI ↗
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Smart money builds large Call positions above spot. Every intraday bounce into these strikes is met with institutional supply. <strong>Upside is strictly capped.</strong>
          </p>
        </div>

        <div className="bg-slate-950 border border-rose-950/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" />
              Long Unwinding • Capitulation
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300">
              Price ↘ | Long OI ↘
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Trapped bulls puke their positions into falling bids without waiting for bounces. Freefalls through thin air until reaching the institutional Put Wall.
          </p>
        </div>
      </div>

      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
        <strong className="text-cyan-300">The Golden Rule:</strong> Never buy an index breakout on short-covering alone. Wait for <em>Put Addition</em> to confirm that institutions are backing the rally with their own capital.
      </div>
    </div>
  );
}

// ==========================================
// 10. AIR POCKET & INSTITUTIONAL FLOOR VISUAL
// ==========================================
function AirPocketVisual({ viewMode, synthesis }: VisualBaseProps) {
  const pocFloor = synthesis?.gapDynamics?.exhaustionTrapTracker?.institutionalFloorPrice ?? synthesis?.keyLevels?.hardFloor?.price ?? 25000;
  const dangerHigh = synthesis?.keyLevels?.hardCeiling?.price ?? 25250;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">The Air Pocket &amp; Real Institutional Floor (POC)</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
            {viewMode === 'live-match' ? `Live POC Floor: ₹${pocFloor.toLocaleString('en-IN')}` : 'Volume Profile Microstructure'}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Why price drops rapidly with zero friction through thin-volume zones down to the institutional POC.
        </p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 760 220" className="w-full h-auto min-w-[550px] select-none">
          <rect x="40" y="30" width="670" height="35" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1" rx="4" />
          <text x="50" y="52" fill="#fca5a5" fontSize="10" fontWeight="bold">
            ⚠️ DANGER ZONE: Trapped Buyers at Climax Highs (₹{dangerHigh.toLocaleString('en-IN')})
          </text>

          <rect x="40" y="75" width="670" height="65" fill="#3b82f6" fillOpacity="0.08" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 2" rx="4" />
          <text x="50" y="105" fill="#38bdf8" fontSize="11" fontWeight="bold">
            🕳️ THE AIR POCKET (Thin Volume Profile Vacuum Zone)
          </text>
          <text x="50" y="122" fill="#94a3b8" fontSize="9">
            Zero resting institutional bids. Price falls like a rock through this pocket without friction.
          </text>

          <path d="M 540 65 L 540 145" stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow)" fill="none" />
          <text x="555" y="105" fill="#ef4444" fontSize="10" fontWeight="bold">Frictionless Freefall</text>

          <rect x="40" y="150" width="670" height="45" fill="#10b981" fillOpacity="0.18" stroke="#10b981" strokeWidth="1.5" rx="4" />
          <text x="50" y="172" fill="#34d399" fontSize="11" fontWeight="bold">
            🎯 REAL INSTITUTIONAL FLOOR (Point of Control / POC: ₹{pocFloor.toLocaleString('en-IN')})
          </text>
          <text x="50" y="187" fill="#6ee7b7" fontSize="9">
            Heavy institutional limit bids resting here. The genuine bounce anchor.
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-rose-300 block">1. Trapped Overhead Supply</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Traders who bought near the day’s high are stuck underwater. As price slips, every bounce is sold by breakeven panickers.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-cyan-300 block">2. Why It Freefalls</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            In an air pocket, no institutional limit orders exist in the order book. A small market sell order slides price 50+ points in seconds.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-emerald-300 block">3. Playbook Execution</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Never attempt to catch a falling knife inside an air pocket. Wait patiently until spot touches the Point of Control (POC) before looking for reversal longs.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 11. MARKET MAKER GAMMA REGIMES VISUAL
// ==========================================
function GammaRegimeVisual({ viewMode, synthesis }: VisualBaseProps) {
  const liveDealerRegime = synthesis?.techSpecs?.dealerRegime ?? 'DEALER_LONG_GAMMA_PIN';
  const isShortGamma = liveDealerRegime === 'DEALER_SHORT_GAMMA_CASCADE';

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">Market Maker Gamma Regimes</span>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
            viewMode === 'live-match'
              ? isShortGamma
                ? 'bg-rose-950 border-rose-700 text-rose-300 font-bold'
                : 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold'
              : 'bg-cyan-950 border-cyan-800 text-cyan-300'
          }`}>
            {viewMode === 'live-match'
              ? isShortGamma ? '🌪️ Active: Short Gamma Accelerator' : '🛡️ Active: Long Gamma Pin'
              : 'Institutional Hedging Physics'}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          How option dealers&apos; mechanical delta-hedging dictates whether the market trends explosively or chops in a tight pin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`bg-slate-950 border rounded-xl p-4 space-y-2 transition-all ${
          viewMode === 'live-match' && isShortGamma
            ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-950/20'
            : 'border-rose-900/60'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
              🌪️ Accelerator Mode (Short Gamma)
              {viewMode === 'live-match' && isShortGamma && <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300">Below Flip Line</span>
          </div>

          <svg viewBox="0 0 320 120" className="w-full h-28 my-1 select-none">
            <line x1="40" y1="20" x2="40" y2="50" stroke="#f43f5e" strokeWidth="2" />
            <rect x="34" y="25" width="12" height="20" fill="#e11d48" rx="1" />

            <line x1="90" y1="40" x2="90" y2="80" stroke="#f43f5e" strokeWidth="2" />
            <rect x="83" y="45" width="14" height="30" fill="#e11d48" rx="1" />

            <line x1="150" y1="70" x2="150" y2="115" stroke="#f43f5e" strokeWidth="2.5" />
            <rect x="142" y="75" width="16" height="38" fill="#e11d48" rx="1" />

            <path d="M 175 80 Q 215 100 245 108" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" fill="none" />
            <text x="160" y="60" fill="#fda4af" fontSize="9" fontWeight="bold">Dealer Hedging: SELL</text>
          </svg>

          <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
            Dealers are net short options. As prices drop, dealers get shorter delta and are <strong>forced to dump index futures</strong> into falling bids, accelerating the slide.
          </p>
        </div>

        <div className={`bg-slate-950 border rounded-xl p-4 space-y-2 transition-all ${
          viewMode === 'live-match' && !isShortGamma
            ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20'
            : 'border-emerald-900/60'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              🛡️ Shock Absorber (Long Gamma)
              {viewMode === 'live-match' && !isShortGamma && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">Above Flip Line</span>
          </div>

          <svg viewBox="0 0 320 120" className="w-full h-28 my-1 select-none">
            <line x1="20" y1="60" x2="300" y2="60" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="235" y="54" fill="#34d399" fontSize="9" fontFamily="monospace">Pin Strike</text>

            <rect x="40" y="45" width="10" height="25" fill="#059669" rx="1" />
            <rect x="80" y="50" width="10" height="25" fill="#e11d48" rx="1" />
            <rect x="120" y="48" width="10" height="20" fill="#059669" rx="1" />
            <rect x="160" y="52" width="10" height="20" fill="#e11d48" rx="1" />

            <text x="110" y="30" fill="#38bdf8" fontSize="9" textAnchor="middle">Buy Dips / Sell Rips</text>
          </svg>

          <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
            Dealers are net long options. They trade counter-cyclical: <strong>buying dips and selling rips</strong> to rebalance deltas, dampening volatility into a tight pin.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 12. GAMMA FLIP LINE VISUAL
// ==========================================
function GammaFlipVisual({ viewMode, synthesis, spotPrice }: VisualBaseProps) {
  const gammaFlip = synthesis?.techSpecs?.gammaFlip ?? 24950;
  const currentSpot = spotPrice ?? 25050;
  const isAbove = currentSpot >= gammaFlip;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">Trend Danger Line (Gamma Flip)</span>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
            viewMode === 'live-match'
              ? isAbove
                ? 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold'
                : 'bg-rose-950 border-rose-700 text-rose-300 font-bold'
              : 'bg-cyan-950 border-cyan-800 text-cyan-300'
          }`}>
            {viewMode === 'live-match'
              ? isAbove ? `Spot ₹${Math.round(currentSpot - gammaFlip)} pts ABOVE Flip Line (Calm)` : `Spot ₹${Math.round(gammaFlip - currentSpot)} pts BELOW Flip Line (Danger)`
              : 'Regime Inflection Point'}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {viewMode === 'live-match'
            ? `Live Gamma Flip inflection line: ₹${gammaFlip.toLocaleString('en-IN')}. Spot is trading at ₹${currentSpot.toLocaleString('en-IN')}.`
            : 'The critical boundary price where market behavior shifts from calm mean-reversion to explosive trending.'}
        </p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
        <svg viewBox="0 0 680 180" className="w-full h-auto min-w-[500px] select-none">
          <rect x="30" y="20" width="620" height="65" fill="#10b981" fillOpacity={isAbove && viewMode === 'live-match' ? 0.2 : 0.1} stroke="#10b981" strokeWidth={isAbove && viewMode === 'live-match' ? 2 : 1} strokeDasharray="3 3" rx="4" />
          <text x="45" y="42" fill="#34d399" fontSize="11" fontWeight="bold">
            CALM ZONE (Above Gamma Flip: &gt; ₹{gammaFlip.toLocaleString('en-IN')}) {isAbove && viewMode === 'live-match' ? '• SPOT TRADING HERE ✓' : ''}
          </text>
          <text x="45" y="58" fill="#94a3b8" fontSize="9">
            Mean-reverting candles. High probability of chop and option premium decay.
          </text>

          <line x1="20" y1="90" x2="660" y2="90" stroke="#38bdf8" strokeWidth="3" />
          <rect x="220" y="80" width="240" height="20" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" rx="4" />
          <text x="340" y="94" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
            GAMMA FLIP LINE: ₹{gammaFlip.toLocaleString('en-IN')}
          </text>

          <rect x="30" y="95" width="620" height="65" fill="#ef4444" fillOpacity={!isAbove && viewMode === 'live-match' ? 0.2 : 0.1} stroke="#ef4444" strokeWidth={!isAbove && viewMode === 'live-match' ? 2 : 1} strokeDasharray="3 3" rx="4" />
          <text x="45" y="120" fill="#f87171" fontSize="11" fontWeight="bold">
            FAST TREND DANGER ZONE (Below Gamma Flip: &lt; ₹{gammaFlip.toLocaleString('en-IN')}) {!isAbove && viewMode === 'live-match' ? '• SPOT TRADING HERE ⚠️' : ''}
          </text>
          <text x="45" y="136" fill="#94a3b8" fontSize="9">
            Dealers sell into drops. High risk of multi-strike waterfall moves and stop cascades.
          </text>
        </svg>

        <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 leading-relaxed">
          <strong className="text-cyan-300">Rule of Thumb:</strong> When spot price is trading above the Gamma Flip line, expect orderly oscillations and range fades. If price breaks and sustains below the Gamma Flip line, step aside from contrarian dip-buying as market makers amplify downward velocity.
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 13. 1-SIGMA EXPECTED MOVE CORRIDOR VISUAL
// ==========================================
function ExpectedMoveVisual({ viewMode, synthesis, spotPrice }: VisualBaseProps) {
  const corridor = synthesis?.gapDynamics?.expectedOpeningRange;
  const central = corridor?.centralPoint ?? spotPrice ?? 25000;
  const low = corridor?.low ?? central - 120;
  const high = corridor?.high ?? central + 120;
  const movePts = corridor?.dailyExpectedMovePts ?? 120;
  const currentSpot = spotPrice ?? central;
  const isInside = currentSpot >= low && currentSpot <= high;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">1-Sigma Expected Move Corridor (Daily Volatility Envelope)</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              viewMode === 'live-match'
                ? isInside
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold'
                  : 'bg-rose-950 border-rose-700 text-rose-300 font-bold animate-pulse'
                : 'bg-cyan-950 border-cyan-800 text-cyan-300'
            }`}>
              {viewMode === 'live-match'
                ? isInside ? '🟢 Spot Inside 68% Noise Band' : '⚠️ Volatility Expansion Breakout (> 1σ)'
                : 'Black-Scholes Volatility Math'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {viewMode === 'live-match'
              ? `Live 1-Day Expected Move: ±${movePts} pts (Corridor: ₹${low.toLocaleString('en-IN')} – ₹${high.toLocaleString('en-IN')}). Current Spot: ₹${currentSpot.toLocaleString('en-IN')}.`
              : 'The mathematical boundary where 68.2% of all daily price closes land, derived continuously from India VIX.'}
          </p>
        </div>
        <div className="p-2 bg-slate-900 border border-cyan-800/60 rounded-lg text-xs font-mono text-cyan-300">
          1-Day 1σ Move = Spot × (VIX / 100) / √252
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 760 220" className="w-full h-auto min-w-[550px] select-none">
          <rect x="50" y="25" width="660" height="170" fill="#0f172a" stroke="#334155" strokeWidth="1" rx="4" />

          {/* 1-Sigma Band */}
          <rect x="220" y="35" width="320" height="150" fill="#0284c7" fillOpacity={isInside && viewMode === 'live-match' ? 0.2 : 0.12} stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 3" rx="4" />
          <text x="380" y="52" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
            NORMAL 68.2% NOISE CORRIDOR (±1-SIGMA)
          </text>
          <text x="380" y="66" fill="#94a3b8" fontSize="9" textAnchor="middle">
            Premium Decay • Mean-Reversion • Fading Gaps Favored
          </text>

          <line x1="380" y1="35" x2="380" y2="185" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
          <circle cx="380" cy="110" r="5" fill="#38bdf8" />
          <text x="380" y="130" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
            Central Pivot (₹{central.toLocaleString('en-IN')})
          </text>

          {/* Upper +1 Sigma Line */}
          <line x1="540" y1="35" x2="540" y2="185" stroke="#10b981" strokeWidth="2" />
          <text x="545" y="100" fill="#34d399" fontSize="10" fontWeight="bold">+1σ (₹{high.toLocaleString('en-IN')})</text>
          <text x="545" y="115" fill="#6ee7b7" fontSize="8">+{movePts} pts expected</text>

          {/* Lower -1 Sigma Line */}
          <line x1="220" y1="35" x2="220" y2="185" stroke="#f43f5e" strokeWidth="2" />
          <text x="135" y="100" fill="#f87171" fontSize="10" fontWeight="bold">-1σ (₹{low.toLocaleString('en-IN')})</text>
          <text x="135" y="115" fill="#fda4af" fontSize="8">-{movePts} pts expected</text>

          <text x="630" y="150" fill="#f59e0b" fontSize="9" textAnchor="middle">Tail Volatility (&gt; +1σ)</text>
          <text x="130" y="150" fill="#f59e0b" fontSize="9" textAnchor="middle">Tail Volatility (&lt; -1σ)</text>
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-cyan-300 block">1. The Mathematical Invariant</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            India VIX represents the annualized 30-day implied volatility of ATM options. Dividing by √252 converts annual vol into a continuous 1-day standard deviation.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-amber-300 block">2. Inside 1σ vs Outside 1σ</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            If an opening gap opens inside 1σ, it is statistically normal noise and has high odds of fading. If price breaks and sustains outside 1σ, volatility is expanding into a one-way trend.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-emerald-300 block">3. Crucial Architecture Guardrail</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Never use the 1σ line as a tight intraday stop loss. Waiting for a 120 pt move to exit means taking a full 1% wipeout. Use tactical price-action levels for stops, and use 1σ for sizing option wings.
          </p>
        </div>
      </div>
    </div>
  );
}
