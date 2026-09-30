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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-2xs">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand / Week label */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight truncate leading-tight">
                {currentWeek.label}
              </h1>
              {isThisWeek && (
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md shrink-0">
                  Actual
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-semibold truncate leading-tight hidden xs:block">
              Arepitas Pa' Mamá · Semanal
            </p>
          </div>
        </div>

        {/* Right: Controls & Week Selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Week Selector Nav */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => onSelectWeek(getPreviousWeekId(currentWeek.id))}
              className="w-7 h-7 sm:w-8 sm:h-7 rounded-lg text-slate-700 hover:bg-white transition-all flex items-center justify-center active:scale-95 cursor-pointer"
              title="Semana anterior"
              aria-label="Semana anterior"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {!isThisWeek && (
              <button
                onClick={() => onSelectWeek(thisWeek.id)}
                className="px-2 h-7 rounded-lg bg-blue-600 text-white font-black text-[10px] transition-all active:scale-95 cursor-pointer"
              >
                Hoy
              </button>
            )}

            <button
              onClick={() => onSelectWeek(getNextWeekId(currentWeek.id))}
              className="w-7 h-7 sm:w-8 sm:h-7 rounded-lg text-slate-700 hover:bg-white transition-all flex items-center justify-center active:scale-95 cursor-pointer"
              title="Semana siguiente"
              aria-label="Semana siguiente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Toggle Move / Rearrange Mode */}
          <button
            onClick={onToggleOrganizing}
            className={`h-7 px-2 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 border active:scale-95 cursor-pointer ${
              isOrganizing
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-1 ring-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Activar modo mover y ordenar secciones"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="hidden sm:inline">{isOrganizing ? 'Listo' : 'Mover'}</span>
          </button>

          {/* Toggle Old App Button */}
          <button
            onClick={onToggleToOldApp}
            className="h-7 px-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
            title="Volver a la versión anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>antes</span>
          </button>
        </div>
      </div>
    </header>
  );
};
