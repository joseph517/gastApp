import { useState, useEffect, useMemo, useCallback } from "react";
import { useExpenseStore } from "../store/expenseStore";
import { Expense, Period, CategoryTotal } from "../types";
import {
  getPeriodDateRange,
  getMondayBasedDayOfWeek,
  getWeekRange,
  DAY_NAMES_SHORT,
  DAY_NAMES_FULL
} from "../utils/dateUtils";
import { InsightData } from "../components/analytics/InsightCard";
import { CategoryChange } from "../components/analytics/CategoryChanges";
import { CategoryFrequency } from "../components/analytics/FrequencyAnalysis";
import { DayData, ExpenseDetail } from "../components/analytics/CalendarHeatMap";
import { WeeklySpendingData, WeeklyInsight } from "../components/analytics/WeeklySpendingChart";

export interface TimelineData {
  date: string;
  amount: number;
  label: string;
  id: string;
}

export interface CategoryEvolution {
  categoryName: string;
  data: TimelineData[];
  color: string;
}

export interface PeriodComparison {
  current: {
    total: number;
    period: string;
    expenses: Expense[];
  };
  previous: {
    total: number;
    period: string;
    expenses: Expense[];
  };
  percentageChange: number;
  difference: number;
}

export interface MonthlyPrediction {
  currentSpent: number;
  daysElapsed: number;
  totalDays: number;
  dailyAverage: number;
  projectedTotal: number;
  remainingBudget: number;
}

