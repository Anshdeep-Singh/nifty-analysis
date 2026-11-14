'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
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
  Compass
} from 'lucide-react';

export type MicrostructureTopicId =
  | 'gap-common'
  | 'gap-breakaway'
  | 'gap-runaway'
  | 'gap-exhaustion'
  | 'clv'
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
  onClose
}: MicrostructureVisualModalProps) {
  const [selectedTopic, setSelectedTopic] = useState<MicrostructureTopicId>(initialTopic);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Microstructure Visual Guide"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden my-auto"
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
                  Candle &amp; Flow Examples
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authentic price-action patterns, institutional order flow &amp; mathematical volatility boundaries
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
          {selectedTopic === 'gap-common' && <CommonGapVisual />}
          {selectedTopic === 'gap-breakaway' && <BreakawayGapVisual />}
          {selectedTopic === 'gap-runaway' && <RunawayGapVisual />}
          {selectedTopic === 'gap-exhaustion' && <ExhaustionGapVisual />}
          {selectedTopic === 'clv' && <ClvVisual />}
          {selectedTopic === 'stop-hunt' && <StopHuntVisual />}
          {selectedTopic === 'culprit-divergence' && <CulpritDivergenceVisual />}
          {selectedTopic === 'put-call-walls' && <PutCallWallsVisual />}
          {selectedTopic === 'oi-velocity' && <OiVelocityVisual />}
          {selectedTopic === 'air-pocket' && <AirPocketVisual />}
          {selectedTopic === 'gamma-regime' && <GammaRegimeVisual />}
          {selectedTopic === 'gamma-flip' && <GammaFlipVisual />}
          {selectedTopic === 'expected-move' && <ExpectedMoveVisual />}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 1. COMMON GAP VISUAL
// ==========================================
function CommonGapVisual() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Common Gap (Range-Bound / Balance Area)</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
              High Fill Odds: 64%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Price opens slightly outside yesterday’s close but remains trapped inside the standard range.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300">
            Fill Probability: <strong>64%</strong>
          </span>
          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">
            Continuation: <strong>24%</strong>
          </span>
        </div>
      </div>

      {/* SVG Candlestick Chart */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 760 220" className="w-full h-auto min-w-[550px] select-none">
          {/* Background grid lines */}
          <line x1="40" y1="40" x2="560" y2="40" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="40" y1="90" x2="560" y2="90" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="40" y1="140" x2="560" y2="140" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="40" y1="180" x2="560" y2="180" stroke="#1e293b" strokeDasharray="3 3" />

          {/* Price Labels on Right (Clearance past 560 line) */}
          <text x="575" y="44" fill="#64748b" fontSize="10" fontFamily="monospace">25,050</text>
          <text x="575" y="94" fill="#64748b" fontSize="10" fontFamily="monospace">25,000</text>
          <text x="575" y="144" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">24,950 (Prev Close)</text>
          <text x="575" y="184" fill="#64748b" fontSize="10" fontFamily="monospace">24,900</text>

          {/* Session Divider */}
          <line x1="260" y1="20" x2="260" y2="200" stroke="#334155" strokeDasharray="4 4" />
          <text x="130" y="25" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">YESTERDAY SESSION</text>
          <text x="420" y="25" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">TODAY SESSION (OPEN &amp; FILL)</text>

          {/* Yesterday Range Highlight Box */}
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
          <text x="320" y="118" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle">GAP (+45 pts)</text>

          {/* Today Candles */}
          <line x1="320" y1="65" x2="320" y2="115" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="312" y="92" width="16" height="20" fill="#e11d48" rx="1" />
          <text x="320" y="58" fill="#fda4af" fontSize="9" textAnchor="middle">09:15 Open Rejection</text>

          <line x1="375" y1="85" x2="375" y2="155" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="367" y="105" width="16" height="42" fill="#e11d48" rx="1" />

          {/* Fill Point Touch */}
          <circle cx="375" cy="140" r="4" fill="#38bdf8" />
          <text x="385" y="152" fill="#38bdf8" fontSize="10" fontWeight="bold">GAP FILLED (Touches 24,950)</text>

          <line x1="430" y1="125" x2="430" y2="160" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="422" y="138" width="16" height="6" fill="#64748b" rx="1" />
          <text x="430" y="175" fill="#94a3b8" fontSize="9" textAnchor="middle">Mean-Reversion Chop</text>

          <line x1="480" y1="110" x2="480" y2="150" stroke="#10b981" strokeWidth="1.5" />
          <rect x="472" y="120" width="16" height="25" fill="#059669" rx="1" />

          {/* Low RVOL Subtitle */}
          <rect x="312" y="185" width="16" height="15" fill="#475569" rx="1" />
          <rect x="367" y="185" width="16" height="18" fill="#475569" rx="1" />
          <text x="400" y="198" fill="#64748b" fontSize="9">Low / Normal Opening Volume (No institutional urgency)</text>
        </svg>
      </div>

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
function BreakawayGapVisual() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Breakaway Gap (Structural Breakout)</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
              Continuation Odds: 54%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Price gaps clean over multi-day consolidation or a heavy Call Wall with massive institutional volume.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
            Continuation: <strong>54%</strong>
          </span>
          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">
            Same-Day Fill: <strong>32% (Low)</strong>
          </span>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 760 220" className="w-full h-auto min-w-[550px] select-none">
          {/* Resistance Barrier Line */}
          <line x1="40" y1="120" x2="560" y2="120" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5 3" />
          <text x="575" y="124" fill="#f43f5e" fontSize="10" fontFamily="monospace" fontWeight="bold">Key Resistance (25,000)</text>

          {/* Consolidation Box */}
          <rect x="50" y="122" width="190" height="75" fill="#334155" fillOpacity="0.15" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" rx="4" />
          <text x="60" y="137" fill="#94a3b8" fontSize="9" fontFamily="monospace">Multi-Day Accumulation Base</text>

          <line x1="80" y1="130" x2="80" y2="185" stroke="#10b981" strokeWidth="1.5" />
          <rect x="73" y="145" width="14" height="30" fill="#059669" rx="1" />

          <line x1="125" y1="125" x2="125" y2="180" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="118" y="130" width="14" height="40" fill="#e11d48" rx="1" />

          <line x1="170" y1="122" x2="170" y2="170" stroke="#10b981" strokeWidth="1.5" />
          <rect x="163" y="135" width="14" height="25" fill="#059669" rx="1" />

          {/* Session Divider */}
          <line x1="235" y1="20" x2="235" y2="200" stroke="#334155" strokeDasharray="4 4" />

          {/* Gap Zone (Above Resistance) */}
          <rect x="250" y="75" width="55" height="45" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" rx="2" />
          <text x="278" y="100" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">CLEAN GAP</text>

          {/* Today Open Candle */}
          <line x1="280" y1="40" x2="280" y2="80" stroke="#10b981" strokeWidth="2" />
          <rect x="270" y="45" width="20" height="30" fill="#10b981" rx="2" />
          <text x="280" y="32" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">09:15 Breakout Open</text>

          {/* Retest wick defending new floor */}
          <line x1="350" y1="25" x2="350" y2="115" stroke="#10b981" strokeWidth="2" />
          <rect x="340" y="35" width="20" height="45" fill="#059669" rx="2" />
          <circle cx="350" cy="115" r="4" fill="#34d399" />
          <text x="360" y="114" fill="#34d399" fontSize="9" fontWeight="bold">Dip Defended Above 25,000</text>

          {/* Follow-through expansion candle */}
          <line x1="420" y1="15" x2="420" y2="50" stroke="#10b981" strokeWidth="2" />
          <rect x="410" y="20" width="20" height="25" fill="#10b981" rx="2" />

          {/* RVOL Spike */}
          <rect x="268" y="165" width="24" height="35" fill="#10b981" rx="1" />
          <rect x="338" y="172" width="24" height="28" fill="#10b981" rx="1" />
          <text x="350" y="160" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">3x Institutional RVOL Spike</text>

          {/* Trend Continuation Arrow */}
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
            The prior resistance barrier (25,000) instantly flips into an institutional floor. Intraday dips into the gap zone are aggressively bought by institutions.
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
function RunawayGapVisual() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Runaway Gap (Mid-Trend Acceleration / Measuring Gap)</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
              Continuation Odds: 62%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Occurs in the middle of an established, fast-moving trend. Panic buyers jump in without waiting for pullbacks.
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
function ExhaustionGapVisual() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Exhaustion Gap (Late Trap / Climax Reversal)</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300">
              Fill &amp; Reverse Odds: 78%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Price gaps aggressively after an extended multi-day rally straight into an institutional ceiling, then collapses.
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
function ClvVisual() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">Close Location Value (CLV)</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
            Institutional Closing Auction Metric
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          CLV measures exactly where the day’s closing print landed relative to the session’s high and low.
        </p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 flex items-center justify-between">
          <span>CLV Formula = ((Close - Low) - (High - Close)) / (High - Low)</span>
          <span className="text-slate-400">Scale: -1.0 to +1.0 (or 0% to 100%)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-emerald-900/60 rounded-xl p-3 flex flex-col items-center text-center">
            <span className="text-xs font-bold text-emerald-400">Bullish CLV (&gt; 70%)</span>
            <span className="text-[10px] text-slate-400">Institutional Accumulation into 15:30</span>
            <svg viewBox="0 0 100 130" className="w-24 h-32 my-2 select-none">
              <line x1="50" y1="20" x2="50" y2="110" stroke="#10b981" strokeWidth="2" />
              <rect x="40" y="25" width="20" height="60" fill="#10b981" rx="2" />
              <circle cx="50" cy="25" r="3" fill="#ffffff" />
              <text x="65" y="28" fill="#34d399" fontSize="9" fontWeight="bold">Close</text>
              <text x="50" y="15" fill="#94a3b8" fontSize="8" textAnchor="middle">High</text>
              <text x="50" y="122" fill="#94a3b8" fontSize="8" textAnchor="middle">Low</text>
            </svg>
            <p className="text-[11px] text-slate-300 leading-tight">
              Buyers absorbed all intraday supply and held prices at highs right into the closing bell.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
            <span className="text-xs font-bold text-slate-300">Neutral CLV (30% - 70%)</span>
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
              Price closed in the middle of the range. Both bulls and bears settled into balance.
            </p>
          </div>

          <div className="bg-slate-900 border border-rose-900/60 rounded-xl p-3 flex flex-col items-center text-center">
            <span className="text-xs font-bold text-rose-400">Bearish CLV (&lt; 30%)</span>
            <span className="text-[10px] text-slate-400">Institutional Distribution / Dump</span>
            <svg viewBox="0 0 100 130" className="w-24 h-32 my-2 select-none">
              <line x1="50" y1="20" x2="50" y2="110" stroke="#f43f5e" strokeWidth="2" />
              <rect x="40" y="45" width="20" height="60" fill="#e11d48" rx="2" />
              <circle cx="50" cy="105" r="3" fill="#ffffff" />
              <text x="65" y="108" fill="#fda4af" fontSize="9" fontWeight="bold">Close</text>
              <text x="50" y="15" fill="#94a3b8" fontSize="8" textAnchor="middle">High</text>
              <text x="50" y="122" fill="#94a3b8" fontSize="8" textAnchor="middle">Low</text>
            </svg>
            <p className="text-[11px] text-slate-300 leading-tight">
              Sellers controlled the 15:00-15:30 closing auction, flushing the market down to session lows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. STOP HUNT / LIQUIDITY SWEEP VISUAL
// ==========================================
function StopHuntVisual() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">Retail Stop-Loss Hunt / Liquidity Sweep</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">
            Institutional Absorption
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          How smart money pierces obvious retail support levels to trigger stops before reversing.
        </p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 760 220" className="w-full h-auto min-w-[550px] select-none">
          {/* Obvious Support Line - With 190 coordinate units of clearance to 760 */}
          <line x1="40" y1="120" x2="560" y2="120" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 3" />
          <text x="570" y="124" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">Obvious Support (25,000)</text>

          {/* Clustered Stop-Loss Zone below Support */}
          <rect x="220" y="122" width="220" height="40" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" rx="4" />
          <text x="330" y="145" fill="#fda4af" fontSize="9" fontWeight="bold" textAnchor="middle">
            Retail Stop-Loss Cluster (Sell Orders)
          </text>

          {/* Candle 1 & 2 forming the support level */}
          <line x1="100" y1="70" x2="100" y2="120" stroke="#10b981" strokeWidth="1.5" />
          <rect x="92" y="80" width="16" height="38" fill="#059669" rx="1" />

          <line x1="160" y1="80" x2="160" y2="120" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="152" y="85" width="16" height="33" fill="#e11d48" rx="1" />

          {/* THE STOP HUNT CANDLE (Long lower wick piercing support) */}
          <line x1="280" y1="75" x2="280" y2="175" stroke="#10b981" strokeWidth="2.5" />
          <rect x="270" y="85" width="20" height="30" fill="#10b981" rx="2" />
          <circle cx="280" cy="175" r="4" fill="#ef4444" />
          <text x="295" y="180" fill="#fca5a5" fontSize="9" fontWeight="bold">Stop Sweep Low (24,960)</text>

          {/* Violent Reversal Green Hammer */}
          <text x="280" y="65" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">Rejection Hammer</text>

          {/* Follow-up Institutional Surge */}
          <line x1="360" y1="40" x2="360" y2="90" stroke="#10b981" strokeWidth="2" />
          <rect x="350" y="45" width="20" height="40" fill="#10b981" rx="2" />

          <line x1="430" y1="20" x2="430" y2="65" stroke="#10b981" strokeWidth="2" />
          <rect x="420" y="25" width="20" height="35" fill="#10b981" rx="2" />
          <text x="450" y="45" fill="#34d399" fontSize="10" fontWeight="bold">Sharp Squeeze Higher</text>

          {/* Huge Volume Bar on the sweep */}
          <rect x="270" y="185" width="20" height="30" fill="#10b981" rx="1" />
          <text x="360" y="202" fill="#38bdf8" fontSize="9">Institutions buy the panic into limit orders</text>
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-rose-300 block">1. The Retail Trap</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Retail puts stop losses 5-15 points below round numbers (e.g. 24,990). Market makers push spot down to trigger these market sell orders.
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
function CulpritDivergenceVisual() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">Single-Stock Skew &amp; Breadth Divergence Trap</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">
              The Heavyweight Illusion
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            When Nifty appears green and bullish solely due to 1 pumped heavyweight while 80% of stocks fall.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-rose-950/60 border border-rose-800/60 text-rose-300">
            Fake Breakout Trap Odds: <strong>81%</strong>
          </span>
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
            Nifty 50: +65 pts (+0.26%) 🚀
          </text>
          <text x="190" y="185" fill="#94a3b8" fontSize="9" textAnchor="middle">
            Retail sees green and FOMO buys calls
          </text>

          {/* RIGHT: The Microstructure Reality */}
          <text x="570" y="32" fill="#f43f5e" fontSize="12" fontWeight="bold" textAnchor="middle">
            THE REALITY (Market Breadth &amp; Volume)
          </text>
          <rect x="430" y="45" width="280" height="150" fill="#1e1015" stroke="#881337" strokeWidth="1" rx="4" />

          <rect x="445" y="60" width="250" height="32" fill="#059669" fillOpacity="0.2" stroke="#10b981" strokeWidth="1" rx="3" />
          <text x="455" y="76" fill="#34d399" fontSize="10" fontWeight="bold">
            1 Culprit (RELIANCE): +3.4% (+68 pts!)
          </text>
          <text x="455" y="88" fill="#a7f3d0" fontSize="8">
            Single-handedly holding up the entire index
          </text>

          <rect x="445" y="98" width="250" height="42" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="1" rx="3" />
          <text x="455" y="114" fill="#f87171" fontSize="10" fontWeight="bold">
            Remaining 49 Stocks: 11 Up vs 39 Down
          </text>
          <text x="455" y="128" fill="#fda4af" fontSize="8">
            Rupee Volume: 74% Outflow / Severe Selling Across Banks &amp; IT
          </text>

          <text x="570" y="165" fill="#f43f5e" fontSize="10" fontWeight="bold" textAnchor="middle">
            ⚠️ Breadth Divergence: Fake Breakout
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
function PutCallWallsVisual() {
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
            The strikes with the absolute highest Open Interest on Puts and Calls where smart money has massive capital at stake.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">
            Pin Corridor Probability: <strong>72%</strong>
          </span>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 760 220" className="w-full h-auto min-w-[550px] select-none">
          {/* Top: Call Wall (Resistance Ceiling) */}
          <rect x="40" y="25" width="670" height="40" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" rx="4" />
          <text x="55" y="47" fill="#f87171" fontSize="11" fontWeight="bold">
            🏰 INSTITUTIONAL CALL WALL: 25,300 CE (Peak Call Open Interest: 1.8 Cr Contracts)
          </text>
          <text x="55" y="59" fill="#fda4af" fontSize="9">
            Heavy Call Writing Ceiling • Option sellers defend this strike; market makers sell futures on approach
          </text>

          {/* Middle: Live Spot Trading Corridor */}
          <rect x="40" y="75" width="670" height="65" fill="#0f172a" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" rx="4" />
          <line x1="60" y1="108" x2="690" y2="108" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />

          {/* Oscillating Range Candles */}
          <line x1="140" y1="85" x2="140" y2="125" stroke="#10b981" strokeWidth="1.5" />
          <rect x="134" y="92" width="12" height="25" fill="#059669" rx="1" />

          <line x1="220" y1="80" x2="220" y2="130" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="214" y="85" width="12" height="35" fill="#e11d48" rx="1" />

          <line x1="300" y1="90" x2="300" y2="132" stroke="#10b981" strokeWidth="1.5" />
          <rect x="294" y="95" width="12" height="25" fill="#059669" rx="1" />

          {/* Spot Tracker Pill */}
          <circle cx="410" cy="108" r="5" fill="#38bdf8" />
          <text x="425" y="112" fill="#38bdf8" fontSize="11" fontWeight="bold">
            Current Spot (25,050) • Range-Bound Oscillation Inside Corridor
          </text>

          {/* Bottom: Put Wall (Support Floor) */}
          <rect x="40" y="150" width="670" height="40" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" rx="4" />
          <text x="55" y="172" fill="#34d399" fontSize="11" fontWeight="bold">
            🛡️ INSTITUTIONAL PUT WALL: 24,800 PE (Peak Put Open Interest: 2.1 Cr Contracts)
          </text>
          <text x="55" y="184" fill="#6ee7b7" fontSize="9">
            Primary Demand Floor • Put sellers absorb dips and buy futures to protect collected premiums
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
function OiVelocityVisual() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">Open Interest Velocity &amp; Real Money Flow</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
            Order Flow Decoding
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          How to tell whether a rally is genuine smart-money accumulation or a fragile mechanical short-covering bounce.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="bg-slate-950 border border-emerald-900/60 rounded-xl p-3.5 space-y-2">
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

        <div className="bg-slate-950 border border-amber-900/60 rounded-xl p-3.5 space-y-2">
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

        <div className="bg-slate-950 border border-rose-900/60 rounded-xl p-3.5 space-y-2">
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
function AirPocketVisual() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">The Air Pocket &amp; Real Institutional Floor (POC)</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
            Volume Profile Microstructure
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
            ⚠️ DANGER ZONE: Trapped Buyers at Climax Highs (25,200 – 25,280)
          </text>

          <rect x="40" y="75" width="670" height="65" fill="#3b82f6" fillOpacity="0.08" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 2" rx="4" />
          <text x="50" y="105" fill="#38bdf8" fontSize="11" fontWeight="bold">
            🕳️ THE AIR POCKET (Thin Volume Profile Vacuum Zone: 25,050 – 25,180)
          </text>
          <text x="50" y="122" fill="#94a3b8" fontSize="9">
            Zero resting institutional bids. Price falls like a rock through this pocket without friction.
          </text>

          <path d="M 540 65 L 540 145" stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow)" fill="none" />
          <text x="555" y="105" fill="#ef4444" fontSize="10" fontWeight="bold">Frictionless Freefall</text>

          <rect x="40" y="150" width="670" height="45" fill="#10b981" fillOpacity="0.18" stroke="#10b981" strokeWidth="1.5" rx="4" />
          <text x="50" y="172" fill="#34d399" fontSize="11" fontWeight="bold">
            🎯 REAL INSTITUTIONAL FLOOR (Point of Control / POC: 25,000)
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
function GammaRegimeVisual() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">Market Maker Gamma Regimes</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
            Institutional Hedging Physics
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          How option dealers&apos; mechanical delta-hedging dictates whether the market trends explosively or chops in a tight pin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950 border border-rose-900/60 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400">🌪️ Accelerator Mode (Short Gamma)</span>
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

        <div className="bg-slate-950 border border-emerald-900/60 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">🛡️ Shock Absorber (Long Gamma)</span>
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
function GammaFlipVisual() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">Trend Danger Line (Gamma Flip)</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
            Regime Inflection Point
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          The critical boundary price where market behavior shifts from calm mean-reversion to explosive trending.
        </p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
        <svg viewBox="0 0 680 180" className="w-full h-auto min-w-[500px] select-none">
          <rect x="30" y="20" width="620" height="65" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" rx="4" />
          <text x="45" y="42" fill="#34d399" fontSize="11" fontWeight="bold">
            CALM ZONE (Above Gamma Flip) • Volatility Suppressed
          </text>
          <text x="45" y="58" fill="#94a3b8" fontSize="9">
            Mean-reverting candles. High probability of chop and option premium decay.
          </text>

          <line x1="20" y1="90" x2="660" y2="90" stroke="#38bdf8" strokeWidth="3" />
          <rect x="240" y="80" width="200" height="20" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" rx="4" />
          <text x="340" y="94" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
            GAMMA FLIP INFLECTION LINE
          </text>

          <rect x="30" y="95" width="620" height="65" fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" rx="4" />
          <text x="45" y="120" fill="#f87171" fontSize="11" fontWeight="bold">
            FAST TREND DANGER ZONE (Below Gamma Flip) • Volatility Expansion
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
function ExpectedMoveVisual() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">1-Sigma Expected Move Corridor (Daily Volatility Envelope)</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
              Black-Scholes Volatility Math
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            The mathematical boundary where 68.2% of all daily price closes land, derived continuously from India VIX.
          </p>
        </div>
        <div className="p-2 bg-slate-900 border border-cyan-800/60 rounded-lg text-xs font-mono text-cyan-300">
          1-Day 1σ Move = Spot × (VIX / 100) / √252
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 760 220" className="w-full h-auto min-w-[550px] select-none">
          <rect x="50" y="25" width="660" height="170" fill="#0f172a" stroke="#334155" strokeWidth="1" rx="4" />

          {/* 1-Sigma Band (Central 68% Zone) */}
          <rect x="220" y="35" width="320" height="150" fill="#0284c7" fillOpacity="0.12" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 3" rx="4" />
          <text x="380" y="52" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
            NORMAL 68.2% NOISE CORRIDOR (±1-SIGMA)
          </text>
          <text x="380" y="66" fill="#94a3b8" fontSize="9" textAnchor="middle">
            Premium Decay • Mean-Reversion • Fading Gaps Favored
          </text>

          <line x1="380" y1="35" x2="380" y2="185" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
          <circle cx="380" cy="110" r="5" fill="#38bdf8" />
          <text x="380" y="130" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
            Anchor Spot (25,000)
          </text>

          {/* Upper +1 Sigma Line */}
          <line x1="540" y1="35" x2="540" y2="185" stroke="#10b981" strokeWidth="2" />
          <text x="545" y="100" fill="#34d399" fontSize="10" fontWeight="bold">+1σ (25,120)</text>
          <text x="545" y="115" fill="#6ee7b7" fontSize="8">+120 pts expected</text>

          {/* Lower -1 Sigma Line */}
          <line x1="220" y1="35" x2="220" y2="185" stroke="#f43f5e" strokeWidth="2" />
          <text x="145" y="100" fill="#f87171" fontSize="10" fontWeight="bold">-1σ (24,880)</text>
          <text x="145" y="115" fill="#fda4af" fontSize="8">-120 pts expected</text>

          {/* Extreme Tail Zones */}
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
