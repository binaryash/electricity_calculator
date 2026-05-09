import type { ElectricityMetrics } from './calculator';

export type PaceStatus = 'ahead' | 'balanced' | 'watch' | 'recovery';

export interface ApplianceRecommendation {
  label: string;
  watts: number;
  unitsPerHour: number;
  runtimeMode: 'hours' | 'minutes';
  suggestedRuntimeHours: number;
  suggestedRuntimeLabel: string;
  soloRuntimeLabel: string;
  suggestedUnits: number;
  suggestedDailyCost: number;
  detail: string;
}

export interface ElectricityInsights {
  paceStatus: PaceStatus;
  remainingSpendableShare: number;
  idealSpentByNow: number;
  paceGap: number;
  averageSpentPerElapsedDay: number;
  averageUnitsPerElapsedDay: number;
  projectedMonthSpend: number;
  projectedMonthUnits: number;
  projectedVariance: number;
  dailySpendChangePercent: number;
  dailyUnitChangePercent: number;
  applianceRecommendations: ApplianceRecommendation[];
}

const round = (value: number, digits = 2) => Number(value.toFixed(digits));

interface ApplianceProfile {
  label: string;
  watts: number;
  typicalDailyHours: number;
  mode?: 'hours' | 'minutes';
  detail: string;
}

const APPLIANCE_PROFILES: ApplianceProfile[] = [
  {
    label: '1-ton inverter AC',
    watts: 1050,
    typicalDailyHours: 8,
    detail: 'Assumes roughly 1.05 units/hour average draw in active cooling.'
  },
  {
    label: 'Iron box',
    watts: 1000,
    typicalDailyHours: 0.4,
    mode: 'minutes',
    detail: 'Dry iron at full heat; thermostat cycling may reduce actual meter draw.'
  },
  {
    label: 'Ceiling fan',
    watts: 75,
    typicalDailyHours: 12,
    detail: 'One standard 1200 mm fan.'
  },
  {
    label: '4 LED lights',
    watts: 36,
    typicalDailyHours: 6,
    detail: 'Four 9W LED bulbs running together.'
  },
  {
    label: 'LED TV',
    watts: 120,
    typicalDailyHours: 4,
    detail: 'Typical 40 to 43 inch LED television.'
  },
  {
    label: 'Laptop',
    watts: 65,
    typicalDailyHours: 8,
    detail: '65W charger draw during active use.'
  },
  {
    label: 'Wi-Fi router',
    watts: 12,
    typicalDailyHours: 24,
    detail: 'Always-on broadband router.'
  },
  {
    label: 'Refrigerator',
    watts: 50,
    typicalDailyHours: 24,
    detail: 'Approximate 24-hour average draw after compressor cycling.'
  },
  {
    label: 'Washing machine',
    watts: 500,
    typicalDailyHours: 0.75,
    mode: 'minutes',
    detail: 'Active wash time, not standby.'
  },
  {
    label: 'Microwave oven',
    watts: 1200,
    typicalDailyHours: 0.25,
    mode: 'minutes',
    detail: 'Full-power cooking time.'
  },
  {
    label: 'Mixer grinder',
    watts: 500,
    typicalDailyHours: 0.15,
    mode: 'minutes',
    detail: 'Short burst kitchen use.'
  },
  {
    label: '25L geyser',
    watts: 2000,
    typicalDailyHours: 0.5,
    mode: 'minutes',
    detail: '2 kW storage water heater.'
  }
];

function formatRuntimeLabel(hours: number, mode: 'hours' | 'minutes' = 'hours') {
  if (!Number.isFinite(hours) || hours <= 0) {
    return mode === 'minutes' ? '0 min/day' : '0 h/day';
  }

  if (mode === 'minutes') {
    return `${Math.round(hours * 60)} min/day`;
  }

  if (hours > 24) {
    return '24h+/day';
  }

  return `${round(hours, 1)} h/day`;
}

function buildApplianceRecommendation(
  appliance: ApplianceProfile,
  dailyUnitBudget: number,
  unitRate: number
): ApplianceRecommendation {
  const unitsPerHour = appliance.watts / 1000;
  const soloRuntimeHours = unitsPerHour === 0 ? 0 : dailyUnitBudget / unitsPerHour;
  const suggestedRuntimeHours = Math.min(soloRuntimeHours, appliance.typicalDailyHours);
  const suggestedUnits = round(suggestedRuntimeHours * unitsPerHour);

  return {
    label: appliance.label,
    watts: appliance.watts,
    unitsPerHour: round(unitsPerHour, 3),
    runtimeMode: appliance.mode ?? 'hours',
    suggestedRuntimeHours: round(suggestedRuntimeHours, 4),
    suggestedRuntimeLabel: formatRuntimeLabel(suggestedRuntimeHours, appliance.mode),
    soloRuntimeLabel: formatRuntimeLabel(soloRuntimeHours, appliance.mode),
    suggestedUnits,
    suggestedDailyCost: round(suggestedUnits * unitRate),
    detail: appliance.detail
  };
}

export function calculateElectricityInsights(metrics: ElectricityMetrics): ElectricityInsights {
  const averageDays = Math.max(metrics.daysElapsed, 1);
  const averageSpentPerElapsedDay = round(metrics.spentAmount / averageDays);
  const averageUnitsPerElapsedDay = round(metrics.spentUnits / averageDays);
  const projectedMonthSpend = round(averageSpentPerElapsedDay * metrics.totalDaysInMonth);
  const projectedMonthUnits = round(averageUnitsPerElapsedDay * metrics.totalDaysInMonth);
  const projectedVariance = round(metrics.targetMonthSpend - projectedMonthSpend);
  const idealSpentByNow = round((metrics.targetMonthSpend / metrics.totalDaysInMonth) * metrics.daysElapsed);
  const paceGap = round(idealSpentByNow - metrics.spentAmount);
  const dailySpendChangePercent =
    averageSpentPerElapsedDay === 0
      ? 0
      : round(((metrics.dailyRupeeBudget - averageSpentPerElapsedDay) / averageSpentPerElapsedDay) * 100, 1);
  const dailyUnitChangePercent =
    averageUnitsPerElapsedDay === 0
      ? 0
      : round(((metrics.dailyUnitBudget - averageUnitsPerElapsedDay) / averageUnitsPerElapsedDay) * 100, 1);
  const targetThreshold = Math.max(metrics.targetMonthSpend, 1);

  let paceStatus: PaceStatus = 'balanced';

  if (projectedVariance <= -targetThreshold * 0.08) {
    paceStatus = 'recovery';
  } else if (projectedVariance < -targetThreshold * 0.02) {
    paceStatus = 'watch';
  } else if (projectedVariance >= targetThreshold * 0.08) {
    paceStatus = 'ahead';
  }

  return {
    paceStatus,
    remainingSpendableShare:
      metrics.targetMonthSpend === 0
        ? 0
        : round((metrics.spendableAmount / metrics.targetMonthSpend) * 100, 1),
    idealSpentByNow,
    paceGap,
    averageSpentPerElapsedDay,
    averageUnitsPerElapsedDay,
    projectedMonthSpend,
    projectedMonthUnits,
    projectedVariance,
    dailySpendChangePercent,
    dailyUnitChangePercent,
    applianceRecommendations: APPLIANCE_PROFILES.map((appliance) =>
      buildApplianceRecommendation(appliance, metrics.dailyUnitBudget, metrics.unitRate)
    )
  };
}
