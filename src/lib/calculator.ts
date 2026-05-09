export interface ElectricityInput {
  totalAmount: number;
  remainingAmount: number;
  unitRate: number;
  bufferAmount?: number | null;
  referenceDate?: Date;
}

export type BufferSource = 'auto' | 'user';

export interface ElectricityMetrics {
  unitRate: number;
  totalUnits: number;
  remainingUnits: number;
  bufferAmount: number;
  bufferUnits: number;
  spendableAmount: number;
  spendableUnits: number;
  spentAmount: number;
  spentUnits: number;
  targetMonthSpend: number;
  totalDaysInMonth: number;
  daysElapsed: number;
  daysLeft: number;
  dailyRupeeBudget: number;
  dailyUnitBudget: number;
  usageProgress: number;
  bufferSource: BufferSource;
}

export interface ElectricityPlan {
  errors: string[];
  metrics: ElectricityMetrics | null;
}

const round = (value: number, digits = 2) => Number(value.toFixed(digits));

function getMonthDayContext(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const daysLeft = Math.max(totalDaysInMonth - referenceDate.getDate() + 1, 1);

  return {
    totalDaysInMonth,
    daysElapsed: Math.max(totalDaysInMonth - daysLeft, 0),
    daysLeft
  };
}

export function getDaysLeftInMonth(referenceDate = new Date()): number {
  return getMonthDayContext(referenceDate).daysLeft;
}

export function calculateSuggestedBuffer(remainingAmount: number) {
  if (!Number.isFinite(remainingAmount) || remainingAmount <= 0) {
    return 0;
  }

  return round(remainingAmount * 0.1);
}

function validateInput({
  totalAmount,
  remainingAmount,
  unitRate,
  bufferAmount
}: ElectricityInput): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    errors.push('Total amount must be greater than 0.');
  }

  if (!Number.isFinite(remainingAmount) || remainingAmount < 0) {
    errors.push('Remaining amount must be 0 or more.');
  }

  if (!Number.isFinite(unitRate) || unitRate <= 0) {
    errors.push('Per-unit charge must be greater than 0.');
  }

  if (Number.isFinite(totalAmount) && Number.isFinite(remainingAmount) && remainingAmount > totalAmount) {
    errors.push('Remaining amount cannot be greater than total amount.');
  }

  if (bufferAmount !== null && bufferAmount !== undefined) {
    if (!Number.isFinite(bufferAmount) || bufferAmount < 0) {
      errors.push('Buffer amount must be 0 or more.');
    }

    if (
      Number.isFinite(remainingAmount) &&
      Number.isFinite(bufferAmount) &&
      bufferAmount > remainingAmount
    ) {
      errors.push('Buffer amount cannot be greater than the remaining amount.');
    }
  }

  return errors;
}

export function calculateElectricityPlan(input: ElectricityInput): ElectricityPlan {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      errors,
      metrics: null
    };
  }

  const { totalDaysInMonth, daysElapsed, daysLeft } = getMonthDayContext(input.referenceDate);
  const bufferSource: BufferSource =
    input.bufferAmount === null || input.bufferAmount === undefined ? 'auto' : 'user';
  const resolvedBufferAmount =
    bufferSource === 'user' ? input.bufferAmount ?? 0 : calculateSuggestedBuffer(input.remainingAmount);
  const spentAmount = input.totalAmount - input.remainingAmount;
  const totalUnits = input.totalAmount / input.unitRate;
  const remainingUnits = input.remainingAmount / input.unitRate;
  const bufferUnits = resolvedBufferAmount / input.unitRate;
  const spendableAmount = Math.max(input.remainingAmount - resolvedBufferAmount, 0);
  const spendableUnits = spendableAmount / input.unitRate;
  const spentUnits = totalUnits - remainingUnits;
  const usageProgress = input.totalAmount === 0 ? 0 : spentAmount / input.totalAmount;
  const targetMonthSpend = input.totalAmount - resolvedBufferAmount;

  return {
    errors: [],
    metrics: {
      unitRate: round(input.unitRate),
      totalUnits: round(totalUnits),
      remainingUnits: round(remainingUnits),
      bufferAmount: round(resolvedBufferAmount),
      bufferUnits: round(bufferUnits),
      spendableAmount: round(spendableAmount),
      spendableUnits: round(spendableUnits),
      spentAmount: round(spentAmount),
      spentUnits: round(spentUnits),
      targetMonthSpend: round(targetMonthSpend),
      totalDaysInMonth,
      daysElapsed,
      daysLeft,
      dailyRupeeBudget: round(spendableAmount / daysLeft),
      dailyUnitBudget: round(spendableUnits / daysLeft),
      usageProgress: round(Math.min(Math.max(usageProgress, 0), 1) * 100, 1),
      bufferSource
    }
  };
}
