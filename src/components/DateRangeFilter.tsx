import { Calendar } from 'lucide-react';
import {
  DATE_RANGE_PRESET_LABELS,
  DATE_RANGE_PRESET_ORDER,
  type DateRangePreset,
  type DateRangeState,
  formatDateInput,
  formatDateRangeLabel,
  getBoundsForPreset,
  resolveDateRangeBounds,
} from '../utils/dateRange';

type Props = {
  value: DateRangeState;
  onChange: (next: DateRangeState) => void;
  dateFieldLabel?: string;
};

export function DateRangeFilter({ value, onChange, dateFieldLabel = 'records' }: Props) {
  const bounds = resolveDateRangeBounds(value);

  const onPresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      onChange({ ...value, preset });
      return;
    }
    const nextBounds = getBoundsForPreset(preset);
    onChange({
      preset,
      from: formatDateInput(nextBounds.start),
      to: formatDateInput(nextBounds.end),
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 mb-3">
      <div className="flex items-center gap-2 text-slate-600">
        <Calendar size={16} className="text-slate-400 shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Period</span>
      </div>
      <select
        value={value.preset}
        onChange={(e) => onPresetChange(e.target.value as DateRangePreset)}
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 min-w-[140px]"
      >
        {DATE_RANGE_PRESET_ORDER.map((key) => (
          <option key={key} value={key}>
            {DATE_RANGE_PRESET_LABELS[key]}
          </option>
        ))}
      </select>
      {value.preset === 'custom' && (
        <>
          <input
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
            aria-label="From date"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
            aria-label="To date"
          />
        </>
      )}
      <p className="text-xs text-slate-500 sm:ml-auto">
        {formatDateRangeLabel(bounds)} · Summary boxes count {dateFieldLabel} in this period
      </p>
    </div>
  );
}
