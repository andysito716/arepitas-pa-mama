
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sale, BusinessStats, DailyArchive, Expense, ProductionCost, Note, Suggestion, ClosingSchedule, Booking } from './types';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { SalesForm } from './components/SalesForm';
import { ExpenseForm } from './components/ExpenseForm';
import { SalesTable } from './components/SalesTable';
import { AIInsights } from './components/AIInsights';
import { HistoryView } from './components/HistoryView';
import { SyncManager } from './components/SyncManager';
import { BookingsView } from './components/BookingsView';
import { CostsView } from './components/CostsView';
import { Calculator } from './components/Calculator';
import { ConfirmModal } from './components/ConfirmModal';
import { Tutorial } from './components/Tutorial';
import { NotesSection } from './components/NotesSection';
import { SuggestionsSection } from './components/SuggestionsSection';
import { ClosingScheduleModal } from './components/ClosingScheduleModal';
import { cloudService } from './services/dbService';

type Tab = 'ventas' | 'costos' | 'historial' | 'ia' | 'notas' | 'nube' | 'agendacion';

const SQL_SETUP = `-- 1. COPIA TODO ESTE CÓDIGO
-- 2. VE A TU PANEL DE SUPABASE -> SQL EDITOR -> NUEVA CONSULTA
-- 3. PEGA Y DALE A "RUN" (EL BOTÓN VERDE)

-- TABLA DE VENTAS
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  price numeric not null,
  cost numeric not null default 0,
  quantity integer not null,
  buyer_name text not null,
  buyer_type text not null default 'comprador',
  date text not null,
  business_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA DE GASTOS
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric not null,
  category text not null,
  date text not null,
  business_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA DE HISTORIAL (ARCHIVOS)
create table if not exists archives (
  id text primary key,
  date text not null,
  total_revenue numeric not null,
  total_profit numeric not null default 0,
  total_items integer not null,
  sales_json text default '[]',
  expenses_json text default '[]',
  business_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA DE NOTAS
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  date text not null,
  business_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA DE SUGERENCIAS
create table if not exists suggestions (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  date text not null,
  business_id text not null,
  timestamp bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA DE HORARIOS DE CIERRE
create table if not exists closing_schedules (
  id uuid primary key default gen_random_uuid(),
  time text not null,
  business_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA DE COSTOS DE PRODUCCIÓN
create table if not exists production_costs (
  id text primary key,
  label text not null,
  value numeric not null,
  business_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA DE CONFIGURACIÓN DEL NEGOCIO
create table if not exists business_settings (
  business_id text primary key,
  selected_production_cost_id text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA DE AGENDACIÓN (RESERVAS)
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  date text not null,
  time text not null,
  buyer_name text not null,
  quantity integer not null,
  reference text not null, -- 'blanco' | 'amarillo'
  is_distributor boolean not null default false,
  cash_payment numeric not null default 0,
  transfer_payment numeric not null default 0,
  location text not null,
  city_neighborhood text not null,
  delivery_fee numeric, -- null if no delivery fee
  is_half_delivery_paid boolean not null default false,
  business_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ASEGURAR COLUMNAS SI LAS TABLAS YA EXISTÍAN
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='sales' and column_name='cost') then
    alter table sales add column cost numeric default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='archives' and column_name='expenses_json') then
    alter table archives add column expenses_json text default '[]';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='sales' and column_name='buyer_type') then
    alter table sales add column buyer_type text default 'comprador';
  end if;
end $$;

-- FORZAR RECARGA DEL ESQUEMA (SOLUCIONA EL ERROR PGRST205)
notify pgrst, 'reload schema';`;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('ventas');
  const [isSalesFormOpen, setIsSalesFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbError, setDbError] = useState<{message: string, isTableError: boolean} | null>(null);
  
  const [archiveToEdit, setArchiveToEdit] = useState<DailyArchive | null>(null);
  
  const [businessId, setBusinessId] = useState(() => localStorage.getItem('business_id') || '');

  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [history, setHistory] = useState<DailyArchive[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [closingSchedules, setClosingSchedules] = useState<ClosingSchedule[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [lastAutoCloseCheck, setLastAutoCloseCheck] = useState<string | null>(null);
  
  const [productionCosts, setProductionCosts] = useState<ProductionCost[]>(() => {
    const saved = localStorage.getItem('production_costs');
    return saved ? JSON.parse(saved) : [{ id: 'default', value: 0, label: 'Costo Base' }];
  });
  const [selectedCostId, setSelectedCostId] = useState(() => localStorage.getItem('selected_cost_id') || 'default');

  useEffect(() => {
    localStorage.setItem('production_costs', JSON.stringify(productionCosts));
  }, [productionCosts]);

  useEffect(() => {
    localStorage.setItem('selected_cost_id', selectedCostId);
  }, [selectedCostId]);

  const activeProductionCost = useMemo(() => 
    productionCosts.find(c => c.id === selectedCostId)?.value || 0
  , [productionCosts, selectedCostId]);

  const loadData = useCallback(async () => {
    if (!businessId) return;
    setIsSyncing(true);
    setDbError(null);
    try {
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      await cloudService.cleanupOldSuggestions(businessId, oneWeekAgo);

      const [remoteSales, remoteExpenses, remoteHistory, remoteNotes, remoteSuggestions, remoteSchedules, remoteProductionCosts, remoteSettings, remoteBookings] = await Promise.all([
        cloudService.fetchSales(businessId),
        cloudService.fetchExpenses(businessId),
        cloudService.fetchHistory(businessId),
        cloudService.fetchNotes(businessId),
        cloudService.fetchSuggestions(businessId),
        cloudService.fetchClosingSchedules(businessId),
        cloudService.fetchProductionCosts(businessId),
        cloudService.fetchBusinessSettings(businessId),
        cloudService.fetchBookings(businessId)
      ]);
      setSales(remoteSales);
      setExpenses(remoteExpenses);
      setHistory(remoteHistory);
      setNotes(remoteNotes);
      setSuggestions(remoteSuggestions);
      setClosingSchedules(remoteSchedules);
      setBookings(remoteBookings);
      if (remoteProductionCosts.length > 0) {
        setProductionCosts(remoteProductionCosts);
      }
      if (remoteSettings?.selected_production_cost_id) {
        setSelectedCostId(remoteSettings.selected_production_cost_id);
      }
    } catch (e: any) {
      console.error("Error en carga:", e);
      let errorMessage = e.message || "Error al conectar con la nube";
      
      // Detectar específicamente PGRST204 (columna falta) o PGRST205 (tabla falta)
      const isTableOrColError = e.code?.startsWith('PGRST20') || e.message?.includes('column') || e.message?.includes('table') || e.message?.includes('schema');
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = "Error de conexión: No se pudo contactar con Supabase. Verifica que las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén configuradas correctamente.";
      }

      setDbError({
        message: errorMessage,
        isTableError: isTableOrColError
      });
    } finally {
      setIsSyncing(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId) {
      loadData();
      localStorage.setItem('business_id', businessId);
    }
  }, [businessId, loadData]);

  const handleAddSale = async (data: Omit<Sale, 'id' | 'cost'>) => {
    const newSale: Sale = { 
      ...data, 
      id: crypto.randomUUID(),
      cost: activeProductionCost 
    };
    setSales(prev => [newSale, ...prev]);
    if (businessId) {
      try {
        await cloudService.pushSale(businessId, newSale);
      } catch (e: any) {
        setDbError({ message: e.message, isTableError: true });
      }
    }
  };

  const handleAddExpense = async (data: Omit<Expense, 'id'>) => {
    const newExpense = { ...data, id: crypto.randomUUID() };
    setExpenses(prev => [newExpense, ...prev]);
    if (businessId) {
      try {
        await cloudService.pushExpense(businessId, newExpense);
      } catch (e: any) {
        setDbError({ message: e.message, isTableError: true });
      }
    }
  };

  const handleDeleteSale = async (id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
    if (businessId) await cloudService.deleteSale(id);
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (businessId) await cloudService.deleteExpense(id);
  };

  const handleAddNote = async (content: string) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      content,
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      business_id: businessId
    };
    setNotes(prev => [newNote, ...prev]);
    if (businessId) {
      try {
        await cloudService.pushNote(businessId, newNote);
      } catch (e: any) {
        setDbError({ message: e.message, isTableError: true });
      }
    }
  };

  const handleDeleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (businessId) await cloudService.deleteNote(id);
  };

  const handleAddSuggestion = async (content: string) => {
    const newSuggestion: Suggestion = {
      id: crypto.randomUUID(),
      content,
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      business_id: businessId,
      timestamp: Date.now()
    };
    setSuggestions(prev => [newSuggestion, ...prev]);
    if (businessId) {
      try {
        await cloudService.pushSuggestion(businessId, newSuggestion);
      } catch (e: any) {
        setDbError({ message: e.message, isTableError: true });
      }
    }
  };

  const handleDeleteSuggestion = async (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
    if (businessId) await cloudService.deleteSuggestion(id);
  };

  const handleAddClosingSchedule = async (time: string) => {
    const newSchedule: ClosingSchedule = {
      id: crypto.randomUUID(),
      time,
      business_id: businessId
    };
    setClosingSchedules(prev => [...prev, newSchedule].sort((a, b) => a.time.localeCompare(b.time)));
    if (businessId) {
      try {
        await cloudService.pushClosingSchedule(businessId, newSchedule);
      } catch (e: any) {
        setDbError({ message: e.message, isTableError: true });
      }
    }
  };

  const handleDeleteClosingSchedule = async (id: string) => {
    setClosingSchedules(prev => prev.filter(s => s.id !== id));
    if (businessId) await cloudService.deleteClosingSchedule(id);
  };

  const handleAddBooking = async (data: Omit<Booking, 'id' | 'business_id'>) => {
    const newBooking: Booking = {
      ...data,
      id: crypto.randomUUID(),
      business_id: businessId
    };
    setBookings(prev => [...prev, newBooking].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    }));
    if (businessId) {
      try {
        await cloudService.pushBooking(businessId, newBooking);
      } catch (e: any) {
        setDbError({ message: e.message, isTableError: true });
      }
    }
  };

  const handleDeleteBooking = async (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    if (businessId) await cloudService.deleteBooking(id);
  };

  // Lógica de auto-cierre
  useEffect(() => {
    const interval = setInterval(() => {
      if (closingSchedules.length === 0 || (sales.length === 0 && expenses.length === 0)) return;

      const now = new Date();
      const currentTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

      if (currentTime === lastAutoCloseCheck) return;

      const shouldClose = closingSchedules.some(s => s.time === currentTime);
      if (shouldClose) {
        setLastAutoCloseCheck(currentTime);
        handleNewDay();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [closingSchedules, sales, expenses, lastAutoCloseCheck]);

  const handleAddProductionCost = async (value: number, label: string) => {
    const newCost: ProductionCost = { id: crypto.randomUUID(), value, label };
    setProductionCosts(prev => [...prev, newCost]);
    setSelectedCostId(newCost.id);
    if (businessId) {
      try {
        await cloudService.pushProductionCost(businessId, newCost);
        await cloudService.updateBusinessSettings(businessId, { selected_production_cost_id: newCost.id });
      } catch (e: any) {
        console.error("Error al sincronizar costo:", e);
      }
    }
  };

  const handleDeleteProductionCost = async (id: string) => {
    if (productionCosts.length <= 1) return alert("Debes tener al menos un costo guardado.");
    const newCosts = productionCosts.filter(c => c.id !== id);
    setProductionCosts(newCosts);
    
    let nextId = selectedCostId;
    if (selectedCostId === id) {
      nextId = newCosts[0].id;
      setSelectedCostId(nextId);
    }

    if (businessId) {
      try {
        await cloudService.deleteProductionCost(id);
        if (selectedCostId === id) {
          await cloudService.updateBusinessSettings(businessId, { selected_production_cost_id: nextId });
        }
      } catch (e: any) {
        console.error("Error al eliminar costo:", e);
      }
    }
  };

  const handleSelectProductionCost = async (id: string) => {
    setSelectedCostId(id);
    if (businessId) {
      try {
        await cloudService.updateBusinessSettings(businessId, { selected_production_cost_id: id });
      } catch (e: any) {
        console.error("Error al guardar configuración:", e);
      }
    }
  };

  const handleNewDay = async () => {
    if (sales.length === 0 && expenses.length === 0) return alert("Nada que guardar.");
    
    const totalRevenue = sales.reduce((acc, s) => acc + (s.price * s.quantity), 0);
    const totalCogs = sales.reduce((acc, s) => acc + (s.cost * s.quantity), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const totalProfit = totalRevenue - totalCogs - totalExpenses;
    
    const archive: DailyArchive = {
      id: `archive-${Date.now()}`,
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      sales: [...sales],
      expenses: [...expenses],
      totalRevenue,
      totalProfit,
      totalItems: sales.reduce((acc, s) => acc + s.quantity, 0)
    };

    setIsSyncing(true);
    if (businessId) {
      try {
        await cloudService.saveArchive(businessId, archive);
        await loadData();
        setSales([]);
        setExpenses([]);
        setActiveTab('historial');
      } catch (e: any) {
        setDbError({ message: e.message, isTableError: true });
      }
    }
    setIsSyncing(false);
  };

  const handleEditDay = (archive: DailyArchive) => {
    setArchiveToEdit(archive);
  };

  const confirmEditDay = async () => {
    if (!archiveToEdit) return;
    const archive = archiveToEdit;
    setArchiveToEdit(null);
    
    setIsSyncing(true);
    try {
      if (businessId) {
        await cloudService.restoreArchive(businessId, archive);
        await loadData();
        setActiveTab('ventas');
      }
    } catch (e: any) {
      setDbError({ message: e.message, isTableError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const stats = useMemo((): BusinessStats => {
    const totalRevenue = sales.reduce((acc, s) => acc + (s.price * s.quantity), 0);
    const totalCogs = sales.reduce((acc, s) => acc + (s.cost * s.quantity), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const totalCost = totalCogs + totalExpenses;
    return { 
      totalRevenue, 
      totalProfit: totalRevenue - totalCost, 
      totalCost, 
      totalSalesCount: sales.reduce((acc, s) => acc + s.quantity, 0) 
    };
  }, [sales, expenses]);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50 overflow-hidden font-sans">
      <Header />
      
      <main className="flex-1 overflow-y-auto pb-32 px-4 pt-4 safe-top custom-scrollbar">
        <div className="max-w-2xl mx-auto w-full">
          {activeTab === 'ventas' && (
            <button 
              onClick={() => setIsTutorialOpen(true)}
              className="w-full mb-4 py-4 bg-white border-2 border-blue-100 rounded-[28px] flex items-center justify-center gap-3 text-blue-600 font-black text-xs uppercase tracking-widest shadow-sm hover:bg-blue-50 transition-all active:scale-95 group"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              ¿Cómo usar la App? Ver Tutorial
            </button>
          )}

          {dbError && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 p-6 rounded-[32px] space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-red-700">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
               <h3 className="font-black text-sm uppercase">¡Problema de Configuración!</h3>
            </div>
            
            <p className="text-xs text-red-600 font-bold leading-relaxed">
              {dbError.isTableError 
                ? "Faltan tablas o columnas en Supabase (Error PGRST). Necesitas ejecutar el script de reparación abajo." 
                : dbError.message}
            </p>

            {dbError.isTableError && (
              <div className="space-y-3">
                <div className="bg-slate-900 p-4 rounded-2xl relative border border-white/10 shadow-inner">
                  <pre className="text-[9px] text-emerald-400 font-mono overflow-x-auto whitespace-pre leading-tight max-h-40">
                    {SQL_SETUP}
                  </pre>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(SQL_SETUP); alert("¡SQL Copiado! Ve a Supabase -> SQL Editor y pégalo."); }}
                    className="absolute top-2 right-2 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-lg active:scale-90 transition-all"
                  >
                    COPIAR SCRIPT
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-slate-500 font-bold italic text-center">Una vez ejecutado en Supabase, dale al botón de abajo:</p>
                  <button 
                    onClick={loadData}
                    className="w-full py-4 bg-red-600 text-white font-black rounded-2xl text-xs uppercase shadow-xl shadow-red-100 active:scale-95 transition-all"
                  >
                    REINTENTAR CONEXIÓN
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ventas' && (
          <div className="space-y-6">
            <Dashboard stats={stats} />
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Ventas de Hoy</h3>
            <SalesTable sales={sales} onDeleteSale={handleDeleteSale} onUpdateSale={() => {}} />
            
            <div className="flex flex-col gap-3">
              <button 
                id="tutorial-closing-schedules"
                onClick={() => setIsClosingModalOpen(true)}
                className="w-full py-4 bg-blue-50 text-blue-600 font-black rounded-2xl border-2 border-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all uppercase text-xs tracking-widest"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Configurar Horarios de Cierre
              </button>

              <button id="tutorial-close-day" onClick={handleNewDay} className="w-full py-5 bg-slate-800 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50" disabled={isSyncing}>
                {isSyncing ? 'SINCRONIZANDO...' : 'CERRAR CAJA DE HOY'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notas' && (
          <div className="space-y-12">
            <NotesSection 
              notes={notes} 
              onAddNote={handleAddNote} 
              onDeleteNote={handleDeleteNote} 
            />
            
            <div className="h-px bg-slate-200 mx-4" />

            <SuggestionsSection 
              suggestions={suggestions}
              onAddSuggestion={handleAddSuggestion}
              onDeleteSuggestion={handleDeleteSuggestion}
            />
          </div>
        )}

        {activeTab === 'costos' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tight">Costo de Producción</h2>
            <CostsView 
              stats={stats} 
              sales={sales} 
              expenses={expenses}
              productionCosts={productionCosts}
              selectedCostId={selectedCostId}
              onSelectCost={handleSelectProductionCost}
              onAddProductionCost={handleAddProductionCost}
              onDeleteProductionCost={handleDeleteProductionCost}
              onOpenCalculator={() => setIsCalcOpen(true)}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>
        )}

        {activeTab === 'historial' && (
          <HistoryView 
            history={history} 
            onDeleteDay={(id) => cloudService.deleteArchive(id).then(loadData)} 
            onEditDay={handleEditDay}
            onQuickAdd={() => {}}
          />
        )}

        {activeTab === 'ia' && <AIInsights sales={sales} />}
        {activeTab === 'agendacion' && (
          <BookingsView 
            bookings={bookings} 
            onAddBooking={handleAddBooking} 
            onDeleteBooking={handleDeleteBooking} 
          />
        )}
        {activeTab === 'nube' && <SyncManager businessId={businessId} onSetBusinessId={setBusinessId} isSyncing={isSyncing} />}
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-40">
        {activeTab === 'costos' && (
          <button 
            id="tutorial-add-expense"
            onClick={() => setIsExpenseFormOpen(true)}
            className="w-16 h-16 bg-amber-500 text-white rounded-full shadow-2xl border-4 border-white flex items-center justify-center active:scale-90 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
        {activeTab === 'ventas' && (
          <button 
            id="tutorial-add-sale"
            onClick={() => setIsSalesFormOpen(true)}
            className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl border-4 border-white flex items-center justify-center active:scale-90 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      <SalesForm isOpen={isSalesFormOpen} onClose={() => setIsSalesFormOpen(false)} onAddSale={handleAddSale} />
      <ExpenseForm isOpen={isExpenseFormOpen} onClose={() => setIsExpenseFormOpen(false)} onAddExpense={handleAddExpense} />
      <Calculator isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
      
      <Tutorial 
        isOpen={isTutorialOpen} 
        onClose={() => setIsTutorialOpen(false)} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSalesFormOpen={isSalesFormOpen}
      />

      <ClosingScheduleModal 
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
        schedules={closingSchedules}
        onAddSchedule={handleAddClosingSchedule}
        onDeleteSchedule={handleDeleteClosingSchedule}
      />

      <ConfirmModal 
        isOpen={!!archiveToEdit}
        title="¿Reabrir Cierre?"
        message={`¿Quieres reabrir el cierre del ${archiveToEdit?.date}? Las ventas y gastos volverán a sus secciones originales para que puedas editarlos.`}
        onConfirm={confirmEditDay}
        onCancel={() => setArchiveToEdit(null)}
      />

      <nav id="tutorial-nav-bar" className="bg-white/90 backdrop-blur-xl border-t border-slate-200 fixed bottom-0 left-0 right-0 z-50 h-20 flex justify-around items-center px-2 pb-2">
        <NavBtn id="nav-ventas" active={activeTab === 'ventas'} onClick={() => setActiveTab('ventas')} icon="cash" label="Ventas" />
        <NavBtn id="nav-costos" active={activeTab === 'costos'} onClick={() => setActiveTab('costos')} icon="beaker" label="Costos" />
        <NavBtn id="nav-notas" active={activeTab === 'notas'} onClick={() => setActiveTab('notas')} icon="note" label="Notas" />
        <NavBtn id="nav-historial" active={activeTab === 'historial'} onClick={() => setActiveTab('historial')} icon="history" label="Historial" />
        <NavBtn id="nav-ia" active={activeTab === 'ia'} onClick={() => setActiveTab('ia')} icon="sparkles" label="IA" />
        <NavBtn id="nav-agendacion" active={activeTab === 'agendacion'} onClick={() => setActiveTab('agendacion')} icon="calendar" label="Agenda" />
        <NavBtn id="nav-nube" active={activeTab === 'nube'} onClick={() => setActiveTab('nube')} icon="cloud" label="Negocio" />
      </nav>
    </div>
  );
};

const NavBtn = ({ active, onClick, icon, label, id }: { active: boolean, onClick: () => void, icon: string, label: string, id?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    cash: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    beaker: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.631.285a2 2 0 01-1.558 0l-.63-.285a6 6 0 00-3.86-.517l-2.388.477a2 2 0 00-1.022.547V21h17.428v-5.572zM7 3l3 4h4l3-4" /></svg>,
    history: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    sparkles: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    note: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    calendar: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v14a2 2 0 002 2z" /></svg>,
    cloud: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
  };
  return (
    <button id={id} onClick={onClick} className={`flex flex-col items-center justify-center flex-1 transition-all ${active ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
      {icons[icon]}
      <span className={`text-[9px] font-black uppercase tracking-wider ${active ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{label}</span>
    </button>
  );
};

export default App;
