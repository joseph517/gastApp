import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../../contexts/ThemeContext";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/colors";
import { RecurringExpense } from "../../types";
import {
  formatCurrency,
  formatDateShort,
  getFrequencyLabel,
} from "../../utils/recurringExpensesUtils";

interface RecurringExpenseCardProps {
  expense: RecurringExpense;
  onToggleActive: (expense: RecurringExpense) => void;
  onDelete: (expense: RecurringExpense) => void;
}

const RecurringExpenseCard: React.FC<RecurringExpenseCardProps> = ({
  expense,
  onToggleActive,
  onDelete,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[styles.card, !expense.isActive && styles.pausedCard]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <View style={styles.titleWithStatus}>
            <Text style={styles.cardTitle}>{expense.description}</Text>
            <View
              style={[
                styles.statusBadge,
                expense.isActive ? styles.activeBadge : styles.pausedBadge,
              ]}
            >
              <Ionicons
                name={expense.isActive ? "checkmark-circle" : "pause-circle"}
                size={14}
                color={colors.background}
              />
              <Text style={styles.statusText}>
                {expense.isActive ? "Activo" : "Pausado"}
              </Text>
            </View>
          </View>
          <Text style={styles.cardAmount}>
            {formatCurrency(expense.amount)}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              expense.isActive ? styles.pauseButton : styles.resumeButton,
            ]}
            onPress={() => onToggleActive(expense)}
          >
            <Ionicons
              name={expense.isActive ? "pause" : "play"}
              size={16}
              color={colors.background}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => onDelete(expense)}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={colors.background}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.cardCategory}>📂 {expense.category}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.frequencyText}>
          🔄 {getFrequencyLabel(expense.intervalDays, expense.executionDates)}
        </Text>
        <Text style={styles.nextDateText}>
          📅 Próximo: {formatDateShort(expense.nextDueDate)}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.cardBackground,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      marginBottom: SPACING.md,
      ...SHADOWS.small,
    },
    pausedCard: {
      opacity: 0.7,
      borderLeftWidth: 4,
      borderLeftColor: colors.textSecondary,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: SPACING.sm,
    },
    cardTitleContainer: {
      flex: 1,
      marginRight: SPACING.sm,
    },
    titleWithStatus: {
      marginBottom: SPACING.xs,
    },
    cardTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: SPACING.xs,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.md,
      alignSelf: "flex-start",
      gap: 4,
    },
    activeBadge: {
      backgroundColor: colors.success,
    },
    pausedBadge: {
      backgroundColor: colors.textSecondary,
    },
    statusText: {
      fontSize: FONT_SIZES.xs,
      fontWeight: "600",
      color: colors.background,
    },
    cardAmount: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "600",
      color: colors.error,
    },
    cardActions: {
      flexDirection: "row",
      gap: SPACING.xs,
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: BORDER_RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
    },
    pauseButton: {
      backgroundColor: colors.warning,
    },
    resumeButton: {
      backgroundColor: colors.success,
    },
    deleteButton: {
      backgroundColor: colors.error,
    },
    cardCategory: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
      marginBottom: SPACING.sm,
    },
    cardFooter: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: SPACING.sm,
      gap: 4,
    },
    frequencyText: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
    },
    nextDateText: {
      fontSize: FONT_SIZES.sm,
      color: colors.primary,
      fontWeight: "600",
    },
  });

export default RecurringExpenseCard;