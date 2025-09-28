import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { databaseService } from "../../database/database";
import { Budget } from "../../types";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

interface BudgetPerformanceMetrics {
  complianceRate: number; // Porcentaje de presupuestos cumplidos
  averageUsage: number; // Promedio de uso de presupuesto
  totalSavings: number; // Total ahorrado
  totalOverspend: number; // Total excedido
  bestMonth: { month: string; percentage: number } | null;
  worstMonth: { month: string; percentage: number } | null;
  trend: 'improving' | 'declining' | 'stable';
}

interface BudgetPerformanceCardProps {
  onViewDetails?: () => void;
}

const BudgetPerformanceCard: React.FC<BudgetPerformanceCardProps> = ({
  onViewDetails,
}) => {
  const { colors } = useTheme();
  const [metrics, setMetrics] = useState<BudgetPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceMetrics();
  }, []);

  const loadPerformanceMetrics = async () => {
    try {
      setLoading(true);

      // Obtener todos los presupuestos históricos
      const budgets = await databaseService.getBudgets();

      if (budgets.length === 0) {
        setMetrics(null);
        return;
      }

      // Calcular métricas para cada presupuesto
      const budgetMetrics = await Promise.all(
        budgets.map(async (budget) => {
          const spent = await databaseService.getTotalSpentInBudgetPeriod(budget);
          const percentage = (spent / budget.amount) * 100;
          const savings = Math.max(0, budget.amount - spent);
          const overspend = Math.max(0, spent - budget.amount);

          return {
            budget,
            spent,
            percentage,
            savings,
            overspend,
            compliant: percentage <= 100,
          };
        })
      );

      // Calcular métricas de rendimiento
      const compliantBudgets = budgetMetrics.filter(m => m.compliant).length;
      const complianceRate = (compliantBudgets / budgets.length) * 100;

      const averageUsage = budgetMetrics.reduce((acc, m) => acc + m.percentage, 0) / budgets.length;

      const totalSavings = budgetMetrics.reduce((acc, m) => acc + m.savings, 0);
      const totalOverspend = budgetMetrics.reduce((acc, m) => acc + m.overspend, 0);

      // Encontrar mejor y peor mes
      const sortedByPerformance = budgetMetrics.sort((a, b) => a.percentage - b.percentage);
      const bestMonth = sortedByPerformance[0] ? {
        month: formatBudgetPeriod(sortedByPerformance[0].budget),
        percentage: sortedByPerformance[0].percentage
      } : null;

      const worstMonth = sortedByPerformance[sortedByPerformance.length - 1] ? {
        month: formatBudgetPeriod(sortedByPerformance[sortedByPerformance.length - 1].budget),
        percentage: sortedByPerformance[sortedByPerformance.length - 1].percentage
      } : null;

      // Calcular tendencia (comparar últimos 3 vs 3 anteriores)
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (budgets.length >= 6) {
        const recent = budgetMetrics.slice(-3);
        const previous = budgetMetrics.slice(-6, -3);

        const recentAvg = recent.reduce((acc, m) => acc + m.percentage, 0) / 3;
        const previousAvg = previous.reduce((acc, m) => acc + m.percentage, 0) / 3;

        if (recentAvg < previousAvg - 5) trend = 'improving';
        else if (recentAvg > previousAvg + 5) trend = 'declining';
      }

      setMetrics({
        complianceRate,
        averageUsage,
        totalSavings,
        totalOverspend,
        bestMonth,
        worstMonth,
        trend,
      });

    } catch (error) {
      console.error('Error loading performance metrics:', error);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const formatBudgetPeriod = (budget: Budget): string => {
    const startDate = new Date(budget.startDate);
    return `${startDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return 'trending-up';
      case 'declining': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return colors.success;
      case 'declining': return colors.error;
      default: return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Análisis de Rendimiento
        </Text>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Analizando datos...
          </Text>
        </View>
      </View>
    );
  }

  if (!metrics) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Análisis de Rendimiento
        </Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Necesitas al menos un presupuesto para ver el análisis de rendimiento.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Análisis de Rendimiento
        </Text>
        {onViewDetails && (
          <TouchableOpacity style={styles.detailsButton} onPress={onViewDetails}>
            <Text style={[styles.detailsText, { color: colors.primary }]}>
              Ver detalles
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.metricsGrid}>
        {/* Compliance Rate */}
        <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
          <View style={styles.metricHeader}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={metrics.complianceRate >= 70 ? colors.success : colors.warning}
            />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Cumplimiento
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            {metrics.complianceRate.toFixed(0)}%
          </Text>
        </View>

        {/* Average Usage */}
        <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
          <View style={styles.metricHeader}>
            <Ionicons
              name="speedometer"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Uso Promedio
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            {metrics.averageUsage.toFixed(0)}%
          </Text>
        </View>

        {/* Total Savings */}
        <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
          <View style={styles.metricHeader}>
            <Ionicons
              name="wallet"
              size={20}
              color={colors.success}
            />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Total Ahorrado
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            {formatCurrency(metrics.totalSavings)}
          </Text>
        </View>

        {/* Trend */}
        <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
          <View style={styles.metricHeader}>
            <Ionicons
              name={getTrendIcon(metrics.trend)}
              size={20}
              color={getTrendColor(metrics.trend)}
            />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Tendencia
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: getTrendColor(metrics.trend) }]}>
            {metrics.trend === 'improving' ? 'Mejorando' :
             metrics.trend === 'declining' ? 'Empeorando' : 'Estable'}
          </Text>
        </View>
      </View>

      {/* Best/Worst Performance */}
      {(metrics.bestMonth || metrics.worstMonth) && (
        <View style={styles.performanceSection}>
          {metrics.bestMonth && (
            <View style={styles.performanceRow}>
              <Ionicons name="trophy" size={16} color={colors.success} />
              <Text style={[styles.performanceText, { color: colors.textSecondary }]}>
                Mejor mes: {metrics.bestMonth.month} ({metrics.bestMonth.percentage.toFixed(0)}%)
              </Text>
            </View>
          )}

          {metrics.worstMonth && metrics.worstMonth.percentage > 100 && (
            <View style={styles.performanceRow}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.performanceText, { color: colors.textSecondary }]}>
                Exceso máximo: {metrics.worstMonth.month} ({metrics.worstMonth.percentage.toFixed(0)}%)
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
  },
  detailsButton: {
    padding: SPACING.xs,
  },
  detailsText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  metricCard: {
    width: "48%",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  metricLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
    marginLeft: SPACING.xs,
  },
  metricValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
  },
  performanceSection: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5E7",
    paddingTop: SPACING.sm,
  },
  performanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  performanceText: {
    fontSize: FONT_SIZES.xs,
    marginLeft: SPACING.xs,
  },
});

export default BudgetPerformanceCard;