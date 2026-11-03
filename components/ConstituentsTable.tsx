'use client';

import React, { useState, useMemo } from 'react';
import { Nifty50Stock, SectorAnalysis } from '@/lib/types';
import { Search, Filter, ArrowUpDown, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ConstituentsTableProps {
  stocks: Nifty50Stock[];
  sectors: SectorAnalysis[];
}

export function ConstituentsTable({ stocks, sectors }: ConstituentsTableProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'weight' | 'changePct' | 'pointImpact' | 'symbol' | 'price' | 'relativeVolume' | 'turnoverCr'>('weight');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Default descending for quantitative impact
    }
  };

  const filteredStocks = useMemo(() => {
    return stocks
      .filter((s) => {
        const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSector = selectedSector === 'ALL' || s.sector === selectedSector;
        return matchesSearch && matchesSector;
      })
      .sort((a, b) => {
        let valA: number | string = a[sortField] ?? 0;
        let valB: number | string = b[sortField] ?? 0;

        if (typeof valA === 'string') {
          return sortAsc
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }

        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [stocks, searchQuery, selectedSector, sortField, sortAsc]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">50 Constituents Breakdown</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Microstructure point impact and price trends for all 50 index constituents.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[180px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ticker or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Sector Filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Sectors ({sectors.length})</option>
            {sectors.map((sec) => (
              <option key={sec.name} value={sec.name}>
                {sec.name} ({sec.weight.toFixed(1)}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('symbol')}>
                <div className="flex items-center gap-1">
                  Ticker <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Sector</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('weight')}>
                <div className="flex items-center justify-end gap-1">
                  Weight <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('price')}>
                <div className="flex items-center justify-end gap-1">
                  Price (₹) <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('changePct')}>
                <div className="flex items-center justify-end gap-1">
                  Change % <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pointImpact')}>
                <div className="flex items-center justify-end gap-1">
                  Nifty Impact <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('relativeVolume')}>
                <div className="flex items-center justify-end gap-1">
                  RVOL <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('turnoverCr')}>
                <div className="flex items-center justify-end gap-1">
                  Turnover <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Trend</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredStocks.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-6 text-center text-slate-500 italic">
                  No constituent stocks matching search criteria.
                </td>
              </tr>
            ) : (
              filteredStocks.map((stock) => {
                const isPositive = stock.changePct > 0;
                const isNegative = stock.changePct < 0;
                const rvol = stock.relativeVolume ?? 1.0;
                const isSurge = rvol >= 1.8;

                return (
                  <tr key={stock.symbol} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{stock.symbol}</span>
                        {stock.isAnomaly && (
                          <span className={`w-1.5 h-1.5 rounded-full ${stock.anomalyType?.includes('VOLUME') ? 'bg-cyan-400' : 'bg-amber-400'}`} title={stock.anomalyDesc || 'Microstructure Anomaly'} />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans font-normal truncate max-w-[130px]">
                        {stock.name}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans text-[11px] truncate max-w-[150px]">
                      {stock.sector}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{stock.weight.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-right text-white font-semibold">₹{stock.price.toFixed(2)}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${
                      isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {isPositive ? '+' : ''}{stock.changePct.toFixed(2)}%
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${
                      stock.pointImpact >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}>
                      {stock.pointImpact >= 0 ? '+' : ''}{stock.pointImpact.toFixed(1)} pts
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                        isSurge
                          ? 'bg-cyan-500/20 text-cyan-300 font-extrabold border border-cyan-500/30'
                          : rvol >= 1.2
                          ? 'text-cyan-400'
                          : 'text-slate-400 font-normal'
                      }`}>
                        {rvol.toFixed(2)}x
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="text-white font-semibold text-[11px]">
                        ₹{(stock.turnoverCr ?? 0).toFixed(0)} Cr
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {stock.volume ? `${(stock.volume / 100000).toFixed(1)}L shs` : '-'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        stock.trend === 'STRONG_BULL'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : stock.trend === 'MODERATE_BULL'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : stock.trend === 'STRONG_BEAR'
                          ? 'bg-rose-500/20 text-rose-300'
                          : stock.trend === 'MODERATE_BEAR'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {stock.trend.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <a
                        href={`https://www.google.com/finance/quote/${encodeURIComponent(stock.symbol)}:NSE`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-sans hover:underline"
                      >
                        <span>News</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
