
import React, { useState } from 'react';
import { Sale } from '../types';

interface SalesFormProps {
  onAddSale: (sale: Omit<Sale, 'id' | 'cost'>, andBooking?: boolean) => void;
  onUpdateSale?: (id: string, sale: Omit<Sale, 'id' | 'cost'>) => void;
  isOpen: boolean;
  onClose: () => void;
  saleToEdit?: Sale | null;
}

export const SalesForm: React.FC<SalesFormProps> = ({ onAddSale, onUpdateSale, isOpen, onClose, saleToEdit }) => {
  const [productName, setProductName] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [quantity, setQuantity] = React.useState('1');
  const [buyerName, setBuyerName] = React.useState('');
  const [buyerType, setBuyerType] = React.useState<'comprador' | 'distribuidor'>('comprador');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [color, setColor] = React.useState('');
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isPendingBooking, setIsPendingBooking] = React.useState(false);

  React.useEffect(() => {
    if (saleToEdit) {
      setProductName(saleToEdit.productName);
      setPrice(saleToEdit.price.toString());
      setQuantity(saleToEdit.quantity.toString());
      setBuyerName(saleToEdit.buyerName);
      setBuyerType(saleToEdit.buyerType);
      setColor(saleToEdit.color || '');
      
      // Convert DD/MM/YYYY to YYYY-MM-DD
      const [day, month, year] = saleToEdit.date.split('/');
      if (day && month && year) {
        setDate(`${year}-${month}-${day}`);
      }
    } else {
      setProductName('');
      setPrice('');
      setQuantity('1');
      setBuyerName('');
      setBuyerType('comprador');
      setColor('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [saleToEdit, isOpen]);

  if (!isOpen) return null;

  const colorOptions = [
    { name: 'Ninguno', value: '' },
    { name: 'Azul', value: '#dbeafe' }, // blue-100
    { name: 'Esmeralda', value: '#d1fae5' }, // emerald-100
    { name: 'Ámbar', value: '#fef3c7' }, // amber-100
    { name: 'Rojo', value: '#fee2e2' }, // red-100
    { name: 'Púrpura', value: '#f3e8ff' }, // violet-100
    { name: 'Rosa', value: '#fce7f3' }, // pink-100
  ];

  const preSubmit = (e: React.FormEvent, andBooking: boolean = false) => {
    e.preventDefault();
    if (!productName || !price || !buyerName) return;
    setIsPendingBooking(andBooking);
    setShowConfirm(true);
  };

  const handleConfirmedSubmit = () => {
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    const saleData = {
      productName,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      buyerName,
      buyerType,
      date: formattedDate,
      color: color || undefined,
    };

    if (saleToEdit && onUpdateSale) {
      onUpdateSale(saleToEdit.id, saleData);
    } else {
      onAddSale(saleData, isPendingBooking);
    }

    setShowConfirm(false);
    onClose();
  };

  const inputClasses = "w-full px-4 py-3.5 bg-slate-100 border-none rounded-2xl text-md font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4">
      <div 
        className="bg-white w-full sm:max-w-[480px] rounded-t-[32px] sm:rounded-[32px] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom sm:zoom-in duration-300 transition-all border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-50 shrink-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">{saleToEdit ? 'Editar Venta' : 'Nueva Venta'}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Completa los datos del pedido</p>
          </div>
          <button onClick={onClose} className="p-2 sm:p-2.5 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 active:bg-slate-200 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar pb-12">
          <form onSubmit={preSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClasses}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">¿Qué vendiste?</label>
              <input
                id="tutorial-product-input"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className={inputClasses}
                placeholder="Nombre del producto"
                required
                autoFocus
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Precio</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    id="tutorial-price-input"
                    type="number"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={`${inputClasses} pl-7`}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
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
            </div>

            <div className="space-y-1">
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Tipo de Cliente</label>
                <select
                  id="tutorial-client-type-select"
                  value={buyerType}
                  onChange={(e) => setBuyerType(e.target.value as 'comprador' | 'distribuidor')}
                  className={inputClasses}
                >
                  <option value="comprador">Final</option>
                  <option value="distribuidor">Distribuidor</option>
                </select>
              </div>

              <div className="space-y-1" id="tutorial-color-picker">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Color (Opcional)</label>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl h-[52px]">
                  <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar px-1">
                    {colorOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setColor(opt.value)}
                        className={`w-6 h-6 shrink-0 rounded-full border transition-all ${color === opt.value ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: opt.value || '#ffffff' }}
                      >
                        {opt.value === '' && <span className="text-[7px] text-slate-300">X</span>}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="color"
                    value={color && color.startsWith('#') ? color : '#ffffff'}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-6 h-6 shrink-0 rounded-full overflow-hidden border-none cursor-pointer p-0 bg-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                id="tutorial-confirm-sale"
                type="submit"
                className="w-full py-3.5 bg-blue-600 text-white text-md font-black rounded-xl shadow-lg shadow-blue-100 active:scale-95 transition-all"
              >
                {saleToEdit ? 'GUARDAR CAMBIOS' : 'CONFIRMAR VENTA'}
              </button>

              {!saleToEdit && (
                <button
                  type="button"
                  onClick={(e) => preSubmit(e as any, true)}
                  className="w-full py-3.5 bg-amber-500 text-white text-md font-black rounded-xl shadow-lg shadow-amber-50 active:scale-95 transition-all"
                >
                  CONFIRMAR Y AGENDAR
                </button>
              )}
            </div>
          </form>
        </div>

        {showConfirm && (
          <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 sm:p-4">
            <div 
              id="tutorial-confirm-modal"
              className="w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in duration-200"
              style={{ backgroundColor: color || '#ffffff' }}
            >
              <div className="w-16 h-16 bg-blue-600/10 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 text-center mb-2 uppercase">¿Todo Correcto?</h3>
              <p className="text-slate-500 text-center font-bold text-sm mb-8">Revisa bien los datos antes de registrar esta venta.</p>
              
              <div className="p-5 rounded-[24px] space-y-3 mb-8 border border-black/5 bg-white/40 backdrop-blur-sm shadow-inner">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-slate-500 uppercase">Producto:</span>
                  <span className="text-slate-900 text-right">{productName}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-slate-500 uppercase">Cliente:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900">{buyerName}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${buyerType === 'distribuidor' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}`}>
                      {buyerType === 'distribuidor' ? 'DIST' : 'COMP'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-slate-500 uppercase">Cantidad x Precio:</span>
                  <span className="text-slate-900">{quantity} x ${parseFloat(price || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-black border-t border-black/5 pt-2 mt-2">
                  <span className="text-slate-500 uppercase">Total a Cobrar:</span>
                  <span className="text-blue-700 text-lg">${(parseFloat(price || '0') * parseInt(quantity || '1')).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-slate-500 uppercase">Fecha:</span>
                  <span className="text-slate-700">{date}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleConfirmedSubmit}
                  className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all"
                >
                  {saleToEdit ? 'SÍ, GUARDAR CAMBIOS' : 'SÍ, REGISTRAR AHORA'}
                </button>
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="w-full py-4 bg-black/5 text-slate-500 font-black rounded-2xl active:scale-95 transition-all text-xs uppercase"
                >
                  VOLVER A REVISAR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
