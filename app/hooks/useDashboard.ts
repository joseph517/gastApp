import { useState, useEffect } from "react";
import { useExpenseStore } from "../store/expenseStore";
import { Period, CategoryTotal } from "../types";
import { getPeriodDateRange } from "../utils/dateUtils";

export interface DashboardStats {
  total: number;
  previousTotal: number;
  percentageChange: number;
  expenseCount: number;
}

export const useDashboard = () => {
  const {
    expenses,
    loading,
    error,
    initializeStore,
    getExpenses,
    deleteExpense,
    getTotalsByCategory,
    getRecentExpenses,
    getPeriodStats,
    importTestData,
  } = useExpenseStore();

  const [selectedPeriod, setSelectedPeriod] = useState<Period>("month");
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [periodStats, setPeriodStats] = useState<DashboardStats>({
    total: 0,
    previousTotal: 0,
    percentageChange: 0,
    expenseCount: 0,
  });

  useEffect(() => {
    initializeStore();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadDashboardData();
    }
  }, [selectedPeriod, expenses, loading]);

  const loadDashboardData = async () => {
    try {
      const { startDate, endDate } = getPeriodDateRange(selectedPeriod);

      // Obtener totales por categoría usando las mismas fechas
      const totals = await getTotalsByCategory(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );
      setCategoryTotals(totals);

      // Obtener estadísticas del período
      const stats = await getPeriodStats(selectedPeriod);
      setPeriodStats(stats);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const handleRefresh = async () => {
    await getExpenses();
    await loadDashboardData();
  };

  const handleDeleteExpense = (expenseId: number) => {
    return deleteExpense(expenseId);
  };

  const handleImportTestData = async () => {
    return await importTestData();
  };

  const recentExpenses = getRecentExpenses(5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  const getPeriodLabel = () => {
    const labels = {
      week: "Esta semana",
      month: "Este mes",
      year: "Este año"
    };
    return labels[selectedPeriod] || "Período";
  };

  return {
    // Estado
    selectedPeriod,
    categoryTotals,
    periodStats,
    recentExpenses,
    loading,
    error,

    // Acciones
    setSelectedPeriod,
    handleRefresh,
    handleDeleteExpense,
    handleImportTestData,
    loadDashboardData,

    // Utilidades
    formatCurrency,
    getPeriodLabel,
  };
};