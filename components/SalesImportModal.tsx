
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sale } from '../types';

interface SalesImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingSales: Omit<Sale, 'id' | 'cost'>[];
  onConfirmDay: (sales: Omit<Sale, 'id' | 'cost'>[]) => Promise<void>;
  loading: boolean;
}

export const SalesImportModal: React.FC<SalesImportModalProps> = ({ 
  isOpen, 
  onClose, 
  pendingSales: initialSales, 
  onConfirmDay,
  loading
}) => {
  const [editableSales, setEditableSales] = useState<Omit<Sale, 'id' | 'cost'>[]>([]);
  const [currentGroupIdx, setCurrentGroupIdx] = useState(0);

  // Update internal state when props change
  useEffect(() => {
    if (isOpen) {
      setEditableSales(initialSales);
      setCurrentGroupIdx(0);
    }
  }, [isOpen, initialSales]);

  // Group by date
  const groups = useMemo(() => {
    const grouped: Record<string, Omit<Sale, 'id' | 'cost'>[]> = {};
    editableSales.forEach(s => {
      if (!grouped[s.date]) grouped[s.date] = [];
      grouped[s.date].push(s);
    });
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  }, [editableSales]);

  if (!isOpen) return null;

  const currentGroup = groups[currentGroupIdx];
  const dateStr = currentGroup?.[0] || '';
  const salesInGroup = currentGroup?.[1] || [];

  const handleUpdateField = (idxInGlobal: number, field: keyof Omit<Sale, 'id' | 'cost'>, value: any) => {
    setEditableSales(prev => {
      const updated = [...prev];
      updated[idxInGlobal] = { ...updated[idxInGlobal], [field]: value };
      return updated;
    });
  };

  const handleDeleteItem = (idxInGlobal: number) => {
    setEditableSales(prev => prev.filter((_, i) => i !== idxInGlobal));
  };

  const handleConfirmCurrentDay = async () => {
    await onConfirmDay(salesInGroup);
    if (currentGroupIdx < groups.length - 1) {
      setCurrentGroupIdx(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const findGlobalIdx = (saleToFind: Omit<Sale, 'id' | 'cost'>) => {
    return editableSales.findIndex(s => s === saleToFind);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-[700px] rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header con Progreso */}
        <div className="bg-indigo-600 p-8 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 rounded-[20px] flex items-center justify-center text-white border-2 border-white/20">
              <span className="text-xl font-black">{currentGroupIdx + 1}</span>
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Ventas del {dateStr}</h2>
              <p className="text-indigo-100 text-sm font-bold mt-1">
                Paso {currentGroupIdx + 1} de {groups.length}. Estas ventas se guardarán juntas.
              </p>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <motion.div 
              className="h-full bg-white shadow-[0_0_10px_white]"
              initial={{ width: 0 }}
              animate={{ width: `${((currentGroupIdx + 1) / groups.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Lista editable */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {salesInGroup.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 opacity-40"
              >
                  <p className="font-black text-slate-800 uppercase text-xs tracking-widest">No hay ventas para este día.</p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {salesInGroup.map((sale, idx) => {
                  const globalIdx = findGlobalIdx(sale);
                  return (
                    <motion.div 
                      key={`${sale.date}-${idx}`}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
                      style={{ borderLeftColor: sale.color || '#6366f1', borderLeftWidth: '8px' }}
                    >
                      <button 
                        onClick={() => handleDeleteItem(globalIdx)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-2"
                        title="Eliminar esta venta"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</label>
                          <input 
                            type="text" 
                            value={sale.productName}
                            onChange={(e) => handleUpdateField(globalIdx, 'productName', e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</label>
                          <input 
                            type="text" 
                            value={sale.buyerName}
                            onChange={(e) => handleUpdateField(globalIdx, 'buyerName', e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio</label>
                            <input 
                              type="number" 
                              value={sale.price}
                              onChange={(e) => handleUpdateField(globalIdx, 'price', Number(e.target.value))}
                              className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-black text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cantidad</label>
                            <input 
                              type="number" 
                              value={sale.quantity}
                              onChange={(e) => handleUpdateField(globalIdx, 'quantity', Number(e.target.value))}
                              className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-black text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                        </div>
                        <div className="flex items-end justify-between gap-3">
                           <div className="flex-1 space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distribuidor?</label>
                              <button 
                                onClick={() => handleUpdateField(globalIdx, 'buyerType', sale.buyerType === 'distribuidor' ? 'comprador' : 'distribuidor')}
                                className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${sale.buyerType === 'distribuidor' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                              >
                                {sale.buyerType === 'distribuidor' ? 'SÍ' : 'NO'}
                              </button>
                           </div>
                           <div className="flex-1 space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color</label>
                              <input 
                                type="color" 
                                value={sale.color || '#6366f1'}
                                onChange={(e) => handleUpdateField(globalIdx, 'color', e.target.value)}
                                className="w-full h-[41px] bg-slate-50 border-none rounded-xl p-1 cursor-pointer"
                              />
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navegación */}
        <div className="p-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 text-center sm:text-left">
             <p className="text-lg font-black text-slate-800">
               Subtotal {dateStr}: <span className="text-indigo-600">${salesInGroup.reduce((acc, s) => acc + (s.price * s.quantity), 0).toLocaleString()}</span>
             </p>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ventas en este día: {salesInGroup.length}</p>
          </div>
          
          <div className="flex w-full sm:w-auto gap-3">
             <button 
              disabled={loading || salesInGroup.length === 0}
              onClick={handleConfirmCurrentDay}
              className="flex-[2] sm:px-12 py-5 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  GUARDANDO...
                </>
              ) : (
                currentGroupIdx < groups.length - 1 ? "REGISTRAR ESTE DÍA Y SEGUIR" : "FINALIZAR REGISTRO"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
