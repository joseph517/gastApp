import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from "../constants/colors";
import { CategoryTotal } from "../types";

interface PieChartProps {
  data: CategoryTotal[];
}

const { width } = Dimensions.get("window");
const chartSize = width * 0.5;

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Sin datos para mostrar</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <View style={styles.simplePieChart}>
          <Text style={styles.chartPlaceholder}>📊</Text>
          <View style={styles.centerContent}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
              }).format(data.reduce((sum, item) => sum + item.total, 0))}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.legend}>
        {data.slice(0, 5).map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: item.color }]}
            />
            <Text style={styles.legendText} numberOfLines={1}>
              {item.category}
            </Text>
            <Text style={styles.legendPercentage}>
              {item.percentage.toFixed(1)}%
            </Text>
          </View>
        ))}
        {data.length > 5 && (
          <Text style={styles.moreItems}>+{data.length - 5} más...</Text>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
  },
  emptyContainer: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: colors.textSecondary,
  },
  chartContainer: {
    position: "relative",
    marginBottom: SPACING.lg,
  },
  simplePieChart: {
    height: chartSize,
    width: chartSize,
    borderRadius: chartSize / 2,
    backgroundColor: colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  chartPlaceholder: {
    fontSize: 64,
    opacity: 0.3,
    position: "absolute",
  },
  centerContent: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -30 }],
    alignItems: "center",
  },
  totalLabel: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  legend: {
    width: "100%",
    maxWidth: 300,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
  },
  legendText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: colors.textPrimary,
    marginRight: SPACING.sm,
  },
  legendPercentage: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    minWidth: 40,
    textAlign: "right",
  },
  moreItems: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: SPACING.xs,
    fontStyle: "italic",
  },
});

export default PieChart;
