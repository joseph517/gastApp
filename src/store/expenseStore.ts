import { create } from 'zustand';
import { Expense, Category, ExpenseFilters, CategoryTotal, PeriodStats, Period } from '../types';
import { databaseService } from '../database/database';
import { FREE_TIER_LIMITS } from '../constants/categories';

interface ExpenseStore {
  // Estado
  expenses: Expense[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  isPremium: boolean;
  
  // Acciones
  initializeStore: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'synced'>) => Promise<boolean>;
  getExpenses: (filters?: ExpenseFilters) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  updateExpense: (id: number, data: Partial<Expense>) => Promise<void>;
  loadCategories: () => Promise<void>;
  
  // Estadísticas
  getTotalsByCategory: (startDate: string, endDate: string) => Promise<CategoryTotal[]>;
  getTotalByPeriod: (period: Period) => number;
  getRecentExpenses: (limit: number) => Expense[];
  getPeriodStats: (period: Period) => Promise<PeriodStats>;
  
  // Validaciones
  canAddExpense: () => Promise<boolean>;
  getExpenseCountToday: () => Promise<number>;
  
  // Utilidades
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  // Estado inicial
  expenses: [],
  categories: [],
  loading: false,
  error: null,
  isPremium: false,

  // Inicialización
  initializeStore: async () => {
    try {
      set({ loading: true, error: null });
      
      await databaseService.init();
      
      // Cargar configuración premium
      const premiumSetting = await databaseService.getSetting('isPremium');
      const isPremium = premiumSetting === 'true';
      
      // Cargar categorías y gastos iniciales
      await get().loadCategories();
      await get().getExpenses();
      
      set({ isPremium, loading: false });
    } catch (error) {
      console.error('Error initializing store:', error);
      set({ error: 'Error al inicializar la aplicación', loading: false });
    }
  },

  // Gestión de gastos
  addExpense: async (expense) => {
    try {
      set({ loading: true, error: null });
      
      // Verificar límites para usuarios gratuitos
      const canAdd = await get().canAddExpense();
      if (!canAdd) {
        set({ 
          error: `Límite diario alcanzado (${FREE_TIER_LIMITS.maxExpensesPerDay} gastos)`,
          loading: false 
        });
        return false;
      }

      await databaseService.addExpense(expense);
      await get().getExpenses(); // Recargar gastos
      
      set({ loading: false });
      return true;
    } catch (error) {
      console.error('Error adding expense:', error);
      set({ error: 'Error al agregar el gasto', loading: false });
      return false;
    }
  },

