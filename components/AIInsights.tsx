
import React, { useState } from 'react';
import { getBusinessInsights } from '../services/geminiService';
import { Sale } from '../types';

interface AIInsightsProps {
  sales: Sale[];
  advancedAIEnabled: boolean;
  onToggleAdvancedAI: (enabled: boolean) => void;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ sales, advancedAIEnabled, onToggleAdvancedAI }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (sales.length === 0) return;
    setLoading(true);
    const result = await getBusinessInsights(sales, advancedAIEnabled);
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Selector IA Avanzada */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${advancedAIEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.631.285a2 2 0 01-1.558 0l-.63-.285a6 6 0 00-3.86-.517l-2.388.477a2 2 0 00-1.022.547V21h17.428v-5.572z" />
              </svg>
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">IA Avanzada</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Asesor de Precios y Predicciones</p>
            </div>
          </div>
          <button 
            onClick={() => onToggleAdvancedAI(!advancedAIEnabled)}
            className={`w-14 h-8 rounded-full transition-all relative ${advancedAIEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${advancedAIEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      <div className={`bg-gradient-to-br transition-all duration-500 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden ${advancedAIEnabled ? 'from-indigo-600 via-purple-600 to-indigo-700' : 'from-slate-700 to-slate-800'}`}>
        {/* Decoración IA */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
                <div className="p-2 bg-white/20 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                Gemini AI {advancedAIEnabled ? 'PRO' : 'Lite'}
              </h2>
              <p className="text-white/70 text-sm font-bold mt-2">
                {advancedAIEnabled 
                  ? 'Análisis profundo de márgenes, predicción de masa y estrategia VIP.' 
                  : 'Consejos rápidos para mejorar tus ventas de hoy.'}
              </p>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={loading || sales.length === 0}
              className={`w-full sm:w-auto px-8 py-4 bg-white text-indigo-700 font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase text-xs tracking-widest`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {advancedAIEnabled ? 'Ejecutar Análisis Avanzado' : 'Obtener Consejos'}
                </>
              )}
            </button>
          </div>

          <div className="min-h-[200px] flex flex-col items-center justify-center">
            {insight ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full prose prose-invert max-w-none prose-sm sm:prose-base font-bold text-white/90 leading-relaxed">
                <div className="whitespace-pre-wrap">
                  {insight}
                </div>
              </div>
            ) : (
              <div className="text-center p-10 opacity-40">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-white/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="uppercase text-xs font-black tracking-[0.2em]">Esperando datos...</p>
                <p className="text-[10px] mt-2 italic">Pulsa el botón de arriba para iniciar la magia</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {sales.length === 0 && (
        <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-[28px] flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-amber-800 font-bold text-xs uppercase leading-tight">Necesitas registrar al menos una venta para que la IA pueda analizar tu negocio.</p>
        </div>
      )}
    </div>
  );
};
