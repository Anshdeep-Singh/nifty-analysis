'use client';

import React, { useState } from 'react';
import { Nifty50Stock } from '@/lib/types';
import { ExternalLink, X, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface ConstituentsHeatmapProps {
  stocks: Nifty50Stock[];
}

export function ConstituentsHeatmap({ stocks }: ConstituentsHeatmapProps) {
  const [selectedStock, setSelectedStock] = useState<Nifty50Stock | null>(null);

  // Sort by weight descending so institutional heavyweights appear first
  const sortedStocks = [...stocks].sort((a, b) => b.weight - a.weight);

  const getIntensityClass = (changePct: number) => {
    if (changePct >= 2.5) return 'bg-emerald-950/80 border-emerald-500/70 text-emerald-100 hover:border-emerald-400';
    if (changePct >= 1.0) return 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200 hover:border-emerald-400';
    if (changePct >= 0.2) return 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300 hover:border-emerald-500';
    if (changePct <= -2.5) return 'bg-rose-950/80 border-rose-500/70 text-rose-100 hover:border-rose-400';
    if (changePct <= -1.0) return 'bg-rose-950/40 border-rose-600/50 text-rose-200 hover:border-rose-400';
    if (changePct <= -0.2) return 'bg-rose-950/20 border-rose-800/40 text-rose-300 hover:border-rose-500';
    return 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600';
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">50 Constituents Visual Heatmap</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Arranged by free-float weightage order. Click any tile to inspect microstructure metrics and corporate news.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> Bullish
          </span>
          <span className="flex items-center gap-1 ml-2">
            <span className="w-2.5 h-2.5 rounded bg-slate-700 inline-block"></span> Neutral
          </span>
          <span className="flex items-center gap-1 ml-2">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span> Bearish
          </span>
        </div>
      </div>

      {/* Grid of 50 Stocks */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 mt-4">
        {sortedStocks.map((stock) => {
          const isSelected = selectedStock?.symbol === stock.symbol;
          const isPositive = stock.changePct > 0;
          const isNegative = stock.changePct < 0;

          return (
            <div
              key={stock.symbol}
              onClick={() => setSelectedStock(stock)}
              className={`cursor-pointer rounded-lg p-2.5 border transition-all flex flex-col justify-between ${
                getIntensityClass(stock.changePct)
              } ${isSelected ? 'ring-2 ring-cyan-400 scale-[1.02]' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono font-bold text-xs text-white flex items-center gap-1">
                    {stock.symbol}
                    {stock.isAnomaly && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Microstructure Anomaly" />
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate max-w-[95px]">{stock.name}</div>
                </div>
                <div className="flex items-center gap-1">
                  {(stock.relativeVolume ?? 1) >= 1.8 && (
                    <span className="text-[8px] font-mono text-cyan-300 bg-cyan-950/80 px-1 rounded border border-cyan-500/30 font-bold" title={`${stock.relativeVolume?.toFixed(1)}x RVOL`}>
                      {stock.relativeVolume?.toFixed(1)}x
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950/40 px-1 rounded">
                    {stock.weight.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1 border-t border-slate-800/40 flex items-end justify-between font-mono">
                <div>
                  <div className="text-[11px] font-semibold text-slate-200">₹{stock.price.toFixed(1)}</div>
                  <div className={`text-[10px] font-bold ${
                    isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'
                  }`}>
                    {isPositive ? '+' : ''}{stock.changePct.toFixed(2)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-400">Impact</div>
                  <div className={`text-[10px] font-bold ${
                    stock.pointImpact >= 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}>
                    {stock.pointImpact >= 0 ? '+' : ''}{stock.pointImpact.toFixed(1)}p
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Modal / Detail Drawer */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedStock(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-mono text-white">{selectedStock.symbol}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                Weight: {selectedStock.weight}%
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{selectedStock.name}</div>
            <div className="text-xs text-cyan-400 font-medium mt-1">Sector: {selectedStock.sector}</div>

            {/* Microstructure Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Current Price</div>
                <div className="text-sm font-bold font-mono text-white mt-0.5">₹{selectedStock.price.toFixed(2)}</div>
                <div className="text-[10px] text-slate-400 font-mono">Close: ₹{selectedStock.prevClose.toFixed(2)}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Change %</div>
                <div className={`text-sm font-bold font-mono mt-0.5 ${
                  selectedStock.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {selectedStock.changePct >= 0 ? '+' : ''}{selectedStock.changePct.toFixed(2)}%
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Trend: {selectedStock.trend}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Nifty Point Impact</div>
                <div className={`text-sm font-bold font-mono mt-0.5 ${
                  selectedStock.pointImpact >= 0 ? 'text-emerald-300' : 'text-rose-300'
                }`}>
                  {selectedStock.pointImpact >= 0 ? '+' : ''}{selectedStock.pointImpact.toFixed(1)} pts
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Microstructure formula</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Turnover & RVOL</div>
                <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                  {(selectedStock.relativeVolume ?? 1.0).toFixed(2)}x RVOL
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  ₹{(selectedStock.turnoverCr ?? 0).toFixed(0)} Cr turnover
                </div>
              </div>
            </div>

            {selectedStock.isAnomaly && (
              <div className="bg-amber-950/30 border border-amber-900/40 rounded-lg p-3 mb-4 text-xs text-amber-200">
                <span className="font-bold">Anomaly Note: </span>
                {selectedStock.anomalyDesc || 'Flagged for unusual price or sector divergence.'}
              </div>
            )}

            {/* Action Links */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-300 mb-2">Check Company Announcements & News:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <a
                  href={`https://www.nseindia.com/companies-listing/corporate-filings-announcements?symbol=${encodeURIComponent(selectedStock.symbol)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 transition-colors"
                >
                  <span>NSE Filings</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
                <a
                  href={`https://www.google.com/finance/quote/${encodeURIComponent(selectedStock.symbol)}:NSE`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 transition-colors"
                >
                  <span>Google News</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
                <a
                  href={`https://www.tradingview.com/chart/?symbol=NSE:${encodeURIComponent(selectedStock.symbol)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 transition-colors"
                >
                  <span>TradingView</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
