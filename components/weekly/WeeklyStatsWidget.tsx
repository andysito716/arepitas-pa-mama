import React from 'react';
import { WeeklyStats } from '../../types/weekly';
import { formatCurrency } from '../../services/weeklyDateUtils';

interface WeeklyStatsWidgetProps {
  stats: WeeklyStats;
}

export const WeeklyStatsWidget: React.FC<WeeklyStatsWidgetProps> = ({ stats }) => {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      {/* Main Highlights Row - Compact Mobile First */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
        {/* Ganancia Neta */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-3 sm:p-3.5 rounded-2xl text-white shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
              Ganancia Neta
            </span>
            <span className="text-[10px] font-bold text-white bg-white/20 px-1.5 py-0.2 rounded-md">
              {stats.marginPercent}% Margen
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black mt-1 truncate">
            {formatCurrency(stats.totalProfit)}
          </p>
          <p className="text-[10px] text-emerald-100 font-medium truncate mt-0.5">
            Libre de costos de insumos
          </p>
        </div>

        {/* Ventas Totales */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 sm:p-3.5 rounded-2xl text-white shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">
              Ventas Totales
            </span>
            <span className="text-[10px] font-bold text-blue-100 bg-white/20 px-1.5 py-0.2 rounded-md">
              {stats.totalQuantity} und.
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black mt-1 truncate">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <p className="text-[10px] text-blue-100 font-medium truncate mt-0.5">
            {stats.salesCount} pedidos registrados
          </p>
        </div>

        {/* Costos de Producción */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 sm:p-3.5 rounded-2xl text-white shadow-xs relative overflow-hidden flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">
            Costo de Insumos
          </span>
          <p className="text-xl sm:text-2xl font-black mt-1 truncate">
            {formatCurrency(stats.totalCost)}
          </p>
          <p className="text-[10px] text-amber-100 font-medium truncate mt-0.5">
            Materia prima invertida
          </p>
        </div>
      </div>

      {/* Secondary Highlights - Ultra-compact strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
        <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between px-2.5">
          <span className="text-[10px] font-bold uppercase text-slate-400">Artículos:</span>
          <span className="text-xs font-black text-slate-800">{stats.totalQuantity} und.</span>
        </div>

        <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between px-2.5">
          <span className="text-[10px] font-bold uppercase text-slate-400">Ventas:</span>
          <span className="text-xs font-black text-slate-800">{stats.salesCount} regs.</span>
        </div>

        <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between px-2.5">
          <span className="text-[10px] font-bold uppercase text-slate-400">Mejor día:</span>
          <span className="text-xs font-black text-slate-800 truncate max-w-[80px]">
            {stats.bestDay ? stats.bestDay.dayName : '—'}
          </span>
        </div>

        <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between px-2.5">
          <span className="text-[10px] font-bold uppercase text-slate-400">Top producto:</span>
          <span className="text-xs font-black text-blue-600 truncate max-w-[90px]" title={stats.bestProduct?.name || ''}>
            {stats.bestProduct ? stats.bestProduct.name : '—'}
          </span>
        </div>
      </div>
    </div>
  );
};
