import { SectorAnalysis, SectorCoDependency, CoDependencySummary, SectorSpillover } from '../types';

/**
 * Historical Cross-Segment Elasticity Matrix for Bank Nifty (Private vs PSU Banks)
 * Derived from rolling intraday covariance between Private Sector Banks and PSU Banks on NSE.
 */
interface BankElasticityRule {
  targetSector: string;
  elasticity: number;
  relationship: 'POSITIVE_CO_MOVE' | 'CAPITAL_ROTATION_DEFENSE' | 'DECOUPLED';
}

const BANK_ELASTICITIES: Record<string, { beta: number; spillovers: BankElasticityRule[] }> = {
  'Private Bank': {
    beta: 1.12,
    spillovers: [
      { targetSector: 'PSU Bank', elasticity: 0.65, relationship: 'POSITIVE_CO_MOVE' }
    ]
  },
  'PSU Bank': {
    beta: 1.28,
    spillovers: [
      { targetSector: 'Private Bank', elasticity: 0.52, relationship: 'POSITIVE_CO_MOVE' }
    ]
  }
};

/**
 * Calculates Bank Nifty segment co-dependency, dispersion, and capital rotation projections
 */
export function buildBankSectorCoDependencyAnalysis(
  sectors: SectorAnalysis[],
  spotPrice = 55900,
  baseSpotParam?: number
): CoDependencySummary {
  const baseSpot = (baseSpotParam && baseSpotParam > 0) ? baseSpotParam : spotPrice;
  const returns = sectors.map(s => s.weightedReturn);
  const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;

  // Dispersion score normalized from 0 (synchronized) to 100 (extreme rotation/divergence)
  const pvtSector = sectors.find(s => s.name === 'Private Bank');
  const psuSector = sectors.find(s => s.name === 'PSU Bank');
  const pvtReturn = pvtSector?.weightedReturn || 0;
  const psuReturn = psuSector?.weightedReturn || 0;

  const returnDiff = Math.abs(pvtReturn - psuReturn);
  const dispersionScore = Math.min(100, Math.round((returnDiff / 2.5) * 100));

  let marketRegime: CoDependencySummary['marketRegime'] = 'FRAGMENTED_CHOP';
  let rotationIntensity: CoDependencySummary['rotationIntensity'] = 'LOW';

  const isBothPositive = pvtReturn >= 0.15 && psuReturn >= 0.15;
  const isBothNegative = pvtReturn <= -0.15 && psuReturn <= -0.15;
  const isRotating = pvtReturn * psuReturn < -0.05;

  if (isRotating) {
    marketRegime = 'INTERNAL_SECTOR_ROTATION';
    rotationIntensity = dispersionScore > 65 ? 'HIGH' : 'MODERATE';
  } else if (isBothPositive) {
    marketRegime = 'UNIFORM_BETA_EXPANSION';
    rotationIntensity = 'LOW';
  } else if (isBothNegative) {
    marketRegime = 'UNIFORM_BETA_CONTRACTION';
    rotationIntensity = 'LOW';
  } else {
    marketRegime = 'FRAGMENTED_CHOP';
    rotationIntensity = dispersionScore > 40 ? 'MODERATE' : 'LOW';
  }

  // Build sector-by-sector co-dependency models
  const sectorCoDeps: SectorCoDependency[] = sectors.map(sec => {
    const rule = BANK_ELASTICITIES[sec.name] || { beta: 1.0, spillovers: [] };

    const spillovers: SectorSpillover[] = rule.spillovers.map(sp => {
      const targetSec = sectors.find(s => s.name === sp.targetSector);
      const targetWeight = targetSec ? targetSec.weight : 25.0;
      const expectedImpactPct = Number((sec.weightedReturn * sp.elasticity).toFixed(2));
      const expectedPoints = Number((baseSpot * (targetWeight / 100) * (expectedImpactPct / 100)).toFixed(2));

      return {
        targetSector: sp.targetSector,
        elasticity: sp.elasticity,
        expectedImpactPct,
        expectedPoints,
        relationship: isRotating ? 'CAPITAL_ROTATION_DEFENSE' : sp.relationship
      };
    });

    let regime: SectorCoDependency['regime'] = 'NEUTRAL_DRIFT';
    if (sec.weight >= 40 && Math.abs(sec.weightedReturn) >= 0.5) {
      regime = 'BETA_LEAD';
    } else if (marketRegime === 'INTERNAL_SECTOR_ROTATION' && sec.weightedReturn * meanReturn < 0) {
      regime = sec.weightedReturn > 0 ? 'ROTATION_SINK' : 'DIVERGENT_DRAG';
    }

    return {
      name: sec.name,
      weight: sec.weight,
      weightedReturn: sec.weightedReturn,
      pointImpact: sec.pointImpact,
      betaWithNifty: rule.beta,
      spillovers,
      regime
    };
  });

  const sortedByAbsPoints = [...sectors].sort((a, b) => Math.abs(b.pointImpact) - Math.abs(a.pointImpact));
  const leadSector = sortedByAbsPoints[0]?.name || 'Private Bank';
  const sortedByReturn = [...sectors].sort((a, b) => a.weightedReturn - b.weightedReturn);
  const lagSector = sortedByReturn[0]?.name || 'PSU Bank';

  let dominantInterSectorChain = '';
  let impliedIndexDriftPoints = 0;

  if (isRotating) {
    const winningSec = pvtReturn > psuReturn ? 'Private Banks' : 'PSU Banks';
    const winningRet = pvtReturn > psuReturn ? pvtReturn : psuReturn;
    const losingSec = pvtReturn > psuReturn ? 'PSU Banks' : 'Private Banks';
    const losingRet = pvtReturn > psuReturn ? psuReturn : pvtReturn;
    dominantInterSectorChain = `Active intra-banking capital rotation: ${winningSec} outperforming (+${winningRet}%) while ${losingSec} drag (${losingRet}%). Net directional velocity capped by dispersion.`;
    impliedIndexDriftPoints = Number(((pvtSector?.pointImpact || 0) + (psuSector?.pointImpact || 0)).toFixed(1));
  } else if (isBothPositive) {
    dominantInterSectorChain = `Synchronous Banking Tide: Private Banks (+${pvtReturn}%) and PSU Banks (+${psuReturn}%) both advancing in institutional lockstep (+${((pvtSector?.pointImpact || 0) + (psuSector?.pointImpact || 0)).toFixed(1)} Bank Nifty pts).`;
    impliedIndexDriftPoints = Number(((pvtSector?.pointImpact || 0) + (psuSector?.pointImpact || 0)).toFixed(1));
  } else if (isBothNegative) {
    dominantInterSectorChain = `Broad Banking Contraction: Institutional liquidation across both Private Banks (${pvtReturn}%) and PSU Banks (${psuReturn}%). Combined drag: ${((pvtSector?.pointImpact || 0) + (psuSector?.pointImpact || 0)).toFixed(1)} pts.`;
    impliedIndexDriftPoints = Number(((pvtSector?.pointImpact || 0) + (psuSector?.pointImpact || 0)).toFixed(1));
  } else {
    dominantInterSectorChain = `Banking sector operating in balanced equilibrium (Dispersion: ${dispersionScore}/100). No unilateral rotational spillover detected.`;
    impliedIndexDriftPoints = 0;
  }

  return {
    marketRegime,
    dispersionScore,
    leadSector,
    lagSector,
    dominantInterSectorChain,
    impliedIndexDriftPoints,
    rotationIntensity,
    sectors: sectorCoDeps
  };
}
