import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../../contexts/ThemeContext";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";
import { Expense } from "../../types";
import ExpenseCard from "../ExpenseCard";

interface RecentExpensesSectionProps {
  expenses: Expense[];
  onDeleteExpense: (expenseId: number) => void;
  onViewAll?: () => void;
}

const RecentExpensesSection: React.FC<RecentExpensesSectionProps> = ({
  expenses,
  onDeleteExpense,
  onViewAll,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.recentCard}>
      <View style={styles.recentHeader}>
        <Text style={styles.cardTitle}>Gastos Recientes</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllText}>Ver todos</Text>
          </TouchableOpacity>
        )}
      </View>

      {expenses.length > 0 ? (
        expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            onDelete={() => onDeleteExpense(expense.id)}
          />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="receipt-outline"
            size={48}
            color={colors.gray300}
          />
          <Text style={styles.emptyStateText}>
            No hay gastos registrados
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Toca el botón + para agregar tu primer gasto
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    recentCard: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      paddingTop: SPACING.lg,
      ...SHADOWS.small,
    },
    cardTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: SPACING.md,
      marginHorizontal: SPACING.md,
    },
    recentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SPACING.md,
      marginBottom: SPACING.sm,
    },
    viewAllText: {
      fontSize: FONT_SIZES.sm,
      color: colors.primary,
      fontWeight: "600",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: SPACING.xl,
      paddingHorizontal: SPACING.md,
    },
    emptyStateText: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.textSecondary,
      marginTop: SPACING.sm,
      textAlign: "center",
    },
    emptyStateSubtext: {
      fontSize: FONT_SIZES.sm,
      color: colors.textLight,
      marginTop: 4,
      textAlign: "center",
    },
  });

export default RecentExpensesSection;