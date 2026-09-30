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
  "Hola! Carlos llevó 4 arepas de queso a 3000 c/u y 2 jugos mora a 2000. Recuerda pagar el queso mañana.",
  "Venta: 5 empanadas mixtas a 2500 a María y 3 gaseosas a 2000. Estuvo lloviendo por la tarde.",
  "Distribuidora El Éxito pidió 10 paquetes arepas congeladas a 18000 al por mayor."
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
        notes: item.reasoning ? `IA: ${item.reasoning}` : 'Registro por IA'
      };
    });

    onAddSales(toAdd);
    setSuccessMessage(`¡Listo! Se guardaron ${toAdd.length} ventas y se sincronizaron con la base de datos.`);
    setDetectedSales([]);
    setIgnoredItems([]);
    setMessage('');
    setHasProcessed(false);

    setTimeout(() => {
      setSuccessMessage('');
    }, 4500);
  };

  return (
    <div className="bg-white/95 rounded-2xl border border-amber-900/10 p-3 sm:p-4 shadow-[0_4px_20px_-2px_rgba(66,32,6,0.04)] space-y-2.5">
      {/* Header explanation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-stone-900 leading-tight font-display">
              Registro Inteligente con IA
            </h3>
            <p className="text-[11px] text-stone-500 font-medium leading-tight">
              Pega pedidos de WhatsApp: la IA detecta qué es venta y filtra saludos o comentarios.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Example Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 text-stone-600">
        <span className="text-[9px] font-black uppercase text-amber-800 shrink-0">Ejemplos:</span>
        {SAMPLE_MESSAGES.map((sample, i) => (
          <button
            key={i}
            onClick={() => setMessage(sample)}
            className="text-[10px] font-semibold bg-stone-100/90 hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200/70 px-2 py-0.5 rounded-lg transition-colors truncate shrink-0 max-w-[210px] cursor-pointer"
          >
            "{sample.substring(0, 24)}..."
          </button>
        ))}
      </div>

      {/* Input Textarea */}
      <div className="space-y-1.5">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ej: Le vendí 3 arepas de queso a $3.000 a Carlos y 2 jugos a $2.000..."
          rows={2}
          className="w-full p-2.5 rounded-xl bg-[#FDFCFB] border border-stone-200 text-xs font-medium text-stone-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none placeholder:text-stone-400"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-stone-400 font-medium">
            {message.length > 0 ? `${message.length} caracteres` : 'Escribe o pega texto'}
          </span>
          <button
            onClick={handleProcess}
            disabled={isProcessing || !message.trim()}
            className="h-8 px-3.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 disabled:opacity-40 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analizando...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Procesar IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success alert */}
      {successMessage && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* AI Process Results Review Box */}
      {hasProcessed && (
        <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-950 font-display">
                Resultado del Análisis IA
              </h4>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-200/80 truncate max-w-[220px]">
              {summary}
            </span>
          </div>

          {/* Detected Sales List */}
          {detectedSales.length > 0 ? (
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                ✓ Ventas Detectadas ({detectedSales.length}):
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {detectedSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="bg-white p-2 sm:p-2.5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                  >
                    <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {/* Product */}
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-[8px] font-bold text-stone-500 uppercase block">Producto</label>
                        <input
                          type="text"
                          value={sale.productName}
                          onChange={(e) => handleUpdateItem(sale.id, 'productName', e.target.value)}
                          className="w-full text-xs font-bold text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 outline-none focus:border-amber-500 focus:bg-white"
                        />
                      </div>

                      {/* Quantity & Unit Price */}
                      <div className="grid grid-cols-2 gap-1 col-span-2 sm:col-span-1">
                        <div>
                          <label className="text-[8px] font-bold text-stone-500 uppercase block">Cant.</label>
                          <input
                            type="number"
                            min="1"
                            value={sale.quantity}
                            onChange={(e) => handleUpdateItem(sale.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full text-xs font-bold text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-1.5 py-1 outline-none focus:border-amber-500 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-bold text-stone-500 uppercase block">Precio ($)</label>
                          <input
                            type="number"
                            min="0"
                            value={sale.price}
                            onChange={(e) => handleUpdateItem(sale.id, 'price', Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full text-xs font-bold text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-1.5 py-1 outline-none focus:border-amber-500 focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Buyer */}
                      <div className="col-span-1">
                        <label className="text-[8px] font-bold text-stone-500 uppercase block">Cliente</label>
                        <input
                          type="text"
                          value={sale.buyerName}
                          onChange={(e) => handleUpdateItem(sale.id, 'buyerName', e.target.value)}
                          className="w-full text-xs font-bold text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 outline-none focus:border-amber-500 focus:bg-white"
                        />
                      </div>

                      {/* Day in current week */}
                      <div className="col-span-1">
                        <label className="text-[8px] font-bold text-stone-500 uppercase block">Día</label>
                        <select
                          value={sale.date}
                          onChange={(e) => handleUpdateItem(sale.id, 'date', e.target.value)}
                          className="w-full text-xs font-bold text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-1.5 py-1 outline-none focus:border-amber-500 focus:bg-white"
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
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      <div className="text-left sm:text-right">
                        <span className="text-[8px] font-bold text-stone-500 uppercase block">Subtotal</span>
                        <span className="text-xs font-black text-emerald-700">
                          {formatCurrency(sale.price * sale.quantity)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(sale.id)}
                        className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                        title="Descartar esta venta"
                        aria-label="Descartar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-amber-100/60 border border-amber-300/80 rounded-xl text-amber-900 text-xs font-bold">
              No se detectaron ventas de productos en el texto ingresado.
            </div>
          )}

          {/* Ignored / Filtered Non-Sales Parts */}
          {ignoredItems.length > 0 && (
            <div className="space-y-1 pt-1.5 border-t border-amber-200/60">
              <span className="text-[9px] font-black uppercase tracking-wider text-stone-500 block">
                🚫 Descartado por la IA (No corresponde a ventas):
              </span>
              <div className="flex flex-wrap gap-1">
                {ignoredItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white/90 border border-stone-200 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1.5 shadow-2xs"
                  >
                    <span className="font-semibold text-stone-800">"{item.text}"</span>
                    <span className="text-[9px] text-stone-500 bg-stone-100 px-1 py-0.2 rounded font-medium">
                      {item.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Button */}
          {detectedSales.length > 0 && (
            <div className="flex justify-end pt-1">
              <button
                onClick={handleConfirmAll}
                className="w-full sm:w-auto h-9 px-4 bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 hover:from-emerald-800 hover:to-teal-950 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Guardar {detectedSales.length} Ventas en la Nube</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
