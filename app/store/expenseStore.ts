import { create } from 'zustand';
import { Expense, Category, ExpenseFilters, CategoryTotal, PeriodStats, Period } from '../types';
import { databaseService } from '../database/database';
import { FREE_TIER_LIMITS } from '../constants/categories';
import { getCategoryColor } from '../utils/categoryUtils';

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
  clearAllData: () => Promise<void>;
  importTestData: () => Promise<boolean>;
  setLoading: (loading: boolean) => void;

  // Premium
  upgradeToPremium: () => Promise<void>;
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
      const allCategories = await databaseService.getCategories();
      const { isPremium } = get();

      // Filtrar categorías según el estado premium
      const categories = isPremium
        ? allCategories
        : allCategories.filter(category => !category.isPremium);

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

      const totalAmount = totals.reduce((sum, item) => sum + item.total, 0);

      return totals.map(item => {
        return {
          category: item.category,
          total: item.total,
          color: getCategoryColor(item.category),
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

    // Funciones auxiliares para calcular períodos calendarios
    const getWeekBounds = (date: Date) => {
      const d = new Date(date);
      // Lunes como primer día de la semana (1 = lunes, 0 = domingo)
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      return { start: monday, end: sunday };
    };

    const getMonthBounds = (date: Date) => {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);

      return { start, end };
    };

    const getYearBounds = (date: Date) => {
      const start = new Date(date.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);

      return { start, end };
    };

    // Calcular fechas para el período actual y anterior
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

    switch (period) {
      case 'week':
        // Período actual: semana calendario actual
        const currentWeek = getWeekBounds(now);
        currentStart = currentWeek.start;
        currentEnd = currentWeek.end;

        // Período anterior: semana anterior
        const previousWeekDate = new Date(now);
        previousWeekDate.setDate(now.getDate() - 7);
        const previousWeek = getWeekBounds(previousWeekDate);
        previousStart = previousWeek.start;
        previousEnd = previousWeek.end;
        break;

      case 'month':
        // Período actual: mes calendario actual
        const currentMonth = getMonthBounds(now);
        currentStart = currentMonth.start;
        currentEnd = currentMonth.end;

        // Para meses, comparar con el promedio de los 3 meses anteriores
        const month1Date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const month2Date = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const month3Date = new Date(now.getFullYear(), now.getMonth() - 3, 1);

        const month3Bounds = getMonthBounds(month3Date);
        const month1Bounds = getMonthBounds(month1Date);

        previousStart = month3Bounds.start;
        previousEnd = month1Bounds.end;
        break;

      case 'year':
        // Período actual: año calendario actual
        const currentYear = getYearBounds(now);
        currentStart = currentYear.start;
        currentEnd = currentYear.end;

        // Período anterior: año anterior
        const previousYearDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const previousYear = getYearBounds(previousYearDate);
        previousStart = previousYear.start;
        previousEnd = previousYear.end;
        break;
    }

    const currentStartStr = currentStart.toISOString().split('T')[0];
    const currentEndStr = currentEnd.toISOString().split('T')[0];
    const previousStartStr = previousStart.toISOString().split('T')[0];
    const previousEndStr = previousEnd.toISOString().split('T')[0];

    // Calcular totales
    const currentExpenses = expenses.filter(
      e => e.date >= currentStartStr && e.date <= currentEndStr
    );

    let previousTotal = 0;

    if (period === 'month') {
      // Para meses, calcular el promedio de los 3 meses calendarios anteriores
      const previousExpenses = expenses.filter(
        e => e.date >= previousStartStr && e.date <= previousEndStr
      );

      // Como estamos usando exactamente 3 meses calendarios completos,
      // dividimos el total entre 3 para obtener el promedio mensual
      const totalPreviousAmount = previousExpenses.reduce((sum, e) => sum + e.amount, 0);
      previousTotal = totalPreviousAmount / 3;
    } else {
      // Para semanas y años, usar comparación directa con el período anterior
      const previousExpenses = expenses.filter(
        e => e.date >= previousStartStr && e.date <= previousEndStr
      );
      previousTotal = previousExpenses.reduce((sum, e) => sum + e.amount, 0);
    }

    const total = currentExpenses.reduce((sum, e) => sum + e.amount, 0);

    const percentageChange = previousTotal > 0
      ? ((total - previousTotal) / previousTotal) * 100
      : total > 0 ? 100 : 0; // Si no hay datos anteriores pero sí actuales, mostrar 100% de incremento

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

  clearAllData: async () => {
    try {
      set({ loading: true, error: null });
      await databaseService.clearAllData();

      // Reinsertar categorías predeterminadas después de borrar todo
      await databaseService.reinitializeDefaultData();

      // Limpiar y recargar el estado del store, incluyendo resetear premium
      set({
        expenses: [],
        loading: false,
        error: null,
        isPremium: false,
      });

      // Recargar categorías predeterminadas
      await get().loadCategories();

    } catch (error) {
      console.error('Error clearing all data:', error);
      set({
        error: error instanceof Error ? error.message : 'Error al eliminar los datos',
        loading: false,
      });
    }
  },

  importTestData: async () => {
    try {
      set({ loading: true, error: null });
      console.log('🚀 Iniciando importación de datos de prueba...');
      await databaseService.importTestData();

      console.log('🔄 Recargando gastos...');
      await get().getExpenses(); // Recargar gastos

      const { expenses } = get();
      console.log(`📊 Gastos en el store después de recargar: ${expenses.length}`);

      set({ loading: false });
      console.log('✅ Datos de prueba importados correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error importing test data:', error);
      set({ error: 'Error al importar datos de prueba', loading: false });
      return false;
    }
  },
  
  setLoading: (loading) => set({ loading }),

  // Premium
  upgradeToPremium: async () => {
    try {
      set({ loading: true, error: null });

      // Guardar el estado premium en la base de datos
      await databaseService.setSetting('isPremium', 'true');

      // Actualizar el estado local
      set({ isPremium: true, loading: false });

      // Forzar inserción de categorías premium y recargar
      await databaseService.forceInsertPremiumCategories();

      // Recargar categorías para mostrar las premium
      await get().loadCategories();

      console.log('✅ Usuario actualizado a Premium exitosamente');
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      set({ error: 'Error al actualizar a Premium', loading: false });
    }
  },
}));

// Función global temporal para importar datos de prueba desde la consola
if (typeof window !== 'undefined') {
  (window as any).importTestData = async () => {
    const store = useExpenseStore.getState();
    return await store.importTestData();
  };
}