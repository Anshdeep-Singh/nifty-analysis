export type TrendIntensity = 'STRONG_BULL' | 'MODERATE_BULL' | 'NEUTRAL' | 'MODERATE_BEAR' | 'STRONG_BEAR';

export interface Nifty50Stock {
  symbol: string;
  name: string;
  sector: string;
  weight: number; // Official baseline percentage weight in Nifty 50 (sums to 100.00%)
  dynamicWeight?: number;
  price: number;
  changePct: number;
  prevClose: number;
  high?: number;
  low?: number;
  volume?: number;
  avgVolume?: number; // 20-day Average Daily Volume (shares)
  turnoverCr?: number; // Traded rupee turnover in ₹ Crores (price * volume / 1e7)
  relativeVolume?: number; // RVOL = actual / time-expected volume
  pointImpact: number; // Point impact on NIFTY index = BaseSpot * (Weight / 100) * (ChangePct / 100)
  trend: TrendIntensity;
  volumeZScore?: number;
  isAnomaly?: boolean;
  anomalyType?: string;
  anomalyDesc?: string;
}

export interface SectorAnalysis {
  name: string;
  weight: number;
  stockCount: number;
  advances: number;
  declines: number;
  unchanged: number;
  weightedReturn: number;
  pointImpact: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  dominantStock: string;
  stocks: Nifty50Stock[];
}

export interface SectorSpillover {
  targetSector: string;
  elasticity: number; // Cross-sector elasticity coefficient
  expectedImpactPct: number;
  expectedPoints: number;
  relationship: 'POSITIVE_CO_MOVE' | 'CAPITAL_ROTATION_DEFENSE' | 'DECOUPLED';
}

export interface SectorCoDependency {
  name: string;
  weight: number;
  weightedReturn: number;
  pointImpact: number;
  betaWithNifty: number; // Historical beta to Nifty index
  spillovers: SectorSpillover[];
  regime: 'BETA_LEAD' | 'ROTATION_SINK' | 'DIVERGENT_DRAG' | 'NEUTRAL_DRIFT';
}

export interface CoDependencySummary {
  marketRegime: 'UNIFORM_BETA_EXPANSION' | 'UNIFORM_BETA_CONTRACTION' | 'INTERNAL_SECTOR_ROTATION' | 'FRAGMENTED_CHOP';
  dispersionScore: number; // 0 (100% synchronized) to 100 (complete dispersion)
  leadSector: string;
  lagSector: string;
  dominantInterSectorChain: string;
  impliedIndexDriftPoints: number;
  rotationIntensity: 'HIGH' | 'MODERATE' | 'LOW';
  sectors: SectorCoDependency[];
}

export interface AdvancesDeclinesSummary {
  advances: number;
  declines: number;
  unchanged: number;
  advancingWeight: number; // Percentage of total index weight that is advancing
  decliningWeight: number; // Percentage of total index weight that is declining
  unchangedWeight: number;
  adRatio: number; // Advances / Declines
  breadthVelocity: 'EXPANDING_BULLISH' | 'MODERATE_BULLISH' | 'BALANCED' | 'MODERATE_BEARISH' | 'EXPANDING_BEARISH';
  totalTurnoverCr: number; // Total constituent turnover in ₹ Crores
  advancingTurnoverCr: number; // Turnover of advancing stocks in ₹ Crores
  decliningTurnoverCr: number; // Turnover of declining stocks in ₹ Crores
  advancingVolumePct: number; // % of constituent turnover in advancing stocks
  decliningVolumePct: number; // % of constituent turnover in declining stocks
  volumeBreadthRatio: number; // advancingTurnoverCr / max(1, decliningTurnoverCr)
  volumeConviction: 'STRONG_ACCUMULATION' | 'MODERATE_INFLOW' | 'NEUTRAL_FLOW' | 'MODERATE_OUTFLOW' | 'HEAVY_DISTRIBUTION';
}

export interface ConfirmationSignal {
  id: string;
  name: string;
  status: 'CONFIRMED' | 'DIVERGENT' | 'NEUTRAL';
  score: number; // -100 to +100
  details: string;
  weight: number; // Institutional weight in trend synthesis
}

export interface PredictionLevels {
  direction: 'STRONG_BULLISH' | 'MODERATE_BULLISH' | 'NEUTRAL_CHOPPY' | 'MODERATE_BEARISH' | 'STRONG_BEARISH';
  trendScore: number; // -100 to +100
  confidencePct: number; // 0 to 100
  spotPrice: number;
  vix: number;
  expected1DayMove: number; // Spot * (VIX / 100) / sqrt(252)
  r1_sigma: number;
  s1_sigma: number;
  r2_sigma: number;
  s2_sigma: number;
  pivot: number;
  netPointImpact: number;
  constituentNetPoints: number;
  totalPositivePoints: number;
  totalNegativePoints: number;
  keyPositiveDrivers: { symbol: string; weight: number; changePct: number; points: number }[];
  keyNegativeDraggers: { symbol: string; weight: number; changePct: number; points: number }[];
  confirmationSignals: ConfirmationSignal[];
  summary: string;
  // Institutional Smart Money Roadmap & Tactical Levels
  smartRoadmap?: SmartMoneyRoadmapState;
  gapAnalysis?: GapRegimeAnalysis;
  tacticalStopLoss?: number;
  tacticalSupport?: number;
  tacticalResistance?: number;
}