export const useAnalytics = () => {
  const { expenses, getExpenses, getTotalsByCategory } = useExpenseStore();
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [timelineRange, setTimelineRange] = useState<7 | 15 | 30>(15);
  const [monthComparison, setMonthComparison] =
    useState<PeriodComparison | null>(null);
  const [monthlyPrediction, setMonthlyPrediction] =
    useState<MonthlyPrediction | null>(null);

  // Memoizar cálculos pesados - Rango dinámico
  const memoizedTimelineData = useMemo(() => {
    if (expenses.length === 0) return [];

    const now = new Date();
    const daysAgo = new Date(now.getTime() - timelineRange * 24 * 60 * 60 * 1000);

    const recentExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= daysAgo && expenseDate <= now;
    });

    const dailyTotals = new Map<string, number>();
    recentExpenses.forEach((expense) => {
      const dateKey = expense.date.split("T")[0];
      const current = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, current + expense.amount);
    });

    const timeline: TimelineData[] = [];
    for (let i = timelineRange - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      const amount = dailyTotals.get(dateKey) || 0;

      timeline.push({
        date: dateKey,
        amount,
        label: date.toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "2-digit",
        }),
        id: dateKey,
      });
    }

    return timeline;
  }, [expenses, timelineRange]);

  useEffect(() => {
    setTimelineData(memoizedTimelineData);
  }, [memoizedTimelineData]);

  // Memoizar comparación mensual
  const memoizedMonthComparison = useMemo(() => {
    if (expenses.length === 0) return null;

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= currentMonthStart && expenseDate <= currentMonthEnd;
    });

    const previousExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate >= previousMonthStart && expenseDate <= previousMonthEnd
      );
    });

    const currentTotal = currentExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const previousTotal = previousExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const difference = currentTotal - previousTotal;
    const percentageChange =
      previousTotal > 0 ? (difference / previousTotal) * 100 : 0;

    return {
      current: {
        total: currentTotal,
        period: currentMonthStart.toLocaleDateString("es-CO", {
          month: "long",
          year: "numeric",
        }),
        expenses: currentExpenses,
      },
      previous: {
        total: previousTotal,
        period: previousMonthStart.toLocaleDateString("es-CO", {
          month: "long",
          year: "numeric",
        }),
        expenses: previousExpenses,
      },
      percentageChange,
      difference,
    };
  }, [expenses]);

  useEffect(() => {
    setMonthComparison(memoizedMonthComparison);
  }, [memoizedMonthComparison]);

  // Memoizar predicción mensual
  const memoizedMonthlyPrediction = useMemo(() => {
    if (expenses.length === 0) return null;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const currentMonthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= monthStart && expenseDate <= now;
    });

    const currentSpent = currentMonthExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const daysElapsed = Math.ceil(
      (now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalDays =
      Math.ceil(
        (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    const dailyAverage = daysElapsed > 0 ? currentSpent / daysElapsed : 0;
    const projectedTotal = dailyAverage * totalDays;
    const remainingBudget = projectedTotal - currentSpent;

    return {
      currentSpent,
      daysElapsed,
      totalDays,
      dailyAverage,
      projectedTotal,
      remainingBudget,
    };
  }, [expenses]);

  useEffect(() => {
    setMonthlyPrediction(memoizedMonthlyPrediction);
  }, [memoizedMonthlyPrediction]);

  // Optimizar funciones con useCallback
  const getTopCategories = useCallback(
    async (period: Period = "month"): Promise<CategoryTotal[]> => {
      const { startDate, endDate } = getPeriodDateRange(period);

      try {
        const totals = await getTotalsByCategory(
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0]
        );

        return totals.sort((a, b) => b.total - a.total).slice(0, 5);
      } catch (error) {
        console.error("Error getting top categories:", error);
        return [];
      }
    },
    [getTotalsByCategory]
  );

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  }, []);

  const refreshData = useCallback(async () => {
    await getExpenses();
  }, [getExpenses]);

  // Calcular insights automáticos
  const getBasicInsights = useCallback((): InsightData[] => {
    if (expenses.length === 0) return [];

    const insights: InsightData[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filtrar gastos de los últimos 30 días
    const recentExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= thirtyDaysAgo && expenseDate <= now;
    });

    if (recentExpenses.length === 0) return [];

    // 1. Día de la semana más caro
    const dayTotals = new Map<number, number>();

    recentExpenses.forEach(expense => {
      const day = getMondayBasedDayOfWeek(new Date(expense.date));
      const current = dayTotals.get(day) || 0;
      dayTotals.set(day, current + expense.amount);
    });

    if (dayTotals.size > 0) {
      const mostExpensiveDay = Array.from(dayTotals.entries())
        .sort((a, b) => b[1] - a[1])[0];

      insights.push({
        title: 'Día más caro',
        value: DAY_NAMES_FULL[mostExpensiveDay[0]],
        subtitle: formatCurrency(mostExpensiveDay[1]),
        icon: 'calendar-outline',
        iconColor: '#FF6B6B'
      });
    }

    // 2. Gasto promedio por transacción
    const avgTransaction = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0) / recentExpenses.length;
    insights.push({
      title: 'Promedio por gasto',
      value: formatCurrency(avgTransaction),
      subtitle: `${recentExpenses.length} transacciones`,
      icon: 'cash-outline',
      iconColor: '#4ECDC4'
    });

    // 3. Categoría más frecuente
    const categoryFreq = new Map<string, number>();
    recentExpenses.forEach(expense => {
      const current = categoryFreq.get(expense.category) || 0;
      categoryFreq.set(expense.category, current + 1);
    });

    if (categoryFreq.size > 0) {
      const mostFrequentCategory = Array.from(categoryFreq.entries())
        .sort((a, b) => b[1] - a[1])[0];

      insights.push({
        title: 'Categoría favorita',
        value: mostFrequentCategory[0],
        subtitle: `${mostFrequentCategory[1]} veces`,
        icon: 'star-outline',
        iconColor: '#FFD93D'
      });
    }

    // 4. Tendencia semanal
    const currentWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentWeekExpenses = recentExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= currentWeekStart;
    });

    const previousWeekExpenses = recentExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= previousWeekStart && expenseDate < currentWeekStart;
    });

    const currentWeekTotal = currentWeekExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const previousWeekTotal = previousWeekExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    if (previousWeekTotal > 0) {
      const weeklyChange = ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100;
      const trend = weeklyChange > 5 ? 'up' : weeklyChange < -5 ? 'down' : 'neutral';

      insights.push({
        title: 'Esta semana',
        value: formatCurrency(currentWeekTotal),
        subtitle: 'vs semana anterior',
        icon: 'trending-up-outline',
        iconColor: '#9B59B6',
        trend,
        trendValue: `${Math.abs(weeklyChange).toFixed(1)}%`
      });
    }

    return insights.slice(0, 4); // Máximo 4 insights
  }, [expenses, formatCurrency]);

  // Calcular cambios por categoría mes actual vs anterior
  const getCategoryChanges = useCallback((): { increases: CategoryChange[], decreases: CategoryChange[] } => {
    if (expenses.length === 0) return { increases: [], decreases: [] };

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Filtrar gastos por mes
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= currentMonthStart && expenseDate <= currentMonthEnd;
    });

    const previousMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= previousMonthStart && expenseDate <= previousMonthEnd;
    });

    // Calcular totales por categoría para cada mes
    const currentTotals = new Map<string, number>();
    const previousTotals = new Map<string, number>();

    currentMonthExpenses.forEach(expense => {
      const current = currentTotals.get(expense.category) || 0;
      currentTotals.set(expense.category, current + expense.amount);
    });

    previousMonthExpenses.forEach(expense => {
      const current = previousTotals.get(expense.category) || 0;
      previousTotals.set(expense.category, current + expense.amount);
    });

    // Obtener todas las categorías únicas
    const allCategories = new Set([
      ...Array.from(currentTotals.keys()),
      ...Array.from(previousTotals.keys())
    ]);

    const changes: CategoryChange[] = [];

    allCategories.forEach(category => {
      const currentAmount = currentTotals.get(category) || 0;
      const previousAmount = previousTotals.get(category) || 0;

      if (currentAmount === 0 && previousAmount === 0) return;

      let percentageChange = 0;
      let changeType: CategoryChange['changeType'] = 'unchanged';

      if (previousAmount === 0) {
        changeType = 'new';
        percentageChange = 100;
      } else if (currentAmount === 0) {
        changeType = 'decrease';
        percentageChange = -100;
      } else {
        percentageChange = ((currentAmount - previousAmount) / previousAmount) * 100;
        if (Math.abs(percentageChange) < 5) {
          changeType = 'unchanged';
        } else if (percentageChange > 0) {
          changeType = 'increase';
        } else {
          changeType = 'decrease';
        }
      }

      if (changeType !== 'unchanged') {
        changes.push({
          categoryName: category,
          currentAmount,
          previousAmount,
          percentageChange,
          changeType
        });
      }
    });

    const increases = changes
      .filter(change => change.changeType === 'increase' || change.changeType === 'new')
      .sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));

    const decreases = changes
      .filter(change => change.changeType === 'decrease')
      .sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));

    return { increases, decreases };
  }, [expenses]);

  // Calcular análisis de frecuencia por categoría
  const getFrequencyAnalysis = useCallback((): CategoryFrequency[] => {
    if (expenses.length === 0) return [];

    const now = new Date();
    const categoryData = new Map<string, { dates: Date[], amounts: number[] }>();

    // Agrupar gastos por categoría
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      if (!categoryData.has(expense.category)) {
        categoryData.set(expense.category, { dates: [], amounts: [] });
      }
      const data = categoryData.get(expense.category)!;
      data.dates.push(expenseDate);
      data.amounts.push(expense.amount);
    });

    const frequencies: CategoryFrequency[] = [];

    categoryData.forEach((data, categoryName) => {
      if (data.dates.length < 2) return; // Necesitamos al menos 2 transacciones

      // Ordenar fechas
      const sortedDates = data.dates.sort((a, b) => a.getTime() - b.getTime());

      // Calcular días entre transacciones
      const daysBetween: number[] = [];
      for (let i = 1; i < sortedDates.length; i++) {
        const diffMs = sortedDates[i].getTime() - sortedDates[i - 1].getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        daysBetween.push(diffDays);
      }

      const averageDaysBetween = daysBetween.reduce((sum, days) => sum + days, 0) / daysBetween.length;

      // Calcular días desde última transacción
      const lastTransaction = sortedDates[sortedDates.length - 1];
      const lastTransactionDaysAgo = (now.getTime() - lastTransaction.getTime()) / (1000 * 60 * 60 * 24);

      // Determinar frecuencia
      let frequency: CategoryFrequency['frequency'] = 'baja';
      if (averageDaysBetween <= 7) {
        frequency = 'alta';
      } else if (averageDaysBetween <= 20) {
        frequency = 'media';
      }

      frequencies.push({
        categoryName,
        transactionCount: data.dates.length,
        averageDaysBetween,
        lastTransactionDaysAgo,
        frequency
      });
    });

    // Ordenar por frecuencia (alta primero) y luego por cantidad de transacciones
    return frequencies.sort((a, b) => {
      const frequencyOrder = { alta: 3, media: 2, baja: 1 };
      const freqCompare = frequencyOrder[b.frequency] - frequencyOrder[a.frequency];
      if (freqCompare !== 0) return freqCompare;
      return b.transactionCount - a.transactionCount;
    }).slice(0, 6); // Mostrar solo top 6
  }, [expenses]);

  // Calcular datos para el heat map del calendario
  const getCalendarHeatMapData = useCallback((month: Date = new Date()): DayData[] => {
    if (expenses.length === 0) return [];

    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    // Filtrar gastos del mes seleccionado
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === year && expenseDate.getMonth() === monthIndex;
    });

    // Agrupar gastos por día
    const dailyData = new Map<string, { total: number, expenses: ExpenseDetail[] }>();

    monthExpenses.forEach(expense => {
      const dateKey = expense.date.split('T')[0];
      const expenseTime = new Date(expense.date);

      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { total: 0, expenses: [] });
      }

      const dayData = dailyData.get(dateKey)!;
      dayData.total += expense.amount;

      // Crear detalle del gasto
      const expenseDetail: ExpenseDetail = {
        id: expense.id?.toString() || `${expense.date}-${expense.amount}`,
        description: expense.description || 'Gasto sin descripción',
        amount: expense.amount,
        category: expense.category
      };

      dayData.expenses.push(expenseDetail);
    });

    // Calcular intensidades basadas en los totales diarios
    const amounts = Array.from(dailyData.values()).map(d => d.total);
    if (amounts.length === 0) return [];

    const maxAmount = Math.max(...amounts);
    const minAmount = Math.min(...amounts);
    const range = maxAmount - minAmount;

    // Crear datos del heat map
    const heatMapData: DayData[] = [];
    Array.from(dailyData.entries()).forEach(([date, dayData]) => {
      let intensity = 0;
      if (range > 0) {
        const normalizedAmount = (dayData.total - minAmount) / range;
        if (normalizedAmount > 0.8) intensity = 4;
        else if (normalizedAmount > 0.6) intensity = 3;
        else if (normalizedAmount > 0.4) intensity = 2;
        else if (normalizedAmount > 0.2) intensity = 1;
        else intensity = 1;
      } else if (dayData.total > 0) {
        intensity = 2; // Valor medio si todos los días tienen el mismo gasto
      }

      const dayOfMonth = new Date(date).getDate();

      // Ordenar gastos por monto (mayor a menor)
      const sortedExpenses = dayData.expenses.sort((a, b) => b.amount - a.amount);

      heatMapData.push({
        date,
        amount: dayData.total,
        dayOfMonth,
        isCurrentMonth: true,
        intensity,
        expenses: sortedExpenses
      });
    });

    return heatMapData;
  }, [expenses]);

  // Calcular datos del mapa de calor para un mes específico
  const getCalendarDataForMonth = useCallback((monthOffset: number): DayData[] => {
    if (expenses.length === 0) return [];

    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();

    // Filtrar gastos del mes específico
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
    });

    // Agrupar gastos por día
    const dailyTotals = new Map<string, { amount: number; expenses: ExpenseDetail[] }>();

    monthExpenses.forEach(expense => {
      const dateKey = expense.date;
      const existing = dailyTotals.get(dateKey) || { amount: 0, expenses: [] };

      existing.amount += expense.amount;
      existing.expenses.push({
        id: expense.id?.toString() || '',
        description: expense.description,
        amount: expense.amount,
        category: expense.category
      });

      dailyTotals.set(dateKey, existing);
    });

    // Convertir a formato DayData
    const maxAmount = Math.max(...Array.from(dailyTotals.values()).map(d => d.amount), 1);
    const heatMapData: DayData[] = [];

    dailyTotals.forEach((dayData, date) => {
      const intensity = Math.min(Math.floor((dayData.amount / maxAmount) * 4) + 1, 4);
      const dayOfMonth = new Date(date).getDate();

      heatMapData.push({
        date,
        amount: dayData.amount,
        dayOfMonth,
        isCurrentMonth: true,
        intensity,
        expenses: dayData.expenses
      });
    });

    return heatMapData;
  }, [expenses]);

  // Calcular patrones de gasto por día de la semana
  const getWeeklySpendingData = useCallback((): { data: WeeklySpendingData[], insight: WeeklyInsight | null } => {
    if (expenses.length === 0) return { data: [], insight: null };

    // Inicializar contadores para cada día de la semana (lunes a domingo)
    const weeklyData = Array.from({ length: 7 }, (_, index) => ({
      dayOfWeek: index,
      dayName: DAY_NAMES_SHORT[index],
      fullDayName: DAY_NAMES_FULL[index],
      totalAmount: 0,
      totalTransactions: 0,
      percentage: 0
    }));

    // Agrupar gastos por día de la semana
    expenses.forEach(expense => {
      const dayOfWeek = getMondayBasedDayOfWeek(new Date(expense.date));
      weeklyData[dayOfWeek].totalAmount += expense.amount;
      weeklyData[dayOfWeek].totalTransactions += 1;
    });

    // Encontrar el máximo para calcular porcentajes
    const maxAmount = Math.max(...weeklyData.map(d => d.totalAmount));

    weeklyData.forEach(day => {
      day.percentage = maxAmount > 0 ? (day.totalAmount / maxAmount) * 100 : 0;
    });

    // Filtrar días con datos y crear resultado final
    const validData = weeklyData
      .filter(day => day.totalTransactions > 0)
      .map(day => ({
        dayOfWeek: day.dayOfWeek,
        dayName: day.dayName,
        totalAmount: day.totalAmount,
        totalTransactions: day.totalTransactions,
        percentage: day.percentage
      }));

    // Generar insight
    let insight: WeeklyInsight | null = null;
    if (validData.length >= 2) {
      const sortedByAmount = [...validData].sort((a, b) => b.totalAmount - a.totalAmount);
      const highest = sortedByAmount[0];
      const lowest = sortedByAmount[sortedByAmount.length - 1];

      if (highest.totalAmount > lowest.totalAmount) {
        const percentageDiff = ((highest.totalAmount - lowest.totalAmount) / lowest.totalAmount) * 100;

        insight = {
          highestDay: highest.dayName,
          lowestDay: lowest.dayName,
          percentageDifference: percentageDiff,
          insight: `Gastas ${percentageDiff.toFixed(1)}% más los ${weeklyData[highest.dayOfWeek].fullDayName.toLowerCase()} que los ${weeklyData[lowest.dayOfWeek].fullDayName.toLowerCase()}`
        };
      }
    }

    return { data: validData, insight };
  }, [expenses]);

  // Calcular patrones de gasto por día de la semana para una semana específica
  const getWeeklyDataForWeek = useCallback((weekOffset: number): { data: WeeklySpendingData[], insight: WeeklyInsight | null } => {
    if (expenses.length === 0) return { data: [], insight: null };

    // Usar las funciones utilitarias para calcular el rango de la semana
    const { start: targetWeekStart, end: targetWeekEnd } = getWeekRange(weekOffset);

    // Filtrar gastos de la semana específica
    const weekExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= targetWeekStart && expenseDate <= targetWeekEnd;
    });

    // Inicializar contadores para cada día de la semana (lunes a domingo)
    const weeklyData = Array.from({ length: 7 }, (_, index) => ({
      dayOfWeek: index,
      dayName: DAY_NAMES_SHORT[index],
      fullDayName: DAY_NAMES_FULL[index],
      totalAmount: 0,
      totalTransactions: 0,
      percentage: 0
    }));

    // Agrupar gastos por día de la semana
    weekExpenses.forEach(expense => {
      const dayOfWeek = getMondayBasedDayOfWeek(new Date(expense.date));
      weeklyData[dayOfWeek].totalAmount += expense.amount;
      weeklyData[dayOfWeek].totalTransactions += 1;
    });

    // Los datos ya están en totalAmount, no necesitamos calcular promedios

    // Encontrar el máximo para calcular porcentajes
    const maxAmount = Math.max(...weeklyData.map(d => d.totalAmount));

    weeklyData.forEach(day => {
      day.percentage = maxAmount > 0 ? (day.totalAmount / maxAmount) * 100 : 0;
    });

    // Filtrar días con datos y crear resultado final
    const validData = weeklyData
      .filter(day => day.totalTransactions > 0)
      .map(day => ({
        dayOfWeek: day.dayOfWeek,
        dayName: day.dayName,
        totalAmount: day.totalAmount,
        totalTransactions: day.totalTransactions,
        percentage: day.percentage
      }));

    // Generar insight para la semana específica
    let insight: WeeklyInsight | null = null;
    if (validData.length >= 2) {
      const sortedByAmount = [...validData].sort((a, b) => b.totalAmount - a.totalAmount);
      const highest = sortedByAmount[0];
      const lowest = sortedByAmount[sortedByAmount.length - 1];

      if (highest.totalAmount > lowest.totalAmount) {
        const percentageDiff = ((highest.totalAmount - lowest.totalAmount) / lowest.totalAmount) * 100;
        const weekLabel = weekOffset === 0 ? 'esta semana' : weekOffset === 1 ? 'la semana pasada' : `hace ${weekOffset} semanas`;

        insight = {
          highestDay: highest.dayName,
          lowestDay: lowest.dayName,
          percentageDifference: percentageDiff,
          insight: `En ${weekLabel}, gastaste ${percentageDiff.toFixed(1)}% más los ${weeklyData[highest.dayOfWeek].fullDayName.toLowerCase()} que los ${weeklyData[lowest.dayOfWeek].fullDayName.toLowerCase()}`
        };
      }
    }

    return { data: validData, insight };
  }, [expenses]);


  return {
    // Datos calculados
    timelineData,
    timelineRange,
    monthComparison,
    monthlyPrediction,

    // Funciones utilitarias
    getTopCategories,
    getBasicInsights,
    getCategoryChanges,
    getFrequencyAnalysis,
    getCalendarHeatMapData,
    getCalendarDataForMonth,
    getWeeklySpendingData,
    getWeeklyDataForWeek,
    formatCurrency,
    refreshData,
    setTimelineRange,

    // Estado
    loading: expenses.length === 0,
  };
};
