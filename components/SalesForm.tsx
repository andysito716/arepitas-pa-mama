
import React, { useState } from 'react';
import { Sale } from '../types';

interface SalesFormProps {
  onAddSale: (sale: Omit<Sale, 'id' | 'cost'>, andBooking?: boolean) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SalesForm: React.FC<SalesFormProps> = ({ onAddSale, isOpen, onClose }) => {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [buyerName, setBuyerName] = useState('');
  const [buyerType, setBuyerType] = useState<'comprador' | 'distribuidor'>('comprador');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent, andBooking: boolean = false) => {
    e.preventDefault();
    if (!productName || !price || !buyerName) return;

    onAddSale({
      productName,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      buyerName,
      buyerType,
      date: new Date().toLocaleDateString('es-ES'),
    }, andBooking);

    setProductName('');
    setPrice('');
    setQuantity('1');
    setBuyerName('');
    setBuyerType('comprador');
    onClose();
  };

  const inputClasses = "w-full px-4 py-4 bg-slate-100 border-none rounded-2xl text-lg font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4">
      <div 
        className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 pb-12 sm:pb-8 animate-in slide-in-from-bottom duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800">Nueva Venta</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            id="tutorial-product-input"
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className={inputClasses}
            placeholder="¿Qué vendiste?"
            required
            autoFocus
          />
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Precio de Venta</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  id="tutorial-price-input"
                  type="number"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={`${inputClasses} pl-8`}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="col-span-1 space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Cantidad</label>
                <input
                  id="tutorial-quantity-input"
                  type="number"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={inputClasses}
                  placeholder="1"
                  required
                />
             </div>
             <div className="col-span-2 space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Cliente</label>
                <input
                  id="tutorial-client-input"
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className={inputClasses}
                  placeholder="Nombre cliente"
                  required
                />
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Tipo de Cliente</label>
            <select
              id="tutorial-client-type-select"
              value={buyerType}
              onChange={(e) => setBuyerType(e.target.value as 'comprador' | 'distribuidor')}
              className={inputClasses}
            >
              <option value="comprador">Comprador Final</option>
              <option value="distribuidor">Distribuidor</option>
            </select>
          </div>

          <button
            id="tutorial-confirm-sale"
            type="submit"
            className="w-full py-4 bg-blue-600 text-white text-lg font-black rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all mt-4"
          >
            CONFIRMAR VENTA
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e as any, true)}
            className="w-full py-4 bg-amber-500 text-white text-lg font-black rounded-2xl shadow-xl shadow-amber-100 active:scale-95 transition-all mt-2"
          >
            CONFIRMAR Y AGENDAR
          </button>
        </form>
      </div>
    </div>
  );
};
