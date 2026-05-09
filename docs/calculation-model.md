# Calculation Model

This document describes the math used by the Electricity Use Planner.

## Inputs

The planner accepts:

- `totalAmount`
  Full electricity budget for the month.
- `remainingAmount`
  Remaining money still available for electricity.
- `unitRate`
  Cost per electricity unit.
- `bufferAmount`
  Optional money to keep untouched by month-end.

## Calendar Context

The planner calculates the month context from the user's device date.

Derived values:

- `totalDaysInMonth`
- `daysLeft`
- `daysElapsed`

The app includes the current day in `daysLeft`.

## Reserve / Buffer Logic

If the user provides `bufferAmount`, that value is used directly.

If the buffer is blank, the app uses an automatic reserve:

```text
suggestedBuffer = remainingAmount * 0.10
```

Derived reserve values:

- `bufferAmount`
- `bufferUnits = bufferAmount / unitRate`

## Spendable Amount

The app distinguishes between money that is still on the bill and money that is still safe to use.

```text
spendableAmount = remainingAmount - bufferAmount
spendableUnits = spendableAmount / unitRate
```

These values drive the real daily cap.

## Daily Safe Limit

Safe daily limits are derived from the spendable amount, not from the full remaining amount.

```text
dailyRupeeBudget = spendableAmount / daysLeft
dailyUnitBudget = spendableUnits / daysLeft
```

These are the two numbers the rest of the planning flow depends on.

## Month Pacing Metrics

The planner also derives:

- `spentAmount`
- `spentUnits`
- `usageProgress`
- `averageSpentPerElapsedDay`
- `averageUnitsPerElapsedDay`
- `projectedMonthSpend`
- `projectedMonthUnits`
- `projectedVariance`
- `paceGap`
- `dailySpendChangePercent`
- `dailyUnitChangePercent`

These metrics are bill-based and independent of appliance selection.

## Appliance Recommendation Baseline

Each appliance profile has:

- wattage
- a default practical runtime assumption
- runtime display mode (`hours` or `minutes`)

From that baseline the app derives:

- `unitsPerHour`
- default `suggestedRuntimeHours`
- default `suggestedUnits`
- default `suggestedDailyCost`

## Selected-Appliance Planning

Only checked appliances participate in selected-set analytics.

For each selected appliance, the user can request a runtime.

Current requested runtime slider range:

- minimum: `10 min/day`
- maximum: `24 h/day`

The app converts each requested runtime into requested units:

```text
requestedUnits = unitsPerHour * requestedRuntimeHours
```

Then it totals the selected set:

```text
selectedRequestedUnits = sum(requestedUnits for checked appliances)
```

## Rebalancing Against The Daily Cap

If the selected set is already under the safe daily cap:

```text
scaleFactor = 1
```

If the selected set exceeds the safe daily cap:

```text
scaleFactor = dailyUnitBudget / selectedRequestedUnits
```

The app then applies that scale factor to every selected appliance:

```text
safeRuntimeHours = requestedRuntimeHours * scaleFactor
safeUnits = requestedUnits * scaleFactor
safeDailyCost = safeUnits * unitRate
```

This makes the checked rows represent a safe daily plan for the selected set instead of unrelated standalone appliance caps.

## Interpretation Rules

- Bill pacing is bill-based.
- Appliance planning is selected-set-based.
- Unchecked appliances do not affect selected-set totals.
- Checked appliances may show lower runtimes than requested if the selected set exceeds the safe daily cap.
