
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Suggestion } from '../types';

interface SuggestionsSectionProps {
  suggestions: Suggestion[];
  onAddSuggestion: (content: string) => void;
  onDeleteSuggestion: (id: string) => void;
}

export const SuggestionsSection: React.FC<SuggestionsSectionProps> = ({ suggestions, onAddSuggestion, onDeleteSuggestion }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuggestion.trim()) return;
    onAddSuggestion(newSuggestion);
    setNewSuggestion('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-xl uppercase tracking-tight leading-none">Buzón de Sugerencias</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Se borran automáticamente cada semana</p>
          </div>
        </div>
        <button 
          id="tutorial-add-suggestion"
          onClick={() => setIsAdding(!isAdding)}
          className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center active:scale-90 transition-all"
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
            className="bg-white p-6 rounded-[32px] border-2 border-indigo-100 shadow-2xl space-y-4 relative z-10"
          >
            <textarea
              autoFocus
              value={newSuggestion}
              onChange={(e) => setNewSuggestion(e.target.value)}
              placeholder="¿Qué podemos mejorar hoy?"
              className="w-full p-6 bg-slate-50 rounded-2xl text-base font-bold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-500/10 min-h-[120px] resize-none border-none"
            />
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-xs uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-100"
              >
                Enviar Sugerencia
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {suggestions.length === 0 && !isAdding && (
          <div className="bg-slate-50 p-8 text-center rounded-[32px] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">El buzón está vacío</p>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {suggestions.map((suggestion) => (
            <motion.div
              layout
              key={suggestion.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group"
            >
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700">{suggestion.content}</p>
                <p className="text-[9px] font-black text-indigo-400 uppercase mt-2">{suggestion.date}</p>
              </div>
              <button 
                onClick={() => onDeleteSuggestion(suggestion.id)}
                className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all active:bg-red-500 active:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
