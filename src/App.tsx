import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { calculateElectricityInsights, type ApplianceRecommendation } from './lib/analytics';
import {
  calculateElectricityPlan,
  calculateSuggestedBuffer,
  getDaysLeftInMonth
} from './lib/calculator';
import {
  buildHistoryEntry,
  buildHistorySignature,
  readDraftValues,
  readHistoryEntries,
  trimHistory,
  writeDraftValues,
  writeHistoryEntries,
  type HistoryEntry
} from './lib/storage';

interface InputFieldProps {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface SectionIntroProps {
  step: string;
  eyebrow: string;
  title: string;
  description: string;
}

interface HighlightStatProps {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'accent' | 'subtle';
}

interface InfoRowProps {
  label: string;
  value: string;
  detail: string;
}

interface ApplianceItemConfig {
  label: string;
  code: string;
  defaultSelected?: boolean;
}

interface ApplianceGroupConfig {
  title: string;
  description: string;
  items: ApplianceItemConfig[];
}

interface ApplianceGroupProps {
  title: string;
  description: string;
  items: Array<
    ApplianceRecommendation & {
      code: string;
      displayRuntimeLabel: string;
      displayRuntimeHours: number;
      displayUnits: number;
      displayDailyCost: number;
      requestedRuntimeHours: number;
      requestedRuntimeLabel: string;
    }
  >;
  selectedLabels: string[];
  onToggle: (label: string) => void;
  onRuntimeChange: (label: string, nextHours: number) => void;
}

const APPLIANCE_GROUPS: ApplianceGroupConfig[] = [
  {
    title: 'Base load',
    description: 'Always-on and daily essentials that should fit even on tighter days.',
    items: [
      { label: 'Refrigerator', code: 'RF' },
      { label: 'Wi-Fi router', code: 'WF' },
      { label: '4 LED lights', code: 'LT', defaultSelected: true }
    ]
  },
  {
    title: 'Comfort load',
    description: 'Cooling and entertainment loads that need pacing across the week.',
    items: [
      { label: '1-ton inverter AC', code: 'AC', defaultSelected: true },
      { label: 'Ceiling fan', code: 'FN', defaultSelected: true },
      { label: 'LED TV', code: 'TV', defaultSelected: true },
      { label: 'Laptop', code: 'LP', defaultSelected: true }
    ]
  },
  {
    title: 'Burst load',
    description: 'Short high-draw tasks that should not pile up on the same day.',
    items: [
      { label: 'Iron box', code: 'IR', defaultSelected: true },
      { label: '25L geyser', code: 'GY', defaultSelected: true },
      { label: 'Washing machine', code: 'WM' },
      { label: 'Microwave oven', code: 'MW' }
    ]
  }
];

function InputField({ id, label, hint, value, onChange, placeholder }: InputFieldProps) {
  return (
    <label
      className="input-field"
      htmlFor={id}
    >
      <span className="input-field__label">{label}</span>
      <input
        id={id}
        className="input-field__input"
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="input-field__hint">{hint}</span>
    </label>
  );
}

function SectionIntro({ step, eyebrow, title, description }: SectionIntroProps) {
  return (
    <div className="section-intro">
      <div className="section-intro__step">{step}</div>
      <div className="section-intro__copy">
        <span className="section-intro__eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function HighlightStat({ label, value, detail, tone = 'default' }: HighlightStatProps) {
  return (
    <div className={`highlight-stat highlight-stat--${tone}`}>
      <span className="highlight-stat__label">{label}</span>
      <strong className="highlight-stat__value">{value}</strong>
      <span className="highlight-stat__detail">{detail}</span>
    </div>
  );
}

function InfoRow({ label, value, detail }: InfoRowProps) {
  return (
    <div className="info-row">
      <div className="info-row__copy">
        <span className="info-row__label">{label}</span>
        <p className="info-row__detail">{detail}</p>
      </div>
      <strong className="info-row__value">{value}</strong>
    </div>
  );
}

function ApplianceGroup({
  title,
  description,
  items,
  selectedLabels,
  onToggle,
  onRuntimeChange
}: ApplianceGroupProps) {
  return (
    <section className="appliance-section">
      <div className="appliance-section__header">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="appliance-list">
        {items.map((item) => (
          <div
            key={item.label}
            className={`appliance-row${selectedLabels.includes(item.label) ? ' appliance-row--selected' : ''}`}
          >
            <div className="appliance-row__main">
              <label className="appliance-row__toggle">
                <input
                  type="checkbox"
                  checked={selectedLabels.includes(item.label)}
                  onChange={() => onToggle(item.label)}
                />
                <span
                  className="appliance-row__checkbox"
                  aria-hidden="true"
                />
              </label>
              <span className="appliance-row__icon">{item.code}</span>
              <div className="appliance-row__copy">
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
                {selectedLabels.includes(item.label) ? (
                  <div className="appliance-row__bias">
                    <div className="appliance-row__bias-head">
                      <span>Requested runtime</span>
                      <strong>{item.requestedRuntimeLabel}</strong>
                    </div>
                    <input
                      className="appliance-row__slider"
                      type="range"
                      min={(10 / 60).toString()}
                      max="24"
                      step={(10 / 60).toString()}
                      value={item.requestedRuntimeHours}
                      onChange={(event) => onRuntimeChange(item.label, Number(event.target.value))}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="appliance-row__stats">
              <span>{item.displayRuntimeLabel}</span>
              <span>{item.watts}W</span>
              <span>{decimalFormatter.format(item.displayUnits)} u/day</span>
              <span>{currencyFormatter.format(item.displayDailyCost)}/day</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function parseAmount(value: string): number | null {
  if (value.trim() === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function formatSignedCurrency(value: number, formatter: Intl.NumberFormat) {
  return `${value >= 0 ? '+' : '-'}${formatter.format(Math.abs(value))}`;
}

function formatSignedPercent(value: number, formatter: Intl.NumberFormat) {
  return `${value >= 0 ? '+' : ''}${formatter.format(value)}%`;
}

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

  return `${Number(hours.toFixed(1))} h/day`;
}

function clampRequestedRuntimeHours(value: number) {
  const minHours = 10 / 60;

  return Math.min(24, Math.max(minHours, Number(value.toFixed(4))));
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
});

const decimalFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2
});

const compactDecimalFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 1
});

const monthFormatter = new Intl.DateTimeFormat('en-IN', {
  month: 'long',
  year: 'numeric'
});

const DEFAULT_SELECTED_APPLIANCE_LABELS = APPLIANCE_GROUPS.flatMap((group) =>
  group.items.filter((item) => item.defaultSelected).map((item) => item.label)
);

function buildApplianceGroups(recommendations: ApplianceRecommendation[]) {
  const lookup = new Map(recommendations.map((item) => [item.label, item]));

  return APPLIANCE_GROUPS.map((group) => ({
    title: group.title,
    description: group.description,
    items: group.items
      .map((item) => {
        const recommendation = lookup.get(item.label);

        return recommendation ? { ...recommendation, code: item.code } : null;
      })
      .filter((item): item is ApplianceRecommendation & { code: string } => item !== null)
  }));
}

export default function App() {
  const [draftValues] = useState(() => readDraftValues());
  const [totalAmount, setTotalAmount] = useState(() => draftValues.totalAmount);
  const [remainingAmount, setRemainingAmount] = useState(() => draftValues.remainingAmount);
  const [unitRate, setUnitRate] = useState(() => draftValues.unitRate);
  const [bufferAmount, setBufferAmount] = useState(() => draftValues.bufferAmount);
  const [selectedApplianceLabels, setSelectedApplianceLabels] = useState(() =>
    draftValues.selectedApplianceLabels.length > 0
      ? draftValues.selectedApplianceLabels
      : DEFAULT_SELECTED_APPLIANCE_LABELS
  );
  const [applianceRequestedHoursByLabel, setApplianceRequestedHoursByLabel] = useState(
    () => draftValues.applianceRequestedHoursByLabel
  );
  const [history, setHistory] = useState<HistoryEntry[]>(() => readHistoryEntries());

  const referenceDate = new Date();
  const currentMonthLabel = monthFormatter.format(referenceDate);
  const defaultDaysLeft = getDaysLeftInMonth(referenceDate);

  const parsedTotalAmount = parseAmount(totalAmount);
  const parsedRemainingAmount = parseAmount(remainingAmount);
  const parsedUnitRate = parseAmount(unitRate);
  const parsedBufferAmount = parseAmount(bufferAmount);

  const hasCoreInputs =
    parsedTotalAmount !== null &&
    parsedRemainingAmount !== null &&
    parsedUnitRate !== null;

  const plan = hasCoreInputs
    ? calculateElectricityPlan({
        totalAmount: parsedTotalAmount,
        remainingAmount: parsedRemainingAmount,
        unitRate: parsedUnitRate,
        bufferAmount: parsedBufferAmount,
        referenceDate
      })
    : null;

  const metrics = plan?.metrics ?? null;
  const insights =
    hasCoreInputs && metrics
      ? calculateElectricityInsights(metrics)
      : null;

  const hasValidPlan = metrics !== null && insights !== null && !plan?.errors.length;

  const autoBufferSuggestion =
    parsedRemainingAmount !== null ? calculateSuggestedBuffer(parsedRemainingAmount) : null;
  const autoBufferUnits =
    autoBufferSuggestion !== null && parsedUnitRate !== null && parsedUnitRate > 0
      ? autoBufferSuggestion / parsedUnitRate
      : null;
  const bufferHint =
    parsedBufferAmount !== null
      ? 'Custom reserve kept untouched by month-end.'
      : autoBufferSuggestion !== null
        ? `Leave blank to auto-hold ${currencyFormatter.format(autoBufferSuggestion)}${
            autoBufferUnits !== null
              ? ` (${decimalFormatter.format(autoBufferUnits)} units)`
              : ''
          }.`
        : 'Leave blank to auto-hold 10% of the remaining balance.';

  const currentSignature =
    hasCoreInputs &&
    parsedTotalAmount !== null &&
    parsedRemainingAmount !== null &&
    parsedUnitRate !== null &&
    metrics !== null
      ? buildHistorySignature(
          currentMonthLabel,
          parsedTotalAmount,
          parsedRemainingAmount,
          parsedUnitRate,
          metrics.bufferAmount
        )
      : null;

  const comparisonEntry =
    currentSignature !== null
      ? history.find((entry) => entry.signature !== currentSignature) ?? null
      : history[0] ?? null;

  const applianceGroups = useMemo(
    () => (insights ? buildApplianceGroups(insights.applianceRecommendations) : []),
    [insights]
  );
  const selectedRequestedUnits = useMemo(
    () =>
      applianceGroups
        .flatMap((group) => group.items)
        .filter((item) => selectedApplianceLabels.includes(item.label))
        .reduce(
          (sum, item) =>
            sum +
            item.unitsPerHour *
              (applianceRequestedHoursByLabel[item.label] ?? item.suggestedRuntimeHours),
          0
        ),
    [applianceGroups, applianceRequestedHoursByLabel, selectedApplianceLabels]
  );
  const selectedScaleFactor =
    hasValidPlan && metrics !== null && selectedRequestedUnits > 0
      ? Math.min(metrics.dailyUnitBudget / selectedRequestedUnits, 1)
      : 1;
  const scaledApplianceGroups = useMemo(
    () =>
      applianceGroups.map((group) => ({
        ...group,
        items: group.items.map((item) => {
          const isSelected = selectedApplianceLabels.includes(item.label);
          const requestedRuntimeHours = isSelected
            ? clampRequestedRuntimeHours(
                applianceRequestedHoursByLabel[item.label] ?? item.suggestedRuntimeHours
              )
            : item.suggestedRuntimeHours;
          const displayRuntimeHours = isSelected
            ? requestedRuntimeHours * selectedScaleFactor
            : item.suggestedRuntimeHours;
          const displayUnits = Number((displayRuntimeHours * item.unitsPerHour).toFixed(2));

          return {
            ...item,
            requestedRuntimeHours,
            requestedRuntimeLabel: formatRuntimeLabel(requestedRuntimeHours, item.runtimeMode),
            displayRuntimeLabel: formatRuntimeLabel(displayRuntimeHours, item.runtimeMode),
            displayRuntimeHours: Number(displayRuntimeHours.toFixed(4)),
            displayUnits,
            displayDailyCost: Number((displayUnits * (metrics?.unitRate ?? 0)).toFixed(2))
          };
        })
      })),
    [applianceGroups, applianceRequestedHoursByLabel, metrics?.unitRate, selectedApplianceLabels, selectedScaleFactor]
  );
  const selectedApplianceItems = useMemo(
    () =>
      scaledApplianceGroups.flatMap((group) =>
        group.items.filter((item) => selectedApplianceLabels.includes(item.label))
      ),
    [scaledApplianceGroups, selectedApplianceLabels]
  );
  const selectedSuggestedUnits = useMemo(
    () => Number(selectedApplianceItems.reduce((sum, item) => sum + item.displayUnits, 0).toFixed(2)),
    [selectedApplianceItems]
  );
  const selectedSuggestedCost = useMemo(
    () => Number(selectedApplianceItems.reduce((sum, item) => sum + item.displayDailyCost, 0).toFixed(2)),
    [selectedApplianceItems]
  );

  useEffect(() => {
    writeDraftValues({
      totalAmount,
      remainingAmount,
      unitRate,
      bufferAmount,
      selectedApplianceLabels,
      applianceRequestedHoursByLabel
    });
  }, [applianceRequestedHoursByLabel, bufferAmount, remainingAmount, selectedApplianceLabels, totalAmount, unitRate]);

  useEffect(() => {
    writeHistoryEntries(history);
  }, [history]);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      currentSignature === null ||
      parsedTotalAmount === null ||
      parsedRemainingAmount === null ||
      parsedUnitRate === null ||
      metrics === null ||
      insights === null ||
      plan?.errors.length
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHistory((currentHistory) => {
        if (currentHistory[0]?.signature === currentSignature) {
          return currentHistory;
        }

        return trimHistory([
          buildHistoryEntry({
            signature: currentSignature,
            monthLabel: currentMonthLabel,
            totalAmount: parsedTotalAmount,
            remainingAmount: parsedRemainingAmount,
            unitRate: parsedUnitRate,
            bufferAmount: metrics.bufferSource === 'user' ? parsedBufferAmount ?? 0 : null,
            bufferSource: metrics.bufferSource,
            daysLeft: metrics.daysLeft,
            dailyRupeeBudget: metrics.dailyRupeeBudget,
            dailyUnitBudget: metrics.dailyUnitBudget,
            usageProgress: metrics.usageProgress,
            paceStatus: insights.paceStatus
          }),
          ...currentHistory.filter((entry) => entry.signature !== currentSignature)
        ]);
      });
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    currentMonthLabel,
    currentSignature,
    insights,
    metrics,
    parsedBufferAmount,
    parsedRemainingAmount,
    parsedTotalAmount,
    parsedUnitRate,
    plan?.errors.length
  ]);

  const pacePresentation = !hasValidPlan || insights === null || metrics === null
    ? {
        tone: 'neutral',
        badge: 'Plan setup',
        headline: 'Enter the bill numbers to unlock the pacing check.',
        detail: 'The page will calculate a clean daily limit and then show whether the month is drifting.'
      }
    : insights.paceStatus === 'ahead'
      ? {
          tone: 'positive',
          badge: 'Under control',
          headline: `${currencyFormatter.format(insights.projectedVariance)} below the protected target at current pace.`,
          detail: `You can stay close to ${currencyFormatter.format(metrics.dailyRupeeBudget)} per day and still keep the reserve.`
        }
      : insights.paceStatus === 'balanced'
        ? {
            tone: 'neutral',
            badge: 'On target',
            headline: 'Current spending is landing close to the protected target.',
            detail: `Hold the next ${metrics.daysLeft} days near ${decimalFormatter.format(metrics.dailyUnitBudget)} units/day.`
          }
        : insights.paceStatus === 'watch'
          ? {
              tone: 'warning',
              badge: 'Needs trim',
              headline: `${currencyFormatter.format(Math.abs(insights.projectedVariance))} above target if this pace continues.`,
              detail: `Cut daily usage by about ${formatSignedPercent(insights.dailyUnitChangePercent, compactDecimalFormatter)} from your month-to-date average.`
            }
          : {
              tone: 'critical',
              badge: 'High risk',
              headline: `${currencyFormatter.format(Math.abs(insights.projectedVariance))} reserve gap if nothing changes.`,
              detail: `Stay near ${currencyFormatter.format(metrics.dailyRupeeBudget)} and avoid stacking high-draw appliances on the same day.`
            };

  const stageMeta = hasValidPlan && metrics
    ? `${currentMonthLabel} • ${metrics.daysLeft} days left • Reserve ${currencyFormatter.format(metrics.bufferAmount)}`
    : `${currentMonthLabel} • ${defaultDaysLeft} days left • Reserve can auto-calculate`;
  const selectedRuntimeRequestsChanged = selectedApplianceLabels.some((label) => {
    const item = applianceGroups.flatMap((group) => group.items).find((entry) => entry.label === label);

    return item
      ? Math.abs(
          (applianceRequestedHoursByLabel[label] ?? item.suggestedRuntimeHours) - item.suggestedRuntimeHours
        ) > 0.001
      : false;
  });
  const selectedSetNeedsBalancing =
    hasValidPlan &&
    metrics !== null &&
    selectedRequestedUnits > 0 &&
    (selectedRuntimeRequestsChanged || Math.abs(selectedScaleFactor - 1) > 0.001);
  const selectedSetHitDailyLimit =
    hasValidPlan &&
    metrics !== null &&
    selectedRequestedUnits > metrics.dailyUnitBudget;
  const selectedSetHeadline =
    !hasValidPlan || metrics === null
      ? 'Select appliances to see the checkbox-based estimate.'
      : selectedApplianceItems.length === 0
        ? 'No appliances are selected yet.'
      : selectedSetNeedsBalancing
        ? 'Checked appliances have been rebalanced using your selected runtimes.'
        : 'The checked appliance set already fits inside the safe daily limit.';
  const selectedSetDetail =
    !hasValidPlan || metrics === null
      ? 'Once the bill values are valid, the analytics below will total only the rows you checked.'
      : selectedApplianceItems.length === 0
        ? 'Check the appliances you plan to use and the app will turn them into a safe daily plan.'
      : selectedSetNeedsBalancing
        ? selectedSetHitDailyLimit
          ? `Your requested runtimes are above the day cap, so the checked set is scaled to ${compactDecimalFormatter.format(selectedScaleFactor * 100)}% to fit ${decimalFormatter.format(metrics.dailyUnitBudget)} units/day and ${currencyFormatter.format(metrics.dailyRupeeBudget)}/day.`
          : `Your requested runtimes redistributed the checked set, so the rows below follow those requests while staying inside the same selected-set total.`
        : `${decimalFormatter.format(metrics.dailyUnitBudget - selectedSuggestedUnits)} units and ${currencyFormatter.format(metrics.dailyRupeeBudget - selectedSuggestedCost)} are still left for the day.`;

  function handleToggleAppliance(label: string) {
    setSelectedApplianceLabels((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label]
    );
  }

  function handleApplianceRuntimeChange(label: string, nextHours: number) {
    setApplianceRequestedHoursByLabel((current) => ({
      ...current,
      [label]: clampRequestedRuntimeHours(nextHours)
    }));
  }

  return (
    <main className="experience-shell">
      <div
        className="experience-shell__glow experience-shell__glow--left"
        aria-hidden="true"
      />
      <div
        className="experience-shell__glow experience-shell__glow--right"
        aria-hidden="true"
      />

      <section className="hero-stage">
        <div className="stage-copy">
          <span className="stage-copy__eyebrow">Electricity use planner</span>
          <h1>One calm view of what you can safely use each day.</h1>
          <p className="stage-copy__lede">
            The page keeps the important things visible and drops the extra noise. Enter the
            numbers once, check the daily limit, confirm the month is on track, then look at
            the appliance suggestions.
          </p>
          <p className="stage-copy__meta">{stageMeta}</p>
        </div>

        <section className="planner-panel">
          <div className="planner-panel__header">
            <div>
              <span className="planner-panel__eyebrow">Step 1</span>
              <h2>Enter current bill values</h2>
            </div>
            <span className="planner-panel__status">{hasValidPlan ? 'Ready' : 'Waiting'}</span>
          </div>

          <div className="planner-panel__form">
            <InputField
              id="total-amount"
              label="Monthly budget"
              hint="Full electricity budget for the month."
              value={totalAmount}
              onChange={setTotalAmount}
            />
            <InputField
              id="remaining-amount"
              label="Balance remaining"
              hint="How much money is still left for electricity."
              value={remainingAmount}
              onChange={setRemainingAmount}
            />
            <InputField
              id="unit-rate"
              label="Per-unit charge"
              hint="The tariff you pay for one unit."
              value={unitRate}
              onChange={setUnitRate}
            />
            <InputField
              id="buffer-amount"
              label="Reserve to keep unspent"
              hint={bufferHint}
              value={bufferAmount}
              onChange={setBufferAmount}
              placeholder="Optional"
            />
          </div>

          {plan?.errors.length ? (
            <div className="planner-panel__error">
              <strong>Check the inputs</strong>
              <ul>
                {plan.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="planner-panel__footer">
              <div className="planner-panel__footnote">
                Draft saves locally in this browser.
              </div>
              <div className="planner-panel__inline-value">
                <span>Spendable now</span>
                <strong>
                  {hasValidPlan && metrics
                    ? currencyFormatter.format(metrics.spendableAmount)
                    : '--'}
                </strong>
              </div>
            </div>
          )}
        </section>
      </section>

      <div className="journey-stack">
        <section className="flow-panel">
          <SectionIntro
            step="01"
            eyebrow="Daily limit"
            title="Start with the limit for each remaining day"
            description="This is the main answer. Everything below depends on these numbers."
          />

          {hasValidPlan && metrics ? (
            <>
              <div className="highlight-band">
                <HighlightStat
                  label="Safe daily spend"
                  value={currencyFormatter.format(metrics.dailyRupeeBudget)}
                  detail={`${currencyFormatter.format(metrics.spendableAmount)} left after reserve`}
                  tone="accent"
                />
                <HighlightStat
                  label="Safe daily units"
                  value={`${decimalFormatter.format(metrics.dailyUnitBudget)} units`}
                  detail={`${decimalFormatter.format(metrics.spendableUnits)} usable units remain`}
                  tone="accent"
                />
                <HighlightStat
                  label="Protected buffer"
                  value={currencyFormatter.format(metrics.bufferAmount)}
                  detail={`${metrics.bufferSource === 'user' ? 'Custom' : 'Auto'} reserve kept aside`}
                  tone="subtle"
                />
              </div>

              <div className="info-list">
                <InfoRow
                  label="Spendable now"
                  value={currencyFormatter.format(metrics.spendableAmount)}
                  detail="Amount you can still use this month."
                />
                <InfoRow
                  label="Target month-end spend"
                  value={currencyFormatter.format(metrics.targetMonthSpend)}
                  detail={currentMonthLabel}
                />
                <InfoRow
                  label="Days left"
                  value={`${metrics.daysLeft} days`}
                  detail="Including today."
                />
                <InfoRow
                  label="Total units this month"
                  value={`${decimalFormatter.format(metrics.totalUnits)} units`}
                  detail="At the entered tariff."
                />
              </div>
            </>
          ) : (
            <div className="empty-panel">
              <strong>Enter the four bill values to get the daily limit.</strong>
              <p>
                Once the budget, remaining amount, rate, and reserve are valid, this section
                becomes the main decision point for the rest of the page.
              </p>
            </div>
          )}
        </section>

        <section className="flow-panel">
          <SectionIntro
            step="02"
            eyebrow="Pacing"
            title="Check whether the month is drifting"
            description="This section is bill-based. Appliance analytics below use only the rows you check."
          />

          {hasValidPlan && insights && metrics ? (
            <>
              <div className={`pace-banner pace-banner--${pacePresentation.tone}`}>
                <span className="pace-banner__badge">{pacePresentation.badge}</span>
                <strong>{pacePresentation.headline}</strong>
                <p>{pacePresentation.detail}</p>
              </div>

              <div className="progress-line">
                <div className="progress-line__top">
                  <span>Budget used so far</span>
                  <strong>{compactDecimalFormatter.format(metrics.usageProgress)}%</strong>
                </div>
                <div
                  className="progress-line__track"
                  aria-hidden="true"
                >
                  <div
                    className="progress-line__fill"
                    style={{ width: `${metrics.usageProgress}%` }}
                  />
                </div>
              </div>

              <div className="info-list">
                <InfoRow
                  label="Projected month-end bill"
                  value={currencyFormatter.format(insights.projectedMonthSpend)}
                  detail="If the current pace continues."
                />
                <InfoRow
                  label="Average spend per day"
                  value={currencyFormatter.format(insights.averageSpentPerElapsedDay)}
                  detail="Month-to-date average."
                />
                <InfoRow
                  label="Protected target"
                  value={currencyFormatter.format(metrics.targetMonthSpend)}
                  detail="Budget minus reserve."
                />
                <InfoRow
                  label="Course correction"
                  value={formatSignedPercent(insights.dailyUnitChangePercent, compactDecimalFormatter)}
                  detail="Daily unit change needed from the current average."
                />
              </div>

              <div className="inline-note">
                {comparisonEntry ? (
                  <>
                    Daily allowance moved by{' '}
                    {formatSignedCurrency(
                      metrics.dailyRupeeBudget - comparisonEntry.dailyRupeeBudget,
                      currencyFormatter
                    )}
                    {' '}since the previous saved check-in.
                  </>
                ) : (
                  <>
                    The first valid run becomes your local baseline, so later checks can show how
                    the daily allowance moved.
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="empty-panel">
              <strong>Pacing guidance appears after the daily limit is ready.</strong>
              <p>
                This section will show whether the month is on track, where the bill may end,
                and how much to adjust daily usage.
              </p>
            </div>
          )}
        </section>

        <section className="flow-panel">
          <SectionIntro
            step="03"
            eyebrow="Appliance guide"
            title="Pick the appliances you actually plan to use"
            description="Use the checkboxes to choose appliances, then set requested runtime for any selected row and let the rest rebalance automatically."
          />

          {hasValidPlan && applianceGroups.length > 0 ? (
            <>
              <div className={`pace-banner ${selectedApplianceItems.length === 0 ? 'pace-banner--neutral' : selectedSetNeedsBalancing ? 'pace-banner--warning' : 'pace-banner--positive'}`}>
                <span className="pace-banner__badge">Selected set only</span>
                <strong>{selectedSetHeadline}</strong>
                <p>{selectedSetDetail}</p>
              </div>

              <div className="info-list">
                <InfoRow
                  label="Selected appliances"
                  value={`${selectedApplianceItems.length}`}
                  detail="Rows checked as yes for a typical day."
                />
                <InfoRow
                  label="Safe usage for selected set"
                  value={`${decimalFormatter.format(selectedSuggestedUnits)} units/day`}
                  detail={`Safe limit is ${decimalFormatter.format(metrics!.dailyUnitBudget)} units/day.`}
                />
                <InfoRow
                  label="Safe cost for selected set"
                  value={`${currencyFormatter.format(selectedSuggestedCost)}/day`}
                  detail={`Safe limit is ${currencyFormatter.format(metrics!.dailyRupeeBudget)}/day.`}
                />
                <InfoRow
                  label="Headroom left"
                  value={`${decimalFormatter.format(metrics!.dailyUnitBudget - selectedSuggestedUnits)} units • ${currencyFormatter.format(metrics!.dailyRupeeBudget - selectedSuggestedCost)}`}
                  detail="This is based only on the checked appliances after balancing."
                />
              </div>

              <div className="inline-note">
                Checked rows show safe runtime, units/day, and rupee cost/day for the selected
                set after applying your requested runtimes. Unchecked rows remain informational only
                and are not counted in the summary.
              </div>

              <div className="appliance-sections">
                {scaledApplianceGroups.map((group) => (
                  <ApplianceGroup
                    key={group.title}
                    title={group.title}
                    description={group.description}
                    items={group.items}
                    selectedLabels={selectedApplianceLabels}
                    onToggle={handleToggleAppliance}
                    onRuntimeChange={handleApplianceRuntimeChange}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="empty-panel">
              <strong>Appliance suggestions appear here after valid inputs.</strong>
              <p>
                AC, iron box, fan, lights, TV, fridge, geyser, and other appliances will be
                shown here in a simpler list once the plan is ready.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
