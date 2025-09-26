import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../../contexts/ThemeContext";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";
import { StatisticsData } from "../../hooks/useStatistics";

interface StatsCardProps {
  stats: StatisticsData;
  formatCurrency: (amount: number) => string;
}

const StatsCard: React.FC<StatsCardProps> = ({ stats, formatCurrency }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.statsCard}>
      <Text style={styles.cardTitle}>Resumen del Mes</Text>
      <View style={styles.basicStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(stats.total)}</Text>
          <Text style={styles.statLabel}>Total gastado</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.expenseCount}</Text>
          <Text style={styles.statLabel}>Gastos registrados</Text>
        </View>
      </View>
      <View style={styles.changeIndicator}>
        <Ionicons
          name={stats.percentageChange >= 0 ? "trending-up" : "trending-down"}
          size={16}
          color={stats.percentageChange >= 0 ? colors.error : colors.success}
        />
        <Text
          style={[
            styles.changeText,
            {
              color:
                stats.percentageChange >= 0 ? colors.error : colors.success,
            },
          ]}
        >
          {Math.abs(stats.percentageChange).toFixed(1)}% vs mes anterior
        </Text>
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
    cardTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: SPACING.md,
    },
    basicStats: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.md,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
    },
    statValue: {
      fontSize: FONT_SIZES.xl,
      fontWeight: "700",
      color: colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
      textAlign: "center",
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.gray200,
      marginHorizontal: SPACING.md,
    },
    changeIndicator: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: colors.gray200,
    },
    changeText: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "600",
      marginLeft: 4,
    },
  });

export default StatsCard;