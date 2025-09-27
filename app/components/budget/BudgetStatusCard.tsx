import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { BudgetStatus } from "../../types";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

interface BudgetStatusCardProps {
  budgetStatus: BudgetStatus;
}

const BudgetStatusCard: React.FC<BudgetStatusCardProps> = ({ budgetStatus }) => {
  const { colors } = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = () => {
    switch (budgetStatus.status) {
      case 'exceeded':
        return colors.error;
      case 'warning':
        return colors.warning;
      default:
        return colors.success;
    }
  };

  const getStatusIcon = () => {
    switch (budgetStatus.status) {
      case 'exceeded':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      default:
        return 'checkmark-circle';
    }
  };

  const getStatusMessage = () => {
    if (budgetStatus.status === 'exceeded') {
      const excess = budgetStatus.spent - budgetStatus.budget.amount;
      return `Has excedido tu presupuesto por ${formatCurrency(excess)}`;
    }

    if (budgetStatus.status === 'warning') {
      return `Te estás acercando a tu límite de presupuesto`;
    }

    if (budgetStatus.daysRemaining === 0) {
      return `¡Felicidades! Has completado el mes dentro del presupuesto`;
    }

    return `Vas bien con tu presupuesto este mes`;
  };

  const getRecommendation = () => {
    if (budgetStatus.status === 'exceeded') {
      return "Considera revisar tus gastos y ajustar el presupuesto para el próximo mes.";
    }

    if (budgetStatus.status === 'warning') {
      if (budgetStatus.daysRemaining > 0) {
        return `Puedes gastar hasta ${formatCurrency(budgetStatus.recommendedDailyLimit)} por día para mantenerte dentro del presupuesto.`;
      }
      return "Trata de reducir los gastos en los días restantes.";
    }

    if (budgetStatus.daysRemaining > 0) {
      return `Puedes gastar hasta ${formatCurrency(budgetStatus.recommendedDailyLimit)} por día para el resto del mes.`;
    }

    return "¡Excelente control de gastos este mes!";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.header}>
        <View style={styles.statusIndicator}>
          <Ionicons
            name={getStatusIcon()}
            size={24}
            color={getStatusColor()}
          />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {budgetStatus.status === 'exceeded' ? 'Excedido' :
             budgetStatus.status === 'warning' ? 'Cuidado' : 'En control'}
          </Text>
        </View>
        <Text style={[styles.percentage, { color: getStatusColor() }]}>
          {budgetStatus.percentage.toFixed(1)}%
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: getStatusColor(),
                width: `${Math.min(budgetStatus.percentage, 100)}%`,
              },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            Gastado: {formatCurrency(budgetStatus.spent)}
          </Text>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            Límite: {formatCurrency(budgetStatus.budget.amount)}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Restante
          </Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {formatCurrency(Math.max(0, budgetStatus.remaining))}
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Días restantes
          </Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {budgetStatus.daysRemaining}
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Promedio diario
          </Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {formatCurrency(budgetStatus.averageDailySpending)}
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Proyección total
          </Text>
          <Text style={[styles.statValue, { color: getStatusColor() }]}>
            {formatCurrency(budgetStatus.projectedTotal)}
          </Text>
        </View>
      </View>

      {/* Status Message */}
      <View style={[styles.messageContainer, { borderTopColor: colors.border }]}>
        <Text style={[styles.statusMessage, { color: colors.textPrimary }]}>
          {getStatusMessage()}
        </Text>
        <Text style={[styles.recommendation, { color: colors.textSecondary }]}>
          {getRecommendation()}
        </Text>
      </View>
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
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  percentage: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
  },
  progressContainer: {
    marginBottom: SPACING.lg,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
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
    fontSize: FONT_SIZES.sm,
    fontWeight: "700",
    textAlign: "center",
  },
  messageContainer: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  statusMessage: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  recommendation: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default BudgetStatusCard;