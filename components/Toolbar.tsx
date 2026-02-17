import React from 'react';
import { Plus, Download, Upload, RefreshCw, Calendar as CalendarIcon, LogOut } from 'lucide-react';
import { YEAR } from '../constants';
import { UserProfile } from '../types';

interface ToolbarProps {
  user: UserProfile | null;
  onNewEvent: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  onLogout: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ user, onNewEvent, onExport, onImport, onReset, onLogout }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur shadow-sm border-b border-gray-200">
      <div className="max-w-[1920px] mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white p-2 rounded-lg">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">YEAR CANVAS</h1>
            <p className="text-xs text-slate-500 font-medium tracking-widest">{YEAR}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user && (
             <div className="flex items-center gap-3 mr-2 pr-4 border-r border-gray-200">
                <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm"
                    style={{ backgroundColor: user.color }}
                >
                    {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-slate-700 hidden sm:inline">{user.name}</span>
             </div>
          )}

          <button 
            onClick={onNewEvent}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo Evento</span>
          </button>
          
          <div className="flex items-center bg-gray-100 rounded-md p-0.5">
             <button 
                onClick={onExport}
                className="p-2 text-gray-600 hover:text-slate-900 hover:bg-white rounded-md transition-all shadow-none hover:shadow-sm"
                title="Exportar JSON"
            >
                <Download size={18} />
            </button>
            <button 
                onClick={onImport}
                className="p-2 text-gray-600 hover:text-slate-900 hover:bg-white rounded-md transition-all shadow-none hover:shadow-sm"
                title="Importar JSON"
            >
                <Upload size={18} />
            </button>
             <button 
                onClick={onReset}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-white rounded-md transition-all shadow-none hover:shadow-sm"
                title="Resetear todo"
            >
                <RefreshCw size={18} />
            </button>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-md text-sm font-medium transition-colors ml-2"
            title="Cambiar Perfil"
          >
            <LogOut size={18} />
          </button>

        </div>
      </div>
    </header>
  );
};

export default Toolbar;