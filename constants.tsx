import React from 'react';
import { Plane, PartyPopper, Briefcase, Heart, Dumbbell, BookOpen, Smile, Meh, Frown, Sparkles } from 'lucide-react';
import { EventCategory, Mood, CalendarEvent, DayEntry } from './types';

export const YEAR = 2026;

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const CATEGORY_ICONS: Record<EventCategory, React.ReactNode> = {
  travel: <Plane size={14} />,
  celebration: <PartyPopper size={14} />,
  work: <Briefcase size={14} />,
  personal: <Heart size={14} />,
  sport: <Dumbbell size={14} />,
  study: <BookOpen size={14} />,
};

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  travel: 'Viaje',
  celebration: 'Celebración',
  work: 'Trabajo',
  personal: 'Personal',
  sport: 'Deporte',
  study: 'Estudio',
};

export const MOOD_ICONS: Record<Mood, React.ReactNode> = {
  excellent: <Sparkles size={16} className="text-yellow-500" />,
  good: <Smile size={16} className="text-green-500" />,
  normal: <Meh size={16} className="text-blue-400" />,
  bad: <Frown size={16} className="text-red-500" />,
};

export const EVENT_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
];

export const PREDEFINED_TAGS = [
  { id: 'family', label: 'Familia / Casa', emoji: '🏠' },
  { id: 'work', label: 'Trabajo', emoji: '💼' },
  { id: 'sport', label: 'Deporte', emoji: '🏃' },
  { id: 'party', label: 'Social / Fiesta', emoji: '🎉' },
  { id: 'food', label: 'Comida', emoji: '🍔' },
  { id: 'travel', label: 'Viaje', emoji: '✈️' },
  { id: 'money', label: 'Compras / Finanzas', emoji: '💰' },
  { id: 'study', label: 'Estudio / Lectura', emoji: '📚' },
  { id: 'health', label: 'Salud / Relax', emoji: '🧘' },
  { id: 'creative', label: 'Creatividad / Hobby', emoji: '🎨' },
  { id: 'love', label: 'Pareja', emoji: '❤️' },
  { id: 'gaming', label: 'Ocio / Juegos', emoji: '🎮' },
];

export const DEFAULT_DATA: { days: Record<string, DayEntry>, events: CalendarEvent[] } = {
  days: {
    '2026-01-01': { date: '2026-01-01', title: 'Año Nuevo', notes: 'Comenzando con energía.', mood: 'excellent', tags: ['party', 'family'] },
    '2026-04-14': { date: '2026-04-14', title: 'Lanzamiento Proyecto', notes: 'Finalmente salió a producción.', mood: 'good', tags: ['work'] },
  },
  events: [
    {
      id: 'evt_1',
      title: 'Viaje a Japón',
      startDate: '2026-07-10',
      endDate: '2026-07-16',
      category: 'travel',
      color: '#f97316',
      description: 'Vacaciones de verano'
    },
    {
      id: 'evt_2',
      title: 'Hackathon',
      startDate: '2026-03-05',
      endDate: '2026-03-07',
      category: 'work',
      color: '#3b82f6',
      description: 'Evento de la empresa'
    }
  ]
};