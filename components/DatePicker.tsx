import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { YEAR, MONTHS } from '../constants';

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
}

const DAYS_SHORT = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

const DatePicker: React.FC<DatePickerProps> = ({ 
  label, value, onChange, minDate, maxDate, required 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // State for the calendar view (year/month navigation)
  // We initialize based on value, or default to YEAR-01-01
  const initialDate = value ? new Date(value) : new Date(YEAR, 0, 1);
  const [viewDate, setViewDate] = useState(initialDate);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      // Ensure we stay within the target year for the view if possible
      if (date.getFullYear() === YEAR) {
        setViewDate(date);
      }
    }
  }, [value]);

  const handlePrevMonth = () => {
    setViewDate(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      // Prevent going before Jan 2026
      if (newDate.getFullYear() < YEAR) return prev;
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setViewDate(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      // Prevent going after Dec 2026
      if (newDate.getFullYear() > YEAR) return prev;
      return newDate;
    });
  };

  const handleDayClick = (day: number) => {
    const month = viewDate.getMonth() + 1;
    const formattedDate = `${YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  // Calendar Grid Logic
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const daysInMonth = getDaysInMonth(viewDate);
  const startDay = getFirstDayOfMonth(viewDate); // 0 = Sunday
  const currentMonthIndex = viewDate.getMonth();

  const isPrevDisabled = currentMonthIndex === 0; // Can't go before Jan
  const isNextDisabled = currentMonthIndex === 11; // Can't go after Dec

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Input Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full p-2.5 bg-gray-50 border border-gray-200 text-slate-900 rounded-lg 
          flex items-center justify-between cursor-pointer hover:bg-white hover:border-blue-300 transition-all
          ${isOpen ? 'ring-2 ring-blue-500 bg-white border-transparent' : ''}
        `}
      >
        <span className={value ? "font-medium" : "text-gray-400"}>
           {value || "Seleccionar fecha..."}
        </span>
        <CalendarIcon size={18} className="text-gray-400" />
      </div>

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 w-[300px] animate-in fade-in zoom-in-95 duration-100">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button 
              type="button"
              onClick={handlePrevMonth} 
              disabled={isPrevDisabled}
              className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="font-bold text-slate-800">
              {MONTHS[currentMonthIndex]} {YEAR}
            </div>

            <button 
              type="button"
              onClick={handleNextMonth} 
              disabled={isNextDisabled}
              className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_SHORT.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots for start of month */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateString = `${YEAR}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              
              const isSelected = value === dateString;
              const isDisabled = (minDate && dateString < minDate) || (maxDate && dateString > maxDate);

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => !isDisabled && handleDayClick(dayNum)}
                  disabled={isDisabled}
                  className={`
                    h-8 w-8 rounded-full text-sm font-medium flex items-center justify-center transition-all
                    ${isSelected 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : isDisabled 
                        ? 'text-gray-300 cursor-not-allowed decoration-slice' 
                        : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                    }
                  `}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;