import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { DayEntry, CalendarEvent, EventCategory, Mood } from '../../types';
import { formatReadableDate } from '../../utils';
import { CATEGORY_ICONS, MOOD_ICONS, PREDEFINED_TAGS } from '../../constants';
import { Plus, Tag, Save, Trash2 } from 'lucide-react';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string | null;
  currentEntry: DayEntry | undefined;
  dayEvents: CalendarEvent[];
  onSave: (entry: DayEntry) => void;
  onDelete: (dateStr: string) => void;
  onAddEvent: (dateStr: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

const DayDetailModal: React.FC<DayDetailModalProps> = ({ 
  isOpen, onClose, dateStr, currentEntry, dayEvents, onSave, onDelete, onAddEvent, onEditEvent
}) => {
  // Form State
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (currentEntry) {
        setTitle(currentEntry.title || '');
        setNotes(currentEntry.notes || '');
        setMood(currentEntry.mood);
        setTags(currentEntry.tags || []);
      } else {
        setTitle('');
        setNotes('');
        setMood(undefined);
        setTags([]);
      }
    }
  }, [isOpen, currentEntry, dateStr]);

  const handleSaveDay = () => {
    if (!dateStr) return;
    const entry: DayEntry = {
      date: dateStr,
      title,
      notes,
      mood,
      tags
    };
    onSave(entry);
    onClose();
  };

  const handleDeleteDay = () => {
    if (dateStr && confirm('¿Borrar detalles de este día?')) {
      onDelete(dateStr);
      onClose();
    }
  };

  const toggleTag = (tagId: string) => {
    setTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId) 
        : [...prev, tagId]
    );
  };

  if (!dateStr) return null;

  const inputClass = "w-full p-2.5 bg-gray-50 border border-gray-200 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all placeholder:text-gray-400";

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={formatReadableDate(dateStr)}
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-8">
        
        {/* Day Details Section */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Resumen del Día
                </h3>
            </div>
            
            <div className="space-y-4">
                {/* Title */}
                <div>
                    <input
                        type="text"
                        className={`${inputClass} font-bold text-lg`}
                        placeholder="Título o Highlight del día..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Mood */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">Mood</label>
                        <div className="flex gap-2">
                           {Object.keys(MOOD_ICONS).map((mKey) => (
                               <button
                                   key={mKey}
                                   onClick={() => setMood(mKey as Mood)}
                                   className={`flex-1 h-10 rounded-lg flex items-center justify-center border transition-all ${mood === mKey ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50 grayscale'}`}
                                   title={mKey}
                               >
                                   {MOOD_ICONS[mKey as Mood]}
                               </button>
                           ))}
                        </div>
                    </div>
                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">Etiquetas</label>
                        <div className="flex flex-wrap gap-2">
                            {PREDEFINED_TAGS.map(tag => {
                                const isSelected = tags.includes(tag.id);
                                return (
                                    <button
                                        key={tag.id}
                                        onClick={() => toggleTag(tag.id)}
                                        title={tag.label}
                                        className={`
                                            w-8 h-8 rounded-md flex items-center justify-center text-sm transition-all border
                                            ${isSelected 
                                                ? 'bg-blue-50 border-blue-500 scale-105 shadow-sm opacity-100' 
                                                : 'bg-white border-gray-200 hover:bg-gray-100 grayscale opacity-60 hover:opacity-100'}
                                        `}
                                    >
                                        {tag.emoji}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Notas</label>
                    <textarea
                        className={`${inputClass} min-h-[100px] resize-none`}
                        placeholder="¿Qué pasó hoy?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                {currentEntry && (
                    <button 
                        onClick={handleDeleteDay}
                        className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
                        title="Borrar entrada del día"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
                <button
                    onClick={handleSaveDay}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-md transition-colors text-sm font-medium shadow-sm"
                >
                    <Save size={16} /> Guardar Día
                </button>
            </div>
        </div>

        <hr className="border-gray-100" />

        {/* Events Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Eventos ({dayEvents.length})
            </h3>
            <button 
              type="button"
              onClick={() => onAddEvent(dateStr)}
              className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors flex items-center gap-2 font-medium border border-blue-100"
            >
              <Plus size={14} /> Nuevo Evento
            </button>
          </div>
          
          <div className="space-y-2">
            {dayEvents.length > 0 ? (
              dayEvents.map(evt => (
                <div 
                  key={evt.id}
                  onClick={() => onEditEvent(evt)}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-sm cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 overflow-hidden w-full">
                    {/* Color Indicator */}
                    <div className="w-1.5 self-stretch rounded-full" style={{ backgroundColor: evt.color }}></div>
                    
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 truncate">
                          {evt.title}
                        </span>
                        {/* Type Tag - only show if category exists */}
                        {evt.category && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200 uppercase tracking-wide font-medium flex items-center gap-1">
                            {CATEGORY_ICONS[evt.category as EventCategory] || <Tag size={10} />}
                            {evt.category}
                          </span>
                        )}
                      </div>
                      
                      {evt.description && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {evt.description}
                        </p>
                      )}

                      <span className="text-xs text-slate-400 mt-1">
                        {evt.startDate === evt.endDate 
                          ? 'Todo el día' 
                          : `Del ${evt.startDate} al ${evt.endDate}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
                <p className="text-sm">No hay eventos.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default DayDetailModal;