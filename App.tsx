import React, { useState, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import YearCanvas from './components/YearCanvas';
import DayDetailModal from './components/modals/DayDetailModal';
import EventModal from './components/modals/EventModal';
import ProfileSelector from './components/ProfileSelector';
import { AppData, CalendarEvent, DayEntry, CanvasRectangle, UserProfile } from './types';
import { DEFAULT_DATA } from './constants';
import { isDateInRange } from './utils';

const PROFILES_STORAGE_KEY = 'year_canvas_profiles';
const DATA_STORAGE_PREFIX = 'year_canvas_data_';

const App: React.FC = () => {
  // --- Auth State ---
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // --- App Data State ---
  const [data, setData] = useState<AppData>({ days: {}, events: [], rectangles: [] });
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- Modal States ---
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [initialEventDate, setInitialEventDate] = useState<string | null>(null);
  const [initialEventEndDate, setInitialEventEndDate] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // --- 1. Load Profiles on Mount ---
  useEffect(() => {
    const savedProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (savedProfiles) {
      try {
        setProfiles(JSON.parse(savedProfiles));
      } catch (e) {
        console.error("Failed to load profiles", e);
      }
    }
  }, []);

  // --- 2. Save Profiles when changed ---
  useEffect(() => {
    if (profiles.length > 0) {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    } else {
        // Only remove if we explicitly deleted everything, but usually we keep the key
        if(localStorage.getItem(PROFILES_STORAGE_KEY)) {
             localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify([]));
        }
    }
  }, [profiles]);

  // --- 3. Load User Data when currentUser changes ---
  useEffect(() => {
    if (!currentUser) {
      setIsDataLoaded(false);
      return;
    }

    const key = `${DATA_STORAGE_PREFIX}${currentUser.id}`;
    const savedData = localStorage.getItem(key);
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (!parsed.rectangles) parsed.rectangles = [];
        setData(parsed);
      } catch (e) {
        console.error("Failed to load user data", e);
        setData({ ...DEFAULT_DATA, rectangles: [] });
      }
    } else {
      // New user gets default data (or empty)
      // If it's the very first user and there is legacy data (from before login system), maybe migrate it? 
      // For now, let's just give them fresh default data.
      setData({ ...DEFAULT_DATA, rectangles: [] });
    }
    setIsDataLoaded(true);
  }, [currentUser]);

  // --- 4. Save User Data when data changes ---
  useEffect(() => {
    if (currentUser && isDataLoaded) {
      const key = `${DATA_STORAGE_PREFIX}${currentUser.id}`;
      localStorage.setItem(key, JSON.stringify(data));
    }
  }, [data, currentUser, isDataLoaded]);


  // --- Auth Actions ---

  const handleCreateProfile = (profile: UserProfile) => {
    setProfiles(prev => [...prev, profile]);
    setCurrentUser(profile);
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    // Also remove their data
    localStorage.removeItem(`${DATA_STORAGE_PREFIX}${id}`);
    if (currentUser?.id === id) {
      setCurrentUser(null);
    }
  };

  const handleLogin = (profile: UserProfile) => {
    setCurrentUser(profile);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };


  // --- App Actions ---

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

  const saveDayEntry = (entry: DayEntry) => {
    setData(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [entry.date]: entry
      }
    }));
  };

  const deleteDayEntry = (dateStr: string) => {
    setData(prev => {
      const newDays = { ...prev.days };
      delete newDays[dateStr];
      return { ...prev, days: newDays };
    });
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

  const saveEvent = (event: CalendarEvent) => {
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
  };

  const deleteEvent = (eventId: string) => {
    setData(prev => ({
      ...prev,
      events: prev.events.filter(e => e.id !== eventId)
    }));
    setInitialEventDate(null);
    setInitialEventEndDate(null);
  };

  // Rectangle Actions
  const handleAddRectangle = (rect: CanvasRectangle) => {
    setData(prev => ({
      ...prev,
      rectangles: [...prev.rectangles, rect]
    }));
  };

  const handleUpdateRectangle = (rect: CanvasRectangle) => {
    setData(prev => ({
      ...prev,
      rectangles: prev.rectangles.map(r => r.id === rect.id ? rect : r)
    }));
  };

  const handleDeleteRectangle = (id: string) => {
    setData(prev => ({
      ...prev,
      rectangles: prev.rectangles.filter(r => r.id !== id)
    }));
  };

  // Global Actions
  const handleExport = () => {
    if (!currentUser) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `year-canvas-${currentUser.name}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);
          if (parsed.days && Array.isArray(parsed.events)) {
            if (!parsed.rectangles) parsed.rectangles = [];
            setData(parsed);
            alert('Importación exitosa.');
          } else {
            alert('Formato de archivo inválido.');
          }
        } catch (err) {
          alert('Error al leer el archivo JSON.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de borrar todos los datos de este perfil? Esta acción es irreversible.')) {
      setData({ days: {}, events: [], rectangles: [] });
    }
  };

  // Derived Data
  const getEventsForDay = (dateStr: string | null) => {
    if (!dateStr) return [];
    return data.events.filter(evt => isDateInRange(dateStr, evt.startDate, evt.endDate));
  };

  const existingCategories = Array.from(new Set(data.events.map(e => e.category)));


  // --- Render ---

  if (!currentUser) {
    return (
      <ProfileSelector 
        profiles={profiles}
        onSelectProfile={handleLogin}
        onCreateProfile={handleCreateProfile}
        onDeleteProfile={handleDeleteProfile}
      />
    );
  }

  if (!isDataLoaded) {
    return <div className="flex h-screen items-center justify-center text-gray-400 bg-gray-50">Cargando datos...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Toolbar 
        user={currentUser}
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