
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Note } from '../types';

interface NotesSectionProps {
  notes: Note[];
  onAddNote: (content: string) => void;
  onDeleteNote: (id: string) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ notes, onAddNote, onDeleteNote }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(newNote);
    setNewNote('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-xl uppercase tracking-tight leading-none">Bloc de Notas</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronizado con tu negocio</p>
          </div>
        </div>
        <button 
          id="tutorial-add-note"
          onClick={() => setIsAdding(!isAdding)}
          className="w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center active:scale-90 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-[32px] border-2 border-blue-100 shadow-2xl space-y-4 relative z-10"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Nueva Nota</span>
            </div>
            <textarea
              autoFocus
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escribe algo importante..."
              className="w-full p-6 bg-slate-50 rounded-2xl text-base font-bold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-blue-500/10 min-h-[150px] resize-none border-none"
            />
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all"
              >
                Guardar Nota
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="relative min-h-[400px]">
        {notes.length === 0 && !isAdding && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-slate-400 font-black text-sm uppercase tracking-widest">No hay notas guardadas</p>
            <p className="text-slate-300 font-bold text-[10px] mt-2 italic">Tus notas se guardan en la nube automáticamente</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {notes.map((note, index) => (
              <motion.div
                key={note.id}
                drag
                dragMomentum={false}
                initial={{ opacity: 0, y: 20, rotate: index % 2 === 0 ? -1 : 1 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileDrag={{ scale: 1.05, zIndex: 50, boxShadow: "0 30px 60px rgba(0,0,0,0.15)" }}
                className="relative cursor-grab active:cursor-grabbing"
              >
                {/* Notebook Style Note */}
                <div className="bg-[#fdf6e3] rounded-lg shadow-lg overflow-hidden border border-[#eee8d5] min-h-[200px] flex flex-col">
                  {/* Rings / Spiral */}
                  <div className="h-10 bg-[#eee8d5] flex items-center justify-around px-4 border-b border-[#dcd6c3]">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(r => (
                      <div key={r} className="w-4 h-4 rounded-full bg-slate-700 shadow-inner flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500 opacity-50" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Paper Content */}
                  <div className="p-8 flex-1 relative" style={{ 
                    backgroundImage: 'linear-gradient(#94d2ff 1px, transparent 1px)',
                    backgroundSize: '100% 2rem',
                    lineHeight: '2rem'
                  }}>
                    {/* Vertical Margin Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-red-200" />
                    
                    <div className="pl-4">
                      <p className="text-lg font-bold text-slate-800 whitespace-pre-wrap break-words">
                        {note.content}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-white/30 border-t border-[#eee8d5] flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{note.date}</span>
                    <button 
                      onClick={() => onDeleteNote(note.id)}
                      className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
