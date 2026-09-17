import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { BS_YEARS, NEPALI_MONTHS, getFiscalYear } from '../utils/nepaliCalendar';

interface MonthYearFilterProps {
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  className?: string;
}

export const MonthYearFilter: React.FC<MonthYearFilterProps> = ({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  className = '',
}) => {
  const currentFY = getFiscalYear(selectedYear, selectedMonth);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onMonthChange(12);
      onYearChange(selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onMonthChange(1);
      onYearChange(selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1);
    }
  };

  const currentMonthObj = NEPALI_MONTHS.find((m) => m.index === selectedMonth);

  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 ${className} print:hidden`}
      id="month-year-filter-bar"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Accounting Period (B.S.)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900">
              {currentMonthObj?.name} {selectedYear}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({currentMonthObj?.nepaliName})
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2 sm:gap-3">
        {/* Fiscal Year Tag */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200 text-xs">
          <span className="text-slate-500 font-normal">Fiscal Year:</span>
          <span className="font-semibold text-slate-800 font-mono">FY {currentFY}</span>
        </div>

        {/* Previous Month */}
        <button
          onClick={handlePrevMonth}
          disabled={selectedYear <= BS_YEARS[0] && selectedMonth === 1}
          id="btn-prev-month"
          className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Previous Nepali Month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Year Dropdown */}
        <div className="relative">
          <select
            id="select-bs-year"
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
            className="text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
          >
            {BS_YEARS.map((y) => (
              <option key={y} value={y}>
                {y} B.S.
              </option>
            ))}
          </select>
        </div>

        {/* Month Dropdown */}
        <div className="relative">
          <select
            id="select-bs-month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
            className="text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
          >
            {NEPALI_MONTHS.map((m) => (
              <option key={m.index} value={m.index}>
                {m.name} ({m.nepaliName})
              </option>
            ))}
          </select>
        </div>

        {/* Next Month */}
        <button
          onClick={handleNextMonth}
          disabled={selectedYear >= BS_YEARS[BS_YEARS.length - 1] && selectedMonth === 12}
          id="btn-next-month"
          className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Next Nepali Month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
