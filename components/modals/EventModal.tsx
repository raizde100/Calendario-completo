import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { CalendarEvent } from '../../types';
import { YEAR, PREDEFINED_TAGS } from '../../constants';
import { generateId, stringToColor } from '../../utils';
import { Save, Trash2 } from 'lucide-react';
import DatePicker from '../DatePicker';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEvent: CalendarEvent | null;
  initialDate?: string | null;
  initialEndDate?: string | null;
  existingCategories?: string[];
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen, onClose, editingEvent, initialDate, initialEndDate, existingCategories = [], onSave, onDelete
}) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(`${YEAR}-01-01`);
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        setName(editingEvent.title);
        setStartDate(editingEvent.startDate);
        setEndDate(editingEvent.endDate === editingEvent.startDate ? '' : editingEvent.endDate);
        setCategory(editingEvent.category);
        setDescription(editingEvent.description || '');
      } else {
        // Defaults for new event
        const defaultDate = initialDate || `${YEAR}-01-01`;
        setName('');
        setStartDate(defaultDate);
        // If initialEndDate is provided and different from start, use it
        if (initialEndDate && initialEndDate !== defaultDate) {
            setEndDate(initialEndDate);
        } else {
            setEndDate('');
        }
        setCategory('');
        setDescription('');
      }
      setError('');
    }
  }, [isOpen, editingEvent, initialDate, initialEndDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    
    const finalEndDate = endDate ? endDate : startDate;

    if (finalEndDate < startDate) {
      setError('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }
    if (!startDate.startsWith(String(YEAR))) {
      setError(`Las fechas deben ser del año ${YEAR}.`);
      return;
    }

    const catTrimmed = category.trim();

    const newEvent: CalendarEvent = {
      id: editingEvent ? editingEvent.id : generateId(),
      title: name,
      startDate,
      endDate: finalEndDate,
      category: catTrimmed,
      // Use specific color for valid category, or neutral grey for uncategorized
      color: catTrimmed ? stringToColor(catTrimmed) : '#000000', 
      description
    };

    onSave(newEvent);
    onClose();
  };

  const handleDelete = () => {
    if (editingEvent && confirm('¿Borrar este evento?')) {
      onDelete(editingEvent.id);
      onClose();
    }
  };

  const inputClass = "w-full p-2.5 bg-gray-50 border border-gray-200 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all placeholder:text-gray-400";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 p-2 rounded text-sm">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del evento</label>
          <input
            type="text"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Cumpleaños de Ana"
            autoFocus
          />
        </div>

        {/* Type / Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tipo / Etiqueta <span className="font-normal text-gray-400">(Opcional)</span>
          </label>
          
          {/* Emoji Grid Selection */}
          <div className="flex flex-wrap gap-2 mb-3">
            {PREDEFINED_TAGS.map(tag => {
                const isSelected = category === tag.id;
                return (
                    <button
                        key={tag.id}
                        type="button"
                        onClick={() => setCategory(isSelected ? '' : tag.id)}
                        title={tag.label}
                        className={`
                            w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all border
                            ${isSelected 
                                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200 scale-105 opacity-100' 
                                : 'bg-white border-gray-200 hover:bg-gray-50 grayscale hover:grayscale-0 opacity-70 hover:opacity-100'}
                        `}
                    >
                        {tag.emoji}
                    </button>
                );
            })}
          </div>

          <input
            type="text"
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="O escribe una categoría personalizada..."
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <DatePicker 
              label="Fecha Inicio"
              value={startDate}
              onChange={setStartDate}
              minDate={`${YEAR}-01-01`}
              maxDate={`${YEAR}-12-31`}
              required
            />
          </div>
          <div>
            <DatePicker 
              label="Fecha Fin (Opcional)"
              value={endDate}
              onChange={setEndDate}
              minDate={startDate} // Constraint: End date cannot be before start date
              maxDate={`${YEAR}-12-31`}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
          <textarea
            className={`${inputClass} h-24 resize-none`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles adicionales..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-2">
          {editingEvent ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Trash2 size={16} /> Borrar
            </button>
          ) : (
            <div></div>
          )}
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <Save size={16} /> Guardar Evento
            </button>
          </div>
        </div>

      </form>
    </Modal>
  );
};

export default EventModal;