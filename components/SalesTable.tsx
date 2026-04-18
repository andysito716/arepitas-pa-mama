
import React from 'react';
import { Sale } from '../types';

interface SalesTableProps {
  sales: Sale[];
  onDeleteSale: (id: string) => void;
  onEditSale: (sale: Sale) => void;
  onUpdateSale: (sale: Sale) => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({ sales, onDeleteSale, onEditSale }) => {
  if (sales.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
        <p className="text-slate-400 font-bold text-sm">No hay ventas registradas hoy.</p>
      </div>
    );
  }

  const getContrastColor = (hexcolor: string | undefined): { text: string, muted: string, border: string, badgeBg: string, badgeText: string } => {
    if (!hexcolor) return { 
      text: 'text-slate-800', 
      muted: 'text-slate-400', 
      border: 'border-slate-200',
      badgeBg: '', // Use default
      badgeText: '' 
    };
    
    // Normalize hex
    const hex = hexcolor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    const isDark = yiq < 128;

    return {
      text: isDark ? 'text-white' : 'text-slate-900',
      muted: isDark ? 'text-white/60' : 'text-slate-500',
      border: isDark ? 'border-white/10' : 'border-black/5',
      badgeBg: isDark ? 'bg-white/20' : 'bg-black/10',
      badgeText: isDark ? 'text-white' : 'text-slate-900'
    };
  };

  return (
    <div className="space-y-3">
      {sales.map((sale) => {
        const profit = (sale.price - (sale.cost || 0)) * sale.quantity;
        const theme = getContrastColor(sale.color);
        const hasColor = !!sale.color;

        return (
          <div 
            key={sale.id} 
            className={`${hasColor ? '' : 'bg-white'} p-4 rounded-3xl border ${theme.border} shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 transition-all`}
            style={sale.color ? { backgroundColor: sale.color } : {}}
          >
            <div className="flex-1 min-w-0 pr-4">
              <h4 className={`text-sm font-black ${theme.text} truncate`}>{sale.productName}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold ${theme.muted} uppercase tracking-tight truncate`}>{sale.buyerName}</span>
                <span className={theme.muted}>•</span>
                <span className={`text-[9px] font-bold ${theme.muted}`}>{sale.date}</span>
                <span className={theme.muted}>•</span>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${hasColor ? `${theme.badgeBg} ${theme.badgeText}` : (sale.buyerType === 'distribuidor' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600')}`}>
                  {sale.buyerType === 'distribuidor' ? 'Dist' : 'Comp'}
                </span>
                <span className={theme.muted}>•</span>
                <span className={`text-[10px] font-bold ${hasColor ? theme.text : 'text-emerald-600'} uppercase`}>Util: ${profit.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className={`text-base font-black ${theme.text} leading-none`}>${(sale.price * sale.quantity).toLocaleString()}</p>
                <p className={`text-[10px] ${theme.muted} font-bold mt-1`}>${sale.price.toLocaleString()} c/u</p>
              </div>
              
              <div className="flex gap-1">
                <button 
                  onClick={() => onEditSale(sale)}
                  className={`w-9 h-9 flex items-center justify-center ${hasColor ? 'bg-white/20 text-white hover:bg-white/40' : 'bg-blue-50 text-blue-500 hover:bg-blue-100'} rounded-xl active:scale-90 transition-all shadow-sm`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>

                <button 
                  onClick={() => onDeleteSale(sale.id)}
                  className={`w-9 h-9 flex items-center justify-center ${hasColor ? 'bg-white/20 text-white hover:bg-white/40' : 'bg-red-50 text-red-500 hover:bg-red-100'} rounded-xl active:scale-90 transition-all shadow-sm`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
