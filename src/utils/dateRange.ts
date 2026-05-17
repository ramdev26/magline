export type DateRangePreset =
  | 'this_month'
  | 'last_month'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

export type DateRangeState = {
  preset: DateRangePreset;
  from: string;
  to: string;
};

export const DATE_RANGE_PRESET_LABELS: Record<DateRangePreset, string> = {
  this_month: 'This month',
  last_month: 'Last month',
  last_7_days: 'Last 7 days',
  last_30_days: 'Last 30 days',
  this_quarter: 'This quarter',
  this_year: 'This year',
  custom: 'Custom range',
};

export const DATE_RANGE_PRESET_ORDER: DateRangePreset[] = [
  'this_month',
  'last_month',
  'last_7_days',
  'last_30_days',
  'this_quarter',
  'this_year',
  'custom',
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function formatDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getBoundsForPreset(
  preset: DateRangePreset,
  custom?: { from: string; to: string }
): { start: Date; end: Date } {
  const now = new Date();
  const today = startOfDay(now);

  if (preset === 'custom' && custom?.from && custom?.to) {
    const start = startOfDay(new Date(`${custom.from}T00:00:00`));
    const end = endOfDay(new Date(`${custom.to}T00:00:00`));
    if (start.getTime() <= end.getTime()) return { start, end };
    return { start: end, end: start };
  }

  switch (preset) {
    case 'last_7_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start, end: endOfDay(now) };
    }
    case 'last_30_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start, end: endOfDay(now) };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      return { start, end };
    }
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1);
      return { start, end: endOfDay(now) };
    }
    case 'this_year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end: endOfDay(now) };
    }
    case 'this_month':
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      return { start, end };
    }
  }
}

export function defaultDateRangeState(): DateRangeState {
  const { start, end } = getBoundsForPreset('this_month');
  return {
    preset: 'this_month',
    from: formatDateInput(start),
    to: formatDateInput(end),
  };
}

export function resolveDateRangeBounds(state: DateRangeState) {
  return getBoundsForPreset(state.preset, { from: state.from, to: state.to });
}

export function parseRecordDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = value.length <= 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isDateInRange(
  value: string | null | undefined,
  bounds: { start: Date; end: Date }
): boolean {
  const d = parseRecordDate(value);
  if (!d) return false;
  const t = d.getTime();
  return t >= bounds.start.getTime() && t <= bounds.end.getTime();
}

export function formatDateRangeLabel(bounds: { start: Date; end: Date }) {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(bounds.start)} – ${fmt(bounds.end)}`;
}
