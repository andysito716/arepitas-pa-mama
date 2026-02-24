
import React from 'react';
import { DailyArchive } from '../types';

interface HistoryViewProps {
  history: DailyArchive[];
  onDeleteDay: (id: string) => void;
  onEditDay: (archive: DailyArchive) => void;
  onQuickAdd: (archive: DailyArchive) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onDeleteDay, onEditDay, onQuickAdd }) => {
  if (history.length === 0) {
    return (
      <div className="py-12 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm font-medium">Historial vacío.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
      {history.map((day) => (
        <div key={day.id} className="group bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all relative">
          {/* Cabecera del Día */}
          <div className="bg-slate-800 p-4 text-white">
            <div className="flex justify-between items-center">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Cierre de Caja</p>
                <h4 className="text-sm font-black truncate capitalize">{day.date}</h4>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <p className="text-lg font-black text-emerald-400 leading-none">${day.totalRevenue.toLocaleString()}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{day.totalItems} vendid.</p>
                </div>
                
                {/* BOTÓN AÑADIR VENTA (Signo +) */}
                <button
                  onClick={() => onQuickAdd(day)}
                  className="flex items-center justify-center w-10 h-10 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl transition-all border border-emerald-500/30 active:scale-90"
                  title="Añadir nueva venta a este día"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                {/* BOTÓN REABRIR/EDITAR (Lápiz) */}
                <button
                  onClick={() => onEditDay(day)}
                  className="flex items-center justify-center w-10 h-10 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl transition-all border border-blue-500/30 active:scale-90"
                  title="Reabrir este día para editar todo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>

                {/* BOTÓN DE BORRADO */}
                <button
                  onClick={() => onDeleteDay(day.id)}
                  className="flex items-center justify-center w-10 h-10 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/30 active:scale-90"
                  title="Borrar esta jornada permanentemente"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Resumen de Ventas */}
          <div className="p-3 space-y-2">
            {day.sales.slice(0, 3).map((s) => (
              <div key={s.id} className="flex justify-between items-center text-[11px] bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                <div className="truncate pr-2">
                  <span className="font-black text-slate-700">{s.buyerName}</span>
                  <span className="text-slate-500 ml-1 italic">({s.productName})</span>
                </div>
                <span className="font-bold text-slate-900">
                  ${(s.price * s.quantity).toFixed(0)}
                </span>
              </div>
            ))}
            {day.sales.length > 3 && (
              <p className="text-[10px] text-center text-slate-400 font-bold py-1">
                + {day.sales.length - 3} ventas más en este cierre
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
