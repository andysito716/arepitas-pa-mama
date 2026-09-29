import React from 'react';
import { WeekInfo } from '../../types/weekly';
import { getPreviousWeekId, getNextWeekId, getWeekInfo } from '../../services/weeklyDateUtils';

interface WeeklyHeaderProps {
  currentWeek: WeekInfo;
  onSelectWeek: (weekId: string) => void;
  onToggleToOldApp: () => void;
  isOrganizing: boolean;
  onToggleOrganizing: () => void;
}

export const WeeklyHeader: React.FC<WeeklyHeaderProps> = ({
  currentWeek,
  onSelectWeek,
  onToggleToOldApp,
  isOrganizing,
  onToggleOrganizing,
}) => {
  const thisWeek = getWeekInfo();
  const isThisWeek = currentWeek.id === thisWeek.id;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Logo and Week title */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Sistema Semanal
                </span>
                {isThisWeek && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Semana en Curso
                  </span>
                )}
              </div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-tight">
                {currentWeek.label}
              </h1>
            </div>
          </div>

          {/* Toggle Old App Button on Mobile */}
          <div className="sm:hidden flex items-center gap-2">
            <button
              onClick={onToggleToOldApp}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow flex items-center gap-1.5 active:scale-95 transition-transform"
              title="Volver a la versión anterior"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>antes</span>
            </button>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Week Selector Nav */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => onSelectWeek(getPreviousWeekId(currentWeek.id))}
              className="px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-white hover:shadow-xs transition-all active:scale-95 font-bold text-xs flex items-center gap-1"
              title="Semana anterior"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden md:inline">Anterior</span>
            </button>

            {!isThisWeek && (
              <button
                onClick={() => onSelectWeek(thisWeek.id)}
                className="px-2.5 py-1.5 rounded-xl bg-blue-600 text-white shadow-xs font-bold text-xs transition-all active:scale-95"
              >
                Hoy
              </button>
            )}

            <button
              onClick={() => onSelectWeek(getNextWeekId(currentWeek.id))}
              className="px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-white hover:shadow-xs transition-all active:scale-95 font-bold text-xs flex items-center gap-1"
              title="Semana siguiente"
            >
              <span className="hidden md:inline">Siguiente</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Toggle Move / Rearrange Mode */}
          <button
            onClick={onToggleOrganizing}
            className={`px-3 py-2 rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 border active:scale-95 cursor-pointer ${
              isOrganizing
                ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Activar modo mover y ordenar secciones"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="hidden sm:inline">{isOrganizing ? 'Listo' : 'Mover Secciones'}</span>
          </button>

          {/* Desktop Toggle Old App Button */}
          <div className="hidden sm:block">
            <button
              onClick={onToggleToOldApp}
              className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-full font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 border border-slate-700 flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer"
              title="Volver a la versión anterior"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>antes</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
