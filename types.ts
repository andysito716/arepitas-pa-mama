
export interface Sale {
  id: string;
  productName: string;
  price: number;
  cost: number; // Costo de producción por unidad (COGS)
  quantity: number;
  buyerName: string;
  buyerType: 'comprador' | 'distribuidor';
  date: string;
  color?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface DailyArchive {
  id: string;
  date: string;
  sales: Sale[];
  expenses: Expense[]; // Gastos incluidos en el cierre
  totalRevenue: number;
  totalProfit: number;
  totalItems: number;
}

export interface BusinessStats {
  totalRevenue: number;
  totalProfit: number;
  totalCost: number; // Inversión total (COGS + Gastos directos)
  totalSalesCount: number;
}

export interface ProductionCost {
  id: string;
  value: number;
  label: string;
}

export interface Note {
  id: string;
  content: string;
  date: string;
  business_id: string;
}

export interface Suggestion {
  id: string;
  content: string;
  date: string;
  business_id: string;
  timestamp: number;
}

export interface ClosingSchedule {
  id: string;
  time: string; // HH:mm format
  business_id: string;
}

export interface Booking {
  id: string;
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string;
  buyerName: string;
  quantity: number;
  reference: 'blanco' | 'amarillo';
  isDistributor: boolean;
  cashPayment: number;
  transferPayment: number;
  location: string;
  cityNeighborhood: string;
  deliveryFee: number | null; // null means no delivery fee
  isHalfDeliveryPaid: boolean;
  business_id: string;
  created_at?: string;
}
