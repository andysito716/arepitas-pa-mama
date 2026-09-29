import { WeeklySale, WeekInfo, DaySummary, WeeklyStats, WidgetConfig, WidgetId } from '../types/weekly';
import { getWeekInfo, formatDateToYMD } from './weeklyDateUtils';

const STORAGE_SALES_KEY = 'arepitas_weekly_sales_v2';
const STORAGE_WIDGETS_KEY = 'arepitas_weekly_widgets_order_v2';

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'stats', title: 'Métricas de la Semana', subtitle: 'Totales, margen y mejor día', icon: 'chart', collapsed: false },
  { id: 'ai_input', title: 'Registro Inteligente con IA', subtitle: 'Pega textos, audios o chats para registrar ventas', icon: 'sparkles', collapsed: false },
  { id: 'manual_form', title: 'Registro Manual Rápido', subtitle: 'Añadir venta directamente a un día', icon: 'plus', collapsed: false },
  { id: 'sales_by_day', title: 'Ventas por Días de la Semana', subtitle: 'Arrastra y mueve ventas entre días a tu gusto', icon: 'calendar', collapsed: false },
  { id: 'weekly_chart', title: 'Rendimiento y Gráfica', subtitle: 'Evolución de ingresos diarios', icon: 'trend', collapsed: false }
];

export function loadAllWeeklySales(): WeeklySale[] {
  try {
    const raw = localStorage.getItem(STORAGE_SALES_KEY);
    if (!raw) {
      const initial = generateSampleWeekSales();
      saveAllWeeklySales(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error loading weekly sales:", e);
    return [];
  }
}

export function saveAllWeeklySales(sales: WeeklySale[]): void {
  try {
    localStorage.setItem(STORAGE_SALES_KEY, JSON.stringify(sales));
  } catch (e) {
    console.error("Error saving weekly sales:", e);
  }
}

export function getSalesForWeek(weekId: string): WeeklySale[] {
  const all = loadAllWeeklySales();
  return all.filter(s => s.weekId === weekId);
}

export function addWeeklySaleItem(sale: Omit<WeeklySale, 'id' | 'createdAt'>): WeeklySale {
  const all = loadAllWeeklySales();
  const newSale: WeeklySale = {
    ...sale,
    id: `wsale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now()
  };
  all.push(newSale);
  saveAllWeeklySales(all);
  return newSale;
}

export function addMultipleWeeklySales(sales: Omit<WeeklySale, 'id' | 'createdAt'>[]): WeeklySale[] {
  const all = loadAllWeeklySales();
  const created: WeeklySale[] = [];
  sales.forEach((s, idx) => {
    const item: WeeklySale = {
      ...s,
      id: `wsale_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now() + idx
    };
    created.push(item);
    all.push(item);
  });
  saveAllWeeklySales(all);
  return created;
}

export function updateWeeklySaleItem(id: string, updates: Partial<WeeklySale>): WeeklySale | null {
  const all = loadAllWeeklySales();
  const idx = all.findIndex(s => s.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates };
  saveAllWeeklySales(all);
  return all[idx];
}

export function deleteWeeklySaleItem(id: string): void {
  const all = loadAllWeeklySales();
  const filtered = all.filter(s => s.id !== id);
  saveAllWeeklySales(filtered);
}

export function moveSaleToDay(saleId: string, targetDate: string, targetDayName: string, targetWeekId: string): void {
  const all = loadAllWeeklySales();
  const idx = all.findIndex(s => s.id === saleId);
  if (idx !== -1) {
    all[idx].date = targetDate;
    all[idx].dayName = targetDayName;
    all[idx].weekId = targetWeekId;
    saveAllWeeklySales(all);
  }
}

export function calculateWeeklyStats(sales: WeeklySale[], weekInfo: WeekInfo): WeeklyStats {
  const totalRevenue = sales.reduce((acc, s) => acc + (s.price * s.quantity), 0);
  const totalCost = sales.reduce((acc, s) => acc + (s.cost * s.quantity), 0);
  const totalProfit = totalRevenue - totalCost;
  const totalQuantity = sales.reduce((acc, s) => acc + s.quantity, 0);
  const salesCount = sales.length;
  const marginPercent = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  // Best day
  const dayRevenues: Record<string, number> = {};
  sales.forEach(s => {
    dayRevenues[s.dayName] = (dayRevenues[s.dayName] || 0) + (s.price * s.quantity);
  });

  let bestDay: { dayName: string; revenue: number } | null = null;
  Object.entries(dayRevenues).forEach(([dayName, rev]) => {
    if (!bestDay || rev > bestDay.revenue) {
      bestDay = { dayName, revenue: rev };
    }
  });

  // Best product
  const productStats: Record<string, { quantity: number; revenue: number }> = {};
  sales.forEach(s => {
    if (!productStats[s.productName]) {
      productStats[s.productName] = { quantity: 0, revenue: 0 };
    }
    productStats[s.productName].quantity += s.quantity;
    productStats[s.productName].revenue += (s.price * s.quantity);
  });

  let bestProduct: { name: string; quantity: number; revenue: number } | null = null;
  Object.entries(productStats).forEach(([name, data]) => {
    if (!bestProduct || data.quantity > bestProduct.quantity) {
      bestProduct = { name, quantity: data.quantity, revenue: data.revenue };
    }
  });

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    totalQuantity,
    salesCount,
    marginPercent,
    bestDay,
    bestProduct
  };
}

