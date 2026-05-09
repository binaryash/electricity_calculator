import { describe, expect, it } from 'vitest';
import { calculateElectricityPlan, calculateSuggestedBuffer, getDaysLeftInMonth } from './calculator';

describe('getDaysLeftInMonth', () => {
  it('counts the current day when computing the remaining days', () => {
    expect(getDaysLeftInMonth(new Date(2026, 3, 18))).toBe(13);
  });
});

describe('calculateElectricityPlan', () => {
  it('applies the automatic reserve when no buffer is provided', () => {
    const result = calculateElectricityPlan({
      totalAmount: 3000,
      remainingAmount: 1800,
      unitRate: 9,
      referenceDate: new Date(2026, 3, 18)
    });

    expect(result.errors).toEqual([]);
    expect(result.metrics).toEqual({
      unitRate: 9,
      totalUnits: 333.33,
      remainingUnits: 200,
      bufferAmount: 180,
      bufferUnits: 20,
      spendableAmount: 1620,
      spendableUnits: 180,
      spentAmount: 1200,
      spentUnits: 133.33,
      targetMonthSpend: 2820,
      totalDaysInMonth: 30,
      daysElapsed: 17,
      daysLeft: 13,
      dailyRupeeBudget: 124.62,
      dailyUnitBudget: 13.85,
      usageProgress: 40,
      bufferSource: 'auto'
    });
  });

  it('accepts a custom buffer when the user provides one', () => {
    const result = calculateElectricityPlan({
      totalAmount: 3000,
      remainingAmount: 1800,
      unitRate: 9,
      bufferAmount: 300,
      referenceDate: new Date(2026, 3, 18)
    });

    expect(result.errors).toEqual([]);
    expect(result.metrics?.unitRate).toBe(9);
    expect(result.metrics?.bufferAmount).toBe(300);
    expect(result.metrics?.spendableAmount).toBe(1500);
    expect(result.metrics?.dailyRupeeBudget).toBe(115.38);
    expect(result.metrics?.bufferSource).toBe('user');
  });

  it('rejects impossible budgets', () => {
    const result = calculateElectricityPlan({
      totalAmount: 1000,
      remainingAmount: 1200,
      unitRate: 8
    });

    expect(result.metrics).toBeNull();
    expect(result.errors).toContain('Remaining amount cannot be greater than total amount.');
  });
});

describe('calculateSuggestedBuffer', () => {
  it('defaults to 10% of the remaining amount', () => {
    expect(calculateSuggestedBuffer(1800)).toBe(180);
  });
});
