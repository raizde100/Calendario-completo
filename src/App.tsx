import React, { useState, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import YearCanvas from './components/YearCanvas';
import DayDetailModal from './components/modals/DayDetailModal';
import EventModal from './components/modals/EventModal';
import Auth from './components/Auth';
import { AppData, CalendarEvent, DayEntry, CanvasRectangle, UserProfile } from './types';
import { isDateInRange } from './utils';
import { supabase } from './supabaseClient';
import { supabaseService } from './services/supabaseService';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  // --- Auth State ---
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // --- App Data State ---
  const [data, setData] = useState<AppData>({ days: {}, events: [], rectangles: [] });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Modal States ---
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [initialEventDate, setInitialEventDate] = useState<string | null>(null);
  const [initialEventEndDate, setInitialEventEndDate] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // --- 1. Auth & Session Management ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        // Clear data on logout
        setData({ days: {}, events: [], rectangles: [] });
        setIsDataLoaded(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 2. Data Fetching from Supabase ---
  useEffect(() => {
    if (!session?.user) return;

    const loadData = async () => {
      setIsDataLoaded(false);
      const { data: fetchedData, error } = await supabaseService.fetchData(session.user.id);
      
      if (error) {
        console.error('Error loading data:', error);
        alert(`Error al cargar datos: ${error.message || JSON.stringify(error)}`);
      } else if (fetchedData) {
        setData(fetchedData);
      }
      setIsDataLoaded(true);
    };

    loadData();
  }, [session]);


  // --- App Actions (Optimistic UI + DB Sync) ---

  // Day Actions
  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsDayModalOpen(true);
  };

  const handleRangeSelect = (startStr: string, endStr: string) => {
    setInitialEventDate(startStr);
    setInitialEventEndDate(endStr);
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  const saveDayEntry = async (entry: DayEntry) => {
    if (!session?.user) return;

    // 1. Optimistic Update
    setData(prev => ({
      ...prev,
      days: { ...prev.days, [entry.date]: entry }
    }));

    // 2. DB Update
    try {
      const { error } = await supabaseService.saveDay(session.user.id, entry);
      if (error) throw error;
    } catch (e: any) {
      console.error("Save Day Error:", e);
      alert(`Error guardando día: ${e.message}`);
      // Optional: Revert optimistic update
    }
  };

  const deleteDayEntry = async (dateStr: string) => {
    if (!session?.user) return;

    // 1. Optimistic Update
    setData(prev => {
      const newDays = { ...prev.days };
      delete newDays[dateStr];
      return { ...prev, days: newDays };
    });

    // 2. DB Update
    try {
      const { error } = await supabaseService.deleteDay(session.user.id, dateStr);
      if (error) throw error;
    } catch (e: any) {
       console.error("Delete Day Error:", e);
       alert(`Error borrando día: ${e.message}`);
    }
  };

  // Event Actions
  const handleNewEvent = () => {
    setInitialEventDate(null);
    setInitialEventEndDate(null);
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  const handleAddEventFromDay = (dateStr: string) => {
    setInitialEventDate(dateStr);
    setInitialEventEndDate(null);
    setEditingEvent(null);
    setIsEventModalOpen(true);
    setIsDayModalOpen(false);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    setInitialEventEndDate(null);
    setIsEventModalOpen(true);
    setIsDayModalOpen(false);
  };

  const saveEvent = async (event: CalendarEvent) => {
    if (!session?.user) return;

    // 1. Optimistic
    setData(prev => {
      const exists = prev.events.find(e => e.id === event.id);
      let newEvents;
      if (exists) {
        newEvents = prev.events.map(e => e.id === event.id ? event : e);
      } else {
        newEvents = [...prev.events, event];
      }
      return { ...prev, events: newEvents };
    });
    setInitialEventDate(null);
    setInitialEventEndDate(null);

    // 2. DB Update
    try {
      const { error } = await supabaseService.saveEvent(session.user.id, event);
      if (error) throw error;
    } catch (e: any) {
      console.error("Save Event Error:", e);
      alert(`Error guardando evento: ${e.message}. Revisa que la tabla 'canvas_events' exista y las políticas RLS sean correctas.`);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!session?.user) return;

    setData(prev => ({
      ...prev,
      events: prev.events.filter(e => e.id !== eventId)
    }));
    setInitialEventDate(null);
    setInitialEventEndDate(null);

    try {
        const { error } = await supabaseService.deleteEvent(session.user.id, eventId);
        if (error) throw error;
    } catch (e: any) {
        console.error("Delete Event Error:", e);
        alert(`Error borrando evento: ${e.message}`);
    }
  };

  // Rectangle Actions
  const handleAddRectangle = async (rect: CanvasRectangle) => {
    if (!session?.user) return;

    setData(prev => ({
      ...prev,
      rectangles: [...prev.rectangles, rect]
    }));

    try {
        const { error } = await supabaseService.saveRectangle(session.user.id, rect);
        if (error) throw error;
    } catch (e: any) {
        console.error("Save Rect Error:", e);
        alert(`Error guardando dibujo: ${e.message}`);
    }
  };

  const handleUpdateRectangle = async (rect: CanvasRectangle) => {
    if (!session?.user) return;

    setData(prev => ({
      ...prev,
      rectangles: prev.rectangles.map(r => r.id === rect.id ? rect : r)
    }));

    try {
        const { error } = await supabaseService.saveRectangle(session.user.id, rect);
        if (error) throw error;
    } catch (e: any) {
        console.error("Update Rect Error:", e);
    }
  };

  const handleDeleteRectangle = async (id: string) => {
    if (!session?.user) return;

    setData(prev => ({
      ...prev,
      rectangles: prev.rectangles.filter(r => r.id !== id)
    }));

    try {
        const { error } = await supabaseService.deleteRectangle(session.user.id, id);
        if (error) throw error;
    } catch (e: any) {
        console.error("Delete Rect Error:", e);
    }
  };

  // Global Actions
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `year-canvas-${session?.user.email}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    alert("La importación masiva está deshabilitada temporalmente en la versión online para evitar conflictos de datos.");
  };

  const handleReset = async () => {
    if (confirm('¿Borrar TODO tu año? Esta acción no se puede deshacer.')) {
      if (!session?.user) return;
      setIsSyncing(true);
      
      try {
        await supabaseService.resetAllData(session.user.id);
        setData({ days: {}, events: [], rectangles: [] });
      } catch (e: any) {
          console.error("Reset Error:", e);
          alert("Error al borrar datos: " + e.message);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Derived Data
  const getEventsForDay = (dateStr: string | null) => {
    if (!dateStr) return [];
    return data.events.filter(evt => isDateInRange(dateStr, evt.startDate, evt.endDate));
  };

  const existingCategories = Array.from(new Set(data.events.map(e => e.category)));

  // Mock profile object for Toolbar compatibility
  const userProfile: UserProfile | null = session?.user ? {
    id: session.user.id,
    name: session.user.email?.split('@')[0] || 'User',
    color: '#3b82f6',
    createdAt: session.user.created_at
  } : null;

  // --- Render ---

  if (isLoadingSession) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>;
  }

  if (!session) {
    return <Auth />;
  }

  if (!isDataLoaded) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        <p className="text-slate-500 font-medium animate-pulse">Cargando tu año...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Toolbar 
        user={userProfile}
        onNewEvent={handleNewEvent}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
        onLogout={handleLogout}
      />
      
      <YearCanvas 
        daysData={data.days}
        eventsData={data.events}
        rectangles={data.rectangles}
        onDayClick={handleDayClick}
        onRangeSelect={handleRangeSelect}
        onEventClick={handleEventClick}
        onAddEventClick={handleAddEventFromDay}
        onAddRectangle={handleAddRectangle}
        onUpdateRectangle={handleUpdateRectangle}
        onDeleteRectangle={handleDeleteRectangle}
      />

      <DayDetailModal 
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        dateStr={selectedDate}
        currentEntry={selectedDate ? data.days[selectedDate] : undefined}
        dayEvents={getEventsForDay(selectedDate)}
        onSave={saveDayEntry}
        onDelete={deleteDayEntry}
        onAddEvent={handleAddEventFromDay}
        onEditEvent={handleEventClick}
      />

      <EventModal 
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setInitialEventDate(null);
          setInitialEventEndDate(null);
        }}
        editingEvent={editingEvent}
        initialDate={initialEventDate}
        initialEndDate={initialEventEndDate}
        existingCategories={existingCategories}
        onSave={saveEvent}
        onDelete={deleteEvent}
      />
    </div>
  );
};

export default App;