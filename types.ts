export type Mood = 'excellent' | 'good' | 'normal' | 'bad';

// We keep EventCategory for the default icons, but the event itself can have any string
export type EventCategory = 'travel' | 'celebration' | 'work' | 'personal' | 'sport' | 'study';

export interface UserProfile {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  title: string;
  notes: string;
  mood?: Mood;
  tags: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  category: string; // Changed from EventCategory to string to support custom tags
  color: string;
  description?: string;
}

export interface CanvasRectangle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string; // Border color
  text?: string;
}

export interface AppData {
  days: Record<string, DayEntry>;
  events: CalendarEvent[];
  rectangles: CanvasRectangle[];
}