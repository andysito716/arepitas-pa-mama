export interface WeeklySale {
  id: string;
  weekId: string; // e.g. "2026-W40"
  date: string; // "YYYY-MM-DD"
  dayName: string; // "Lunes", "Martes", etc.
  productName: string;
  quantity: number;
  price: number; // Unit price
  cost: number; // Unit production cost
  buyerName: string;
  buyerType: 'comprador' | 'distribuidor';
  color?: string;
  notes?: string;
  createdAt: number;
}

export interface WeekInfo {
  id: string; // "2026-W40"
  year: number;
  weekNumber: number;
  startDate: string; // "YYYY-MM-DD" (Monday)
  endDate: string; // "YYYY-MM-DD" (Sunday)
  label: string; // "Semana 40 (28 Sep - 4 Oct 2026)"
  days: {
    date: string; // "YYYY-MM-DD"
    dayName: string; // "Lunes"
    shortDate: string; // "28 Sep"
  }[];
}

export interface DaySummary {
  date: string;
  dayName: string;
  shortDate: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  itemCount: number;
  salesCount: number;
  sales: WeeklySale[];
}

export interface WeeklyStats {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalQuantity: number;
  salesCount: number;
  marginPercent: number;
  bestDay: { dayName: string; revenue: number } | null;
  bestProduct: { name: string; quantity: number; revenue: number } | null;
}

export interface AIParsedSaleItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  cost: number;
  buyerName: string;
  buyerType: 'comprador' | 'distribuidor';
  date: string; // "YYYY-MM-DD"
  dayName: string;
  confidence: number;
  reasoning?: string;
}

export interface AIParseResult {
  detectedSales: AIParsedSaleItem[];
  ignoredItems: { text: string; reason: string }[];
  summary: string;
}

export type WidgetId = 'stats' | 'ai_input' | 'manual_form' | 'sales_by_day' | 'weekly_chart';

export interface WidgetConfig {
  id: WidgetId;
  title: string;
  subtitle: string;
  icon: string;
  collapsed: boolean;
}
