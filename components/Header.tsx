
import React from 'react';

interface HeaderProps {
  onToggleDespues?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleDespues }) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 h-11 sm:h-12 w-full px-3 flex items-center justify-between sticky top-0 z-40 shadow-2xs shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
          A
        </div>
        <span className="font-black text-xs sm:text-sm text-slate-800 tracking-tight">
          Arepitas Pa' Mamá
        </span>
      </div>
      {onToggleDespues && (
        <button
          onClick={onToggleDespues}
          className="h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
          title="Ir al nuevo proyecto"
        >
          <span>despues</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      )}
    </header>
  );
};