import React, { useState } from 'react';
import { WeekInfo, DaySummary, WeeklySale } from '../../types/weekly';
import { formatCurrency } from '../../services/weeklyDateUtils';

interface WeeklySalesByDayWidgetProps {
  currentWeek: WeekInfo;
  daySummaries: DaySummary[];
  onUpdateSale: (id: string, updates: Partial<WeeklySale>) => void;
  onDeleteSale: (id: string) => void;
  onMoveSaleToDay: (saleId: string, targetDate: string, targetDayName: string, targetWeekId: string) => void;
}

export const WeeklySalesByDayWidget: React.FC<WeeklySalesByDayWidgetProps> = ({
  currentWeek,
  daySummaries,
  onUpdateSale,
  onDeleteSale,
  onMoveSaleToDay
}) => {
  const [activeDayFilter, setActiveDayFilter] = useState<string>('all');
  const [editingSale, setEditingSale] = useState<WeeklySale | null>(null);
  const [draggedSaleId, setDraggedSaleId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [movingSaleId, setMovingSaleId] = useState<string | null>(null);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, saleId: string) => {
    e.dataTransfer.setData('text/plain', saleId);
    setDraggedSaleId(saleId);
  };

  const handleDragOver = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    setDragOverDate(date);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, targetDate: string, targetDayName: string) => {
    e.preventDefault();
    const saleId = e.dataTransfer.getData('text/plain') || draggedSaleId;
    if (saleId) {
      onMoveSaleToDay(saleId, targetDate, targetDayName, currentWeek.id);
    }
    setDraggedSaleId(null);
    setDragOverDate(null);
  };

  const displayedDays = activeDayFilter === 'all'
    ? daySummaries
    : daySummaries.filter(d => d.date === activeDayFilter);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Title & info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 leading-tight">
              Desglose Semanal por Días
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Puedes <strong>arrastrar o mover</strong> cualquier venta entre días para organizar a tu comodidad.
            </p>
          </div>
        </div>

        {/* Day Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveDayFilter('all')}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              activeDayFilter === 'all'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Toda la Semana
          </button>
          {daySummaries.map(d => (
            <button
              key={d.date}
              onClick={() => setActiveDayFilter(d.date)}
              className={`px-2.5 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                activeDayFilter === d.date
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d.dayName.substring(0, 3)}
              {d.salesCount > 0 && (
                <span className={`ml-1 text-[10px] px-1 py-0.2 rounded-full ${activeDayFilter === d.date ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {d.salesCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Days Containers */}
      <div className="space-y-4">
        {displayedDays.map(day => {
          const isDragTarget = dragOverDate === day.date;
          return (
            <div
              key={day.date}
              onDragOver={(e) => handleDragOver(e, day.date)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day.date, day.dayName)}
              className={`rounded-2xl border-2 transition-all p-4 ${
                isDragTarget
                  ? 'border-dashed border-blue-500 bg-blue-50/70 scale-[1.01]'
                  : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
              }`}
            >
              {/* Day header banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-200/80 gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-black text-xs shadow-2xs">
                    {day.dayName.substring(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">
                      {day.dayName} <span className="text-slate-400 font-bold text-xs">({day.shortDate})</span>
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {day.salesCount} {day.salesCount === 1 ? 'venta' : 'ventas'} ({day.itemCount} und.)
                    </span>
                  </div>
                </div>

                {/* Day Financials */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Ingresos</span>
                    <span className="text-xs font-black text-slate-800">
                      {formatCurrency(day.totalRevenue)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Ganancia</span>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      +{formatCurrency(day.totalProfit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Day sales list */}
              {day.sales.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-3">
                  {day.sales.map(sale => {
                    const totalSale = sale.price * sale.quantity;
                    const profitSale = totalSale - (sale.cost * sale.quantity);

                    return (
                      <div
                        key={sale.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, sale.id)}
                        className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-2.5 cursor-grab active:cursor-grabbing group relative"
                      >
                        {/* Top row: Drag grip + Product name + Total */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <div className="text-slate-300 group-hover:text-slate-500 transition-colors pt-0.5" title="Arrastrar para mover de día">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                            <div>
                              <h5 className="text-xs font-black text-slate-800 leading-tight">
                                {sale.productName}
                              </h5>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
                                <span>{sale.quantity} und. × {formatCurrency(sale.price)}</span>
                                {sale.cost > 0 && (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                                    Costo: {formatCurrency(sale.cost)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-slate-900 block">
                              {formatCurrency(totalSale)}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 block">
                              +{formatCurrency(profitSale)}
                            </span>
                          </div>
                        </div>

                        {/* Bottom row: Buyer pill + Notes + Actions */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              <span>{sale.buyerName}</span>
                            </span>
                            {sale.buyerType === 'distribuidor' && (
                              <span className="bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-md text-[9px] uppercase">
                                Mayorista
                              </span>
                            )}
                            {sale.notes && (
                              <span className="text-slate-400 truncate max-w-[120px]" title={sale.notes}>
                                📝 {sale.notes}
                              </span>
                            )}
                          </div>

                          {/* Quick controls: Move day button, Edit, Delete */}
                          <div className="flex items-center gap-1">
                            {/* Move button dropdown trigger */}
                            <button
                              onClick={() => setMovingSaleId(movingSaleId === sale.id ? null : sale.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Mover esta venta a otro día de la semana"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => setEditingSale(sale)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Editar venta"
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
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar venta"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Interactive Move Selector Popover */}
                        {movingSaleId === sale.id && (
                          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5 animate-in fade-in">
                            <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider block">
                              Mover esta venta a:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {currentWeek.days.map(d => (
                                <button
                                  key={d.date}
                                  disabled={d.date === sale.date}
                                  onClick={() => {
                                    onMoveSaleToDay(sale.id, d.date, d.dayName, currentWeek.id);
                                    setMovingSaleId(null);
                                  }}
                                  className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
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
                <div className="py-5 text-center text-slate-400 text-xs font-medium">
                  Sin ventas registradas en {day.dayName}. Puedes arrastrar ventas aquí o registrarlas arriba.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inline Modal for Editing Sale */}
      {editingSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-black text-slate-800">
                Editar Venta
              </h4>
              <button
                onClick={() => setEditingSale(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Producto</label>
                <input
                  type="text"
                  value={editingSale.productName}
                  onChange={(e) => setEditingSale({ ...editingSale, productName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={editingSale.quantity}
                    onChange={(e) => setEditingSale({ ...editingSale, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Precio Unitario ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingSale.price}
                    onChange={(e) => setEditingSale({ ...editingSale, price: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Costo Unitario ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingSale.cost}
                    onChange={(e) => setEditingSale({ ...editingSale, cost: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Día de la semana</label>
                  <select
                    value={editingSale.date}
                    onChange={(e) => {
                      const dayObj = currentWeek.days.find(d => d.date === e.target.value) || currentWeek.days[0];
                      setEditingSale({
                        ...editingSale,
                        date: e.target.value,
                        dayName: dayObj.dayName
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    {currentWeek.days.map(d => (
                      <option key={d.date} value={d.date}>
                        {d.dayName} ({d.shortDate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Cliente</label>
                <input
                  type="text"
                  value={editingSale.buyerName}
                  onChange={(e) => setEditingSale({ ...editingSale, buyerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingSale(null)}
                className="px-4 py-2 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onUpdateSale(editingSale.id, editingSale);
                  setEditingSale(null);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
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
