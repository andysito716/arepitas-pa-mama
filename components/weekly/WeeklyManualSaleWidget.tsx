import React, { useState } from 'react';
import { WeekInfo, WeeklySale } from '../../types/weekly';
import { formatDateToYMD, formatCurrency } from '../../services/weeklyDateUtils';

interface WeeklyManualSaleWidgetProps {
  currentWeek: WeekInfo;
  onAddSale: (sale: Omit<WeeklySale, 'id' | 'createdAt'>) => void;
}

const COMMON_PRODUCTS = [
  { name: 'Arepa de Queso', price: 3000, cost: 1200 },
  { name: 'Arepa Especial Mixta', price: 4500, cost: 1800 },
  { name: 'Empanada de Carne', price: 2200, cost: 950 },
  { name: 'Jugo Natural', price: 2500, cost: 900 },
  { name: 'Paquete Arepas (x10)', price: 18000, cost: 8500 }
];

export const WeeklyManualSaleWidget: React.FC<WeeklyManualSaleWidgetProps> = ({
  currentWeek,
  onAddSale
}) => {
  const todayYMD = formatDateToYMD(new Date());
  const initialDate = currentWeek.days.find(d => d.date === todayYMD)?.date || currentWeek.days[0].date;

  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState<number | ''>(3000);
  const [cost, setCost] = useState<number | ''>(1200);
  const [quantity, setQuantity] = useState<number>(1);
  const [buyerName, setBuyerName] = useState('');
  const [buyerType, setBuyerType] = useState<'comprador' | 'distribuidor'>('comprador');
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [notes, setNotes] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleSelectQuickProduct = (p: typeof COMMON_PRODUCTS[0]) => {
    setProductName(p.name);
    setPrice(p.price);
    setCost(p.cost);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    const dayObj = currentWeek.days.find(d => d.date === selectedDate) || currentWeek.days[0];
    const finalPrice = typeof price === 'number' ? price : 0;
    const finalCost = typeof cost === 'number' ? cost : 0;

    onAddSale({
      weekId: currentWeek.id,
      date: selectedDate,
      dayName: dayObj.dayName,
      productName: productName.trim(),
      quantity: Math.max(1, quantity),
      price: finalPrice,
      cost: finalCost,
      buyerName: buyerName.trim() || 'Cliente Mostrador',
      buyerType,
      notes: notes.trim() || undefined
    });

    // Reset fields
    setProductName('');
    setBuyerName('');
    setNotes('');
    setQuantity(1);
    setShowSuccessToast(true);

    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
  };

  const calculatedTotal = (typeof price === 'number' ? price : 0) * (quantity || 1);
  const calculatedProfit = calculatedTotal - ((typeof cost === 'number' ? cost : 0) * (quantity || 1));

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 leading-tight">
              Registro Manual Rápido
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Añade ventas directamente con precio, costo y asignación de día
            </p>
          </div>
        </div>
      </div>

      {/* Quick product presets */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Frecuentes:</span>
        {COMMON_PRODUCTS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectQuickProduct(p)}
            className="text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
          >
            {p.name}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Producto */}
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Nombre del Producto o Artículo *
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ej: Arepa con Queso, Empanada..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          {/* Cantidad */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Cantidad
            </label>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-l-xl text-slate-600 font-bold flex items-center justify-center transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full h-10 text-center bg-slate-50 border-y border-slate-200 text-sm font-black text-slate-800 outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-r-xl text-slate-600 font-bold flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Precio de venta */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Precio Unitario ($) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : parseInt(e.target.value))}
              placeholder="Ej: 3000"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          {/* Costo de producción */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Costo Unitario ($)
            </label>
            <input
              type="number"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value === '' ? '' : parseInt(e.target.value))}
              placeholder="Ej: 1200"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          {/* Día de la semana */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Día de la Semana
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
            >
              {currentWeek.days.map((d) => (
                <option key={d.date} value={d.date}>
                  {d.dayName} ({d.shortDate})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de cliente */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Tipo de Venta
            </label>
            <select
              value={buyerType}
              onChange={(e) => setBuyerType(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
            >
              <option value="comprador">Cliente Común</option>
              <option value="distribuidor">Distribuidor / Mayorista</option>
            </select>
          </div>
        </div>

        {/* Cliente y notas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Nombre del Cliente
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Ej: Doña Carmen, Andrés (o Mostrador)"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Nota o detalle (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Pagado por transferencia, con queso extra..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Action bar and summary */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-500">
              Total Venta: <strong className="text-slate-800 text-sm font-black">{formatCurrency(calculatedTotal)}</strong>
            </span>
            <span className="font-semibold text-slate-500">
              Ganancia: <strong className="text-emerald-600 text-sm font-black">{formatCurrency(calculatedProfit)}</strong>
            </span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Añadir Venta</span>
          </button>
        </div>

        {showSuccessToast && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Venta guardada correctamente en el día seleccionado.</span>
          </div>
        )}
      </form>
    </div>
  );
};
