'use client';

import React from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Split,
  Search,
  BellRing,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { AnomalyAlert } from '@/lib/types';

interface AnomalyAlertFeedProps {
  anomalies: AnomalyAlert[];
}

export function AnomalyAlertFeed({ anomalies }: AnomalyAlertFeedProps) {
  const getSeverityBadge = (severity: AnomalyAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'NOTICE':
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  const getTypeIcon = (type: AnomalyAlert['type']) => {
    switch (type) {
      case 'VOLUME_SURGE':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'EXTREME_DRIFT':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'SECTOR_DIVERGENCE':
        return <Split className="w-4 h-4 text-amber-400" />;
      case 'HEAVYWEIGHT_PIVOT':
      default:
        return <AlertTriangle className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Microstructure Anomaly & News Inspection Radar
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {anomalies.length} Flagged
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Flags stocks moving with extreme momentum, volume expansion, or sector divergence. Click action links to immediately check regulatory disclosures and news.
          </p>
        </div>
      </div>

      {anomalies.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 rounded-lg border border-slate-800/60 mt-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
          <p className="text-sm font-semibold text-slate-300">Constituents Operating Within Normal Volatility Bands</p>
          <p className="text-xs text-slate-500 mt-0.5">
            No extreme price drift, unusual volume surges, or sharp sector decoupled moves detected.
          </p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {anomalies.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-950/60 border border-slate-800/90 hover:border-slate-700/80 rounded-lg p-3.5 transition-all shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    {getTypeIcon(alert.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{alert.symbol}</span>
                      <span className="text-xs text-slate-400 font-medium">({alert.companyName})</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Sector: <span className="text-slate-300">{alert.sector}</span> • Time: {alert.timestamp}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs self-start md:self-auto">
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    alert.changePct >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {alert.changePct >= 0 ? '+' : ''}{alert.changePct.toFixed(2)}%
                  </span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    alert.pointImpact >= 0 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                  }`}>
                    {alert.pointImpact >= 0 ? '+' : ''}{alert.pointImpact.toFixed(1)} pts
                  </span>
                </div>
              </div>

              {/* Alert Content */}
              <div className="mt-2.5 pt-2 border-t border-slate-900">
                <div className="text-xs font-semibold text-slate-200">{alert.headline}</div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{alert.description}</p>
              </div>

              {/* Action Buttons for User Inspection */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold mr-1">
                  Verify Catalyst:
                </span>
                {alert.actionLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-cyan-300 hover:text-cyan-200 transition-colors"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
