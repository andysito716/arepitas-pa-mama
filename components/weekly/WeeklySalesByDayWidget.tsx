import React, { useState, useEffect } from 'react';
import { WeekInfo, DaySummary, WeeklySale } from '../../types/weekly';
import { formatCurrency, formatDateToYMD } from '../../services/weeklyDateUtils';

interface WeeklySalesByDayWidgetProps {
  currentWeek: WeekInfo;
  daySummaries: DaySummary[];
  onUpdateSale: (id: string, updates: Partial<WeeklySale>) => void;
  onDeleteSale: (id: string) => void;
  onMoveSaleToDay: (saleId: string, targetDate: string, targetDayName: string, targetWeekId: string) => void;
  onOpenManualModal?: (targetDate?: string) => void;
}

export const WeeklySalesByDayWidget: React.FC<WeeklySalesByDayWidgetProps> = ({
  currentWeek,
  daySummaries,
  onUpdateSale,
  onDeleteSale,
  onMoveSaleToDay,
  onOpenManualModal
}) => {
  const todayYMD = formatDateToYMD(new Date());

  // Default to today if it's within current week, otherwise Monday (first day)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const isTodayInWeek = currentWeek.days.some(d => d.date === todayYMD);
    return isTodayInWeek ? todayYMD : currentWeek.days[0].date;
  });

  // Keep selected date valid if week changes
  useEffect(() => {
    const exists = currentWeek.days.some(d => d.date === selectedDate);
    if (!exists) {
      const isTodayInWeek = currentWeek.days.some(d => d.date === todayYMD);
      setSelectedDate(isTodayInWeek ? todayYMD : currentWeek.days[0].date);
    }
  }, [currentWeek, selectedDate, todayYMD]);

  const [editingSale, setEditingSale] = useState<WeeklySale | null>(null);
  const [movingSaleId, setMovingSaleId] = useState<string | null>(null);

  // Active day object & summary
  const selectedDaySummary = daySummaries.find(d => d.date === selectedDate) || daySummaries[0];
  const activeDayIndex = currentWeek.days.findIndex(d => d.date === selectedDate);

  const handlePrevDay = () => {
    if (activeDayIndex > 0) {
      setSelectedDate(currentWeek.days[activeDayIndex - 1].date);
    }
  };

  const handleNextDay = () => {
    if (activeDayIndex < currentWeek.days.length - 1) {
      setSelectedDate(currentWeek.days[activeDayIndex + 1].date);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-3">
      {/* Title & Navigation between days */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-800 leading-tight">
              Ventas por Día
            </h3>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">
              Selecciona un día de la semana para ver sus pedidos
            </p>
          </div>
        </div>

        {/* Previous / Next Day Arrows */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={handlePrevDay}
            disabled={activeDayIndex <= 0}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Día anterior"
          >
            ←
          </button>
          <span className="text-[11px] font-black text-slate-700 px-1">
            {selectedDaySummary?.dayName}
          </span>
          <button
            onClick={handleNextDay}
            disabled={activeDayIndex >= currentWeek.days.length - 1}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Día siguiente"
          >
            →
          </button>
        </div>
      </div>

      {/* 7 Days Tabs Strip (Single-day selector, NO "Todos" button) */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-0.5">
        {daySummaries.map(d => {
          const isSelected = d.date === selectedDate;
          const isToday = d.date === todayYMD;

          return (
            <button
              key={d.date}
              onClick={() => setSelectedDate(d.date)}
              className={`py-1.5 px-0.5 rounded-xl text-center transition-all flex flex-col items-center justify-center cursor-pointer relative ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <span className="text-[10px] font-black uppercase leading-tight">
                {d.dayName.substring(0, 3)}
              </span>
              <span className={`text-[9px] leading-tight ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                {d.shortDate.split(' ')[0]}
              </span>

              {/* Indicator Dot if day has sales */}
              {d.salesCount > 0 && (
                <span
                  className={`mt-0.5 text-[8px] font-black px-1 rounded-full ${
                    isSelected ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {d.salesCount}
                </span>
              )}

              {isToday && !isSelected && (
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full absolute -top-0.5 -right-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day View - Clean Single Day Presentation */}
      {selectedDaySummary && (
        <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 space-y-2.5">
          {/* Header of the Selected Day */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                {selectedDaySummary.dayName.substring(0, 2).toUpperCase()}
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-800 leading-tight">
                  {selectedDaySummary.dayName}
                  <span className="text-slate-400 font-medium text-xs ml-1.5">
                    ({selectedDaySummary.shortDate})
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {selectedDaySummary.salesCount} pedidos · {selectedDaySummary.itemCount} unidades
                </p>
              </div>
            </div>

            {/* Day Financials */}
            <div className="text-right">
              <span className="text-xs font-black text-slate-900 block leading-tight">
                {formatCurrency(selectedDaySummary.totalRevenue)}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 block leading-tight">
                +{formatCurrency(selectedDaySummary.totalProfit)}
              </span>
            </div>
          </div>

          {/* List of sales for this single day */}
          {selectedDaySummary.sales.length > 0 ? (
            <div className="space-y-1.5">
              {selectedDaySummary.sales.map((sale) => {
                const totalSale = sale.price * sale.quantity;
                const profitSale = totalSale - (sale.cost * sale.quantity);

                return (
                  <div
                    key={sale.id}
                    className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-1.5"
                  >
                    {/* Top row: Name & Subtotal */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-black text-slate-800 leading-tight truncate">
                          {sale.productName}
                        </h5>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium mt-0.5">
                          <span>{sale.quantity} und. × {formatCurrency(sale.price)}</span>
                          {sale.cost > 0 && (
                            <span className="text-slate-400">
                              (Costo: {formatCurrency(sale.cost)})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-900 block leading-tight">
                          {formatCurrency(totalSale)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 block leading-tight">
                          +{formatCurrency(profitSale)}
                        </span>
                      </div>
                    </div>

                    {/* Bottom row: Buyer pill + Notes + Actions */}
                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 text-[10px]">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                          👤 {sale.buyerName}
                        </span>
                        {sale.buyerType === 'distribuidor' && (
                          <span className="bg-purple-100 text-purple-700 font-bold px-1 rounded text-[8px] uppercase">
                            Mayor
                          </span>
                        )}
                        {sale.notes && (
                          <span className="text-slate-400 truncate max-w-[120px]" title={sale.notes}>
                            📝 {sale.notes}
                          </span>
                        )}
                      </div>

                      {/* Quick controls */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {/* Move Day button */}
                        <button
                          onClick={() => setMovingSaleId(movingSaleId === sale.id ? null : sale.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Cambiar día"
                          aria-label="Cambiar día"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => setEditingSale(sale)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Editar"
                          aria-label="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Eliminar la venta de "${sale.productName}"?`)) {
                              onDeleteSale(sale.id);
                            }
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar"
                          aria-label="Eliminar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Move Day Popover */}
                    {movingSaleId === sale.id && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl space-y-1 animate-in fade-in">
                        <span className="text-[9px] font-black uppercase text-blue-800 tracking-wider block">
                          Mover esta venta al día:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {currentWeek.days.map((d) => (
                            <button
                              key={d.date}
                              disabled={d.date === sale.date}
                              onClick={() => {
                                onMoveSaleToDay(sale.id, d.date, d.dayName, currentWeek.id);
                                setMovingSaleId(null);
                              }}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                d.date === sale.date
                                  ? 'bg-blue-600 text-white cursor-default'
                                  : 'bg-white hover:bg-blue-100 text-slate-700 border border-blue-200'
                              }`}
                            >
                              {d.dayName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center space-y-2">
              <p className="text-slate-400 text-xs font-medium">
                No hay ventas registradas el {selectedDaySummary.dayName}.
              </p>
              {onOpenManualModal && (
                <button
                  onClick={() => onOpenManualModal(selectedDate)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>+ Registrar venta en {selectedDaySummary.dayName}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Sale Modal */}
      {editingSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-sm w-full border border-slate-200 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-black text-slate-800">
                Editar Venta
              </h4>
              <button
                onClick={() => setEditingSale(null)}
                className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Producto</label>
                <input
                  type="text"
                  value={editingSale.productName}
                  onChange={(e) => setEditingSale({ ...editingSale, productName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={editingSale.quantity}
                    onChange={(e) => setEditingSale({ ...editingSale, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Precio ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingSale.price}
                    onChange={(e) => setEditingSale({ ...editingSale, price: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Costo Unit. ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingSale.cost}
                    onChange={(e) => setEditingSale({ ...editingSale, cost: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Cliente</label>
                  <input
                    type="text"
                    value={editingSale.buyerName}
                    onChange={(e) => setEditingSale({ ...editingSale, buyerName: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Día de la Semana</label>
                <select
                  value={editingSale.date}
                  onChange={(e) => {
                    const foundDay = currentWeek.days.find(d => d.date === e.target.value);
                    setEditingSale({
                      ...editingSale,
                      date: e.target.value,
                      dayName: foundDay ? foundDay.dayName : editingSale.dayName
                    });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                >
                  {currentWeek.days.map((d) => (
                    <option key={d.date} value={d.date}>
                      {d.dayName} ({d.shortDate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Notas</label>
                <input
                  type="text"
                  value={editingSale.notes || ''}
                  onChange={(e) => setEditingSale({ ...editingSale, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="Detalles adicionales..."
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setEditingSale(null)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onUpdateSale(editingSale.id, {
                    productName: editingSale.productName,
                    quantity: editingSale.quantity,
                    price: editingSale.price,
                    cost: editingSale.cost,
                    buyerName: editingSale.buyerName,
                    date: editingSale.date,
                    dayName: editingSale.dayName,
                    notes: editingSale.notes
                  });
                  setEditingSale(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
