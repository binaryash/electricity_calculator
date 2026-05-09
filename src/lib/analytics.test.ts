import { describe, expect, it } from 'vitest';
import { calculateElectricityInsights } from './analytics';
import { calculateElectricityPlan } from './calculator';

describe('calculateElectricityInsights', () => {
  it('derives practical pace analytics from the current plan', () => {
    const plan = calculateElectricityPlan({
      totalAmount: 3000,
      remainingAmount: 1800,
      unitRate: 9,
      referenceDate: new Date(2026, 3, 18)
    });

    const insights = calculateElectricityInsights(plan.metrics!);

    expect(insights.paceStatus).toBe('ahead');
    expect(insights.remainingSpendableShare).toBe(57.4);
    expect(insights.idealSpentByNow).toBe(1598);
    expect(insights.paceGap).toBe(398);
    expect(insights.averageSpentPerElapsedDay).toBe(70.59);
    expect(insights.projectedMonthSpend).toBe(2117.7);
    expect(insights.projectedVariance).toBe(702.3);
    expect(insights.dailySpendChangePercent).toBe(76.5);
    expect(insights.applianceRecommendations[0]).toEqual({
      label: '1-ton inverter AC',
      watts: 1050,
      unitsPerHour: 1.05,
      runtimeMode: 'hours',
      suggestedRuntimeHours: 8,
      suggestedRuntimeLabel: '8 h/day',
      soloRuntimeLabel: '13.2 h/day',
      suggestedUnits: 8.4,
      suggestedDailyCost: 75.6,
      detail: 'Assumes roughly 1.05 units/hour average draw in active cooling.'
    });
  });

  it('flags overspending trajectories that need recovery', () => {
    const plan = calculateElectricityPlan({
      totalAmount: 1200,
      remainingAmount: 180,
      unitRate: 10,
      referenceDate: new Date(2026, 3, 18)
    });

    const insights = calculateElectricityInsights(plan.metrics!);

    expect(insights.paceStatus).toBe('recovery');
    expect(insights.projectedVariance).toBeLessThan(0);
    expect(insights.dailySpendChangePercent).toBeLessThan(0);
  });
});
