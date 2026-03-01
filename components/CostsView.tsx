
import React, { useState } from 'react';
import { BusinessStats, Sale, Expense, ProductionCost } from '../types';

interface CostsViewProps {
  stats: BusinessStats;
  sales: Sale[];
  expenses: Expense[];
  productionCosts: ProductionCost[];
  selectedCostId: string;
  onSelectCost: (id: string) => void;
  onAddProductionCost: (value: number, label: string) => void;
  onDeleteProductionCost: (id: string) => void;
  onOpenCalculator: () => void;
  onDeleteExpense: (id: string) => void;
}

export const CostsView: React.FC<CostsViewProps> = ({ 
  stats, 
  sales, 
  expenses, 
  productionCosts,
  selectedCostId,
  onSelectCost,
  onAddProductionCost,
  onDeleteProductionCost,
  onOpenCalculator, 
  onDeleteExpense 
}) => {
  const [newCostValue, setNewCostValue] = useState('');
  const [newCostLabel, setNewCostLabel] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Costos derivados de ventas (COGS)
  const cogsTotal = sales.reduce((acc, s) => acc + (s.cost * s.quantity), 0);
  
  // Gastos directos (Compras, insumos, etc)
  const expensesTotal = expenses.reduce((acc, e) => acc + e.amount, 0);

  const handleAddCost = () => {
    const val = parseFloat(newCostValue);
    if (isNaN(val) || !newCostLabel) return;
    onAddProductionCost(val, newCostLabel);
    setNewCostValue('');
    setNewCostLabel('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Selector de Costo Predeterminado */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Costo de Producción Fijo</h3>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full"
          >
            {showAddForm ? 'Cancelar' : '+ Añadir Nuevo'}
          </button>
        </div>

        {showAddForm ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="Nombre (Ej: Arepa Queso)" 
                value={newCostLabel}
                onChange={(e) => setNewCostLabel(e.target.value)}
                className="px-4 py-3 bg-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input 
                type="number" 
                placeholder="Valor $" 
                value={newCostValue}
                onChange={(e) => setNewCostValue(e.target.value)}
                className="px-4 py-3 bg-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button 
              onClick={handleAddCost}
              className="w-full py-3 bg-blue-600 text-white font-black rounded-xl text-xs uppercase"
            >
              Guardar Costo Predeterminado
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex gap-2">
              <select 
                value={selectedCostId}
                onChange={(e) => onSelectCost(e.target.value)}
                className="flex-1 px-4 py-4 bg-slate-100 border-none rounded-2xl text-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
              >
                {productionCosts.map(cost => (
                  <option key={cost.id} value={cost.id}>
                    {cost.label} - ${cost.value.toLocaleString()}
                  </option>
                ))}
              </select>
              {selectedCostId !== 'default' && (
                <button 
                  onClick={() => onDeleteProductionCost(selectedCostId)}
                  className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center active:bg-red-500 active:text-white transition-all border border-red-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-bold italic ml-2 mt-1">
              * Este costo se aplicará automáticamente a todas las nuevas ventas.
            </p>
          </div>
        )}
      </div>

      {/* Resumen de Inversión */}
      <div className="bg-amber-500 p-8 rounded-[36px] shadow-2xl shadow-amber-100 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div className="relative z-10">
          <p className="text-[11px] font-black uppercase opacity-70 tracking-[0.2em] mb-2">Inversión Total Hoy</p>
          <p className="text-4xl font-black truncate">${stats.totalCost.toLocaleString()}</p>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20">
              <p className="text-[9px] font-black uppercase opacity-60">En Ventas (COGS)</p>
              <p className="text-base font-black">${cogsTotal.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20">
              <p className="text-[9px] font-black uppercase opacity-60">Gastos/Insumos</p>
              <p className="text-base font-black">${expensesTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onOpenCalculator}
          className="mt-6 w-full py-4 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center gap-3 backdrop-blur-md transition-all active:scale-95 border border-white/30 font-black text-xs uppercase tracking-widest"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Abrir Calculadora
        </button>
      </div>

      {/* Lista de Gastos/Insumos */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Gastos e Insumos</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{expenses.length} Registros</span>
        </div>
        
        {expenses.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold text-sm">No has registrado gastos independientes hoy.</p>
            <p className="text-[10px] text-slate-300 font-bold mt-2 uppercase">Presiona el botón + para añadir una compra</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map(expense => (
              <div key={expense.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group animate-in slide-in-from-bottom-2">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-sm font-black text-slate-800 truncate">{expense.description}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase">{expense.category}</span>
                    <span className="text-[9px] font-bold text-slate-300">{expense.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-lg font-black text-slate-900 leading-none">${expense.amount.toLocaleString()}</p>
                  <button 
                    onClick={() => onDeleteExpense(expense.id)}
                    className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl active:bg-red-500 active:text-white transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-800 p-6 rounded-[32px] text-white/90">
        <h4 className="font-black text-[10px] uppercase tracking-widest mb-2 text-amber-400">¿Qué registrar aquí?</h4>
        <p className="text-[11px] font-bold leading-relaxed italic">
          "Aquí puedes anotar compras de materiales (harina, queso, gas), transporte o cualquier gasto que no esté incluido directamente en el costo de cada arepilla vendida."
        </p>
      </div>
    </div>
  );
};
