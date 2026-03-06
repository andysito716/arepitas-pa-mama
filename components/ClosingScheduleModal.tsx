
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClosingSchedule } from '../types';

interface ClosingScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: ClosingSchedule[];
  onAddSchedule: (time: string) => void;
  onDeleteSchedule: (id: string) => void;
}

export const ClosingScheduleModal: React.FC<ClosingScheduleModalProps> = ({ 
  isOpen, 
  onClose, 
  schedules, 
  onAddSchedule, 
  onDeleteSchedule 
}) => {
  const [newTime, setNewTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime) return;
    onAddSchedule(newTime);
    setNewTime('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border-2 border-blue-50"
      >
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Horarios de Cierre</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configura cierres automáticos</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-3">
            <input 
              type="time" 
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="flex-1 p-4 bg-slate-50 rounded-2xl text-base font-black text-slate-800 border-none outline-none focus:ring-4 focus:ring-blue-500/10"
            />
            <button 
              type="submit"
              className="px-6 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 active:scale-95 transition-all uppercase text-xs tracking-widest"
            >
              Añadir
            </button>
          </form>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {schedules.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-black text-xs uppercase tracking-widest">No hay horarios configurados</p>
              </div>
            ) : (
              schedules.map((s) => (
                <div key={s.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-lg font-black text-slate-800">{s.time}</span>
                  <button 
                    onClick={() => onDeleteSchedule(s.id)}
                    className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
              <span className="font-black uppercase">Nota:</span> Estos horarios son compartidos por todo el negocio. La app te avisará cuando sea hora de cerrar la caja.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
