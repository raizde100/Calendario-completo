import { YEAR, EVENT_COLORS } from './constants';

export const getDaysInMonth = (monthIndex: number): number => {
  return new Date(YEAR, monthIndex + 1, 0).getDate();
};

export const isValidDay = (monthIndex: number, day: number): boolean => {
  const daysInMonth = getDaysInMonth(monthIndex);
  return day >= 1 && day <= daysInMonth;
};

export const formatDateISO = (monthIndex: number, day: number): string => {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${YEAR}-${m}-${d}`;
};

export const formatReadableDate = (isoDate: string): string => {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const isDateInRange = (dateStr: string, startStr: string, endStr: string): boolean => {
  return dateStr >= startStr && dateStr <= endStr;
};

// Simple ID generator
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Generate a consistent color from a string
export const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Use the pre-defined palette if possible, or generate one
  const index = Math.abs(hash) % EVENT_COLORS.length;
  return EVENT_COLORS[index];
};