import React from 'react';
import { WeeklyStats } from '../../types/weekly';
import { formatCurrency } from '../../services/weeklyDateUtils';

interface WeeklyStatsWidgetProps {
  stats: WeeklyStats;
}

export const WeeklyStatsWidget: React.FC<WeeklyStatsWidgetProps> = ({ stats }) => {
  return (
    <div className="space-y-3">
      {/* Main Highlights Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Ganancia Neta */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-3xl text-white shadow-lg shadow-emerald-500/15 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-15">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
            Ganancia Neta Semanal
          </span>
          <p className="text-2xl sm:text-3xl font-black mt-1 truncate">
            {formatCurrency(stats.totalProfit)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-100">
            <span className="bg-white/20 px-2 py-0.5 rounded-full">
              {stats.marginPercent}% Margen
            </span>
            <span>de ganancia</span>
          </div>
        </div>

        {/* Ventas Totales */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-3xl text-white shadow-lg shadow-blue-500/15 relative overflow-hidden">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">
            Ingresos Totales (Ventas)
          </span>
          <p className="text-2xl sm:text-3xl font-black mt-1 truncate">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <p className="text-xs font-semibold text-blue-100 mt-2">
            {stats.salesCount} ventas ({stats.totalQuantity} unidades)
          </p>
        </div>

        {/* Costos de Producción */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-3xl text-white shadow-lg shadow-amber-500/15 relative overflow-hidden">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">
            Costo de Producción
          </span>
          <p className="text-2xl sm:text-3xl font-black mt-1 truncate">
            {formatCurrency(stats.totalCost)}
          </p>
          <p className="text-xs font-semibold text-amber-100 mt-2">
            Insumos y materia prima invertida
          </p>
        </div>
      </div>

      {/* Secondary Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
            Artículos Vendidos
          </span>
          <p className="text-lg font-black text-slate-800 mt-0.5">
            {stats.totalQuantity} und.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
            Registros
          </span>
          <p className="text-lg font-black text-slate-800 mt-0.5">
            {stats.salesCount} transacciones
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
            Mejor Día
          </span>
          <p className="text-sm font-black text-slate-800 mt-0.5 truncate">
            {stats.bestDay ? `${stats.bestDay.dayName}` : 'Sin datos'}
          </p>
          {stats.bestDay && (
            <span className="text-[10px] font-bold text-emerald-600 block truncate">
              {formatCurrency(stats.bestDay.revenue)}
            </span>
          )}
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
            Producto Estrella
          </span>
          <p className="text-sm font-black text-slate-800 mt-0.5 truncate" title={stats.bestProduct?.name || ''}>
            {stats.bestProduct ? stats.bestProduct.name : 'Sin datos'}
          </p>
          {stats.bestProduct && (
            <span className="text-[10px] font-bold text-blue-600 block truncate">
              {stats.bestProduct.quantity} und. vendidas
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
