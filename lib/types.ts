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

export interface MicrostructureSafety {
  riskLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  status: 'HEALTHY' | 'FAKEMOVE_WARNING' | 'LIQUIDITY_VACUUM' | 'ROTATION_CHOP';
  trapDetected: boolean;
  trapReason?: string;
  governorPenalty: number;
  rawTrendScore: number;
  rawConfidencePct: number;
  culpritSymbol?: string;
  culpritPctOfMove?: number;
  cr1: number;
  cr2: number;
  marketRvol: number;
  liquidityState: 'HEALTHY_DEPTH' | 'MODERATE_DEPTH' | 'THIN_AIR_POCKET';
  recommendation: string;
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
  microstructureSafety?: MicrostructureSafety;
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
  dayOpenPrice?: number;
  regime: 'GAP_RUNAWAY' | 'GAP_FADE' | 'CORRIDOR_CONTAINMENT';
  verdict: string;
}

export interface SmartMoneyRoadmapState {
  symbol: 'NIFTY' | 'BANKNIFTY';
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
  symbol: 'NIFTY' | 'BANKNIFTY';
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

export type BankNiftyStock = Nifty50Stock;

export interface BankNiftyAnalysisState extends NiftyAnalysisState {
  symbol: 'BANKNIFTY';
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

export interface CulpritStockDetail {
  symbol: string;
  name: string;
  sector: string;
  weight: number;
  price: number;
  changePct: number;
  pointImpact: number;
  pctOfDirectionalMove: number;
  pctOfNetIndexMove: number;
  relativeVolume: number;
  turnoverCr: number;
  volumeZScore?: number;
}

export interface ImpulseAttribution {
  isImpulseDetected: boolean;
  intensity: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  direction: 'BULLISH_SURGE' | 'BEARISH_PLUNGE' | 'NEUTRAL_BALANCED';
  netPoints: number;
  grossPoints: number;
  causeType: 'SINGLE_STOCK_CULPRIT' | 'BASKET_ARBITRAGE_SWEEP' | 'VACUUM_SLIPPAGE' | 'SECTOR_ROTATION_BALANCED' | 'ORDERLY_DRIFT';
  causeBadge: string;
  headline: string;
  verdict: string;
  recommendation: string;
  concentrationRatio1: number;
  concentrationRatio2: number;
  culprit?: CulpritStockDetail;
  secondaryCulprit?: CulpritStockDetail;
  topDrivers: { symbol: string; name: string; weight: number; points: number; changePct: number; rvol: number }[];
  topDraggers: { symbol: string; name: string; weight: number; points: number; changePct: number; rvol: number }[];
  marketBreadthSyncPct: number;
  aggregateRvol: number;
  liquidityState: 'HEALTHY_DEPTH' | 'MODERATE_DEPTH' | 'THIN_AIR_POCKET';
  actionLinks: { label: string; url: string }[];
  timestamp: string;
}

export interface OptionGreeksMetrics {
  spotPrice: number;
  vix: number;
  gammaFlip: number;
  callWall: number;
  putWall: number;
  netGexCr: number; // In ₹ Crores
  callGexCr: number;
  putGexCr: number;
  gexRegime: 'DEALER_LONG_GAMMA_PIN' | 'DEALER_SHORT_GAMMA_CASCADE' | 'TRANSITIONAL_BORDER';
  callOiTotal: number;
  putOiTotal: number;
  pcrRatio: number;
  atmIv: number;
  deltaVector: number; // Net option delta drift (-1.0 to +1.0)
  rolling30mCallOiChangePct: number; // dOI/dt CE (% change over rolling 30m)
  rolling30mPutOiChangePct: number; // dOI/dt PE (% change over rolling 30m)
  oiVelocityRegime: 'BULLISH_SHORT_COVERING' | 'BEARISH_LONG_UNWINDING' | 'CALL_ADDITION_RESISTANCE' | 'PUT_ADDITION_SUPPORT' | 'BALANCED_FLOW';
}

export interface Rolling30mPrediction {
  timestamp: string;
  timeIST: string;
  windowMinutes: 30;
  isContinuous: true;
  direction: 'STRONG_BULLISH' | 'MODERATE_BULLISH' | 'NEUTRAL_CHOPPY' | 'MODERATE_BEARISH' | 'STRONG_BEARISH';
  confidencePct: number; // 25 to 95
  score: number; // -100 to +100
  expected30mMovePts: number;
  targetHigh: number;
  targetLow: number;
  tacticalStopLoss: number;
  primaryDriver: string;
  verdictHeadline: string;
  actionablePlaybook: string;
  netPointImpact: number; // Net points from BaseSpot/prevClose
  drift30mPts: number; // Net points drift over rolling 30m window
  greeksMetrics: OptionGreeksMetrics;
  volumeMetrics: {
    advancingTurnoverPct: number;
    decliningTurnoverPct: number;
    volumeConviction: string;
    top5HeavyweightRvol: number;
    anomalyDetected: boolean;
    anomalyType?: string;
    anomalySymbol?: string;
  };
  reconciliationState: 'CONFLUENT_TREND' | 'VOLATILITY_EXPANSION' | 'FORTRESS_PIN' | 'FAKEOUT_EXHAUSTION' | 'AIR_POCKET_SLIPPAGE';
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
  impulseAttribution?: ImpulseAttribution;
  rolling30mPrediction?: Rolling30mPrediction;
  greeks?: OptionGreeksMetrics;
  gapPrediction?: GapPredictionResult;
  masterSynthesis?: ExecutiveMasterSynthesis;
}

export type { GapPredictionResult, GapProbabilityInputs } from './engine/gapProbabilityEngine';
import type { GapPredictionResult } from './engine/gapProbabilityEngine';

export interface RetailLiquidityPool {
  longStopZone: { high: number; low: number; label: string };
  shortStopZone: { high: number; low: number; label: string };
  trapState: 'NO_TRAP' | 'LONG_STOP_HUNT_SWEEP' | 'SHORT_SQUEEZE_SWEEP' | 'CASCADE_CONFIRMED';
  explanation: string;
}

export interface ExecutiveMasterSynthesis {
  headlineState: {
    status: 'BULLISH_TREND' | 'BEARISH_CASCADE' | 'FAKE_BREAKDOWN_TRAP' | 'FAKE_BREAKOUT_TRAP' | 'RANGE_TUG_OF_WAR' | 'ORDERLY_CONSOLIDATION';
    badge: string;
    badgeColor: 'emerald' | 'rose' | 'amber' | 'cyan';
  };
  plainSummary: {
    whatsHappening: string;
    broaderMarket: string;
    bigPlayerPosition: string;
  };
  keyLevels: {
    hardFloor: { price: number; label: string; reason: string };
    stopHuntZone: { range: string; reason: string };
    hardCeiling: { price: number; label: string; reason: string };
  };
  playbook: {
    actionBias: 'AVOID_PUTS' | 'AVOID_CALLS' | 'WAIT_FOR_BOUNCE' | 'TREND_FOLLOW' | 'STAND_ASIDE';
    doNotDo: string;
    opportunity: string;
    strictInvalidation: string;
  };
  liquidityPool: RetailLiquidityPool;
  gapDynamics?: GapPredictionResult;
  techSpecs?: {
    gammaFlip: number;
    putWall: number;
    callWall: number;
    culpritSymbol?: string;
    culpritContributionPct?: number;
    dealerRegime: string;
    advancingTurnoverPct: number;
    decliningTurnoverPct: number;
    oiVelocityRegime: string;
  };
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
