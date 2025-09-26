import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../../contexts/ThemeContext";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";
import { Period } from "../../types";
import { DashboardStats } from "../../hooks/useDashboard";

interface PeriodStatsCardProps {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
  periodStats: DashboardStats;
  formatCurrency: (amount: number) => string;
  getPeriodLabel: () => string;
}

const PeriodStatsCard: React.FC<PeriodStatsCardProps> = ({
  selectedPeriod,
  onPeriodChange,
  periodStats,
  formatCurrency,
  getPeriodLabel,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const periods: { key: Period; label: string }[] = [
    { key: "week", label: "Semana" },
    { key: "month", label: "Mes" },
    { key: "year", label: "Año" },
  ];

  return (
    <View style={styles.statsCard}>
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.activePeriodButton,
            ]}
            onPress={() => onPeriodChange(period.key)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.activePeriodButtonText,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>{getPeriodLabel()}</Text>
        <Text style={styles.totalAmount}>
          {formatCurrency(periodStats.total)}
        </Text>
        <View style={styles.changeContainer}>
          <Ionicons
            name={
              periodStats.percentageChange >= 0
                ? "trending-up"
                : "trending-down"
            }
            size={16}
            color={
              periodStats.percentageChange >= 0
                ? colors.error
                : colors.success
            }
          />
          <Text
            style={[
              styles.changeText,
              {
                color:
                  periodStats.percentageChange >= 0
                    ? colors.error
                    : colors.success,
              },
            ]}
          >
            {Math.abs(periodStats.percentageChange).toFixed(1)}% vs período
            anterior
          </Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    statsCard: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      ...SHADOWS.small,
    },
    periodSelector: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: 4,
      marginBottom: SPACING.lg,
    },
    periodButton: {
      flex: 1,
      paddingVertical: SPACING.sm,
      alignItems: "center",
      borderRadius: BORDER_RADIUS.md,
    },
    activePeriodButton: {
      backgroundColor: colors.primary,
    },
    periodButtonText: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    activePeriodButtonText: {
      color: colors.background,
    },
    totalContainer: {
      alignItems: "center",
    },
    totalLabel: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    totalAmount: {
      fontSize: FONT_SIZES.xxxl,
      fontWeight: "800",
      color: colors.textPrimary,
      marginBottom: SPACING.sm,
    },
    changeContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    changeText: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "600",
      marginLeft: 4,
    },
  });

export default PeriodStatsCard;