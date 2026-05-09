import type { PaceStatus } from './analytics';
import type { BufferSource } from './calculator';

export interface DraftValues {
  totalAmount: string;
  remainingAmount: string;
  unitRate: string;
  bufferAmount: string;
  selectedApplianceLabels: string[];
  applianceRequestedHoursByLabel: Record<string, number>;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  signature: string;
  monthLabel: string;
  totalAmount: number;
  remainingAmount: number;
  unitRate: number;
  bufferAmount: number | null;
  bufferSource: BufferSource;
  daysLeft: number;
  dailyRupeeBudget: number;
  dailyUnitBudget: number;
  usageProgress: number;
  paceStatus: PaceStatus;
}

const DRAFT_KEY = 'electricity-budget-draft-v1';
const HISTORY_KEY = 'electricity-budget-history-v1';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const storedValue = window.localStorage.getItem(key);

    return storedValue ? (JSON.parse(storedValue) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures and keep the app usable.
  }
}

export function readDraftValues(): DraftValues {
  const storedValue = readJson<Partial<DraftValues>>(DRAFT_KEY, {});

  return {
    totalAmount: '',
    remainingAmount: '',
    unitRate: '',
    bufferAmount: '',
    selectedApplianceLabels: [],
    applianceRequestedHoursByLabel: {},
    ...storedValue
  };
}

export function writeDraftValues(value: DraftValues) {
  writeJson(DRAFT_KEY, value);
}

export function readHistoryEntries(): HistoryEntry[] {
  const storedEntries = readJson<HistoryEntry[]>(HISTORY_KEY, []);

  return storedEntries
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      ...entry,
      bufferAmount:
        typeof entry.bufferAmount === 'number' && Number.isFinite(entry.bufferAmount)
          ? entry.bufferAmount
          : null,
      bufferSource: entry.bufferSource === 'user' ? 'user' : 'auto'
    }));
}

export function writeHistoryEntries(value: HistoryEntry[]) {
  writeJson(HISTORY_KEY, value);
}

export function buildHistorySignature(
  monthLabel: string,
  totalAmount: number,
  remainingAmount: number,
  unitRate: number,
  bufferAmount: number
) {
  return [monthLabel, totalAmount, remainingAmount, unitRate, bufferAmount].join('|');
}

export function buildHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): HistoryEntry {
  return {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    createdAt: new Date().toISOString()
  };
}

export function trimHistory(entries: HistoryEntry[], maxEntries = 18) {
  return entries.slice(0, maxEntries);
}