export function calculateDaySummaries(sales: WeeklySale[], weekInfo: WeekInfo): DaySummary[] {
  return weekInfo.days.map(d => {
    const daySales = sales.filter(s => s.date === d.date);
    const totalRevenue = daySales.reduce((acc, s) => acc + (s.price * s.quantity), 0);
    const totalCost = daySales.reduce((acc, s) => acc + (s.cost * s.quantity), 0);
    const totalProfit = totalRevenue - totalCost;
    const itemCount = daySales.reduce((acc, s) => acc + s.quantity, 0);

    return {
      date: d.date,
      dayName: d.dayName,
      shortDate: d.shortDate,
      totalRevenue,
      totalCost,
      totalProfit,
      itemCount,
      salesCount: daySales.length,
      sales: daySales
    };
  });
}

export function loadWidgetOrder(): WidgetConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_WIDGETS_KEY);
    if (!raw) return DEFAULT_WIDGETS;
    const saved = JSON.parse(raw) as WidgetConfig[];
    // Ensure all default widgets exist in case new ones were added
    const savedMap = new Map(saved.map(w => [w.id, w]));
    const result: WidgetConfig[] = [];
    saved.forEach(w => {
      const def = DEFAULT_WIDGETS.find(dw => dw.id === w.id);
      if (def) {
        result.push({ ...def, ...w });
      }
    });
    DEFAULT_WIDGETS.forEach(dw => {
      if (!savedMap.has(dw.id)) {
        result.push(dw);
      }
    });
    return result;
  } catch (e) {
    return DEFAULT_WIDGETS;
  }
}

export function saveWidgetOrder(widgets: WidgetConfig[]): void {
  try {
    localStorage.setItem(STORAGE_WIDGETS_KEY, JSON.stringify(widgets));
  } catch (e) {
    console.error("Error saving widget order:", e);
  }
}

/**
 * Generates clean sample week data so user sees active state
 */
function generateSampleWeekSales(): WeeklySale[] {
  const currentWeek = getWeekInfo();
  const monday = currentWeek.days[0];
  const tuesday = currentWeek.days[1];
  const wednesday = currentWeek.days[2];

  return [
    {
      id: 'sample_1',
      weekId: currentWeek.id,
      date: monday.date,
      dayName: monday.dayName,
      productName: 'Arepa de Queso Doble Crema',
      quantity: 12,
      price: 3000,
      cost: 1200,
      buyerName: 'Carlos Gómez',
      buyerType: 'comprador',
      notes: 'Cliente frecuente',
      createdAt: Date.now() - 3600000 * 20
    },
    {
      id: 'sample_2',
      weekId: currentWeek.id,
      date: monday.date,
      dayName: monday.dayName,
      productName: 'Jugo Natural de Mora',
      quantity: 8,
      price: 2500,
      cost: 900,
      buyerName: 'Carlos Gómez',
      buyerType: 'comprador',
      createdAt: Date.now() - 3600000 * 18
    },
    {
      id: 'sample_3',
      weekId: currentWeek.id,
      date: tuesday.date,
      dayName: tuesday.dayName,
      productName: 'Paquete Arepas Congeladas (x10)',
      quantity: 5,
      price: 18000,
      cost: 8500,
      buyerName: 'Distribuidora La Esquina',
      buyerType: 'distribuidor',
      notes: 'Despacho al por mayor',
      createdAt: Date.now() - 3600000 * 10
    },
    {
      id: 'sample_4',
      weekId: currentWeek.id,
      date: wednesday.date,
      dayName: wednesday.dayName,
      productName: 'Empanada de Carne y Papa',
      quantity: 15,
      price: 2200,
      cost: 950,
      buyerName: 'María Rodríguez',
      buyerType: 'comprador',
      createdAt: Date.now() - 3600000 * 2
    }
  ];
}
