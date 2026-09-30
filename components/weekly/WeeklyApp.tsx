import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WeekInfo, WeeklySale, WidgetConfig, WidgetId } from '../../types/weekly';
import { getWeekInfo, formatDateToYMD } from '../../services/weeklyDateUtils';
import {
  loadAllWeeklySales,
  saveAllWeeklySales,
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
import {
  weeklySyncService,
  getActiveBusinessId,
  setActiveBusinessId
} from '../../services/weeklySyncService';
import { WeeklyHeader } from './WeeklyHeader';
import { WeeklyStatsWidget } from './WeeklyStatsWidget';
import { WeeklySalesByDayWidget } from './WeeklySalesByDayWidget';
import { WeeklyChartWidget } from './WeeklyChartWidget';
import { WeeklyManualSaleModal } from './WeeklyManualSaleModal';
import { WeeklyAIInputModal } from './WeeklyAIInputModal';
import { WeeklySyncModal } from './WeeklySyncModal';

interface WeeklyAppProps {
  onToggleToOldApp: () => void;
}

// Streamlined widgets list for clean screen without giant embedded forms
const STREAMLINED_WIDGETS: WidgetConfig[] = [
  { id: 'stats', title: 'Métricas de la Semana', subtitle: 'Totales, margen y mejor día', icon: 'chart', collapsed: false },
  { id: 'sales_by_day', title: 'Ventas por Día', subtitle: 'Pedidos organizados día por día', icon: 'calendar', collapsed: false },
  { id: 'weekly_chart', title: 'Rendimiento y Gráfica', subtitle: 'Evolución de ingresos diarios', icon: 'trend', collapsed: false }
];

export const WeeklyApp: React.FC<WeeklyAppProps> = ({ onToggleToOldApp }) => {
  const [currentWeek, setCurrentWeek] = useState<WeekInfo>(() => getWeekInfo());
  const [sales, setSales] = useState<WeeklySale[]>(() => loadAllWeeklySales());
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = loadWidgetOrder();
    // Filter out embedded form widgets if they exist, keeping stats, sales_by_day, and chart
    const filtered = saved.filter(w => w.id === 'stats' || w.id === 'sales_by_day' || w.id === 'weekly_chart');
    return filtered.length > 0 ? filtered : STREAMLINED_WIDGETS;
  });
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [draggedWidgetIndex, setDraggedWidgetIndex] = useState<number | null>(null);

  // Modals state (triggered by floating buttons like the previous app)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [manualInitialDate, setManualInitialDate] = useState<string | undefined>(undefined);

  // Cloud Database Sync State
  const [businessId, setBusinessId] = useState<string>(() => getActiveBusinessId());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [cloudNotice, setCloudNotice] = useState<string | null>(null);

  // Sync sales from Supabase Cloud Database
  const syncFromCloud = useCallback(async (currentBusId: string, showToast = false) => {
    if (!currentBusId) return;
    setIsSyncing(true);
    try {
      const cloudSales = await weeklySyncService.fetchCloudSales(currentBusId);
      if (cloudSales && cloudSales.length > 0) {
        setSales(cloudSales);
        saveAllWeeklySales(cloudSales);
        setLastSyncTime(new Date());
        if (showToast) {
          setCloudNotice(`¡Sincronizado! ${cloudSales.length} ventas al día.`);
          setTimeout(() => setCloudNotice(null), 3500);
        }
      } else {
        const local = loadAllWeeklySales();
        if (local.length > 0) {
          try {
            await weeklySyncService.pushMultipleSales(currentBusId, local);
            setLastSyncTime(new Date());
          } catch (e) {
            console.warn("Could not initial-seed cloud:", e);
          }
        }
      }
    } catch (e: any) {
      console.warn("Error synchronizing with cloud:", e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial cloud fetch & subscribe to real-time changes
  useEffect(() => {
    syncFromCloud(businessId);

    const unsubscribe = weeklySyncService.subscribeToSales(businessId, () => {
      syncFromCloud(businessId, true);
    });

    return () => {
      unsubscribe();
    };
  }, [businessId, syncFromCloud]);

  // Sync sales when storage changes in another tab
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
  const handleAddSale = async (newSaleData: Omit<WeeklySale, 'id' | 'createdAt'>) => {
    const createdLocal = addWeeklySaleItem(newSaleData);
    setSales(loadAllWeeklySales());

    try {
      setIsSyncing(true);
      await weeklySyncService.pushSale(businessId, createdLocal);
      setLastSyncTime(new Date());
    } catch (e) {
      console.warn("Could not push sale to cloud immediately:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddMultipleSales = async (newSalesList: {
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

    const createdLocals = addMultipleWeeklySales(toAdd);
    setSales(loadAllWeeklySales());

    try {
      setIsSyncing(true);
      await weeklySyncService.pushMultipleSales(businessId, createdLocals);
      setLastSyncTime(new Date());
    } catch (e) {
      console.warn("Could not push batch sales to cloud:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateSale = async (id: string, updates: Partial<WeeklySale>) => {
    updateWeeklySaleItem(id, updates);
    setSales(loadAllWeeklySales());

    try {
      await weeklySyncService.updateSale(id, updates);
      setLastSyncTime(new Date());
    } catch (e) {
      console.warn("Could not update sale in cloud:", e);
    }
  };

  const handleDeleteSale = async (id: string) => {
    deleteWeeklySaleItem(id);
    setSales(loadAllWeeklySales());

    try {
      await weeklySyncService.deleteSale(id);
      setLastSyncTime(new Date());
    } catch (e) {
      console.warn("Could not delete sale from cloud:", e);
    }
  };

  const handleMoveSaleToDay = async (saleId: string, targetDate: string, targetDayName: string, targetWeekId: string) => {
    moveSaleToDay(saleId, targetDate, targetDayName, targetWeekId);
    setSales(loadAllWeeklySales());

    try {
      await weeklySyncService.updateSale(saleId, { date: targetDate });
      setLastSyncTime(new Date());
    } catch (e) {
      console.warn("Could not move sale in cloud:", e);
    }
  };

  const handleSelectWeek = (weekId: string) => {
    setCurrentWeek(getWeekInfo(weekId));
  };

  const handleSaveBusinessId = (newId: string) => {
    setActiveBusinessId(newId);
    setBusinessId(newId);
    syncFromCloud(newId, true);
    setIsSyncModalOpen(false);
  };

  const handleOpenManualModal = (date?: string) => {
    setManualInitialDate(date);
    setIsManualModalOpen(true);
  };

  // Handlers for widget reordering
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
    setWidgets(STREAMLINED_WIDGETS);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24 selection:bg-blue-100">
      {/* Top Header */}
      <WeeklyHeader
        currentWeek={currentWeek}
        onSelectWeek={handleSelectWeek}
        onToggleToOldApp={onToggleToOldApp}
        isOrganizing={isOrganizing}
        onToggleOrganizing={() => setIsOrganizing(!isOrganizing)}
        businessId={businessId}
        isSyncing={isSyncing}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-3 space-y-2 sm:space-y-2.5">
        {/* Cloud Notification Toast */}
        {cloudNotice && (
          <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-emerald-900">{cloudNotice}</p>
            </div>
            <button
              onClick={() => setCloudNotice(null)}
              className="text-xs text-emerald-700 font-bold px-1.5 py-0.5 rounded hover:bg-emerald-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Action Top Bar (Buttons to open Manual & AI modal) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleOpenManualModal()}
            className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Registrar Venta</span>
          </button>

          <button
            onClick={() => setIsAIModalOpen(true)}
            className="py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>✨ Registro con IA</span>
          </button>
        </div>

        {/* Organizing Mode Banner */}
        {isOrganizing && (
          <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                ⇅
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-900 leading-tight">
                  Modo Reordenamiento
                </h4>
                <p className="text-[10px] text-amber-700 font-medium leading-tight">
                  Usa los botones <strong>Subir ⬆ / Bajar ⬇</strong> para mover las secciones.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <button
                onClick={resetWidgetOrder}
                className="h-7 px-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
              >
                Restablecer
              </button>
              <button
                onClick={() => setIsOrganizing(false)}
                className="h-7 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Reorderable Widgets */}
        <div className="space-y-2 sm:space-y-2.5">
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
                    ? 'ring-1 ring-amber-300 rounded-2xl p-1 bg-amber-50/40'
                    : ''
                }`}
              >
                {/* Reorder control strip if in organizing mode */}
                {isOrganizing && (
                  <div className="flex items-center justify-between px-2.5 py-1 bg-amber-100/80 border border-amber-200 rounded-xl mb-1.5 text-xs font-bold text-amber-900">
                    <div className="flex items-center gap-1.5">
                      <span className="cursor-grab text-amber-700">⋮⋮</span>
                      <span className="text-[11px] font-black">{widget.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveWidget(index, index - 1)}
                        disabled={index === 0}
                        className="px-2 py-0.5 bg-white disabled:opacity-40 rounded text-[10px] hover:bg-amber-200 font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title="Subir"
                      >
                        ⬆
                      </button>
                      <button
                        onClick={() => moveWidget(index, index + 1)}
                        disabled={index === widgets.length - 1}
                        className="px-2 py-0.5 bg-white disabled:opacity-40 rounded text-[10px] hover:bg-amber-200 font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title="Bajar"
                      >
                        ⬇
                      </button>
                      <button
                        onClick={() => toggleWidgetCollapse(widget.id)}
                        className="px-2 py-0.5 bg-white rounded text-[10px] hover:bg-amber-200 font-bold transition-colors cursor-pointer"
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

                    {widget.id === 'sales_by_day' && (
                      <WeeklySalesByDayWidget
                        currentWeek={currentWeek}
                        daySummaries={daySummaries}
                        onUpdateSale={handleUpdateSale}
                        onDeleteSale={handleDeleteSale}
                        onMoveSaleToDay={handleMoveSaleToDay}
                        onOpenManualModal={handleOpenManualModal}
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

      {/* Floating Action Buttons in bottom-right corner (just like the previous app!) */}
      <div className="fixed bottom-4 right-3 sm:right-5 flex flex-col gap-2.5 z-40">
        {/* AI Smart Register FAB */}
        <button
          onClick={() => setIsAIModalOpen(true)}
          className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center active:scale-90 transition-all cursor-pointer group"
          title="Registro Inteligente con IA"
          aria-label="Registro Inteligente con IA"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>

        {/* Manual Sale FAB (+) */}
        <button
          onClick={() => handleOpenManualModal()}
          className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center active:scale-90 transition-all cursor-pointer"
          title="Añadir Venta"
          aria-label="Añadir Venta"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Manual Sale Modal */}
      <WeeklyManualSaleModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        currentWeek={currentWeek}
        onAddSale={handleAddSale}
        initialDate={manualInitialDate}
      />

      {/* AI Smart Input Modal */}
      <WeeklyAIInputModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        currentWeek={currentWeek}
        onAddSales={handleAddMultipleSales}
      />

      {/* Cloud Sync Modal */}
      <WeeklySyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        businessId={businessId}
        onSaveBusinessId={handleSaveBusinessId}
        isSyncing={isSyncing}
        onManualSync={() => syncFromCloud(businessId, true)}
        lastSyncTime={lastSyncTime}
        salesCount={sales.length}
      />
    </div>
  );
};
