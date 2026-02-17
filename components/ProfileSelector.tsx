import React, { useState } from 'react';
import { UserProfile } from '../types';
import { EVENT_COLORS, YEAR } from '../constants';
import { Plus, User, X, Trash2, LogIn } from 'lucide-react';
import { generateId } from '../utils';

interface ProfileSelectorProps {
  profiles: UserProfile[];
  onSelectProfile: (profile: UserProfile) => void;
  onCreateProfile: (profile: UserProfile) => void;
  onDeleteProfile: (id: string) => void;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({ profiles, onSelectProfile, onCreateProfile, onDeleteProfile }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(EVENT_COLORS[0]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newProfile: UserProfile = {
      id: generateId(),
      name: newName.trim(),
      color: selectedColor,
      createdAt: new Date().toISOString()
    };

    onCreateProfile(newProfile);
    setIsCreating(false);
    setNewName('');
    setSelectedColor(EVENT_COLORS[0]);
  };

  const PROFILE_COLORS = EVENT_COLORS.slice(0, 6); // Use first 6 colors for avatars

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-12">
        
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">YEAR CANVAS {YEAR}</h1>
          <p className="text-slate-500 font-medium">¿Quién está planeando hoy?</p>
        </div>

        {/* Profile Grid */}
        <div className="flex flex-wrap items-center justify-center gap-8 animate-in fade-in duration-500">
          {profiles.map(profile => (
            <div key={profile.id} className="group relative">
               {/* Delete Button (visible on hover) */}
               <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if(confirm(`¿Borrar perfil de ${profile.name} y todos sus datos?`)) {
                    onDeleteProfile(profile.id);
                  }
                }}
                className="absolute -top-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50"
              >
                <Trash2 size={14} />
              </button>

              <button 
                onClick={() => onSelectProfile(profile)}
                className="flex flex-col items-center gap-4 transition-transform group-hover:scale-105"
              >
                <div 
                  className="w-32 h-32 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-slate-200 border-4 border-white transition-all group-hover:shadow-xl"
                  style={{ backgroundColor: profile.color }}
                >
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-lg font-semibold text-slate-700 group-hover:text-slate-900">
                  {profile.name}
                </span>
              </button>
            </div>
          ))}

          {/* Add Profile Button */}
          {!isCreating && (
            <button 
              onClick={() => setIsCreating(true)}
              className="flex flex-col items-center gap-4 transition-transform hover:scale-105 group"
            >
              <div className="w-32 h-32 rounded-2xl flex items-center justify-center bg-white text-slate-300 border-2 border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-400 transition-all">
                <Plus size={48} />
              </div>
              <span className="text-lg font-medium text-slate-400 group-hover:text-slate-500">
                Nuevo Perfil
              </span>
            </button>
          )}
        </div>

        {/* Create Profile Form */}
        {isCreating && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Crear Perfil</h2>
                <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="space-y-6">
                {/* Avatar Preview */}
                <div className="flex justify-center">
                  <div 
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold transition-colors shadow-inner"
                    style={{ backgroundColor: selectedColor }}
                  >
                    {newName ? newName.charAt(0).toUpperCase() : <User size={32} />}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 transition-all font-semibold text-slate-900 placeholder:text-slate-400"
                    placeholder="Tu nombre"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Color</label>
                  <div className="flex gap-2 justify-between">
                    {PROFILE_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`w-8 h-8 rounded-full transition-transform ${selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-900' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={!newName.trim()}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-slate-900/10"
                >
                  Empezar
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
      
      <div className="fixed bottom-6 text-slate-400 text-xs font-medium">
         Almacenamiento Local • Sin Servidor • Privado
      </div>
    </div>
  );
};

export default ProfileSelector;