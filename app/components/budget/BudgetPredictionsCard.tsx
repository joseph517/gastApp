import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { databaseService } from "../../database/database";
import { BudgetStatus } from "../../types";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/colors";

interface SpendingPrediction {
  type: "weekly" | "monthly" | "category";
  title: string;
  description: string;
  predictedAmount: number;
  confidence: "high" | "medium" | "low";
  icon: string;
  trend: "up" | "down" | "stable";
  recommendation?: string;
}

interface BudgetPredictionsCardProps {
  budgetStatus?: BudgetStatus | null;
  onViewDetails?: () => void;
}

const BudgetPredictionsCard: React.FC<BudgetPredictionsCardProps> = ({
  budgetStatus,
  onViewDetails,
}) => {
  const { colors } = useTheme();
  const [predictions, setPredictions] = useState<SpendingPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPredictions();
  }, [budgetStatus]);

  const loadPredictions = async () => {
    try {
      setLoading(true);

      // Obtener datos históricos de los últimos 3 meses
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 3);

      const expenses = await databaseService.getExpensesByDateRange(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );

      if (expenses.length === 0) {
        setPredictions([]);
        return;
      }

      const newPredictions: SpendingPrediction[] = [];

      // 1. Predicción semanal basada en tendencia actual
      const weeklyPrediction = calculateWeeklyPrediction(expenses);
      if (weeklyPrediction) newPredictions.push(weeklyPrediction);

      // 2. Predicción mensual basada en histórico
      const monthlyPrediction = calculateMonthlyPrediction(expenses);
      if (monthlyPrediction) newPredictions.push(monthlyPrediction);

      // 3. Predicción por categoría (categoría con mayor tendencia)
      const categoryPrediction = calculateCategoryPrediction(expenses);
      if (categoryPrediction) newPredictions.push(categoryPrediction);

      // 4. Predicción de fin de mes si hay presupuesto activo
      if (budgetStatus) {
        const endOfMonthPrediction = calculateEndOfMonthPrediction(
          budgetStatus,
          expenses
        );
        if (endOfMonthPrediction) newPredictions.push(endOfMonthPrediction);
      }

      // 5. Predicción de días de alto gasto
      const highSpendingDaysPrediction =
        calculateHighSpendingDaysPrediction(expenses);
      if (highSpendingDaysPrediction)
        newPredictions.push(highSpendingDaysPrediction);

      setPredictions(newPredictions);
    } catch (error) {
      console.error("Error loading predictions:", error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyPrediction = (
    expenses: any[]
  ): SpendingPrediction | null => {
    const lastWeekExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return expenseDate >= weekAgo;
    });

    const previousWeekExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return expenseDate >= twoWeeksAgo && expenseDate < weekAgo;
    });

    if (lastWeekExpenses.length === 0) return null;

    const lastWeekTotal = lastWeekExpenses.reduce(
      (acc, exp) => acc + exp.amount,
      0
    );
    const previousWeekTotal = previousWeekExpenses.reduce(
      (acc, exp) => acc + exp.amount,
      0
    );

    const trend =
      lastWeekTotal > previousWeekTotal
        ? "up"
        : lastWeekTotal < previousWeekTotal
        ? "down"
        : "stable";

    const changePercent =
      previousWeekTotal > 0
        ? ((lastWeekTotal - previousWeekTotal) / previousWeekTotal) * 100
        : 0;

    const nextWeekPrediction =
      lastWeekTotal + lastWeekTotal * (changePercent / 100) * 0.5;

    return {
      type: "weekly",
      title: "Próxima Semana",
      description: `Gasto previsto: ${formatCurrency(nextWeekPrediction)}`,
      predictedAmount: nextWeekPrediction,
      confidence:
        Math.abs(changePercent) < 20
          ? "high"
          : Math.abs(changePercent) < 40
          ? "medium"
          : "low",
      icon: "calendar-outline",
      trend,
      recommendation:
        trend === "up"
          ? "Considera revisar tus gastos recurrentes"
          : trend === "down"
          ? "Mantén el buen control de gastos"
          : "Gastos estables, sigue así",
    };
  };

  const calculateMonthlyPrediction = (
    expenses: any[]
  ): SpendingPrediction | null => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    });

    const previousMonthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return (
        expenseDate.getMonth() === prevMonth &&
        expenseDate.getFullYear() === prevYear
      );
    });

    if (currentMonthExpenses.length === 0) return null;

    const currentMonthTotal = currentMonthExpenses.reduce(
      (acc, exp) => acc + exp.amount,
      0
    );
    const previousMonthTotal = previousMonthExpenses.reduce(
      (acc, exp) => acc + exp.amount,
      0
    );

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const remainingDays = daysInMonth - currentDay;

    const dailyAverage = currentMonthTotal / currentDay;
    const projectedTotal = currentMonthTotal + dailyAverage * remainingDays;

    const trend =
      projectedTotal > previousMonthTotal
        ? "up"
        : projectedTotal < previousMonthTotal
        ? "down"
        : "stable";

    return {
      type: "monthly",
      title: "Fin de Mes",
      description: `Total proyectado: ${formatCurrency(projectedTotal)}`,
      predictedAmount: projectedTotal,
      confidence: currentDay > 15 ? "high" : currentDay > 7 ? "medium" : "low",
      icon: "calendar",
      trend,
      recommendation:
        trend === "up"
          ? `Gastos aumentando ${(
              ((projectedTotal - previousMonthTotal) / previousMonthTotal) *
              100
            ).toFixed(0)}%`
          : "Proyección dentro del rango normal",
    };
  };

  const calculateCategoryPrediction = (
    expenses: any[]
  ): SpendingPrediction | null => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (sortedCategories.length === 0) return null;

    const [topCategory, topAmount] = sortedCategories[0];
    const totalExpenses = Object.values(categoryTotals).reduce(
      (acc, amount) => acc + amount,
      0
    );
    const percentage = ((topAmount as number) / totalExpenses) * 100;

    return {
      type: "category",
      title: `Categoría Principal`,
      description: `${topCategory}: ${percentage.toFixed(0)}% del gasto`,
      predictedAmount: topAmount as number,
      confidence: "high",
      icon: "pie-chart-outline",
      trend: "stable",
      recommendation:
        percentage > 40
          ? "Considera diversificar tus gastos"
          : "Distribución equilibrada de categorías",
    };
  };

  const calculateEndOfMonthPrediction = (
    budgetStatus: BudgetStatus,
    expenses: any[]
  ): SpendingPrediction | null => {
    const projectedTotal = budgetStatus.projectedTotal;
    const budgetAmount = budgetStatus.budget.amount;
    const exceedsPercentage =
      ((projectedTotal - budgetAmount) / budgetAmount) * 100;

    if (projectedTotal <= budgetAmount * 1.05) return null; // Solo mostrar si excede por más del 5%

    return {
      type: "monthly",
      title: "Alerta de Presupuesto",
      description: `Riesgo de exceder por ${formatCurrency(
        projectedTotal - budgetAmount
      )}`,
      predictedAmount: projectedTotal,
      confidence: budgetStatus.daysRemaining > 10 ? "medium" : "high",
      icon: "warning-outline",
      trend: "up",
      recommendation: `Reduce gastos diarios a ${formatCurrency(
        budgetStatus.recommendedDailyLimit
      )}`,
    };
  };

  const calculateHighSpendingDaysPrediction = (
    expenses: any[]
  ): SpendingPrediction | null => {
    const dayOfWeekTotals = expenses.reduce((acc, expense) => {
      const dayOfWeek = new Date(expense.date).getDay();
      acc[dayOfWeek] = (acc[dayOfWeek] || 0) + expense.amount;
      return acc;
    }, {});

    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const sortedDays = Object.entries(dayOfWeekTotals).sort(
      ([, a], [, b]) => b - a
    );

    if (sortedDays.length === 0) return null;

    const [highestDay, highestAmount] = sortedDays[0];
    const dayName = dayNames[parseInt(highestDay)];

    return {
      type: "weekly",
      title: "Día de Mayor Gasto",
      description: `Los ${dayName} gastas más: ${formatCurrency(
        highestAmount as number
      )}`,
      predictedAmount: highestAmount as number,
      confidence: "medium",
      icon: "trending-up-outline",
      trend: "stable",
      recommendation: `Planifica mejor los gastos del ${dayName}`,
    };
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return colors.success;
      case "medium":
        return colors.warning;
      case "low":
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return colors.error;
      case "down":
        return colors.success;
      case "stable":
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.cardBackground }]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Predicciones Inteligentes
        </Text>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Analizando tendencias...
          </Text>
        </View>
      </View>
    );
  }

  if (predictions.length === 0) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.cardBackground }]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Predicciones Inteligentes
        </Text>
        <View style={styles.emptyContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Necesitas más datos históricos para generar predicciones.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Predicciones Inteligentes
        </Text>
        {onViewDetails && (
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={onViewDetails}
          >
            <Text style={[styles.detailsText, { color: colors.primary }]}>
              Ver detalles
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.predictionsList}
      >
        {predictions.map((prediction, index) => (
          <View
            key={index}
            style={[styles.predictionCard, { backgroundColor: colors.surface }]}
          >
            <View style={styles.predictionHeader}>
              <Ionicons
                name={prediction.icon as any}
                size={24}
                color={colors.primary}
              />
              <View
                style={[
                  styles.confidenceBadge,
                  {
                    backgroundColor: getConfidenceColor(prediction.confidence),
                  },
                ]}
              >
                <Text
                  style={[styles.confidenceText, { color: colors.background }]}
                >
                  {prediction.confidence === "high"
                    ? "Alta"
                    : prediction.confidence === "medium"
                    ? "Media"
                    : "Baja"}
                </Text>
              </View>
            </View>

            <Text
              style={[styles.predictionTitle, { color: colors.textPrimary }]}
            >
              {prediction.title}
            </Text>

            <Text
              style={[
                styles.predictionDescription,
                { color: colors.textSecondary },
              ]}
            >
              {prediction.description}
            </Text>

            {prediction.recommendation && (
              <View style={styles.recommendationContainer}>
                <Ionicons name="bulb-outline" size={14} color={colors.accent} />
                <Text
                  style={[
                    styles.recommendationText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {prediction.recommendation}
                </Text>
              </View>
            )}

            <View style={styles.trendIndicator}>
              <Ionicons
                name={
                  prediction.trend === "up"
                    ? "trending-up"
                    : prediction.trend === "down"
                    ? "trending-down"
                    : "remove"
                }
                size={16}
                color={getTrendColor(prediction.trend)}
              />
            </View>
          </View>
        ))}
      </ScrollView>
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
  predictionsList: {
    marginHorizontal: -SPACING.sm,
  },
  predictionCard: {
    width: 280,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.sm,
    position: "relative",
  },
  predictionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  confidenceBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  confidenceText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "600",
  },
  predictionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  predictionDescription: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  recommendationContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },
  recommendationText: {
    fontSize: FONT_SIZES.xs,
    lineHeight: 16,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  trendIndicator: {
    position: "absolute",
    top: SPACING.md,
    right: SPACING.md,
  },
});

export default BudgetPredictionsCard;
