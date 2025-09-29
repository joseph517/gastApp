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

// Constants
const PREDICTION_THRESHOLDS = {
  CONFIDENCE: {
    HIGH_CHANGE_PERCENT: 20,
    MEDIUM_CHANGE_PERCENT: 40,
    HIGH_DAY_THRESHOLD: 15,
    MEDIUM_DAY_THRESHOLD: 7,
  },
  CATEGORY: {
    HIGH_CONCENTRATION: 40,
  },
  BUDGET: {
    ALERT_THRESHOLD: 1.05,
  },
  WEEKLY: {
    PREDICTION_DAMPENING: 0.5,
  },
} as const;

const CONFIDENCE_LABELS = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
} as const;

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

// Types
type Trend = "up" | "down" | "stable";
type Confidence = "high" | "medium" | "low";

interface Expense {
  date: string;
  amount: number;
  category: string;
}

interface SpendingPrediction {
  type: "weekly" | "monthly" | "category";
  title: string;
  description: string;
  predictedAmount: number;
  confidence: Confidence;
  icon: string;
  trend: Trend;
  recommendation?: string;
}

interface BudgetPredictionsCardProps {
  budgetStatus?: BudgetStatus | null;
  onViewDetails?: () => void;
}

// Utility functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
};

const calculateTotal = (expenses: Expense[]): number => {
  return expenses.reduce((acc, exp) => acc + exp.amount, 0);
};

const determineTrend = (current: number, previous: number): Trend => {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "stable";
};

const getConfidenceLevelByChange = (changePercent: number): Confidence => {
  const absChange = Math.abs(changePercent);
  if (absChange < PREDICTION_THRESHOLDS.CONFIDENCE.HIGH_CHANGE_PERCENT)
    return "high";
  if (absChange < PREDICTION_THRESHOLDS.CONFIDENCE.MEDIUM_CHANGE_PERCENT)
    return "medium";
  return "low";
};

const getConfidenceLevelByDay = (currentDay: number): Confidence => {
  if (currentDay > PREDICTION_THRESHOLDS.CONFIDENCE.HIGH_DAY_THRESHOLD)
    return "high";
  if (currentDay > PREDICTION_THRESHOLDS.CONFIDENCE.MEDIUM_DAY_THRESHOLD)
    return "medium";
  return "low";
};

const getTrendRecommendation = (trend: Trend): string => {
  switch (trend) {
    case "up":
      return "Considera revisar tus gastos recurrentes";
    case "down":
      return "Mantén el buen control de gastos";
    case "stable":
      return "Gastos estables, sigue así";
  }
};

const filterExpensesByDateRange = (
  expenses: Expense[],
  startDate: Date,
  endDate?: Date
): Expense[] => {
  return expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    if (endDate) {
      return expenseDate >= startDate && expenseDate < endDate;
    }
    return expenseDate >= startDate;
  });
};

const getDateDaysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

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
    expenses: Expense[]
  ): SpendingPrediction | null => {
    const lastWeekExpenses = filterExpensesByDateRange(
      expenses,
      getDateDaysAgo(7)
    );
    const previousWeekExpenses = filterExpensesByDateRange(
      expenses,
      getDateDaysAgo(14),
      getDateDaysAgo(7)
    );

    if (lastWeekExpenses.length === 0) return null;

    const lastWeekTotal = calculateTotal(lastWeekExpenses);
    const previousWeekTotal = calculateTotal(previousWeekExpenses);
    const trend = determineTrend(lastWeekTotal, previousWeekTotal);

    const changePercent =
      previousWeekTotal > 0
        ? ((lastWeekTotal - previousWeekTotal) / previousWeekTotal) * 100
        : 0;

    const nextWeekPrediction =
      lastWeekTotal +
      lastWeekTotal *
        (changePercent / 100) *
        PREDICTION_THRESHOLDS.WEEKLY.PREDICTION_DAMPENING;

    return {
      type: "weekly",
      title: "Próxima Semana",
      description: `Gasto previsto: ${formatCurrency(nextWeekPrediction)}`,
      predictedAmount: nextWeekPrediction,
      confidence: getConfidenceLevelByChange(changePercent),
      icon: "calendar-outline",
      trend,
      recommendation: getTrendRecommendation(trend),
    };
  };

  const calculateMonthlyPrediction = (
    expenses: Expense[]
  ): SpendingPrediction | null => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

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

    const currentMonthTotal = calculateTotal(currentMonthExpenses);
    const previousMonthTotal = calculateTotal(previousMonthExpenses);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const remainingDays = daysInMonth - currentDay;
    const dailyAverage = currentMonthTotal / currentDay;
    const projectedTotal = currentMonthTotal + dailyAverage * remainingDays;

    const trend = determineTrend(projectedTotal, previousMonthTotal);

    const recommendation =
      trend === "up" && previousMonthTotal > 0
        ? `Gastos aumentando ${(
            ((projectedTotal - previousMonthTotal) / previousMonthTotal) *
            100
          ).toFixed(0)}%`
        : "Proyección dentro del rango normal";

    return {
      type: "monthly",
      title: "Fin de Mes",
      description: `Total proyectado: ${formatCurrency(projectedTotal)}`,
      predictedAmount: projectedTotal,
      confidence: getConfidenceLevelByDay(currentDay),
      icon: "calendar",
      trend,
      recommendation,
    };
  };

  const calculateCategoryPrediction = (
    expenses: Expense[]
  ): SpendingPrediction | null => {
    const categoryTotals = expenses.reduce<Record<string, number>>(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      },
      {}
    );

    const sortedCategories = Object.entries(categoryTotals).sort(
      ([, a], [, b]) => b - a
    );

    if (sortedCategories.length === 0) return null;

    const [topCategory, topAmount] = sortedCategories[0];
    const totalExpenses = calculateTotal(expenses);
    const percentage = (topAmount / totalExpenses) * 100;

    const recommendation =
      percentage > PREDICTION_THRESHOLDS.CATEGORY.HIGH_CONCENTRATION
        ? "Considera diversificar tus gastos"
        : "Distribución equilibrada de categorías";

    return {
      type: "category",
      title: "Categoría Principal",
      description: `${topCategory}: ${percentage.toFixed(0)}% del gasto`,
      predictedAmount: topAmount,
      confidence: "high",
      icon: "pie-chart-outline",
      trend: "stable",
      recommendation,
    };
  };

  const calculateEndOfMonthPrediction = (
    budgetStatus: BudgetStatus,
    _expenses: Expense[]
  ): SpendingPrediction | null => {
    const { projectedTotal, budget, daysRemaining, recommendedDailyLimit } =
      budgetStatus;
    const budgetAmount = budget.amount;

    // Solo mostrar si excede por más del 5%
    if (projectedTotal <= budgetAmount * PREDICTION_THRESHOLDS.BUDGET.ALERT_THRESHOLD) {
      return null;
    }

    const exceedAmount = projectedTotal - budgetAmount;

    return {
      type: "monthly",
      title: "Alerta de Presupuesto",
      description: `Riesgo de exceder por ${formatCurrency(exceedAmount)}`,
      predictedAmount: projectedTotal,
      confidence: daysRemaining > 10 ? "medium" : "high",
      icon: "warning-outline",
      trend: "up",
      recommendation: `Reduce gastos diarios a ${formatCurrency(
        recommendedDailyLimit
      )}`,
    };
  };

  const calculateHighSpendingDaysPrediction = (
    expenses: Expense[]
  ): SpendingPrediction | null => {
    const dayOfWeekTotals = expenses.reduce<Record<number, number>>(
      (acc, expense) => {
        const dayOfWeek = new Date(expense.date).getDay();
        acc[dayOfWeek] = (acc[dayOfWeek] || 0) + expense.amount;
        return acc;
      },
      {}
    );

    const sortedDays = Object.entries(dayOfWeekTotals).sort(
      ([, a], [, b]) => b - a
    );

    if (sortedDays.length === 0) return null;

    const [highestDay, highestAmount] = sortedDays[0];
    const dayName = DAY_NAMES[parseInt(highestDay)];

    return {
      type: "weekly",
      title: "Día de Mayor Gasto",
      description: `Los ${dayName} gastas más: ${formatCurrency(highestAmount)}`,
      predictedAmount: highestAmount,
      confidence: "medium",
      icon: "trending-up-outline",
      trend: "stable",
      recommendation: `Planifica mejor los gastos del ${dayName}`,
    };
  };

  const getConfidenceColor = (confidence: Confidence) => {
    const colorMap: Record<Confidence, string> = {
      high: colors.success,
      medium: colors.warning,
      low: colors.error,
    };
    return colorMap[confidence];
  };

  const getTrendColor = (trend: Trend) => {
    const colorMap: Record<Trend, string> = {
      up: colors.error,
      down: colors.success,
      stable: colors.textSecondary,
    };
    return colorMap[trend];
  };

  const getConfidenceLabel = (confidence: Confidence): string => {
    return CONFIDENCE_LABELS[confidence];
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
                  {getConfidenceLabel(prediction.confidence)}
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
