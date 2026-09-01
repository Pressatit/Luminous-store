import { ChevronDown } from "lucide-react";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to:   string;
}

interface DateRangePickerProps {
  value:    DateRange;
  onChange: (range: DateRange) => void;
}

// ── Helpers ──────────────────────────────────────────────────
const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

const getDaysInMonth = (month: number, year: number) =>
  new Date(year, month, 0).getDate();

const parseDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y, month: m, day: d };
};

const toISO = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

// Reusable select with chevron
const Select = ({
  value, onChange, children, ariaLabel
}: {
  value: string | number;
  onChange: (v: string) => void;
  children: React.ReactNode;
  ariaLabel: string;
}) => (
  <div className="relative inline-flex items-center">
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none h-8 pl-2 pr-6 bg-white border border-gray-200 rounded-lg
                 text-sm text-[#1B2B4B] font-medium focus:outline-none focus:border-[#0EA5A0]
                 cursor-pointer transition-colors"
    >
      {children}
    </select>
    <ChevronDown size={12} className="absolute right-1.5 text-gray-400 pointer-events-none" />
  </div>
);

// One date selector (day / month / year)
const DateSelector = ({
  label, value, onChange
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
}) => {
  const { year, month, day } = parseDate(value);
  const daysInMonth = getDaysInMonth(month, year);
  const currentYear = new Date().getFullYear();

  const update = (newDay: number, newMonth: number, newYear: number) => {
    // Clamp day if month/year changes reduce available days
    const maxDay = getDaysInMonth(newMonth, newYear);
    onChange(toISO(newYear, newMonth, Math.min(newDay, maxDay)));
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold text-[#1B2B4B] w-8">{label}</span>

      {/* Day */}
      <Select value={day} onChange={(v) => update(Number(v), month, year)} ariaLabel={`${label} day`}>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>{String(d).padStart(2,"0")}</option>
        ))}
      </Select>

      {/* Month */}
      <Select value={month} onChange={(v) => update(day, Number(v), year)} ariaLabel={`${label} month`}>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>{m}</option>
        ))}
      </Select>

      {/* Year */}
      <Select value={year} onChange={(v) => update(day, month, Number(v))} ariaLabel={`${label} year`}>
        {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </Select>
    </div>
  );
};

export const DateRangePicker = ({ value, onChange }: DateRangePickerProps) => (
  <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex flex-col sm:flex-row
                  items-start sm:items-center gap-3 flex-wrap">
    <DateSelector
      label="From"
      value={value.from}
      onChange={(iso) => onChange({ ...value, from: iso })}
    />
    <span className="text-gray-300 hidden sm:block">→</span>
    <DateSelector
      label="To"
      value={value.to}
      onChange={(iso) => onChange({ ...value, to: iso })}
    />
  </div>
);