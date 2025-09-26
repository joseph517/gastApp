import { useState, useEffect } from "react";
import { useExpenseStore } from "../store/expenseStore";

export interface StatisticsData {
  total: number;
  previousTotal: number;
  percentageChange: number;
  expenseCount: number;
}

export const useStatistics = () => {
  const { expenses, getTotalsByCategory, getPeriodStats } = useExpenseStore();
  const [monthlyTotals, setMonthlyTotals] = useState<any[]>([]);
  const [stats, setStats] = useState<StatisticsData>({
    total: 0,
    previousTotal: 0,
    percentageChange: 0,
    expenseCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [expenses]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 1);

      const totals = await getTotalsByCategory(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );
      setMonthlyTotals(totals);

      const periodStats = await getPeriodStats("month");
      setStats(periodStats);
    } catch (error) {
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  return {
    monthlyTotals,
    stats,
    loading,
    formatCurrency,
    loadStatistics,
  };
};