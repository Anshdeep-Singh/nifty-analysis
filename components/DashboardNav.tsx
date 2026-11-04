'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Landmark, ShieldCheck, Key, Zap } from 'lucide-react';

interface DashboardNavProps {
  kiteConnected?: boolean;
  kiteUser?: string;
  onOpenKiteModal?: () => void;
  spotPrice?: number;
  spotNetChange?: number;
  activeSymbol: 'NIFTY' | 'BANKNIFTY';
}

export function DashboardNav({
  kiteConnected = false,
  kiteUser,
  onOpenKiteModal,
  spotPrice,
  spotNetChange,
  activeSymbol
}: DashboardNavProps) {
  const pathname = usePathname();
  const isBankNifty = pathname?.startsWith('/bank-nifty') || activeSymbol === 'BANKNIFTY';

  return (
    <nav className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 mb-4 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Brand & Index Switcher Tabs */}
      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <div className="flex items-center gap-2 mr-1">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-mono font-black text-xs sm:text-sm tracking-wider text-white hidden md:inline">
            QUANT RADAR
          </span>
        </div>

        {/* Index Switcher Buttons */}
        <div className="bg-slate-950/80 p-1 rounded-lg border border-slate-800 flex items-center gap-1 flex-1 sm:flex-initial">
          <Link
            href="/"
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-all flex-1 sm:flex-initial ${
              !isBankNifty
                ? 'bg-cyan-600 text-slate-950 shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>NIFTY 50</span>
            {!isBankNifty && typeof spotPrice === 'number' && spotPrice > 0 && (
              <span className="text-[10px] font-extrabold ml-1 bg-cyan-700/80 text-white px-1.5 py-0.2 rounded hidden lg:inline">
                ₹{spotPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            )}
          </Link>

          <Link
            href="/bank-nifty"
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-all flex-1 sm:flex-initial ${
              isBankNifty
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>BANK NIFTY</span>
            {isBankNifty && typeof spotPrice === 'number' && spotPrice > 0 && (
              <span className="text-[10px] font-extrabold ml-1 bg-sky-700/80 text-white px-1.5 py-0.2 rounded hidden lg:inline">
                ₹{spotPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Right Controls: Unified Kite Session Status */}
      <div className="flex items-center gap-2 self-end sm:self-center">
        {onOpenKiteModal && (
          <button
            onClick={onOpenKiteModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              kiteConnected
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 shadow-sm shadow-emerald-950/40'
                : 'border-orange-500/40 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20'
            }`}
            title={kiteConnected ? 'Zerodha Kite Session Active across NIFTY & BANK NIFTY' : 'Connect Kite Connect for Sub-Second Live Ticks'}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="font-mono">{kiteConnected ? (kiteUser || 'Kite Connected') : 'Connect Kite'}</span>
          </button>
        )}
      </div>
    </nav>
  );
}
