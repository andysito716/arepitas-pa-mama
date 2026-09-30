import React from 'react';
import { BusinessStats } from '../types';

interface DashboardProps {
  stats: BusinessStats;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="space-y-2">
      {/* Tarjeta de Utilidad Principal - Compact */}
      <div id="tutorial-profit-card" className="bg-emerald-600 p-3.5 sm:p-4 rounded-2xl shadow-xs text-white relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase opacity-85 tracking-wider">Tu Utilidad (Ganancia)</p>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-md font-bold">Hoy</span>
        </div>
        <p className="text-2xl sm:text-3xl font-black truncate mt-0.5">${stats.totalProfit.toLocaleString()}</p>
        <p className="text-[10px] font-medium opacity-80 mt-0.5">Descontando insumos y costos</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-600 p-3 rounded-xl text-white shadow-2xs">
          <p className="text-[9px] font-black uppercase opacity-75 tracking-wider">Ventas Totales</p>
          <p className="text-lg font-black truncate">${stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-amber-500 p-3 rounded-xl text-white shadow-2xs">
          <p className="text-[9px] font-black uppercase opacity-75 tracking-wider">Costo Insumos</p>
          <p className="text-lg font-black truncate">${stats.totalCost.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between px-3">
        <p className="text-[10px] font-bold uppercase text-slate-400">Artículos Vendidos</p>
        <p className="text-base font-black text-slate-800">{stats.totalSalesCount} und.</p>
      </div>
    </div>
  );
};
