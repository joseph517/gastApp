import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../../contexts/ThemeContext";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/colors";
import { PendingRecurringExpense } from "../../types";
import {
  formatCurrency,
  formatDateShort,
} from "../../utils/recurringExpensesUtils";

interface PendingExpenseCardProps {
  expense: PendingRecurringExpense;
  isOverdue: boolean;
  daysOverdue?: number;
  onConfirm: (id: number, amount: number) => Promise<void>;
  onSkip: (id: number) => Promise<void>;
}

const PendingExpenseCard: React.FC<PendingExpenseCardProps> = ({
  expense,
  isOverdue,
  daysOverdue,
  onConfirm,
  onSkip,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [isEditing, setIsEditing] = useState(false);
  const [editedAmount, setEditedAmount] = useState(expense.amount.toString());
  const [isLoading, setIsLoading] = useState(false);

  const handleAmountChange = (text: string) => {
    const numericText = text.replace(/[^0-9.]/g, "");
    const parts = numericText.split(".");
    if (parts.length > 2) return;
    setEditedAmount(numericText);
  };

  const handleConfirm = async () => {
    if (!expense.id) return;

    const finalAmount = parseFloat(editedAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      Alert.alert("Error", "Ingresa un monto válido");
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(expense.id, finalAmount);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!expense.id) return;

    Alert.alert(
      "Omitir Gasto",
      `¿Estás seguro de omitir "${expense.description}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Omitir",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await onSkip(expense.id!);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.card, isOverdue && styles.overdueCard]}>
      {/* Badge de estado */}
      <View style={styles.statusBadgeContainer}>
        <View style={[styles.statusBadge, isOverdue ? styles.overdueBadge : styles.todayBadge]}>
          <Ionicons
            name={isOverdue ? "alert-circle" : "time-outline"}
            size={14}
            color={colors.background}
          />
          <Text style={styles.statusText}>
            {isOverdue
              ? `Vencido ${daysOverdue ? `hace ${daysOverdue}d` : ""}`
              : "Para hoy"}
          </Text>
        </View>
      </View>

      {/* Información del gasto */}
      <View style={styles.infoSection}>
        <Text style={styles.description}>{expense.description}</Text>
        <Text style={styles.category}>📂 {expense.category}</Text>
        <Text style={styles.date}>📅 {formatDateShort(expense.scheduledDate)}</Text>
      </View>

      {/* Monto editable */}
      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Monto:</Text>
        {isEditing ? (
          <View style={styles.amountEditContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={editedAmount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              autoFocus
            />
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(false)}
            >
              <Ionicons name="checkmark" size={20} color={colors.success} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.amountDisplayContainer}>
            <Text style={styles.amount}>{formatCurrency(parseFloat(editedAmount))}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Botones de acción */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.skipButton]}
          onPress={handleSkip}
          disabled={isLoading}
        >
          <Ionicons name="close-circle-outline" size={20} color={colors.background} />
          <Text style={styles.actionButtonText}>Omitir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.confirmButton]}
          onPress={handleConfirm}
          disabled={isLoading}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.background} />
          <Text style={styles.actionButtonText}>
            {isLoading ? "Guardando..." : "Pagado"}
          </Text>
        </TouchableOpacity>
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
      ...SHADOWS.medium,
    },
    overdueCard: {
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    statusBadgeContainer: {
      marginBottom: SPACING.sm,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.md,
      alignSelf: "flex-start",
      gap: 4,
    },
    todayBadge: {
      backgroundColor: colors.primary,
    },
    overdueBadge: {
      backgroundColor: colors.error,
    },
    statusText: {
      fontSize: FONT_SIZES.xs,
      fontWeight: "600",
      color: colors.background,
    },
    infoSection: {
      marginBottom: SPACING.md,
      gap: 4,
    },
    description: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: SPACING.xs,
    },
    category: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
    },
    date: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
    },
    amountSection: {
      backgroundColor: colors.surface,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.md,
    },
    amountLabel: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
      marginBottom: SPACING.xs,
    },
    amountDisplayContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    amountEditContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    amount: {
      fontSize: FONT_SIZES.xl,
      fontWeight: "700",
      color: colors.error,
    },
    currencySymbol: {
      fontSize: FONT_SIZES.xl,
      fontWeight: "700",
      color: colors.error,
      marginRight: SPACING.xs,
    },
    amountInput: {
      flex: 1,
      fontSize: FONT_SIZES.xl,
      fontWeight: "700",
      color: colors.textPrimary,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
      paddingVertical: SPACING.xs,
    },
    editButton: {
      padding: SPACING.xs,
    },
    actionsContainer: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      gap: SPACING.xs,
    },
    skipButton: {
      backgroundColor: colors.warning,
    },
    confirmButton: {
      backgroundColor: colors.success,
    },
    actionButtonText: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.background,
    },
  });

export default PendingExpenseCard;
