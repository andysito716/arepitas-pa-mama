import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WeeklySale } from '../types/weekly';
import { getWeekInfo, formatDateToYMD } from './weeklyDateUtils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bgsizvuxyzuzrftpbcud.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4zaX9UM5uvrZ0vwebGv6Vw_zbYYCon5';

export const supabaseClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEFAULT_BUSINESS_ID = 'arepitas-pa-mama';
const LOCAL_STORAGE_KEY = 'arepitas_weekly_sales_v2';
const BUSINESS_ID_KEY = 'business_id';

export function getActiveBusinessId(): string {
  try {
    const saved = localStorage.getItem(BUSINESS_ID_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {
    // Ignore error
  }
  return DEFAULT_BUSINESS_ID;
}

export function setActiveBusinessId(id: string): void {
  const clean = id.trim().toLowerCase() || DEFAULT_BUSINESS_ID;
  try {
    localStorage.setItem(BUSINESS_ID_KEY, clean);
  } catch (e) {
    // Ignore error
  }
}

// Generate valid UUIDv4
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Standardize date to YYYY-MM-DD
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return formatDateToYMD(new Date());
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }
  return dateStr;
}

export function mapCloudRowToWeeklySale(row: any): WeeklySale {
  const normalizedDate = normalizeDate(row.date);
  const weekInfo = getWeekInfo(normalizedDate);
  const dayObj = weekInfo.days.find(d => d.date === normalizedDate);
  const dayName = dayObj ? dayObj.dayName : 'Día';

  let notes = '';
  let color = '';
  if (typeof row.color === 'string') {
    if (row.color.startsWith('note:')) {
      notes = row.color.replace('note:', '');
    } else {
      color = row.color;
    }
  }

  return {
    id: row.id || generateUUID(),
    weekId: weekInfo.id,
    date: normalizedDate,
    dayName,
    productName: row.product_name || 'Arepa',
    quantity: Number(row.quantity) || 1,
    price: Number(row.price) || 0,
    cost: Number(row.cost) || 0,
    buyerName: row.buyer_name || 'Cliente',
    buyerType: (row.buyer_type === 'distribuidor' ? 'distribuidor' : 'comprador'),
    color,
    notes,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
  };
}

export const weeklySyncService = {
  /**
   * Fetch all sales for the business from Supabase
   */
  async fetchCloudSales(businessId: string): Promise<WeeklySale[]> {
    const cleanId = businessId.trim().toLowerCase() || DEFAULT_BUSINESS_ID;
    try {
      const { data, error } = await supabaseClient
        .from('sales')
        .select('*')
        .eq('business_id', cleanId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data) return [];
      return data.map(mapCloudRowToWeeklySale);
    } catch (err) {
      console.warn("Error fetching cloud sales, using local cache:", err);
      throw err;
    }
  },

  /**
   * Add a single sale to Supabase
   */
  async pushSale(businessId: string, sale: Omit<WeeklySale, 'id' | 'createdAt'> & { id?: string }): Promise<WeeklySale> {
    const cleanId = businessId.trim().toLowerCase() || DEFAULT_BUSINESS_ID;
    const saleId = sale.id && sale.id.includes('-') && sale.id.length > 20 
      ? sale.id 
      : generateUUID();

    const normalizedDate = normalizeDate(sale.date);
    const colorPayload = sale.notes ? `note:${sale.notes}` : (sale.color || '');

    const row = {
      id: saleId,
      product_name: sale.productName,
      price: sale.price,
      cost: sale.cost,
      quantity: sale.quantity,
      buyer_name: sale.buyerName || 'Cliente',
      buyer_type: sale.buyerType || 'comprador',
      date: normalizedDate,
      color: colorPayload,
      business_id: cleanId
    };

    const { error } = await supabaseClient
      .from('sales')
      .upsert(row);

    if (error) {
      console.error("Error upserting sale to cloud:", error);
      throw error;
    }

    const weekInfo = getWeekInfo(normalizedDate);
    const dayObj = weekInfo.days.find(d => d.date === normalizedDate);

    return {
      id: saleId,
      weekId: weekInfo.id,
      date: normalizedDate,
      dayName: dayObj ? dayObj.dayName : sale.dayName,
      productName: sale.productName,
      quantity: sale.quantity,
      price: sale.price,
      cost: sale.cost,
      buyerName: sale.buyerName,
      buyerType: sale.buyerType,
      color: sale.color,
      notes: sale.notes,
      createdAt: Date.now()
    };
  },

  /**
   * Add multiple sales in a batch to Supabase
   */
  async pushMultipleSales(businessId: string, sales: Omit<WeeklySale, 'id' | 'createdAt'>[]): Promise<WeeklySale[]> {
    const cleanId = businessId.trim().toLowerCase() || DEFAULT_BUSINESS_ID;
    const createdSales: WeeklySale[] = [];
    const rows = sales.map((sale, idx) => {
      const saleId = generateUUID();
      const normalizedDate = normalizeDate(sale.date);
      const colorPayload = sale.notes ? `note:${sale.notes}` : (sale.color || '');
      const weekInfo = getWeekInfo(normalizedDate);
      const dayObj = weekInfo.days.find(d => d.date === normalizedDate);

      createdSales.push({
        id: saleId,
        weekId: weekInfo.id,
        date: normalizedDate,
        dayName: dayObj ? dayObj.dayName : sale.dayName,
        productName: sale.productName,
        quantity: sale.quantity,
        price: sale.price,
        cost: sale.cost,
        buyerName: sale.buyerName,
        buyerType: sale.buyerType,
        color: sale.color,
        notes: sale.notes,
        createdAt: Date.now() + idx
      });

      return {
        id: saleId,
        product_name: sale.productName,
        price: sale.price,
        cost: sale.cost,
        quantity: sale.quantity,
        buyer_name: sale.buyerName || 'Cliente',
        buyer_type: sale.buyerType || 'comprador',
        date: normalizedDate,
        color: colorPayload,
        business_id: cleanId
      };
    });

    if (rows.length > 0) {
      const { error } = await supabaseClient.from('sales').insert(rows);
      if (error) throw error;
    }

    return createdSales;
  },

  /**
   * Update an existing sale in Supabase
   */
  async updateSale(saleId: string, updates: Partial<WeeklySale>): Promise<void> {
    const payload: any = {};
    if (updates.productName !== undefined) payload.product_name = updates.productName;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.cost !== undefined) payload.cost = updates.cost;
    if (updates.quantity !== undefined) payload.quantity = updates.quantity;
    if (updates.buyerName !== undefined) payload.buyer_name = updates.buyerName;
    if (updates.buyerType !== undefined) payload.buyer_type = updates.buyerType;
    if (updates.date !== undefined) payload.date = normalizeDate(updates.date);
    if (updates.notes !== undefined || updates.color !== undefined) {
      payload.color = updates.notes ? `note:${updates.notes}` : (updates.color || '');
    }

    const { error } = await supabaseClient
      .from('sales')
      .update(payload)
      .eq('id', saleId);

    if (error) throw error;
  },

  /**
   * Delete a sale from Supabase
   */
  async deleteSale(saleId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('sales')
      .delete()
      .eq('id', saleId);

    if (error) throw error;
  },

  /**
   * Realtime listener so multiple phones update immediately when another device registers a sale!
   */
  subscribeToSales(businessId: string, onChange: () => void): () => void {
    const cleanId = businessId.trim().toLowerCase() || DEFAULT_BUSINESS_ID;
    const channelName = `realtime-sales-${cleanId}-${Date.now()}`;
    
    const channel = supabaseClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `business_id=eq.${cleanId}`
        },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }
};
