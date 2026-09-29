import React, { useState } from 'react';
import { WeekInfo, AIParsedSaleItem } from '../../types/weekly';
import { parseSalesFromMessageWithAI } from '../../services/weeklyAIService';
import { formatCurrency } from '../../services/weeklyDateUtils';

interface WeeklyAIInputWidgetProps {
  currentWeek: WeekInfo;
  onAddSales: (sales: {
    productName: string;
    quantity: number;
    price: number;
    cost: number;
    buyerName: string;
    buyerType: 'comprador' | 'distribuidor';
    date: string;
    dayName: string;
    notes?: string;
  }[]) => void;
}

const SAMPLE_MESSAGES = [
  "Hola buenas tardes! Carlos se llevó 4 arepas de queso a 3000 cada una y 2 jugos mora a 2000. Por cierto acuérdate de pagar el gas mañana.",
  "Venta de hoy: 5 empanadas mixtas a 2500 a María y 3 gaseosas a 2000. Ah y estuvo lloviendo mucho por la tarde.",
  "Distribuidora El Éxito pidió 10 paquetes de arepas congeladas a 15000 al por mayor. Entregar el viernes."
];

export const WeeklyAIInputWidget: React.FC<WeeklyAIInputWidgetProps> = ({
  currentWeek,
  onAddSales
}) => {
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedSales, setDetectedSales] = useState<AIParsedSaleItem[]>([]);
  const [ignoredItems, setIgnoredItems] = useState<{ text: string; reason: string }[]>([]);
  const [summary, setSummary] = useState('');
  const [hasProcessed, setHasProcessed] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleProcess = async () => {
    if (!message.trim()) return;
    setIsProcessing(true);
    setSuccessMessage('');

    try {
      const result = await parseSalesFromMessageWithAI(message, currentWeek);
      setDetectedSales(result.detectedSales);
      setIgnoredItems(result.ignoredItems);
      setSummary(result.summary);
      setHasProcessed(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateItem = (id: string, field: keyof AIParsedSaleItem, value: any) => {
    setDetectedSales(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setDetectedSales(prev => prev.filter(item => item.id !== id));
  };

  const handleConfirmAll = () => {
    if (detectedSales.length === 0) return;

    const toAdd = detectedSales.map(item => {
      const dayObj = currentWeek.days.find(d => d.date === item.date) || currentWeek.days[0];
      return {
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
        buyerName: item.buyerName || 'Cliente',
        buyerType: item.buyerType,
        date: item.date,
        dayName: dayObj.dayName,
        notes: item.reasoning ? `Detectado por IA: ${item.reasoning}` : 'Registro por IA'
      };
    });

    onAddSales(toAdd);
    setSuccessMessage(`¡Listo! Se registraron ${toAdd.length} ventas en la semana.`);
    setDetectedSales([]);
    setIgnoredItems([]);
    setMessage('');
    setHasProcessed(false);

    setTimeout(() => {
      setSuccessMessage('');
    }, 4500);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header explanation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 leading-tight">
              Registro Inteligente por Chat / Mensaje
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Escribe o pega pedidos de WhatsApp: la IA detecta qué es venta y descarta saludos o notas.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Example Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Ejemplos rápidos:</span>
        {SAMPLE_MESSAGES.map((sample, i) => (
          <button
            key={i}
            onClick={() => setMessage(sample)}
            className="text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-2.5 py-1 rounded-full transition-colors truncate max-w-xs cursor-pointer"
          >
            "{sample.substring(0, 32)}..."
          </button>
        ))}
      </div>

      {/* Input Textarea */}
      <div className="relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ejemplo: Le vendí 3 arepas de queso a $3.000 a Carlos y 2 jugos a $2.000. Recordar comprar servilletas mañana..."
          rows={3}
          className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-none transition-all resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-slate-400 font-medium">
            {message.length} caracteres
          </span>
          <button
            onClick={handleProcess}
            disabled={isProcessing || !message.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analizando mensaje...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Procesar con IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success alert */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* AI Process Results Review Box */}
      {hasProcessed && (
        <div className="p-4 bg-indigo-50/70 border-2 border-indigo-200 rounded-3xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900">
                Resultado del Análisis IA
              </h4>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
              {summary}
            </span>
          </div>

          {/* Detected Sales List */}
          {detectedSales.length > 0 ? (
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 block">
                ✓ Ventas Detectadas ({detectedSales.length}):
              </span>
              <div className="grid grid-cols-1 gap-2">
                {detectedSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-4 gap-2">
                      {/* Product */}
                      <div className="sm:col-span-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block">Producto</label>
                        <input
                          type="text"
                          value={sale.productName}
                          onChange={(e) => handleUpdateItem(sale.id, 'productName', e.target.value)}
                          className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none"
                        />
                      </div>

                      {/* Quantity & Unit Price */}
                      <div className="grid grid-cols-2 gap-2 sm:col-span-1">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase block">Cant.</label>
                          <input
                            type="number"
                            min="1"
                            value={sale.quantity}
                            onChange={(e) => handleUpdateItem(sale.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase block">Precio Unit.</label>
                          <input
                            type="number"
                            min="0"
                            value={sale.price}
                            onChange={(e) => handleUpdateItem(sale.id, 'price', Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none"
                          />
                        </div>
                      </div>

                      {/* Buyer */}
                      <div className="sm:col-span-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block">Cliente</label>
                        <input
                          type="text"
                          value={sale.buyerName}
                          onChange={(e) => handleUpdateItem(sale.id, 'buyerName', e.target.value)}
                          className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none"
                        />
                      </div>

                      {/* Day in current week */}
                      <div className="sm:col-span-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block">Día de la Semana</label>
                        <select
                          value={sale.date}
                          onChange={(e) => handleUpdateItem(sale.id, 'date', e.target.value)}
                          className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none"
                        >
                          {currentWeek.days.map(d => (
                            <option key={d.date} value={d.date}>
                              {d.dayName} ({d.shortDate})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Total & Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Subtotal</span>
                        <span className="text-sm font-black text-emerald-600">
                          {formatCurrency(sale.price * sale.quantity)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(sale.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Descartar esta venta"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-semibold">
              No se detectaron ventas de productos en el texto ingresado.
            </div>
          )}

          {/* Ignored / Filtered Non-Sales Parts */}
          {ignoredItems.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-indigo-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                🚫 Descartado por la IA (No corresponde a ventas):
              </span>
              <div className="flex flex-wrap gap-2">
                {ignoredItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white/80 border border-slate-200 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2"
                  >
                    <span className="font-semibold text-slate-700">"{item.text}"</span>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md font-medium">
                      {item.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Button */}
          {detectedSales.length > 0 && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleConfirmAll}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Confirmar y Guardar {detectedSales.length} Ventas en la Semana</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