  getExpenses: async (filters) => {
    try {
      set({ loading: true, error: null });

      let expenses: Expense[];
      
      if (filters?.dateFrom && filters?.dateTo) {
        expenses = await databaseService.getExpensesByDateRange(
          filters.dateFrom,
          filters.dateTo
        );
      } else {
        // Para usuarios gratuitos, limitar a los últimos 30 días
        const { isPremium } = get();
        if (!isPremium) {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - FREE_TIER_LIMITS.historyDays);
          
          expenses = await databaseService.getExpensesByDateRange(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          );
        } else {
          expenses = await databaseService.getExpenses();
        }
      }
      
      // Aplicar filtros adicionales
      if (filters?.category) {
        expenses = expenses.filter(e => e.category === filters.category);
      }
      
      if (filters?.description) {
        expenses = expenses.filter(e => 
          e.description.toLowerCase().includes(filters.description!.toLowerCase())
        );
      }
      
      set({ expenses, loading: false });
    } catch (error) {
      console.error('Error getting expenses:', error);
      set({ error: 'Error al cargar los gastos', loading: false });
    }
  },

  deleteExpense: async (id) => {
    try {
      set({ loading: true, error: null });

      await databaseService.deleteExpense(id);
      await get().getExpenses(); // Recargar gastos
      
      set({ loading: false });
    } catch (error) {
      console.error('Error deleting expense:', error);
      set({ error: 'Error al eliminar el gasto', loading: false });
    }
  },

  updateExpense: async (id, data) => {
    try {
      set({ loading: true, error: null });

      await databaseService.updateExpense(id, data);
      await get().getExpenses(); // Recargar gastos
      
      set({ loading: false });
    } catch (error) {
      console.error('Error updating expense:', error);
      set({ error: 'Error al actualizar el gasto', loading: false });
    }
  },

  loadCategories: async () => {
    try {
      const categories = await databaseService.getCategories();
      set({ categories });
    } catch (error) {
      console.error('Error loading categories:', error);
      set({ error: 'Error al cargar las categorías' });
    }
  },

  // Estadísticas
  getTotalsByCategory: async (startDate, endDate) => {
    try {
      const totals = await databaseService.getTotalByCategory(startDate, endDate);
      const { categories } = get();

      const totalAmount = totals.reduce((sum, item) => sum + item.total, 0);

      return totals.map(item => {
        const category = categories.find(c => c.name === item.category);
        return {
          category: item.category,
          total: item.total,
          color: category?.color || '#95A5A6',
          percentage: totalAmount > 0 ? (item.total / totalAmount) * 100 : 0,
          count: item.count
        };
      });
    } catch (error) {
      console.error('Error getting totals by category:', error);
      return [];
    }
  },

  getTotalByPeriod: (period) => {
    const { expenses } = get();
    const now = new Date();
    
    let startDate: Date;
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = now.toISOString().split('T')[0];
    
    return expenses
      .filter(expense => expense.date >= startDateStr && expense.date <= endDateStr)
      .reduce((total, expense) => total + expense.amount, 0);
  },

  getRecentExpenses: (limit) => {
    const { expenses } = get();
    return expenses.slice(0, limit);
  },

  getPeriodStats: async (period) => {
    const { expenses } = get();
    const now = new Date();
    
    // Calcular fechas para el período actual
    let currentStart: Date, previousStart: Date, previousEnd: Date;
    
    switch (period) {
      case 'week':
        currentStart = new Date(now);
        currentStart.setDate(now.getDate() - 7);
        previousStart = new Date(currentStart);
        previousStart.setDate(currentStart.getDate() - 7);
        previousEnd = new Date(currentStart);
        break;
      case 'month':
        currentStart = new Date(now);
        currentStart.setMonth(now.getMonth() - 1);
        previousStart = new Date(currentStart);
        previousStart.setMonth(currentStart.getMonth() - 1);
        previousEnd = new Date(currentStart);
        break;
      case 'year':
        currentStart = new Date(now);
        currentStart.setFullYear(now.getFullYear() - 1);
        previousStart = new Date(currentStart);
        previousStart.setFullYear(currentStart.getFullYear() - 1);
        previousEnd = new Date(currentStart);
        break;
    }
    
    const currentStartStr = currentStart.toISOString().split('T')[0];
    const currentEndStr = now.toISOString().split('T')[0];
    const previousStartStr = previousStart.toISOString().split('T')[0];
    const previousEndStr = previousEnd.toISOString().split('T')[0];
    
    // Calcular totales
    const currentExpenses = expenses.filter(
      e => e.date >= currentStartStr && e.date <= currentEndStr
    );
    const previousExpenses = expenses.filter(
      e => e.date >= previousStartStr && e.date <= previousEndStr
    );
    
    const total = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const previousTotal = previousExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const percentageChange = previousTotal > 0 
      ? ((total - previousTotal) / previousTotal) * 100 
      : 0;
    
    return {
      total,
      previousTotal,
      percentageChange,
      expenseCount: currentExpenses.length
    };
  },

  // Validaciones
  canAddExpense: async () => {
    const { isPremium } = get();
    if (isPremium) return true;

    const todayCount = await databaseService.getExpenseCountForToday();
    return todayCount < FREE_TIER_LIMITS.maxExpensesPerDay;
  },

  getExpenseCountToday: async () => {
    return await databaseService.getExpenseCountForToday();
  },

  // Utilidades
  clearError: () => set({ error: null }),
  
  setLoading: (loading) => set({ loading }),
}));