export type SmartLevelType =
  | 'EXPANSION_CEILING'
  | 'PULLBACK_RESISTANCE'
  | 'DECISION_PIVOT'
  | 'DIP_BUYING_SHELF'
  | 'EXPANSION_FLOOR'
  | 'GAP_ZONE'
  | 'ORB_HIGH'
  | 'ORB_LOW';

export interface SmartKeyLevel {
  id: string;
  price: number;
  priceHigh?: number;
  priceLow?: number;
  type: SmartLevelType;
  label: string;
  actionTag: string;
  description: string;
  touches: number;
  strength: number;
  confluence: string[];
  distancePts?: number;
}

export interface TacticalActionSignal {
  status: 'SAFE_TO_BUY' | 'AWAIT_CONFIRMATION' | 'DO_NOT_BUY' | 'FAKEOUT_REJECTED' | 'CASH_BUNKER' | 'NEUTRAL';
  headline: string;
  detail: string;
  badge: string;
  variant: 'emerald' | 'amber' | 'rose' | 'cyan' | 'slate';
  invalidationPrice?: number;
  triggerCondition?: string;
  rejectionDetected?: boolean;
}

export interface GapRegimeAnalysis {
  hasGap: boolean;
  gapType: 'GAP_UP' | 'GAP_DOWN' | 'FLAT_OPEN';
  gapPts: number;
  gapPct: number;
  gapZone: { top: number; bottom: number };
  gapSupportPrice: number;
  gapFillTargetPrice: number;
  regime: 'GAP_RUNAWAY' | 'GAP_FADE' | 'CORRIDOR_CONTAINMENT';
  verdict: string;
}

export interface SmartMoneyRoadmapState {
  symbol: 'NIFTY';
  spotPrice: number;
  anchorPrice: number;
  regime: string;
  regimeTag: string;
  regimeDescription: string;
  gapAnalysis: GapRegimeAnalysis;
  tacticalLevels: SmartKeyLevel[];
  actionSignal: TacticalActionSignal;
  macro1SigmaUpper: number;
  macro1SigmaLower: number;
  macro2SigmaUpper: number;
  macro2SigmaLower: number;
  dailyExpectedMovePts: number;
}

export interface CandleBar {
  timestamp: number;
  time: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  ema20?: number;
  ema50?: number;
}

export interface MultiTfChartData {
  timeframe: '5min' | '15min' | '1hr';
  candles: CandleBar[];
  vwap?: number;
  dayOpen: number;
  dayHigh: number;
  dayLow: number;
  prevClose: number;
}

export interface MultiTfPayload {
  symbol: 'NIFTY';
  spotPrice: number;
  prevClose: number;
  dayOpen: number;
  vix: number;
  smartRoadmap: SmartMoneyRoadmapState;
  charts: {
    fiveMin: MultiTfChartData;
    fifteenMin: MultiTfChartData;
    oneHour: MultiTfChartData;
  };
  timestamp: string;
}

export interface AnomalyAlert {
  id: string;
  symbol: string;
  companyName: string;
  sector: string;
  severity: 'CRITICAL' | 'WARNING' | 'NOTICE';
  type: 'VOLUME_SURGE' | 'EXTREME_DRIFT' | 'SECTOR_DIVERGENCE' | 'HEAVYWEIGHT_PIVOT';
  headline: string;
  description: string;
  changePct: number;
  pointImpact: number;
  volumeMultiplier?: number;
  timestamp: string;
  actionLinks: {
    label: string;
    url: string;
  }[];
}

export interface NiftyAnalysisState {
  spotPrice: number;
  spotNetChange: number;
  spotChangePct: number;
  spotPrevClose: number;
  spotOpen?: number;
  spotHigh?: number;
  spotLow?: number;
  timestamp: string;
  dataSource: 'KITE_LIVE' | 'EXCHANGE_LIVE' | 'AUTHENTIC_SNAPSHOT';
  vix: number;
  expected1DayMove: number;
  advancesDeclines: AdvancesDeclinesSummary;
  prediction: PredictionLevels;
  sectors: SectorAnalysis[];
  coDependency: CoDependencySummary;
  anomalies: AnomalyAlert[];
  stocks: Nifty50Stock[];
}

export interface KiteSession {
  apiKey: string;
  apiSecret?: string;
  accessToken: string;
  publicToken?: string;
  userId?: string;
  userName?: string;
  loginTimeMs: number;
  expiresAtMs: number;
}

export interface KiteConfig {
  apiKey: string;
  apiSecret?: string;
}
