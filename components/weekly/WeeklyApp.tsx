import React, { useState, useEffect, useMemo } from 'react';
import { WeekInfo, WeeklySale, WidgetConfig, WidgetId } from '../../types/weekly';
import { getWeekInfo } from '../../services/weeklyDateUtils';
import {
  loadAllWeeklySales,
  addWeeklySaleItem,
  addMultipleWeeklySales,
  updateWeeklySaleItem,
  deleteWeeklySaleItem,
  moveSaleToDay,
  calculateWeeklyStats,
  calculateDaySummaries,
  loadWidgetOrder,
  saveWidgetOrder
} from '../../services/weeklyStorage';
import { WeeklyHeader } from './WeeklyHeader';
import { WeeklyStatsWidget } from './WeeklyStatsWidget';
import { WeeklyAIInputWidget } from './WeeklyAIInputWidget';
import { WeeklyManualSaleWidget } from './WeeklyManualSaleWidget';
import { WeeklySalesByDayWidget } from './WeeklySalesByDayWidget';
import { WeeklyChartWidget } from './WeeklyChartWidget';

interface WeeklyAppProps {
  onToggleToOldApp: () => void;
}

export const WeeklyApp: React.FC<WeeklyAppProps> = ({ onToggleToOldApp }) => {
  const [currentWeek, setCurrentWeek] = useState<WeekInfo>(() => getWeekInfo());
  const [sales, setSales] = useState<WeeklySale[]>(() => loadAllWeeklySales());
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => loadWidgetOrder());
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [draggedWidgetIndex, setDraggedWidgetIndex] = useState<number | null>(null);

  // Sync sales when localStorage changes in another tab
  useEffect(() => {
    const handleStorage = () => {
      setSales(loadAllWeeklySales());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Filter sales for the currently active week
  const weekSales = useMemo(() => {
    return sales.filter(s => s.weekId === currentWeek.id);
  }, [sales, currentWeek.id]);

  const weeklyStats = useMemo(() => {
    return calculateWeeklyStats(weekSales, currentWeek);
  }, [weekSales, currentWeek]);

  const daySummaries = useMemo(() => {
    return calculateDaySummaries(weekSales, currentWeek);
  }, [weekSales, currentWeek]);

  // Handlers for Sales
  const handleAddSale = (newSaleData: Omit<WeeklySale, 'id' | 'createdAt'>) => {
    addWeeklySaleItem(newSaleData);
    setSales(loadAllWeeklySales());
  };

  const handleAddMultipleSales = (newSalesList: {
    productName: string;
    quantity: number;
    price: number;
    cost: number;
    buyerName: string;
    buyerType: 'comprador' | 'distribuidor';
    date: string;
    dayName: string;
    notes?: string;
  }[]) => {
    const toAdd: Omit<WeeklySale, 'id' | 'createdAt'>[] = newSalesList.map(s => ({
      ...s,
      weekId: currentWeek.id
    }));
    addMultipleWeeklySales(toAdd);
    setSales(loadAllWeeklySales());
  };

  const handleUpdateSale = (id: string, updates: Partial<WeeklySale>) => {
    updateWeeklySaleItem(id, updates);
    setSales(loadAllWeeklySales());
  };

  const handleDeleteSale = (id: string) => {
    deleteWeeklySaleItem(id);
    setSales(loadAllWeeklySales());
  };

  const handleMoveSaleToDay = (saleId: string, targetDate: string, targetDayName: string, targetWeekId: string) => {
    moveSaleToDay(saleId, targetDate, targetDayName, targetWeekId);
    setSales(loadAllWeeklySales());
  };

  const handleSelectWeek = (weekId: string) => {
    setCurrentWeek(getWeekInfo(weekId));
  };

  // Handlers for widget reordering ("mover la mayoria de las cosas para tu comodidad")
  const moveWidget = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= widgets.length) return;
    const updated = [...widgets];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setWidgets(updated);
    saveWidgetOrder(updated);
  };

  const toggleWidgetCollapse = (id: WidgetId) => {
    const updated = widgets.map(w => w.id === id ? { ...w, collapsed: !w.collapsed } : w);
    setWidgets(updated);
    saveWidgetOrder(updated);
  };

  const resetWidgetOrder = () => {
    localStorage.removeItem('arepitas_weekly_widgets_order_v2');
    setWidgets(loadWidgetOrder());
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 selection:bg-blue-100">
      {/* Top Header */}
      <WeeklyHeader
        currentWeek={currentWeek}
        onSelectWeek={handleSelectWeek}
        onToggleToOldApp={onToggleToOldApp}
        isOrganizing={isOrganizing}
        onToggleOrganizing={() => setIsOrganizing(!isOrganizing)}
      />

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-5 space-y-4">
        {/* Organizing Mode Banner */}
        {isOrganizing && (
          <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                ⇅
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Modo Personalización y Reordenamiento
                </h4>
                <p className="text-[11px] text-amber-700 font-medium">
                  Usa los botones <strong>Subir ⬆ / Bajar ⬇</strong> o arrastra los módulos para ordenarlos a tu gusto.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={resetWidgetOrder}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Restablecer Orden
              </button>
              <button
                onClick={() => setIsOrganizing(false)}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                Terminar
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Reorderable Widgets */}
        <div className="space-y-4">
          {widgets.map((widget, index) => {
            return (
              <div
                key={widget.id}
                draggable={isOrganizing}
                onDragStart={() => setDraggedWidgetIndex(index)}
                onDragOver={(e) => {
                  if (isOrganizing) e.preventDefault();
                }}
                onDrop={() => {
                  if (isOrganizing && draggedWidgetIndex !== null && draggedWidgetIndex !== index) {
                    moveWidget(draggedWidgetIndex, index);
                    setDraggedWidgetIndex(null);
                  }
                }}
                className={`transition-all duration-200 ${
                  isOrganizing
                    ? 'ring-2 ring-amber-300/80 rounded-3xl p-1 bg-amber-50/20'
                    : ''
                }`}
              >
                {/* Reorder control strip if in organizing mode */}
                {isOrganizing && (
                  <div className="flex items-center justify-between px-3 py-1.5 bg-amber-100/80 border border-amber-200 rounded-2xl mb-2 text-xs font-bold text-amber-900">
                    <div className="flex items-center gap-2">
                      <span className="cursor-grab text-amber-700">⋮⋮</span>
                      <span>{widget.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveWidget(index, index - 1)}
                        disabled={index === 0}
                        className="px-2 py-0.5 bg-white disabled:opacity-40 rounded-lg hover:bg-amber-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title="Mover arriba"
                      >
                        ⬆ Subir
                      </button>
                      <button
                        onClick={() => moveWidget(index, index + 1)}
                        disabled={index === widgets.length - 1}
                        className="px-2 py-0.5 bg-white disabled:opacity-40 rounded-lg hover:bg-amber-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title="Mover abajo"
                      >
                        ⬇ Bajar
                      </button>
                      <button
                        onClick={() => toggleWidgetCollapse(widget.id)}
                        className="px-2 py-0.5 bg-white rounded-lg hover:bg-amber-200 transition-colors cursor-pointer"
                        title={widget.collapsed ? "Expandir" : "Plegar"}
                      >
                        {widget.collapsed ? "Mostrar" : "Plegar"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Widget content */}
                {!widget.collapsed && (
                  <div>
                    {widget.id === 'stats' && (
                      <WeeklyStatsWidget stats={weeklyStats} />
                    )}

                    {widget.id === 'ai_input' && (
                      <WeeklyAIInputWidget
                        currentWeek={currentWeek}
                        onAddSales={handleAddMultipleSales}
                      />
                    )}

                    {widget.id === 'manual_form' && (
                      <WeeklyManualSaleWidget
                        currentWeek={currentWeek}
                        onAddSale={handleAddSale}
                      />
                    )}

                    {widget.id === 'sales_by_day' && (
                      <WeeklySalesByDayWidget
                        currentWeek={currentWeek}
                        daySummaries={daySummaries}
                        onUpdateSale={handleUpdateSale}
                        onDeleteSale={handleDeleteSale}
                        onMoveSaleToDay={handleMoveSaleToDay}
                      />
                    )}

                    {widget.id === 'weekly_chart' && (
                      <WeeklyChartWidget
                        daySummaries={daySummaries}
                        currentWeek={currentWeek}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
