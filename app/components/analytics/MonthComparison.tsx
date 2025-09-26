import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { PeriodComparison } from "../../hooks/useAnalytics";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

interface MonthComparisonProps {
  comparison: PeriodComparison | null;
  title?: string;
}

const MonthComparison: React.FC<MonthComparisonProps> = React.memo(({
  comparison,
  title = "Comparación Mensual"
}) => {
  const { colors } = useTheme();

  if (!comparison) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
        {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color={colors.gray300} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay datos suficientes para comparar
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

  const getChangeColor = () => {
    if (comparison.percentageChange > 0) return colors.error;
    if (comparison.percentageChange < 0) return colors.success;
    return colors.textSecondary;
  };

  const getChangeIcon = () => {
    if (comparison.percentageChange > 0) return "trending-up";
    if (comparison.percentageChange < 0) return "trending-down";
    return "remove";
  };

  const getChangeText = () => {
    if (comparison.percentageChange > 0) return "Aumento";
    if (comparison.percentageChange < 0) return "Reducción";
    return "Sin cambio";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}

      <View style={styles.periodsContainer}>
        {/* Mes actual */}
        <View style={[styles.periodCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>
            {comparison.current.period}
          </Text>
          <Text style={[styles.periodAmount, { color: colors.primary }]}>
            {formatCurrency(comparison.current.total)}
          </Text>
          <Text style={[styles.expenseCount, { color: colors.textSecondary }]}>
            {comparison.current.expenses.length} gastos
          </Text>
        </View>

        {/* Indicador de cambio */}
        <View style={styles.changeIndicator}>
          <Ionicons
            name={getChangeIcon()}
            size={24}
            color={getChangeColor()}
          />
        </View>

        {/* Mes anterior */}
        <View style={[styles.periodCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>
            {comparison.previous.period}
          </Text>
          <Text style={[styles.periodAmount, { color: colors.textPrimary }]}>
            {formatCurrency(comparison.previous.total)}
          </Text>
          <Text style={[styles.expenseCount, { color: colors.textSecondary }]}>
            {comparison.previous.expenses.length} gastos
          </Text>
        </View>
      </View>

      {/* Resumen del cambio */}
      <View style={[styles.summaryContainer, { borderTopColor: colors.border }]}>
        <View style={styles.summaryRow}>
          <View style={styles.changeTextContainer}>
            <Ionicons
              name={getChangeIcon()}
              size={16}
              color={getChangeColor()}
              style={styles.changeIcon}
            />
            <Text style={[styles.changeLabel, { color: getChangeColor() }]}>
              {getChangeText()}
            </Text>
          </View>
          <Text style={[styles.percentageText, { color: getChangeColor() }]}>
            {Math.abs(comparison.percentageChange).toFixed(1)}%
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.differenceLabel, { color: colors.textSecondary }]}>
            Diferencia:
          </Text>
          <Text style={[
            styles.differenceAmount,
            { color: comparison.difference >= 0 ? colors.error : colors.success }
          ]}>
            {comparison.difference >= 0 ? "+" : ""}
            {formatCurrency(comparison.difference)}
          </Text>
        </View>

        {/* Análisis adicional */}
        <View style={styles.insightContainer}>
          <Text style={[styles.insightText, { color: colors.textSecondary }]}>
            {getInsightText(comparison)}
          </Text>
        </View>
      </View>
    </View>
  );
});

const getInsightText = (comparison: PeriodComparison): string => {
  const absChange = Math.abs(comparison.percentageChange);

  if (absChange < 5) {
    return "Tus gastos se mantienen estables comparado con el mes anterior.";
  } else if (comparison.percentageChange > 0) {
    if (absChange > 50) {
      return "Aumento significativo en gastos. Revisa las categorías que más crecieron.";
    } else if (absChange > 20) {
      return "Incremento considerable en gastos este mes.";
    } else {
      return "Ligero aumento en gastos comparado con el mes anterior.";
    }
  } else {
    if (absChange > 50) {
      return "¡Excelente! Has reducido significativamente tus gastos.";
    } else if (absChange > 20) {
      return "¡Muy bien! Notable reducción en gastos este mes.";
    } else {
      return "Buena gestión. Pequeña reducción en gastos.";
    }
  }
};

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
  periodsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  periodCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  periodLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  periodAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    marginBottom: 4,
  },
  expenseCount: {
    fontSize: FONT_SIZES.xs,
  },
  changeIndicator: {
    marginHorizontal: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  changeTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  changeIcon: {
    marginRight: 4,
  },
  changeLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  percentageText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
  },
  differenceLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
  },
  differenceAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: "700",
  },
  insightContainer: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: BORDER_RADIUS.sm,
  },
  insightText: {
    fontSize: FONT_SIZES.sm,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 18,
  },
  emptyState: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
});

export default MonthComparison;