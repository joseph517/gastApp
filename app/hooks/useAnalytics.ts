import { useState, useEffect } from "react";
import { useExpenseStore } from "../store/expenseStore";
import { Expense, Period } from "../types";

export interface TimelineData {
  date: string;
  amount: number;
  label: string;
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
  const { expenses, getExpenses } = useExpenseStore();
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [monthComparison, setMonthComparison] = useState<PeriodComparison | null>(null);
  const [monthlyPrediction, setMonthlyPrediction] = useState<MonthlyPrediction | null>(null);

  useEffect(() => {
    if (expenses.length > 0) {
      calculateTimelineData();
      calculateMonthComparison();
      calculateMonthlyPrediction();
    }
  }, [expenses]);

  const calculateTimelineData = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Filtrar gastos de los últimos 30 días
    const recentExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= thirtyDaysAgo && expenseDate <= now;
    });

    // Agrupar por día
    const dailyTotals = new Map<string, number>();

    recentExpenses.forEach(expense => {
      const dateKey = expense.date.split('T')[0]; // YYYY-MM-DD
      const current = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, current + expense.amount);
    });

    // Crear array para los últimos 30 días (incluyendo días sin gastos)
    const timeline: TimelineData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateKey = date.toISOString().split('T')[0];
      const amount = dailyTotals.get(dateKey) || 0;

      timeline.push({
        date: dateKey,
        amount,
        label: date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })
      });
    }

    setTimelineData(timeline);
  };

  const calculateMonthComparison = () => {
    const now = new Date();

    // Mes actual
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Mes anterior
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= currentMonthStart && expenseDate <= currentMonthEnd;
    });

    const previousExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= previousMonthStart && expenseDate <= previousMonthEnd;
    });

    const currentTotal = currentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const previousTotal = previousExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const difference = currentTotal - previousTotal;
    const percentageChange = previousTotal > 0 ? (difference / previousTotal) * 100 : 0;

    setMonthComparison({
      current: {
        total: currentTotal,
        period: currentMonthStart.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
        expenses: currentExpenses
      },
      previous: {
        total: previousTotal,
        period: previousMonthStart.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
        expenses: previousExpenses
      },
      percentageChange,
      difference
    });
  };

  const calculateMonthlyPrediction = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Gastos del mes actual
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= monthStart && expenseDate <= now;
    });

    const currentSpent = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const daysElapsed = Math.ceil((now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const dailyAverage = daysElapsed > 0 ? currentSpent / daysElapsed : 0;
    const projectedTotal = dailyAverage * totalDays;
    const remainingBudget = projectedTotal - currentSpent;

    setMonthlyPrediction({
      currentSpent,
      daysElapsed,
      totalDays,
      dailyAverage,
      projectedTotal,
      remainingBudget
    });
  };

  const getTopCategories = (period: Period = 'month') => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= now;
    });

    const categoryTotals = new Map<string, number>();
    periodExpenses.forEach(expense => {
      const current = categoryTotals.get(expense.categoryName) || 0;
      categoryTotals.set(expense.categoryName, current + expense.amount);
    });

    return Array.from(categoryTotals.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  const refreshData = async () => {
    await getExpenses();
  };

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
    loading: expenses.length === 0
  };
};