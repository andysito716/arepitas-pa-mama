
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Sale, DailyArchive, Expense, Note, Suggestion } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bgsizvuxyzuzrftpbcud.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4zaX9UM5uvrZ0vwebGv6Vw_zbYYCon5';

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

export const cloudService = {
  isReady: () => true,

  async fetchSuggestions(businessId: string): Promise<Suggestion[]> {
    if (!businessId) return [];
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        content: item.content,
        date: item.date,
        business_id: item.business_id,
        timestamp: Number(item.timestamp)
      }));
    } catch (e: any) {
      throw e;
    }
  },

  async pushSuggestion(businessId: string, suggestion: Suggestion) {
    const { error } = await supabase
      .from('suggestions')
      .insert({
        id: suggestion.id,
        content: suggestion.content,
        date: suggestion.date,
        business_id: businessId,
        timestamp: suggestion.timestamp
      });
    if (error) throw error;
  },

  async deleteSuggestion(suggestionId: string) {
    const { error } = await supabase.from('suggestions').delete().eq('id', suggestionId);
    if (error) throw error;
  },

  async cleanupOldSuggestions(businessId: string, oneWeekAgo: number) {
    const { error } = await supabase
      .from('suggestions')
      .delete()
      .eq('business_id', businessId)
      .lt('timestamp', oneWeekAgo);
    if (error) throw error;
  },

  async fetchNotes(businessId: string): Promise<Note[]> {
    if (!businessId) return [];
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        content: item.content,
        date: item.date,
        business_id: item.business_id
      }));
    } catch (e: any) {
      throw e;
    }
  },

  async pushNote(businessId: string, note: Note) {
    const { error } = await supabase
      .from('notes')
      .insert({
        id: note.id,
        content: note.content,
        date: note.date,
        business_id: businessId
      });
    if (error) throw error;
  },

  async deleteNote(noteId: string) {
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (error) throw error;
  },

  async fetchSales(businessId: string): Promise<Sale[]> {
    if (!businessId) return [];
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        productName: item.product_name,
        price: item.price,
        cost: item.cost || 0,
        quantity: item.quantity,
        buyerName: item.buyer_name,
        buyerType: item.buyer_type || 'comprador',
        date: item.date
      }));
    } catch (e: any) {
      throw e;
    }
  },

  async pushSale(businessId: string, sale: Sale) {
    const { error } = await supabase
      .from('sales')
      .insert({
        id: sale.id,
        product_name: sale.productName,
        price: sale.price,
        cost: sale.cost,
        quantity: sale.quantity,
        buyer_name: sale.buyerName,
        buyer_type: sale.buyerType,
        date: sale.date,
        business_id: businessId
      });
    if (error) throw error;
  },

  async deleteSale(saleId: string) {
    const { error } = await supabase.from('sales').delete().eq('id', saleId);
    if (error) throw error;
  },

  async fetchExpenses(businessId: string): Promise<Expense[]> {
    if (!businessId) return [];
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        description: item.description,
        amount: item.amount,
        category: item.category,
        date: item.date
      }));
    } catch (e: any) {
      throw e;
    }
  },

  async pushExpense(businessId: string, expense: Expense) {
    const { error } = await supabase
      .from('expenses')
      .insert({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        business_id: businessId
      });
    if (error) throw error;
  },

  async deleteExpense(expenseId: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) throw error;
  },

  async fetchHistory(businessId: string): Promise<DailyArchive[]> {
    if (!businessId) return [];
    try {
      const { data, error } = await supabase
        .from('archives')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        date: item.date,
        totalRevenue: item.total_revenue,
        totalProfit: item.total_profit || 0,
        totalItems: item.total_items,
        sales: JSON.parse(item.sales_json || '[]'),
        expenses: JSON.parse(item.expenses_json || '[]')
      }));
    } catch (e: any) {
      throw e;
    }
  },

  async saveArchive(businessId: string, archive: DailyArchive) {
    const { error: archiveError } = await supabase.from('archives').insert({
      id: archive.id,
      date: archive.date,
      total_revenue: archive.totalRevenue,
      total_profit: archive.totalProfit,
      total_items: archive.totalItems,
      sales_json: JSON.stringify(archive.sales),
      expenses_json: JSON.stringify(archive.expenses),
      business_id: businessId
    });

    if (archiveError) throw archiveError;

    // Limpiar temporales
    await supabase.from('sales').delete().eq('business_id', businessId);
    await supabase.from('expenses').delete().eq('business_id', businessId);
  },

  async deleteArchive(archiveId: string) {
    await supabase.from('archives').delete().eq('id', archiveId);
  },

  async restoreArchive(businessId: string, archive: DailyArchive) {
    // 1. Reinsertar ventas
    const salesToInsert = archive.sales.map(s => ({
      id: s.id,
      product_name: s.productName,
      price: s.price,
      cost: s.cost,
      quantity: s.quantity,
      buyer_name: s.buyerName,
      buyer_type: s.buyerType,
      date: s.date,
      business_id: businessId
    }));
    
    if (salesToInsert.length > 0) {
      const { error: sError } = await supabase.from('sales').insert(salesToInsert);
      if (sError) throw sError;
    }

    // 2. Reinsertar gastos
    const expensesToInsert = archive.expenses.map(e => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      category: e.category,
      date: e.date,
      business_id: businessId
    }));

    if (expensesToInsert.length > 0) {
      const { error: eError } = await supabase.from('expenses').insert(expensesToInsert);
      if (eError) throw eError;
    }

    // 3. Eliminar el archivo
    const { error: aError } = await supabase.from('archives').delete().eq('id', archive.id);
    if (aError) throw aError;
  }
};
