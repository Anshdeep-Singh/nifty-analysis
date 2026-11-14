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
  AlertTriangle
} from 'lucide-react';

export type MicrostructureTopicId =
  | 'gap-common'
  | 'gap-breakaway'
  | 'gap-runaway'
  | 'gap-exhaustion'
  | 'clv'
  | 'stop-hunt'
  | 'air-pocket'
  | 'gamma-regime'
  | 'gamma-flip';

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
  { id: 'air-pocket', title: 'Air Pocket & Institutional Floor', badge: 'Volume Vacuum & POC', category: 'Microstructure' },
  { id: 'gamma-regime', title: 'Market Maker Gamma Regimes', badge: 'Cascade vs Pin', category: 'Microstructure' },
  { id: 'gamma-flip', title: 'Trend Danger Line (Gamma Flip)', badge: 'Regime Boundary', category: 'Microstructure' },
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
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden my-auto"
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
                Visual Market Microstructure Guide
                <span className="text-[10px] font-mono font-normal uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  Candle Examples
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authentic price-action patterns, institutional order flow & expected odds
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

            <span className="text-[10px] font-mono uppercase text-slate-500 mx-2 shrink-0">Concepts:</span>
            {TOPICS.filter((t) => t.category !== 'Gaps').map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTopic(t.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                  selectedTopic === t.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                }`}
              >
                {t.title.split(' ')[0]}
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
          {selectedTopic === 'air-pocket' && <AirPocketVisual />}
          {selectedTopic === 'gamma-regime' && <GammaRegimeVisual />}
          {selectedTopic === 'gamma-flip' && <GammaFlipVisual />}
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
        <svg viewBox="0 0 620 220" className="w-full h-auto min-w-[500px] select-none">
          {/* Background grid lines */}
          <line x1="40" y1="40" x2="580" y2="40" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="40" y1="90" x2="580" y2="90" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="40" y1="140" x2="580" y2="140" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="40" y1="180" x2="580" y2="180" stroke="#1e293b" strokeDasharray="3 3" />

          {/* Price Labels on Right */}
          <text x="585" y="44" fill="#64748b" fontSize="10" fontFamily="monospace">25,050</text>
          <text x="585" y="94" fill="#64748b" fontSize="10" fontFamily="monospace">25,000</text>
          <text x="585" y="144" fill="#38bdf8" fontSize="10" fontFamily="monospace">24,950 (Prev Close)</text>
          <text x="585" y="184" fill="#64748b" fontSize="10" fontFamily="monospace">24,900</text>

          {/* Session Divider */}
          <line x1="260" y1="20" x2="260" y2="200" stroke="#334155" strokeDasharray="4 4" />
          <text x="130" y="25" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">YESTERDAY SESSION</text>
          <text x="420" y="25" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">TODAY SESSION (OPEN & FILL)</text>

          {/* Yesterday Range Highlight Box */}
          <rect x="50" y="55" width="200" height="130" fill="#334155" fillOpacity="0.12" rx="4" />
          <text x="55" y="70" fill="#64748b" fontSize="9" fontFamily="monospace">Consolidation Range</text>

          {/* Yesterday Candles */}
          {/* Candle 1 (Bearish) */}
          <line x1="90" y1="65" x2="90" y2="160" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="82" y="80" width="16" height="60" fill="#e11d48" rx="1" />

          {/* Candle 2 (Bullish) */}
          <line x1="140" y1="75" x2="140" y2="175" stroke="#10b981" strokeWidth="1.5" />
          <rect x="132" y="95" width="16" height="65" fill="#059669" rx="1" />

          {/* Candle 3 (Yesterday Close Candle) */}
          <line x1="190" y1="100" x2="190" y2="165" stroke="#10b981" strokeWidth="1.5" />
          <rect x="182" y="110" width="16" height="30" fill="#059669" rx="1" />
          {/* Yesterday Close horizontal line */}
          <line x1="190" y1="140" x2="580" y2="140" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />

          {/* Gap Zone Bracket */}
          <rect x="290" y="92" width="60" height="48" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" rx="2" />
          <text x="320" y="118" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle">GAP (+45 pts)</text>

          {/* Today Candles */}
          {/* Candle 4: 09:15 Open Candle (Gap Up, Upper Wick Rejection) */}
          <line x1="320" y1="65" x2="320" y2="115" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="312" y="92" width="16" height="20" fill="#e11d48" rx="1" />
          <text x="320" y="58" fill="#fda4af" fontSize="9" textAnchor="middle">09:15 Open Rejection</text>

          {/* Candle 5: Gap Fill Reversal Candle */}
          <line x1="375" y1="85" x2="375" y2="155" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="367" y="105" width="16" height="42" fill="#e11d48" rx="1" />

          {/* Fill Point Touch */}
          <circle cx="375" cy="140" r="4" fill="#38bdf8" />
          <text x="385" y="152" fill="#38bdf8" fontSize="10" fontWeight="bold">GAP FILLED (Touches 24,950)</text>

          {/* Candle 6: Post-Fill Stabilization Doji */}
          <line x1="470" y1="125" x2="470" y2="165" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="462" y="137" width="16" height="8" fill="#475569" rx="1" />

          {/* Return to Mean arrow */}
          <path d="M 320 90 Q 350 140 370 140" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* Explanatory Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-cyan-300 block">1. Why It Happened</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            No institutional breakout orders behind the opening jump. Price simply opened on modest overnight liquidity within the prevailing balance zone.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-amber-300 block">2. Expected Behavior</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            High same-day fill rate (64%). The market treats the opening bump as an overextension and gravitates back toward yesterday’s closing value.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-emerald-300 block">3. Playbook Action</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Do not chase opening breakouts. Wait for the morning wick rejection at highs to trade the mean-reversion move down into yesterday’s close.
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
              Continuation Odds: 54% • Fill: 32%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Price gaps cleanly over key resistance with institutional volume and refuses to look back.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
            Continuation: <strong>54%</strong>
          </span>
          <span className="px-2 py-1 rounded bg-rose-950/60 border border-rose-800/60 text-rose-300">
            Same-Day Fill: <strong>32% (Low)</strong>
          </span>
        </div>
      </div>

      {/* SVG Candlestick Chart */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 620 220" className="w-full h-auto min-w-[500px] select-none">
          {/* Resistance Barrier Line */}
          <line x1="40" y1="120" x2="580" y2="120" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5 3" />
          <text x="585" y="124" fill="#f43f5e" fontSize="10" fontFamily="monospace" fontWeight="bold">Key Resistance (25,000)</text>

          {/* Consolidation Box */}
          <rect x="50" y="122" width="190" height="75" fill="#334155" fillOpacity="0.15" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" rx="4" />
          <text x="60" y="137" fill="#94a3b8" fontSize="9" fontFamily="monospace">Multi-Day Accumulation Base</text>

          {/* Prior Candles below resistance */}
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

          {/* Today Open Candle: Opens ABOVE 25,000 and expands upward */}
          <line x1="280" y1="40" x2="280" y2="80" stroke="#10b981" strokeWidth="2" />
          <rect x="270" y="45" width="20" height="30" fill="#10b981" rx="2" />
          <text x="280" y="32" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">09:15 Breakout Open</text>

          {/* Retest wick that defends the gap (New Floor) */}
          <line x1="350" y1="25" x2="350" y2="115" stroke="#10b981" strokeWidth="2" />
          <rect x="340" y="35" width="20" height="45" fill="#059669" rx="2" />
          <circle cx="350" cy="115" r="4" fill="#34d399" />
          <text x="360" y="114" fill="#34d399" fontSize="9" fontWeight="bold">Dip Defended Above 25,000</text>

          {/* Follow-through expansion candle */}
          <line x1="420" y1="15" x2="420" y2="50" stroke="#10b981" strokeWidth="2" />
          <rect x="410" y="20" width="20" height="25" fill="#10b981" rx="2" />

          {/* Massive Volume Spike on Breakout */}
          <rect x="268" y="165" width="24" height="35" fill="#10b981" rx="1" />
          <rect x="338" y="172" width="24" height="28" fill="#10b981" rx="1" />
          <text x="350" y="160" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">3x Institutional RVOL Spike</text>

          {/* Green Trend Continuation Arrow */}
          <path d="M 440 25 L 530 20" stroke="#34d399" strokeWidth="2.5" markerEnd="url(#arrow)" fill="none" />
          <text x="490" y="14" fill="#34d399" fontSize="10" fontWeight="bold">Continuation Rally</text>
        </svg>
      </div>

      {/* Explanatory Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-cyan-300 block">1. Institutional Cause</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Institutions reprice the underlying index higher overnight. All resting sell orders at the resistance barrier are instantly absorbed.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-amber-300 block">2. Why It Doesn’t Fill</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            The prior ceiling (25,000) converts immediately into institutional support. Anyone waiting for a full gap fill gets left behind as the trend extends.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-emerald-300 block">3. Playbook Action</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Strictly avoid fading or shorting. Look for shallow morning pullbacks toward the gap top to enter long positions with risk defined below the breakout floor.
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
            <span className="text-lg font-bold text-white">Runaway Gap (Mid-Trend Acceleration)</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
              Continuation Odds: 62% • Fill: 28%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Occurs midway through an aggressive trend. Shorts capitulate and momentum buyers chase in panic.
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
        <svg viewBox="0 0 620 220" className="w-full h-auto min-w-[500px] select-none">
          {/* Upward trend guide channel */}
          <line x1="50" y1="190" x2="550" y2="40" stroke="#334155" strokeDasharray="3 3" />
          <line x1="50" y1="140" x2="550" y2="10" stroke="#334155" strokeDasharray="3 3" />

          {/* Established Trend Candles */}
          <line x1="80" y1="145" x2="80" y2="185" stroke="#10b981" strokeWidth="1.5" />
          <rect x="72" y="150" width="16" height="30" fill="#059669" rx="1" />

          <line x1="140" y1="110" x2="140" y2="160" stroke="#10b981" strokeWidth="1.5" />
          <rect x="132" y="120" width="16" height="35" fill="#059669" rx="1" />

          <line x1="200" y1="85" x2="200" y2="130" stroke="#10b981" strokeWidth="1.5" />
          <rect x="192" y="90" width="16" height="35" fill="#059669" rx="1" />

          {/* Session Divider */}
          <line x1="260" y1="20" x2="260" y2="200" stroke="#334155" strokeDasharray="4 4" />
          <text x="160" y="25" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">STRONG UPTREND ACTIVE</text>
          <text x="420" y="25" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle">RUNAWAY ACCELERATION GAP</text>

          {/* Runaway Gap in Mid-Air */}
          <rect x="290" y="45" width="55" height="40" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" rx="2" />
          <text x="318" y="68" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">MID-AIR GAP</text>

          {/* Continuation Candles */}
          <line x1="320" y1="20" x2="320" y2="45" stroke="#10b981" strokeWidth="2" />
          <rect x="310" y="22" width="20" height="23" fill="#10b981" rx="2" />

          <line x1="390" y1="8" x2="390" y2="30" stroke="#10b981" strokeWidth="2" />
          <rect x="380" y="10" width="20" height="18" fill="#10b981" rx="2" />

          {/* Measuring Gap Annotations */}
          <text x="470" y="70" fill="#94a3b8" fontSize="10">Often marks the 50% midpoint</text>
          <text x="470" y="85" fill="#38bdf8" fontSize="10">of the total trend distance</text>
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-cyan-300 block">1. Microstructure Dynamic</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Trailing shorts get squeezed out while momentum funds add to winning winners. The order book on the sell side becomes nearly empty.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-amber-300 block">2. Gap Behavior</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Rarely closes during the same session (28% fill rate). Acts as an acceleration checkpoint rather than an attractive fill target.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-emerald-300 block">3. Playbook Action</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Trail existing long positions with 15m EMA stops. Do not attempt to predict the exact peak until distribution volume manifests.
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
            <span className="text-lg font-bold text-white">Exhaustion Gap (Late Climax Reversal Trap)</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300">
              Fill Odds: 78% • Snapback: 35%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            A final aggressive gap into heavy resistance where institutions dump to FOMO buyers.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-rose-950/60 border border-rose-800/60 text-rose-300">
            Fill Probability: <strong>78% (Very High)</strong>
          </span>
          <span className="px-2 py-1 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300">
            Snapback: <strong>35%</strong>
          </span>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 620 220" className="w-full h-auto min-w-[500px] select-none">
          {/* Major Overhead Supply Level */}
          <line x1="40" y1="50" x2="580" y2="50" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" />
          <text x="585" y="54" fill="#f43f5e" fontSize="10" fontFamily="monospace" fontWeight="bold">Overhead Institutional Ceiling</text>

          {/* Extended Rally Candles */}
          <line x1="80" y1="125" x2="80" y2="185" stroke="#10b981" strokeWidth="1.5" />
          <rect x="72" y="135" width="16" height="40" fill="#059669" rx="1" />

          <line x1="140" y1="95" x2="140" y2="155" stroke="#10b981" strokeWidth="1.5" />
          <rect x="132" y="105" width="16" height="40" fill="#059669" rx="1" />

          <line x1="200" y1="75" x2="200" y2="125" stroke="#10b981" strokeWidth="1.5" />
          <rect x="192" y="80" width="16" height="35" fill="#059669" rx="1" />

          {/* Session Divider */}
          <line x1="260" y1="20" x2="260" y2="200" stroke="#334155" strokeDasharray="4 4" />

          {/* Final Euphoric Gap Open */}
          <rect x="280" y="45" width="60" height="35" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" rx="2" />
          <text x="310" y="65" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle">CLIMAX GAP</text>

          {/* Shooting Star Rejection Candle */}
          <line x1="310" y1="25" x2="310" y2="85" stroke="#f43f5e" strokeWidth="2" />
          <rect x="302" y="65" width="16" height="15" fill="#e11d48" rx="1" />
          <circle cx="310" cy="25" r="4" fill="#f43f5e" />
          <text x="325" y="28" fill="#fda4af" fontSize="9" fontWeight="bold">Shooting Star (Wick Trap)</text>

          {/* Follow-up Waterfall Red Candle slicing through gap */}
          <line x1="380" y1="65" x2="380" y2="160" stroke="#f43f5e" strokeWidth="2" />
          <rect x="370" y="75" width="20" height="75" fill="#e11d48" rx="2" />

          {/* Gap Filled & Air Pocket Plunge */}
          <circle cx="380" cy="80" r="4" fill="#f43f5e" />
          <text x="400" y="85" fill="#fda4af" fontSize="9" fontWeight="bold">Gap Erased Completely</text>

          <path d="M 390 120 L 460 170" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" fill="none" />
          <text x="470" y="175" fill="#f43f5e" fontSize="10" fontWeight="bold">Violent Liquidation Flush</text>
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
          <span className="font-bold text-amber-300 block">2. Why It Fills Rapidly</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Once morning buyers realize they are trapped above resistance, their stop-loss sales create an air-pocket collapse straight down through the open.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-cyan-300 block">3. Playbook Action</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Look for shooting star or pin bar triggers within the first 15 minutes. Short the break of the first 5-minute candle low with stop at the swing high.
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
          <span className="text-lg font-bold text-white">Close Location Value (CLV) Explained</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
            Closing Auction Power
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Measures exactly where the session closed relative to its entire High-Low range (0% to 100%).
        </p>
      </div>

      {/* 3 Comparison Candles Diagram */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <div className="text-center font-mono text-xs text-cyan-400 pb-3 border-b border-slate-800/80 mb-3">
          Formula: CLV = [(Close - Low) - (High - Close)] / (High - Low)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Bullish CLV */}
          <div className="bg-slate-900/90 border border-emerald-800/60 rounded-xl p-3 flex flex-col items-center">
            <span className="text-xs font-bold text-emerald-400">Bullish Dominance (80% – 100%)</span>
            <span className="text-[10px] text-slate-400">Close near absolute high</span>

            <svg viewBox="0 0 100 130" className="w-24 h-32 my-2 select-none">
              <line x1="50" y1="10" x2="50" y2="120" stroke="#10b981" strokeWidth="2" />
              <rect x="35" y="15" width="30" height="75" fill="#059669" rx="2" />
              {/* High marker */}
              <text x="75" y="15" fill="#94a3b8" fontSize="8" fontFamily="monospace">High</text>
              {/* Close marker */}
              <circle cx="50" cy="15" r="3" fill="#34d399" />
              <text x="75" y="27" fill="#34d399" fontSize="8" fontWeight="bold" fontFamily="monospace">Close</text>
              {/* Open marker */}
              <text x="5" y="90" fill="#94a3b8" fontSize="8" fontFamily="monospace">Open</text>
              {/* Low marker */}
              <text x="75" y="120" fill="#94a3b8" fontSize="8" fontFamily="monospace">Low</text>
            </svg>

            <span className="text-[11px] text-emerald-300 font-semibold text-center mt-1">
              Buyers held full control into 15:30 IST. Strong odds of positive gap-up next morning.
            </span>
          </div>

          {/* 2. Neutral CLV */}
          <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-3 flex flex-col items-center">
            <span className="text-xs font-bold text-cyan-300">Equilibrium / Neutral (40% – 60%)</span>
            <span className="text-[10px] text-slate-400">Close in the middle (Doji)</span>

            <svg viewBox="0 0 100 130" className="w-24 h-32 my-2 select-none">
              <line x1="50" y1="10" x2="50" y2="120" stroke="#64748b" strokeWidth="2" />
              <rect x="35" y="55" width="30" height="20" fill="#475569" rx="2" />
              <circle cx="50" cy="65" r="3" fill="#38bdf8" />
              <text x="75" y="15" fill="#94a3b8" fontSize="8" fontFamily="monospace">High</text>
              <text x="72" y="68" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">Close</text>
              <text x="75" y="120" fill="#94a3b8" fontSize="8" fontFamily="monospace">Low</text>
            </svg>

            <span className="text-[11px] text-slate-300 font-semibold text-center mt-1">
              Balanced two-way auction. Neither buyers nor sellers won the closing bell.
            </span>
          </div>

          {/* 3. Bearish CLV */}
          <div className="bg-slate-900/90 border border-rose-800/60 rounded-xl p-3 flex flex-col items-center">
            <span className="text-xs font-bold text-rose-400">Bearish Flush (0% – 20%)</span>
            <span className="text-[10px] text-slate-400">Close near absolute low</span>

            <svg viewBox="0 0 100 130" className="w-24 h-32 my-2 select-none">
              <line x1="50" y1="10" x2="50" y2="120" stroke="#f43f5e" strokeWidth="2" />
              <rect x="35" y="45" width="30" height="70" fill="#e11d48" rx="2" />
              <circle cx="50" cy="115" r="3" fill="#f43f5e" />
              <text x="75" y="15" fill="#94a3b8" fontSize="8" fontFamily="monospace">High</text>
              <text x="5" y="50" fill="#94a3b8" fontSize="8" fontFamily="monospace">Open</text>
              <text x="75" y="117" fill="#fda4af" fontSize="8" fontWeight="bold" fontFamily="monospace">Close</text>
              <text x="75" y="125" fill="#94a3b8" fontSize="8" fontFamily="monospace">Low</text>
            </svg>

            <span className="text-[11px] text-rose-300 font-semibold text-center mt-1">
              Aggressive liquidation into the bell. High probability of weak or gap-down open.
            </span>
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
        <svg viewBox="0 0 620 220" className="w-full h-auto min-w-[500px] select-none">
          {/* Obvious Support Line */}
          <line x1="40" y1="120" x2="580" y2="120" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 3" />
          <text x="585" y="124" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">Obvious Support (25,000)</text>

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

          {/* Huge Volume Bar on the sweep */}
          <rect x="270" y="185" width="20" height="30" fill="#10b981" rx="1" />
          <text x="360" y="202" fill="#38bdf8" fontSize="9">Institutions buy the panic</text>

          {/* Upward Reversal Arrow */}
          <path d="M 390 50 L 510 30" stroke="#34d399" strokeWidth="2.5" fill="none" />
          <text x="470" y="22" fill="#34d399" fontSize="10" fontWeight="bold">Trap Spring Rally</text>
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-amber-300 block">1. The Liquidity Problem</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Institutional algorithms cannot buy ₹500 Cr worth of contracts without moving the price higher unless they find a cluster of eager sell orders.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-rose-300 block">2. How the Trap Works</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Price is pushed slightly below key support. Retail stop-loss orders trigger as market sell orders, feeding institutional limit buy bids at a discount.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-emerald-300 block">3. Trader Rule</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Never place stops right on round numbers (e.g. 25,000). Place stops 20-30 pts below, or wait for the sweep wick to close back above support to buy.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. AIR POCKET & POC FLOOR VISUAL
// ==========================================
function AirPocketVisual() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">The Air Pocket (Vacuum Zone) & Institutional Floor</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
            Volume Profile Microstructure
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Why price drops rapidly with zero friction through thin-volume zones down to the institutional POC.
        </p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-x-auto">
        <svg viewBox="0 0 620 220" className="w-full h-auto min-w-[500px] select-none">
          {/* Top: Trapped Buyers Zone */}
          <rect x="40" y="30" width="540" height="35" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1" rx="4" />
          <text x="50" y="52" fill="#fca5a5" fontSize="10" fontWeight="bold">
            ⚠️ DANGER ZONE: Trapped Buyers at Climax Highs (25,200 – 25,280)
          </text>

          {/* Middle: Air Pocket (Low Volume Vacuum) */}
          <rect x="40" y="75" width="540" height="65" fill="#3b82f6" fillOpacity="0.08" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 2" rx="4" />
          <text x="50" y="105" fill="#38bdf8" fontSize="11" fontWeight="bold">
            🕳️ THE AIR POCKET (Thin Volume Profile Vacuum Zone: 25,050 – 25,180)
          </text>
          <text x="50" y="122" fill="#94a3b8" fontSize="9">
            Zero resting institutional bids. Price falls like a rock through this pocket without friction.
          </text>

          {/* Rapid Fall Waterfall Arrow */}
          <path d="M 450 65 L 450 145" stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow)" fill="none" />
          <text x="465" y="105" fill="#ef4444" fontSize="10" fontWeight="bold">Frictionless Freefall</text>

          {/* Bottom: Institutional Point of Control (POC) Floor */}
          <rect x="40" y="150" width="540" height="45" fill="#10b981" fillOpacity="0.18" stroke="#10b981" strokeWidth="1.5" rx="4" />
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
            The gap created a volume vacuum. Because few trades were executed inside the air pocket on the way up, there are no resting buyers on the way down.
          </p>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="font-bold text-emerald-300 block">3. Playbook Action</span>
          <p className="text-slate-400 leading-relaxed font-normal">
            Do not try catching falling knives inside the air pocket. Wait until price reaches the institutional POC floor where real volume absorbs supply.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. GAMMA REGIME (CASCADE VS PIN) VISUAL
// ==========================================
function GammaRegimeVisual() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">Market Maker Gamma Regimes</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
            Dealer Hedging Flow
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          How options market-maker delta hedging either amplifies volatility or pins the market in a calm range.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Accelerator Mode (Short Gamma Cascade) */}
        <div className="bg-slate-950 border border-rose-900/60 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400">🌪️ Accelerator Mode (Short Gamma)</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300">Below Flip Line</span>
          </div>

          <svg viewBox="0 0 260 120" className="w-full h-28 my-1 select-none">
            {/* Accelerating Downward Candles */}
            <line x1="40" y1="20" x2="40" y2="50" stroke="#f43f5e" strokeWidth="2" />
            <rect x="34" y="25" width="12" height="20" fill="#e11d48" rx="1" />

            <line x1="90" y1="40" x2="90" y2="80" stroke="#f43f5e" strokeWidth="2" />
            <rect x="83" y="45" width="14" height="30" fill="#e11d48" rx="1" />

            <line x1="150" y1="70" x2="150" y2="115" stroke="#f43f5e" strokeWidth="2.5" />
            <rect x="142" y="75" width="16" height="38" fill="#e11d48" rx="1" />

            <path d="M 180 90 Q 220 110 240 115" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" fill="none" />
            <text x="180" y="70" fill="#fda4af" fontSize="9" fontWeight="bold">Dealer Hedging: SELL</text>
          </svg>

          <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
            Dealers are net short options. As prices drop, dealers get shorter delta and are <strong>forced to dump index futures</strong> into falling bids, accelerating the slide.
          </p>
        </div>

        {/* Shock Absorber Mode (Long Gamma Pin) */}
        <div className="bg-slate-950 border border-emerald-900/60 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">🛡️ Shock Absorber (Long Gamma)</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">Above Flip Line</span>
          </div>

          <svg viewBox="0 0 260 120" className="w-full h-28 my-1 select-none">
            {/* Pinning Range Line */}
            <line x1="20" y1="60" x2="240" y2="60" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="210" y="55" fill="#34d399" fontSize="8" fontFamily="monospace">Pin Strike</text>

            {/* Alternating Small Oscillating Candles */}
            <rect x="40" y="45" width="10" height="25" fill="#059669" rx="1" />
            <rect x="80" y="50" width="10" height="25" fill="#e11d48" rx="1" />
            <rect x="120" y="48" width="10" height="20" fill="#059669" rx="1" />
            <rect x="160" y="52" width="10" height="20" fill="#e11d48" rx="1" />

            <text x="130" y="30" fill="#38bdf8" fontSize="9" textAnchor="middle">Buy Dips / Sell Rips</text>
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
// 9. GAMMA FLIP VISUAL
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
        <svg viewBox="0 0 540 180" className="w-full h-auto min-w-[450px] select-none">
          {/* Top Zone: Positive Gamma (Calm) */}
          <rect x="30" y="20" width="480" height="65" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" rx="4" />
          <text x="45" y="42" fill="#34d399" fontSize="11" fontWeight="bold">
            CALM ZONE (Above Gamma Flip) • Volatility Suppressed
          </text>
          <text x="45" y="58" fill="#94a3b8" fontSize="9">
            Mean-reverting candles. High probability of chop and option premium decay.
          </text>

          {/* THE GAMMA FLIP LINE */}
          <line x1="20" y1="90" x2="520" y2="90" stroke="#38bdf8" strokeWidth="3" />
          <rect x="180" y="80" width="180" height="20" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" rx="4" />
          <text x="270" y="94" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
            GAMMA FLIP INFLECTION LINE
          </text>

          {/* Bottom Zone: Negative Gamma (Danger) */}
          <rect x="30" y="95" width="480" height="65" fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" rx="4" />
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
