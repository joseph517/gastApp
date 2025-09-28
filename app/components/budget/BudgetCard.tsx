import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { Budget, BudgetStatus } from "../../types";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

interface BudgetCardProps {
  budget: Budget;
  budgetStatus: BudgetStatus | null;
  isHistorical?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  budgetStatus,
  isHistorical = false,
  onEdit,
  onDelete,
}) => {
  const { colors } = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPeriod = (period: string) => {
    const periodLabels = {
      'weekly': 'Semanal',
      'monthly': 'Mensual',
      'quarterly': 'Trimestral',
      'custom': 'Personalizado'
    };
    return periodLabels[period] || 'Mensual';
  };

  const getPeriodIcon = (period: string) => {
    const periodIcons = {
      'weekly': 'calendar-outline',
      'monthly': 'calendar',
      'quarterly': 'calendar-sharp',
      'custom': 'create-outline'
    };
    return periodIcons[period] || 'calendar';
  };

  const getStatusColor = () => {
    if (!budgetStatus || isHistorical) return colors.textSecondary;

    switch (budgetStatus.status) {
      case 'exceeded':
        return colors.error;
      case 'warning':
        return colors.warning;
      default:
        return colors.success;
    }
  };

  const getProgressPercentage = () => {
    if (!budgetStatus || isHistorical) return 0;
    return Math.min(budgetStatus.percentage, 100);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Ionicons
              name={getPeriodIcon(budget.period) as any}
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Presupuesto {formatPeriod(budget.period)}
            </Text>
          </View>
          <Text style={[styles.amount, { color: colors.primary }]}>
            {formatCurrency(budget.amount)}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
            <Ionicons name="trash" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dateRange}>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
          {formatDate(budget.startDate)} - {formatDate(budget.endDate || new Date().toISOString().split('T')[0])}
        </Text>
        {budget.isActive && (
          <View style={[styles.activeBadge, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.activeBadgeText, { color: colors.success }]}>Activo</Text>
          </View>
        )}
        {isHistorical && (
          <View style={[styles.activeBadge, { backgroundColor: colors.textSecondary + '20' }]}>
            <Text style={[styles.activeBadgeText, { color: colors.textSecondary }]}>Finalizado</Text>
          </View>
        )}
      </View>

      {budgetStatus && !isHistorical && (
        <>
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                Gastado: {formatCurrency(budgetStatus.spent)}
              </Text>
              <Text style={[styles.progressPercentage, { color: getStatusColor() }]}>
                {budgetStatus.percentage.toFixed(1)}%
              </Text>
            </View>

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

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Restante
              </Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {formatCurrency(Math.max(0, budgetStatus.remaining))}
              </Text>
            </View>

            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Días restantes
              </Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {budgetStatus.daysRemaining}
              </Text>
            </View>

            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Promedio/día
              </Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {formatCurrency(budgetStatus.averageDailySpending)}
              </Text>
            </View>
          </View>
        </>
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
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  amount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  dateRange: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  dateText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
  },
  activeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  activeBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "600",
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
  },
  progressPercentage: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "700",
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
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
    marginBottom: 4,
    textAlign: "center",
  },
  statValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default BudgetCard;