import { useState, useEffect, useMemo, useCallback } from "react";
import { useExpenseStore } from "../store/expenseStore";
import { Expense, Period, CategoryTotal } from "../types";
import { getPeriodDateRange } from "../utils/dateUtils";

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
  const [monthComparison, setMonthComparison] =
    useState<PeriodComparison | null>(null);
  const [monthlyPrediction, setMonthlyPrediction] =
    useState<MonthlyPrediction | null>(null);

  // Memoizar cálculos pesados - Cambiado a 15 días
  const memoizedTimelineData = useMemo(() => {
    if (expenses.length === 0) return [];

    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    const recentExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= fifteenDaysAgo && expenseDate <= now;
    });

    const dailyTotals = new Map<string, number>();
    recentExpenses.forEach((expense) => {
      const dateKey = expense.date.split("T")[0];
      const current = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, current + expense.amount);
    });

    const timeline: TimelineData[] = [];
    for (let i = 14; i >= 0; i--) {
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
  }, [expenses]);

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

  return {
    // Datos calculados
    timelineData,
    monthComparison,
    monthlyPrediction,

    // Funciones utilitarias
    getTopCategories,
    formatCurrency,
    refreshData,

    // Estado
    loading: expenses.length === 0,
  };
};
