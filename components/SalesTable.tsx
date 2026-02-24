
import React from 'react';
import { Sale } from '../types';

interface SalesTableProps {
  sales: Sale[];
  onDeleteSale: (id: string) => void;
  onUpdateSale: (sale: Sale) => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({ sales, onDeleteSale }) => {
  if (sales.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
        <p className="text-slate-400 font-bold text-sm">No hay ventas registradas hoy.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sales.map((sale) => {
        const profit = (sale.price - (sale.cost || 0)) * sale.quantity;
        return (
          <div key={sale.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="text-sm font-black text-slate-800 truncate">{sale.productName}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{sale.buyerName}</span>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${sale.buyerType === 'distribuidor' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                  {sale.buyerType === 'distribuidor' ? 'Dist' : 'Comp'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Util: ${profit.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-base font-black text-slate-900 leading-none">${(sale.price * sale.quantity).toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">${sale.price.toLocaleString()} c/u</p>
              </div>
              <button 
                onClick={() => onDeleteSale(sale.id)}
                className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl active:bg-red-500 active:text-white transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
