
import React from 'react';
import { BusinessStats } from '../types';

interface DashboardProps {
  stats: BusinessStats;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="space-y-3">
      {/* Tarjeta de Utilidad Principal */}
      <div className="bg-emerald-600 p-6 rounded-[32px] shadow-xl shadow-emerald-100 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-[10px] font-black uppercase opacity-80 tracking-[0.2em] mb-1">Tu Utilidad (Ganancia)</p>
        <p className="text-3xl font-black truncate">${stats.totalProfit.toLocaleString()}</p>
        <p className="text-[10px] font-bold mt-2 opacity-70">Descontando costos de producción</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-600 p-5 rounded-[28px] shadow-lg shadow-blue-100 text-white">
          <p className="text-[9px] font-black uppercase opacity-60 tracking-wider mb-1">Ventas Totales</p>
          <p className="text-xl font-black truncate">${stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-amber-500 p-5 rounded-[28px] shadow-lg shadow-amber-100 text-white">
          <p className="text-[9px] font-black uppercase opacity-60 tracking-wider mb-1">Costo Producción</p>
          <p className="text-xl font-black truncate">${stats.totalCost.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm flex items-center justify-between px-6">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Artículos Vendidos</p>
        <p className="text-xl font-black text-slate-800">{stats.totalSalesCount}</p>
      </div>
    </div>
  );
};
