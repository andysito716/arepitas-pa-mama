
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sale, BusinessStats, DailyArchive, Expense } from './types';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { SalesForm } from './components/SalesForm';
import { ExpenseForm } from './components/ExpenseForm';
import { SalesTable } from './components/SalesTable';
import { AIInsights } from './components/AIInsights';
import { HistoryView } from './components/HistoryView';
import { SyncManager } from './components/SyncManager';
import { CostsView } from './components/CostsView';
import { Calculator } from './components/Calculator';
import { cloudService } from './services/dbService';

type Tab = 'ventas' | 'costos' | 'historial' | 'ia' | 'nube';

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbError, setDbError] = useState<{message: string, isTableError: boolean} | null>(null);
  
  const [businessId, setBusinessId] = useState(() => localStorage.getItem('business_id') || '');

  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [history, setHistory] = useState<DailyArchive[]>([]);

  const loadData = useCallback(async () => {
    if (!businessId) return;
    setIsSyncing(true);
    setDbError(null);
    try {
      const [remoteSales, remoteExpenses, remoteHistory] = await Promise.all([
        cloudService.fetchSales(businessId),
        cloudService.fetchExpenses(businessId),
        cloudService.fetchHistory(businessId)
      ]);
      setSales(remoteSales);
      setExpenses(remoteExpenses);
      setHistory(remoteHistory);
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

  const handleAddSale = async (data: Omit<Sale, 'id'>) => {
    const newSale = { ...data, id: crypto.randomUUID() };
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
    if (!confirm("¿Eliminar este gasto?")) return;
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (businessId) await cloudService.deleteExpense(id);
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
            <button onClick={handleNewDay} className="w-full py-5 bg-slate-800 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50" disabled={isSyncing}>
              {isSyncing ? 'SINCRONIZANDO...' : 'CERRAR CAJA DE HOY'}
            </button>
          </div>
        )}

        {activeTab === 'costos' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tight">Costo de Producción</h2>
            <CostsView 
              stats={stats} 
              sales={sales} 
              expenses={expenses}
              onOpenCalculator={() => setIsCalcOpen(true)}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>
        )}

        {activeTab === 'historial' && (
          <HistoryView 
            history={history} 
            onDeleteDay={(id) => cloudService.deleteArchive(id).then(loadData)} 
            onEditDay={() => alert("Función de edición limitada mientras se actualiza el esquema.")}
            onQuickAdd={() => {}}
          />
        )}

        {activeTab === 'ia' && <AIInsights sales={sales} />}
        {activeTab === 'nube' && <SyncManager businessId={businessId} onSetBusinessId={setBusinessId} isSyncing={isSyncing} />}
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-40">
        {activeTab === 'costos' && (
          <button 
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

      <nav className="bg-white/90 backdrop-blur-xl border-t border-slate-200 fixed bottom-0 left-0 right-0 z-50 h-20 flex justify-around items-center px-2 pb-2">
        <NavBtn active={activeTab === 'ventas'} onClick={() => setActiveTab('ventas')} icon="cash" label="Ventas" />
        <NavBtn active={activeTab === 'costos'} onClick={() => setActiveTab('costos')} icon="beaker" label="Costos" />
        <NavBtn active={activeTab === 'historial'} onClick={() => setActiveTab('historial')} icon="history" label="Historial" />
        <NavBtn active={activeTab === 'ia'} onClick={() => setActiveTab('ia')} icon="sparkles" label="IA" />
        <NavBtn active={activeTab === 'nube'} onClick={() => setActiveTab('nube')} icon="cloud" label="Negocio" />
      </nav>
    </div>
  );
};

const NavBtn = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) => {
  const icons: Record<string, React.ReactNode> = {
    cash: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    beaker: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.631.285a2 2 0 01-1.558 0l-.63-.285a6 6 0 00-3.86-.517l-2.388.477a2 2 0 00-1.022.547V21h17.428v-5.572zM7 3l3 4h4l3-4" /></svg>,
    history: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    sparkles: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    cloud: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 transition-all ${active ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
      {icons[icon]}
      <span className={`text-[9px] font-black uppercase tracking-wider ${active ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{label}</span>
    </button>
  );
};

export default App;
