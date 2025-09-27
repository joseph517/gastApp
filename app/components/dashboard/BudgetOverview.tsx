import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useExpenseStore } from "../../store/expenseStore";
import { BudgetStatus } from "../../types";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

interface BudgetOverviewProps {
  onPress?: () => void;
}

const BudgetOverview: React.FC<BudgetOverviewProps> = ({ onPress }) => {
  const { colors } = useTheme();
  const { activeBudget, getBudgetStatus, isPremium } = useExpenseStore();
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);

  useEffect(() => {
    loadBudgetStatus();
  }, [activeBudget]);

  const loadBudgetStatus = async () => {
    if (activeBudget && isPremium) {
      const status = await getBudgetStatus();
      setBudgetStatus(status);
    } else {
      setBudgetStatus(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = () => {
    if (!budgetStatus) return colors.textSecondary;

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
    if (!budgetStatus) return "wallet-outline";

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
    if (!budgetStatus) return "Configura tu presupuesto";

    if (budgetStatus.status === 'exceeded') {
      const excess = budgetStatus.spent - budgetStatus.budget.amount;
      return `Excedido por ${formatCurrency(excess)}`;
    }

    if (budgetStatus.status === 'warning') {
      return `${budgetStatus.percentage.toFixed(0)}% del presupuesto usado`;
    }

    return `${budgetStatus.percentage.toFixed(0)}% del presupuesto usado`;
  };

  const getProgressPercentage = () => {
    if (!budgetStatus) return 0;
    return Math.min(budgetStatus.percentage, 100);
  };

  if (!isPremium) {
    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.cardBackground }]}
        onPress={onPress}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="diamond" size={20} color={colors.accent} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Control de Presupuesto
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>

        <Text style={[styles.premiumMessage, { color: colors.textSecondary }]}>
          Función disponible en Premium
        </Text>

        <View style={styles.premiumActions}>
          <Text style={[styles.premiumCallToAction, { color: colors.accent }]}>
            Toca para más información
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (!activeBudget) {
    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.cardBackground }]}
        onPress={onPress}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Presupuesto
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>

        <Text style={[styles.noBudgetMessage, { color: colors.textSecondary }]}>
          No hay presupuesto activo
        </Text>

        <View style={styles.createActions}>
          <Text style={[styles.createCallToAction, { color: colors.primary }]}>
            Toca para crear un presupuesto
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons
            name={getStatusIcon()}
            size={20}
            color={getStatusColor()}
          />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Presupuesto Mensual
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>

      {budgetStatus && (
        <>
          <View style={styles.budgetInfo}>
            <View style={styles.amountRow}>
              <Text style={[styles.spent, { color: colors.textPrimary }]}>
                {formatCurrency(budgetStatus.spent)}
              </Text>
              <Text style={[styles.total, { color: colors.textSecondary }]}>
                de {formatCurrency(budgetStatus.budget.amount)}
              </Text>
            </View>

            <Text style={[styles.statusMessage, { color: getStatusColor() }]}>
              {getStatusMessage()}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: getStatusColor(),
                    width: `${getProgressPercentage()}%`,
                  },
                ]}
              />
            </View>
          </View>

          {budgetStatus.daysRemaining > 0 && (
            <View style={styles.dailyInfo}>
              <Text style={[styles.dailyText, { color: colors.textSecondary }]}>
                Puedes gastar {formatCurrency(budgetStatus.recommendedDailyLimit)} por día
                ({budgetStatus.daysRemaining} días restantes)
              </Text>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
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
    marginBottom: SPACING.sm,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  budgetInfo: {
    marginBottom: SPACING.sm,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: SPACING.xs,
  },
  spent: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    marginRight: SPACING.xs,
  },
  total: {
    fontSize: FONT_SIZES.md,
    fontWeight: "500",
  },
  statusMessage: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  progressContainer: {
    marginBottom: SPACING.sm,
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
  dailyInfo: {
    marginTop: SPACING.xs,
  },
  dailyText: {
    fontSize: FONT_SIZES.xs,
    fontStyle: "italic",
    textAlign: "center",
  },
  premiumMessage: {
    fontSize: FONT_SIZES.sm,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  premiumActions: {
    alignItems: "center",
  },
  premiumCallToAction: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  noBudgetMessage: {
    fontSize: FONT_SIZES.sm,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  createActions: {
    alignItems: "center",
  },
  createCallToAction: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
});

export default BudgetOverview;