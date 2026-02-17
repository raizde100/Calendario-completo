import { supabase } from '../supabaseClient';
import { AppData, DayEntry, CalendarEvent, CanvasRectangle } from '../types';

export const supabaseService = {
  // --- READ ---
  async fetchData(userId: string): Promise<{ data: AppData | null; error: any }> {
    try {
      const [daysResponse, eventsResponse, rectsResponse] = await Promise.all([
        supabase.from('canvas_days').select('*').eq('user_id', userId),
        supabase.from('canvas_events').select('*').eq('user_id', userId),
        supabase.from('canvas_rectangles').select('*').eq('user_id', userId)
      ]);

      if (daysResponse.error) throw daysResponse.error;
      if (eventsResponse.error) throw eventsResponse.error;
      if (rectsResponse.error) throw rectsResponse.error;

      // Transform days array to Record object
      const daysRecord: Record<string, DayEntry> = {};
      daysResponse.data?.forEach((day: any) => {
        daysRecord[day.date] = {
            date: day.date,
            title: day.title || '',
            notes: day.notes || '',
            mood: day.mood,
            tags: day.tags || []
        };
      });

      // Map events to match frontend types (camelCase)
      const events: CalendarEvent[] = (eventsResponse.data || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        startDate: e.start_date,
        endDate: e.end_date,
        category: e.category || '',
        color: e.color || '#3b82f6',
        description: e.description || ''
      }));

      // Rectangles usually map 1:1 if column names match types, but let's be explicit
      const rectangles: CanvasRectangle[] = (rectsResponse.data || []).map((r: any) => ({
        id: r.id,
        x: Number(r.x),
        y: Number(r.y),
        width: Number(r.width),
        height: Number(r.height),
        color: r.color,
        text: r.text || ''
      }));

      return {
        data: {
          days: daysRecord,
          events: events,
          rectangles: rectangles,
        },
        error: null
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      return { data: null, error };
    }
  },

  // --- WRITE: DAYS ---
  async saveDay(userId: string, entry: DayEntry) {
    return supabase.from('canvas_days').upsert({
      user_id: userId,
      date: entry.date,
      title: entry.title,
      notes: entry.notes,
      mood: entry.mood ?? null,
      tags: entry.tags
    });
  },

  async deleteDay(userId: string, date: string) {
    return supabase.from('canvas_days').delete().match({ user_id: userId, date });
  },

  // --- WRITE: EVENTS ---
  async saveEvent(userId: string, event: CalendarEvent) {
    return supabase.from('canvas_events').upsert({
      id: event.id,
      user_id: userId,
      title: event.title,
      start_date: event.startDate,
      end_date: event.endDate,
      category: event.category,
      color: event.color,
      description: event.description || null
    });
  },

  async deleteEvent(userId: string, eventId: string) {
    return supabase.from('canvas_events').delete().match({ user_id: userId, id: eventId });
  },

  // --- WRITE: RECTANGLES ---
  async saveRectangle(userId: string, rect: CanvasRectangle) {
    // Upsert handles both insert and update
    return supabase.from('canvas_rectangles').upsert({
      id: rect.id,
      user_id: userId,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      color: rect.color,
      text: rect.text || null
    });
  },

  async deleteRectangle(userId: string, rectId: string) {
    return supabase.from('canvas_rectangles').delete().match({ user_id: userId, id: rectId });
  },

  // --- RESET ---
  async resetAllData(userId: string) {
    // Delete in order to avoid potential foreign key constraints if any (though here they are independent)
    const p1 = supabase.from('canvas_days').delete().eq('user_id', userId);
    const p2 = supabase.from('canvas_events').delete().eq('user_id', userId);
    const p3 = supabase.from('canvas_rectangles').delete().eq('user_id', userId);
    
    await Promise.all([p1, p2, p3]);
  }
};