import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { MonthlyPrediction as PredictionType } from "../../hooks/useAnalytics";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

interface MonthlyPredictionProps {
  prediction: PredictionType | null;
  title?: string;
}

const MonthlyPrediction: React.FC<MonthlyPredictionProps> = React.memo(({
  prediction,
  title = "Predicción Mensual"
}) => {
  const { colors } = useTheme();

  if (!prediction) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
        {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}
        <View style={styles.emptyState}>
          <Ionicons name="trending-up-outline" size={48} color={colors.gray300} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay datos suficientes para hacer predicciones
          </Text>
        </View>
      </View>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressPercentage = () => {
    return (prediction.daysElapsed / prediction.totalDays) * 100;
  };

  const getRemainingDays = () => {
    return prediction.totalDays - prediction.daysElapsed;
  };

  const getPredictionInsight = () => {
    const remainingDays = getRemainingDays();
    const dailyBudget = prediction.remainingBudget / remainingDays;

    if (remainingDays <= 0) {
      return "El mes ha terminado. ¡Revisa tu rendimiento!";
    }

    if (prediction.remainingBudget < 0) {
      return `A este ritmo, excederás tu gasto habitual en ${formatCurrency(Math.abs(prediction.remainingBudget))}.`;
    }

    if (dailyBudget < prediction.dailyAverage * 0.5) {
      return `Necesitas reducir tu gasto diario a ${formatCurrency(dailyBudget)} para mantener el ritmo.`;
    }

    if (dailyBudget > prediction.dailyAverage * 1.5) {
      return "¡Vas muy bien! Puedes mantener o incluso aumentar ligeramente tu gasto diario.";
    }

    return `Para mantener el ritmo, puedes gastar aproximadamente ${formatCurrency(dailyBudget)} por día.`;
  };

  const getStatusColor = () => {
    const remainingDays = getRemainingDays();
    if (remainingDays <= 0) return colors.textSecondary;
    if (prediction.remainingBudget < 0) return colors.error;

    const dailyBudget = prediction.remainingBudget / remainingDays;
    if (dailyBudget < prediction.dailyAverage * 0.7) return colors.warning;
    return colors.success;
  };

  const getStatusIcon = () => {
    const remainingDays = getRemainingDays();
    if (remainingDays <= 0) return "checkmark-circle";
    if (prediction.remainingBudget < 0) return "warning";

    const dailyBudget = prediction.remainingBudget / remainingDays;
    if (dailyBudget < prediction.dailyAverage * 0.7) return "alert-circle";
    return "checkmark-circle";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}

      {/* Progreso del mes */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            Progreso del mes
          </Text>
          <Text style={[styles.daysText, { color: colors.textPrimary }]}>
            Día {prediction.daysElapsed} de {prediction.totalDays}
          </Text>
        </View>

        <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${getProgressPercentage()}%`
              }
            ]}
          />
        </View>
      </View>

      {/* Estadísticas principales */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Gastado
          </Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {formatCurrency(prediction.currentSpent)}
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Promedio diario
          </Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {formatCurrency(prediction.dailyAverage)}
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Proyección total
          </Text>
          <Text style={[styles.statValue, { color: getStatusColor() }]}>
            {formatCurrency(prediction.projectedTotal)}
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Días restantes
          </Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {getRemainingDays()}
          </Text>
        </View>
      </View>

      {/* Insight y recomendación */}
      <View style={[styles.insightContainer, { borderTopColor: colors.border }]}>
        <View style={styles.insightHeader}>
          <Ionicons
            name={getStatusIcon()}
            size={20}
            color={getStatusColor()}
          />
          <Text style={[styles.insightTitle, { color: getStatusColor() }]}>
            Predicción
          </Text>
        </View>

        <Text style={[styles.insightText, { color: colors.textSecondary }]}>
          {getPredictionInsight()}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  progressSection: {
    marginBottom: SPACING.lg,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
  },
  daysText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: "48%",
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
    marginBottom: 4,
    textAlign: "center",
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: "700",
    textAlign: "center",
  },
  insightContainer: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  insightTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  insightText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    fontStyle: "italic",
  },
  emptyState: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
});

export default MonthlyPrediction;