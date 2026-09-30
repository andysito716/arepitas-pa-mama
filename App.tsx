
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
import { SalesImportModal } from './components/SalesImportModal';
import { WeeklyApp } from './components/weekly/WeeklyApp';
import { cloudService } from './services/dbService';
import { extractSalesFromText } from './services/geminiService';
import * as XLSX from 'xlsx';

type Tab = 'ventas' | 'costos' | 'historial' | 'ia' | 'notas' | 'nube' | 'agendacion';

const SQL_SETUP = `-- 1. COPIA TODO ESTE CÓDIGO
-- 2. VE A TU PANEL DE SUPABASE -> SQL EDITOR -> NUEVA CONSULTA
-- 3. PEGA Y DALE A "RUN" (EL BOTÓN VERDE)
-- 4. SI APARECE UN CUADRO AMARILLO DICIENDO "RLS", DALE A "EJECUTAR SIN RLS"

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
  color text,
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
  order_date text not null,
  delivery_date text not null,
  delivery_time text not null,
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

-- DESACTIVAR RLS PARA EVITAR BLOQUEOS
alter table sales disable row level security;
alter table expenses disable row level security;
alter table archives disable row level security;
alter table notes disable row level security;
alter table suggestions disable row level security;
alter table closing_schedules disable row level security;
alter table production_costs disable row level security;
alter table business_settings disable row level security;
alter table bookings disable row level security;

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
  if not exists (select 1 from information_schema.columns where table_name='sales' and column_name='color') then
    alter table sales add column color text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='business_settings' and column_name='advanced_ai_enabled') then
    alter table business_settings add column advanced_ai_enabled boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'bookings' and column_name = 'delivery_date') then
    alter table bookings add column delivery_date text;
    alter table bookings add column delivery_time text;
    alter table bookings add column order_date text;
  end if;
end $$;

-- FORZAR RECARGA DEL ESQUEMA (SOLUCIONA EL ERROR PGRST205)
notify pgrst, 'reload schema';
`;

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'antes' | 'despues'>(() => {
    return (localStorage.getItem('app_view_mode') as 'antes' | 'despues') || 'antes';
  });

  const toggleViewMode = () => {
    setViewMode((prev) => {
      const next = prev === 'antes' ? 'despues' : 'antes';
      localStorage.setItem('app_view_mode', next);
      return next;
    });
  };

  const [activeTab, setActiveTab] = useState<Tab>('ventas');
  const [isSalesFormOpen, setIsSalesFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbError, setDbError] = useState<{message: string, isTableError: boolean} | null>(null);
  
  const [archiveToEdit, setArchiveToEdit] = useState<DailyArchive | null>(null);
  const [archiveToDelete, setArchiveToDelete] = useState<DailyArchive | null>(null);
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [bookingPrefill, setBookingPrefill] = useState<any>(null);
  
  const [businessId, setBusinessId] = useState(() => localStorage.getItem('business_id') || 'arepitas-pa-mama');

  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [history, setHistory] = useState<DailyArchive[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [closingSchedules, setClosingSchedules] = useState<ClosingSchedule[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImportSales, setPendingImportSales] = useState<Omit<Sale, 'id' | 'cost'>[]>([]);
  const [lastAutoCloseCheck, setLastAutoCloseCheck] = useState<string | null>(null);
  
  // AI Chat Persistence State
  const [aiChatMessages, setAiChatMessages] = useState<{id: string, role: 'user'|'ai', content: string}[]>(() => {
    const saved = localStorage.getItem('ai_chat_messages');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ai_chat_messages', JSON.stringify(aiChatMessages));
  }, [aiChatMessages]);

  const [productionCosts, setProductionCosts] = useState<ProductionCost[]>(() => {
    const saved = localStorage.getItem('production_costs');
    return saved ? JSON.parse(saved) : [{ id: 'default', value: 0, label: 'Costo Base' }];
  });
  const [selectedCostId, setSelectedCostId] = useState(() => localStorage.getItem('selected_cost_id') || 'default');
  const [advancedAIEnabled, setAdvancedAIEnabled] = useState(() => localStorage.getItem('advanced_ai_enabled') === 'true');

  useEffect(() => {
    localStorage.setItem('production_costs', JSON.stringify(productionCosts));
  }, [productionCosts]);

  useEffect(() => {
    localStorage.setItem('selected_cost_id', selectedCostId);
  }, [selectedCostId]);

  useEffect(() => {
    localStorage.setItem('advanced_ai_enabled', String(advancedAIEnabled));
  }, [advancedAIEnabled]);

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
      if (remoteSettings?.advanced_ai_enabled !== undefined) {
        setAdvancedAIEnabled(remoteSettings.advanced_ai_enabled);
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

  const handleAddSale = async (data: Omit<Sale, 'id' | 'cost'>, andBooking?: boolean) => {
    // Lógica de auto-cierre por cambio de fecha
    if (sales.length > 0) {
      const currentSalesSorted = [...sales].sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('-');
        const dateB = b.date.split('/').reverse().join('-');
        return dateB.localeCompare(dateA);
      });
      const latestDate = currentSalesSorted[0].date;
      
      if (data.date !== latestDate) {
        // Si la nueva venta es de una fecha distinta (usualmente más reciente), 
        // cerramos lo anterior automáticamente antes de registrar la nueva.
        await handleNewDay();
      }
    }

    const newSale: Sale = { 
      ...data, 
      id: crypto.randomUUID(),
      cost: activeProductionCost 
    };
    setSales(prev => [newSale, ...prev]);
    
    if (andBooking) {
      setBookingPrefill({
        buyerName: data.buyerName,
        quantity: data.quantity,
        isDistributor: data.buyerType === 'distribuidor'
      });
      setActiveTab('agendacion');
    }

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
      const dateCompare = a.deliveryDate.localeCompare(b.deliveryDate);
      if (dateCompare !== 0) return dateCompare;
      return a.deliveryTime.localeCompare(b.deliveryTime);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Convert array of arrays to string for Gemini
        const textToAnalyze = json.map((row: any) => row.join(' | ')).join('\n');
        
        const extracted = await extractSalesFromText(textToAnalyze);
        setPendingImportSales(extracted);
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Error leyendo archivo:", error);
      alert("No se pudo leer el archivo. Intenta con otro.");
      setIsImporting(false);
    }
  };

  const handleConfirmImportDay = async (daySales: Omit<Sale, 'id' | 'cost'>[]) => {
    if (daySales.length === 0) return;
    setIsSyncing(true);
    try {
      const dayDate = daySales[0].date;
      const salesToArchive: Sale[] = daySales.map(s => ({
        ...s,
        id: crypto.randomUUID(),
        cost: activeProductionCost
      }));

      const totalRevenue = salesToArchive.reduce((acc, s) => acc + (s.price * s.quantity), 0);
      const totalCogs = salesToArchive.reduce((acc, s) => acc + (s.cost * s.quantity), 0);
      const totalProfit = totalRevenue - totalCogs;

      const archive: DailyArchive = {
        id: `archive-${crypto.randomUUID()}`,
        date: dayDate, // Usar la fecha real detectada/editada
        sales: salesToArchive,
        expenses: [],
        totalRevenue,
        totalProfit,
        totalItems: salesToArchive.reduce((acc, s) => acc + s.quantity, 0)
      };

      if (businessId) {
        // Guardamos directamente en el historial sin pasar por la lista de "hoy"
        await cloudService.saveArchive(businessId, archive);
        await loadData();
      }
    } catch (e) {
      console.error(e);
      alert("Hubo un error al registrar las ventas de este día.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateSale = async (id: string, data: Omit<Sale, 'id' | 'cost'>) => {
    setSales(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    if (businessId) {
      try {
        await cloudService.updateSale(id, data);
      } catch (e: any) {
        setDbError({ message: e.message, isTableError: true });
      }
    }
  };

  const handleDeliverBooking = async (booking: Booking, registerAsSale: boolean) => {
    if (registerAsSale) {
      await handleAddSale({
        productName: `Pedido: ${booking.reference}`,
        price: (booking.cashPayment + booking.transferPayment) / booking.quantity,
        quantity: booking.quantity,
        buyerName: booking.buyerName,
        buyerType: booking.isDistributor ? 'distribuidor' : 'comprador',
        date: new Date().toLocaleDateString('es-ES')
      });
    }
    await handleDeleteBooking(booking.id);
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

  const handleToggleAdvancedAI = async (enabled: boolean) => {
    setAdvancedAIEnabled(enabled);
    if (businessId) {
      try {
        await cloudService.updateBusinessSettings(businessId, { advanced_ai_enabled: enabled });
      } catch (e: any) {
        console.error("Error al guardar IA:", e);
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
    
    // Obtener la fecha de la última venta para que el cierre tenga la fecha correcta
    const latestSaleDate = sales.length > 0 
      ? sales.sort((a,b) => b.date.split('/').reverse().join('-').localeCompare(a.date.split('/').reverse().join('-')))[0].date
      : new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    const archive: DailyArchive = {
      id: `archive-${crypto.randomUUID()}`,
      date: latestSaleDate,
      sales: sales.map(s => ({ ...s, id: crypto.randomUUID() })),
      expenses: expenses.map(e => ({ ...e, id: crypto.randomUUID() })),
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

  const handleUpdateArchiveDate = async (archiveId: string, newDate: string) => {
    setIsSyncing(true);
    try {
      if (businessId) {
        await cloudService.updateArchiveDate(archiveId, newDate);
        await loadData();
      }
    } catch (e: any) {
      setDbError({ message: e.message, isTableError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const confirmDeleteDay = async () => {
    if (!archiveToDelete) return;
    const id = archiveToDelete.id;
    setArchiveToDelete(null);
    
    setIsSyncing(true);
    try {
      if (businessId) {
        await cloudService.deleteArchive(id);
        await loadData();
      }
    } catch (e: any) {
      setDbError({ message: e.message, isTableError: true });
    } finally {
      setIsSyncing(false);
    }
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

  if (viewMode === 'despues') {
    return <WeeklyApp onToggleToOldApp={toggleViewMode} />;
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50 overflow-hidden font-sans">
      <Header onToggleDespues={toggleViewMode} />
      
      <main className="flex-1 overflow-y-auto pb-16 px-2.5 sm:px-4 pt-1.5 safe-top custom-scrollbar">
        <div className="max-w-2xl mx-auto w-full">
          {activeTab === 'ventas' && (
            <button 
              onClick={() => setIsTutorialOpen(true)}
              className="w-full mb-2 py-1.5 px-3 bg-white border border-blue-100 rounded-xl flex items-center justify-center gap-2 text-blue-600 font-bold text-[11px] uppercase tracking-wider shadow-2xs hover:bg-blue-50 transition-all active:scale-95 group cursor-pointer"
            >
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>¿Cómo usar la App? Ver Tutorial</span>
            </button>
          )}

          {dbError && (
          <div className="mb-3 bg-red-50 border border-red-200 p-3 sm:p-4 rounded-2xl space-y-2.5 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-2 text-red-700">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
               <h3 className="font-black text-xs uppercase">¡Problema de Configuración!</h3>
            </div>
            
            <p className="text-[11px] text-red-600 font-bold leading-tight">
              {dbError.isTableError 
                ? "Faltan tablas o columnas en Supabase (Error PGRST). Necesitas ejecutar el script de reparación abajo." 
                : dbError.message}
            </p>

            {dbError.isTableError && (
              <div className="space-y-2">
                <div className="bg-slate-900 p-2.5 rounded-xl relative border border-white/10 shadow-inner">
                  <pre className="text-[9px] text-emerald-400 font-mono overflow-x-auto whitespace-pre leading-tight max-h-32">
                    {SQL_SETUP}
                  </pre>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(SQL_SETUP); alert("¡SQL Copiado! Ve a Supabase -> SQL Editor y pégalo."); }}
                    className="absolute top-2 right-2 bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase shadow-lg active:scale-90 transition-all cursor-pointer"
                  >
                    COPIAR SCRIPT
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[9px] text-slate-500 font-bold italic text-center">Una vez ejecutado en Supabase, dale al botón de abajo:</p>
                  <button 
                    onClick={loadData}
                    className="w-full py-2.5 bg-red-600 text-white font-black rounded-xl text-xs uppercase shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    REINTENTAR CONEXIÓN
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

          {activeTab === 'ventas' && (
            <div className="space-y-2.5">
              <Dashboard stats={stats} />
              <div className="flex items-center justify-between pt-0.5">
                <h3 className="font-black text-slate-800 text-xs sm:text-sm uppercase tracking-tight">Ventas de Hoy</h3>
                <span className="text-[10px] text-slate-400 font-bold">{sales.length} registradas</span>
              </div>
              <SalesTable 
                sales={sales} 
                onDeleteSale={handleDeleteSale} 
                onEditSale={(sale) => {
                  setSaleToEdit(sale);
                  setIsSalesFormOpen(true);
                }}
                onUpdateSale={() => {}} 
              />
              
              <div className="flex flex-col gap-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <label className="h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all uppercase text-[11px] tracking-wider cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate">{isImporting ? 'Analizando...' : 'Subir Excel'}</span>
                  <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
                </label>

                <button 
                  id="tutorial-closing-schedules"
                  onClick={() => setIsClosingModalOpen(true)}
                  className="h-10 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black rounded-xl border border-blue-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all uppercase text-[11px] tracking-wider cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="truncate">Horarios Cierre</span>
                </button>
              </div>

              <button id="tutorial-close-day" onClick={handleNewDay} className="h-11 w-full bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl shadow-xs active:scale-95 transition-all disabled:opacity-50 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer" disabled={isSyncing}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>{isSyncing ? 'SINCRONIZANDO...' : 'CERRAR CAJA DE HOY'}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notas' && (
          <div className="space-y-4">
            <NotesSection 
              notes={notes} 
              onAddNote={handleAddNote} 
              onDeleteNote={handleDeleteNote} 
            />
            
            <div className="h-px bg-slate-200" />

            <SuggestionsSection 
              suggestions={suggestions}
              onAddSuggestion={handleAddSuggestion}
              onDeleteSuggestion={handleDeleteSuggestion}
            />
          </div>
        )}

        {activeTab === 'costos' && (
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-tight">Costo de Producción</h2>
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
            onDeleteDay={(archive) => setArchiveToDelete(archive)} 
            onEditDay={handleEditDay}
            onQuickAdd={() => {}}
            onUpdateDate={handleUpdateArchiveDate}
          />
        )}

        {activeTab === 'ia' && (
          <AIInsights 
            sales={sales} 
            history={history}
            advancedAIEnabled={advancedAIEnabled} 
            onToggleAdvancedAI={handleToggleAdvancedAI} 
            chatMessages={aiChatMessages}
            onSetChatMessages={setAiChatMessages}
          />
        )}
        {activeTab === 'agendacion' && (
          <BookingsView 
            bookings={bookings} 
            onAddBooking={handleAddBooking} 
            onDeleteBooking={handleDeleteBooking} 
            onDeliverBooking={handleDeliverBooking}
            prefillData={bookingPrefill}
            onClearPrefill={() => setBookingPrefill(null)}
          />
        )}
        {activeTab === 'nube' && <SyncManager businessId={businessId} onSetBusinessId={setBusinessId} isSyncing={isSyncing} />}
        </div>
      </main>

      {/* Floating Action Buttons - Mobile Ergonomic */}
      <div className="fixed bottom-16 right-3 sm:right-4 flex flex-col gap-2 z-40">
        {activeTab === 'costos' && (
          <button 
            id="tutorial-add-expense"
            onClick={() => setIsExpenseFormOpen(true)}
            className="w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            title="Añadir Gasto"
            aria-label="Añadir Gasto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
        {activeTab === 'ventas' && (
          <button 
            id="tutorial-add-sale"
            onClick={() => setIsSalesFormOpen(true)}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            title="Añadir Venta"
            aria-label="Añadir Venta"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      <SalesForm 
        isOpen={isSalesFormOpen} 
        onClose={() => {
          setIsSalesFormOpen(false);
          setSaleToEdit(null);
        }} 
        onAddSale={handleAddSale} 
        onUpdateSale={handleUpdateSale}
        saleToEdit={saleToEdit}
      />
      <ExpenseForm isOpen={isExpenseFormOpen} onClose={() => setIsExpenseFormOpen(false)} onAddExpense={handleAddExpense} />
      <Calculator isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
      
      <Tutorial 
        isOpen={isTutorialOpen} 
        onClose={() => setIsTutorialOpen(false)} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSalesFormOpen={isSalesFormOpen}
      />

      <SalesImportModal 
        isOpen={pendingImportSales.length > 0} 
        onClose={() => { setPendingImportSales([]); setIsImporting(false); }}
        pendingSales={pendingImportSales}
        onConfirmDay={handleConfirmImportDay}
        loading={isSyncing}
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

      <ConfirmModal 
        isOpen={!!archiveToDelete}
        title="¿Eliminar Cierre?"
        message={`¿Estás seguro de que quieres eliminar permanentemente el cierre del ${archiveToDelete?.date}? Esta acción no se puede deshacer.`}
        onConfirm={confirmDeleteDay}
        onCancel={() => setArchiveToDelete(null)}
        confirmText="Sí, borrar"
      />

      <nav id="tutorial-nav-bar" className="bg-white/95 backdrop-blur-xl border-t border-slate-200 fixed bottom-0 left-0 right-0 z-50 h-13 sm:h-14 flex justify-around items-center px-1">
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
    cash: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    beaker: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.631.285a2 2 0 01-1.558 0l-.63-.285a6 6 0 00-3.86-.517l-2.388.477a2 2 0 00-1.022.547V21h17.428v-5.572zM7 3l3 4h4l3-4" /></svg>,
    history: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    sparkles: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    note: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    calendar: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v14a2 2 0 002 2z" /></svg>,
    cloud: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
  };
  return (
    <button id={id} onClick={onClick} className={`min-h-[44px] flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${active ? 'text-blue-600 font-black' : 'text-slate-400 hover:text-slate-600'}`}>
      {icons[icon]}
      <span className={`text-[8.5px] uppercase tracking-tight leading-tight mt-0.5 ${active ? 'opacity-100 font-black' : 'opacity-80 font-medium'}`}>{label}</span>
    </button>
  );
};

export default App;
