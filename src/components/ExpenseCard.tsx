import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  SHADOWS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
} from "../constants/colors";
import { Expense } from "../types";

interface ExpenseCardProps {
  expense: Expense;
  onPress?: () => void;
  onDelete?: () => void;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  onPress,
  onDelete,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.leftSection}>
        <View style={styles.categoryIcon}>
          <Text style={styles.categoryText}>{expense.category}</Text>
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.description} numberOfLines={1}>
            {expense.description}
          </Text>
          <Text style={styles.date}>{formatDate(expense.date)}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
        {onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...SHADOWS.small,
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  categoryText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "600",
    color: COLORS.primary,
  },
  expenseInfo: {
    flex: 1,
  },
  description: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  date: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  amount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: COLORS.error,
    marginBottom: 4,
  },
  deleteButton: {
    padding: 4,
  },
});

export default ExpenseCard;
