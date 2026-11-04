'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Clock,
  Layers,
  ShieldCheck,
  Maximize2,
  Sliders,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  TickMarkType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type Time,
  type UTCTimestamp
} from 'lightweight-charts';
import { MultiTfPayload, CandleBar, SmartKeyLevel } from '@/lib/types';

interface ChartPanelProps {
  title: string;
  subtitle: string;
  timeframe: string;
  candles: CandleBar[];
  dayOpen: number;
  prevClose: number;
  tacticalLevels: SmartKeyLevel[];
  showIndicators: boolean;
}

function SingleTfChart({
  title,
  subtitle,
  timeframe,
  candles,
  dayOpen,
  prevClose,
  tacticalLevels,
  showIndicators
}: ChartPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [activeCandle, setActiveCandle] = useState<CandleBar | null>(null);

  // Initialize and update chart
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Dispose old chart if exists
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const width = container.clientWidth || 400;
    const height = Math.max(380, container.clientHeight || 420);

    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: 'monospace'
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.4)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(30, 41, 59, 0.4)', style: LineStyle.Dotted }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#38bdf8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0284c7'
        },
        horzLine: {
          color: '#38bdf8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0284c7'
        }
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.1, bottom: 0.22 },
        autoScale: true
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 8,
        minBarSpacing: 2,
        maxBarSpacing: 14,
        rightOffset: 6,
        tickMarkFormatter: (timeVal: Time, tickMarkType: TickMarkType) => {
          let epochMs = 0;
          if (typeof timeVal === 'number') {
            epochMs = timeVal < 10000000000 ? timeVal * 1000 : timeVal;
          } else if (typeof timeVal === 'string') {
            epochMs = new Date(timeVal).getTime();
          }
          if (!epochMs) return null;
          const d = new Date(epochMs);
          if (tickMarkType < TickMarkType.Time) {
            return d.toLocaleDateString('en-IN', {
              timeZone: 'Asia/Kolkata',
              day: '2-digit',
              month: 'short'
            });
          }
          return d.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        }
      },
      localization: {
        priceFormatter: (p: number) =>
          p.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }),
        timeFormatter: (timeVal: Time) => {
          let epochMs = 0;
          if (typeof timeVal === 'number') {
            epochMs = timeVal < 10000000000 ? timeVal * 1000 : timeVal;
          } else if (typeof timeVal === 'string') {
            epochMs = new Date(timeVal).getTime();
          }
          if (!epochMs) return '';
          const d = new Date(epochMs);
          return d.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        }
      }
    });

    chartRef.current = chart;

    // Volume Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      color: '#334155'
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 }
    });
    volumeSeriesRef.current = volumeSeries;

    // Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e'
    });
    candleSeriesRef.current = candleSeries;

    // Indicators: VWAP, EMA 20, EMA 50
    const vwapSeries = chart.addSeries(LineSeries, {
      color: '#a855f7',
      lineWidth: 2,
      title: 'VWAP',
      priceLineVisible: false
    });
    vwapSeriesRef.current = vwapSeries;

    const ema20Series = chart.addSeries(LineSeries, {
      color: '#fbbf24',
      lineWidth: 1,
      title: 'EMA 20',
      priceLineVisible: false
    });
    ema20SeriesRef.current = ema20Series;

    const ema50Series = chart.addSeries(LineSeries, {
      color: '#38bdf8',
      lineWidth: 1,
      title: 'EMA 50',
      priceLineVisible: false
    });
    ema50SeriesRef.current = ema50Series;

    // Crosshair listener
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        if (candles.length > 0) setActiveCandle(candles[candles.length - 1]);
        return;
      }
      const c = candles.find((item) => item.timestamp === param.time);
      if (c) setActiveCandle(c);
    });

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: newWidth, height: newHeight } = entries[0].contentRect;
      if (newWidth > 0 && newHeight > 0) {
        chart.applyOptions({ width: newWidth, height: newHeight });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Update Data & Indicators
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || candles.length === 0) return;

    // Deduplicate and sort by timestamp
    const sorted = [...candles].sort((a, b) => a.timestamp - b.timestamp);
    const uniqueMap = new Map<number, CandleBar>();
    for (const c of sorted) {
      uniqueMap.set(c.timestamp, c);
    }
    const cleanCandles = Array.from(uniqueMap.values());

    const cData: CandlestickData<Time>[] = cleanCandles.map((c) => ({
      time: c.timestamp as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }));

    const vData: HistogramData<Time>[] = cleanCandles.map((c) => ({
      time: c.timestamp as UTCTimestamp,
      value: c.volume || 1000,
      color: c.close >= c.open ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'
    }));

    candleSeriesRef.current.setData(cData);
    if (volumeSeriesRef.current) volumeSeriesRef.current.setData(vData);

    // Indicator Data
    if (showIndicators) {
      if (vwapSeriesRef.current) {
        const vwapData: LineData<Time>[] = cleanCandles
          .filter((c) => typeof c.vwap === 'number')
          .map((c) => ({ time: c.timestamp as UTCTimestamp, value: c.vwap! }));
        vwapSeriesRef.current.setData(vwapData);
      }
      if (ema20SeriesRef.current) {
        const ema20Data: LineData<Time>[] = cleanCandles
          .filter((c) => typeof c.ema20 === 'number')
          .map((c) => ({ time: c.timestamp as UTCTimestamp, value: c.ema20! }));
        ema20SeriesRef.current.setData(ema20Data);
      }
      if (ema50SeriesRef.current) {
        const ema50Data: LineData<Time>[] = cleanCandles
          .filter((c) => typeof c.ema50 === 'number')
          .map((c) => ({ time: c.timestamp as UTCTimestamp, value: c.ema50! }));
        ema50SeriesRef.current.setData(ema50Data);
      }
    } else {
      if (vwapSeriesRef.current) vwapSeriesRef.current.setData([]);
      if (ema20SeriesRef.current) ema20SeriesRef.current.setData([]);
      if (ema50SeriesRef.current) ema50SeriesRef.current.setData([]);
    }

    // Set Default Active Candle
    setActiveCandle(cleanCandles[cleanCandles.length - 1]);

    // Fit content smoothly
    chartRef.current.timeScale().fitContent();
  }, [candles, showIndicators]);

  const latestCandle = activeCandle || (candles.length > 0 ? candles[candles.length - 1] : null);
  const isUp = latestCandle ? latestCandle.close >= latestCandle.open : true;

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex-1 min-w-[320px]">
      {/* Panel Sub-Header */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              {timeframe}
            </span>
            <span className="font-bold text-xs text-white">{title}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{subtitle}</div>
        </div>

        {latestCandle && (
          <div className="text-right font-mono text-xs">
            <div className={`font-extrabold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₹{latestCandle.close.toFixed(1)}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 justify-end">
              <span>O: {latestCandle.open.toFixed(0)}</span>
              <span>H: {latestCandle.high.toFixed(0)}</span>
              <span>L: {latestCandle.low.toFixed(0)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full h-[380px] bg-[#090d16]" ref={containerRef} />

      {/* Indicator Legend Bar */}
      {showIndicators && latestCandle && (
        <div className="px-3 py-1.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            {latestCandle.vwap && (
              <span className="flex items-center gap-1 text-purple-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                VWAP: ₹{latestCandle.vwap.toFixed(1)}
              </span>
            )}
            {latestCandle.ema20 && (
              <span className="flex items-center gap-1 text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                EMA 20: ₹{latestCandle.ema20.toFixed(1)}
              </span>
            )}
            {latestCandle.ema50 && (
              <span className="flex items-center gap-1 text-cyan-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                EMA 50: ₹{latestCandle.ema50.toFixed(1)}
              </span>
            )}
          </div>
          <span className="text-slate-500">{latestCandle.time} IST</span>
        </div>
      )}
    </div>
  );
}

export function MultiTfParallelCharts() {
  const [data, setData] = useState<MultiTfPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showIndicators, setShowIndicators] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchChartData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`/api/market-chart?_t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      console.warn('[MultiTfParallelCharts] Fetch failed:', err);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchChartData(false);
    const interval = setInterval(() => {
      fetchChartData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchChartData]);

  if (loading || !data) {
    return (
      <div className="min-h-[450px] flex flex-col items-center justify-center p-8 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <h3 className="text-base font-bold text-white">Loading Multi-Timeframe Intraday Charts...</h3>
        <p className="text-xs text-slate-400 mt-1">Aggregating authentic 5-minute, 15-minute, and 1-hour candles.</p>
      </div>
    );
  }

  const { charts, smartRoadmap, spotPrice, prevClose, dayOpen, vix } = data;
  const netChange = spotPrice - prevClose;
  const netPct = prevClose > 0 ? (netChange / prevClose) * 100 : 0;
  const isNetPositive = netChange >= 0;

  return (
    <div className="space-y-4 w-full">
      {/* Top Multi-TF Action Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Live Developing Intraday Multi-Timeframe Cockpit
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              Parallel 5m • 15m • 1h
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <h2 className="text-2xl font-black font-mono tracking-tight text-white">
              ₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
            </h2>
            <div className={`flex items-center text-sm font-mono font-bold ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isNetPositive ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
              {isNetPositive ? '+' : ''}{netChange.toFixed(1)} ({isNetPositive ? '+' : ''}{netPct.toFixed(2)}%)
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-mono text-slate-400">
              India VIX: <strong className="text-cyan-400">{vix.toFixed(1)}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-mono text-slate-400">
              1σ Move: <strong className="text-cyan-300">±{smartRoadmap.dailyExpectedMovePts} pts</strong>
            </span>
          </div>
        </div>

        {/* Action Controls & Signal Badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {smartRoadmap.actionSignal && (
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 text-[10px] uppercase block">Tactical SL Invalidation</span>
              <span className="font-bold text-rose-400">
                ₹{smartRoadmap.actionSignal.invalidationPrice?.toFixed(1) || (spotPrice - 30).toFixed(1)}
              </span>
            </div>
          )}

          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showIndicators
                ? 'bg-cyan-950/50 border-cyan-700/60 text-cyan-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {showIndicators ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>VWAP & EMAs</span>
          </button>

          <button
            onClick={() => fetchChartData(true)}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3 PARALLEL DEVELOPING CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 w-full">
        {/* 1. 5-Minute Chart */}
        <SingleTfChart
          title="5-Minute Scalp & Microstructure"
          subtitle="VWAP • 5m EMA 20/50 • Execution & Trailing"
          timeframe="5m"
          candles={charts.fiveMin.candles}
          dayOpen={dayOpen}
          prevClose={prevClose}
          tacticalLevels={smartRoadmap.tacticalLevels}
          showIndicators={showIndicators}
        />

        {/* 2. 15-Minute Chart */}
        <SingleTfChart
          title="15-Minute Institutional Bias"
          subtitle="Opening Range (ORB) • Swing Pivots • Trend Conviction"
          timeframe="15m"
          candles={charts.fifteenMin.candles}
          dayOpen={dayOpen}
          prevClose={prevClose}
          tacticalLevels={smartRoadmap.tacticalLevels}
          showIndicators={showIndicators}
        />

        {/* 3. 1-Hour Chart */}
        <SingleTfChart
          title="1-Hour Macro Structure & Levels"
          subtitle="1-σ Expected Envelope • Gap Zones • Session Target"
          timeframe="1h"
          candles={charts.oneHour.candles}
          dayOpen={dayOpen}
          prevClose={prevClose}
          tacticalLevels={smartRoadmap.tacticalLevels}
          showIndicators={showIndicators}
        />
      </div>

      {/* Tactical Key Levels Roadmap Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Institutional Roadmap & Key Levels (Smart Money Engine)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Derived from 1D Density Clustering, Session Anchor & Order Blocks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="pb-2 font-semibold">Level Role</th>
                <th className="pb-2 font-semibold">Price Level</th>
                <th className="pb-2 font-semibold">Distance from Spot</th>
                <th className="pb-2 font-semibold">Strength</th>
                <th className="pb-2 font-semibold">Confluence Drivers</th>
                <th className="pb-2 font-semibold text-right">Action Directive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {smartRoadmap.tacticalLevels.map((lvl) => {
                const diff = lvl.price - spotPrice;
                const isAbove = diff > 0;
                return (
                  <tr key={lvl.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 font-bold font-sans text-white flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        lvl.type.includes('CEILING') || lvl.type.includes('RESISTANCE')
                          ? 'bg-rose-400'
                          : lvl.type.includes('PIVOT') || lvl.type.includes('GAP')
                          ? 'bg-cyan-400'
                          : 'bg-emerald-400'
                      }`} />
                      {lvl.label}
                    </td>
                    <td className="py-2.5 font-extrabold text-slate-200">
                      ₹{lvl.price.toFixed(1)}
                    </td>
                    <td className="py-2.5">
                      <span className={isAbove ? 'text-rose-400' : 'text-emerald-400'}>
                        {isAbove ? '+' : ''}{diff.toFixed(1)} pts
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 font-bold">
                        {lvl.strength}%
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 font-sans text-[11px]">
                      {lvl.confluence.join(' • ')}
                    </td>
                    <td className="py-2.5 text-right font-sans text-[11px] font-semibold text-slate-300">
                      {lvl.actionTag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
