
import React, { useState } from 'react';
import { getBusinessInsights } from '../services/geminiService';
import { Sale } from '../types';

interface AIInsightsProps {
  sales: Sale[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ sales }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (sales.length === 0) return;
    setLoading(true);
    const result = await getBusinessInsights(sales);
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="mt-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Insights Inteligentes (Gemini AI)
          </h2>
          <p className="text-indigo-100 text-sm mt-1">Recibe consejos personalizados basados en tus ventas.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || sales.length === 0}
          className={`px-4 py-2 bg-white text-indigo-600 font-bold rounded-lg shadow-sm hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? 'Analizando...' : 'Generar Consejos'}
        </button>
      </div>

      {insight && (
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mt-4 border border-white/20 animate-fade-in whitespace-pre-wrap">
          {insight}
        </div>
      )}

      {sales.length === 0 && !insight && (
        <p className="text-indigo-200 italic mt-2">Añade al menos una venta para recibir sugerencias de la IA.</p>
      )}
    </div>
  );
};
