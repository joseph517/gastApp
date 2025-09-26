import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useTheme } from "../../contexts/ThemeContext";
import { CategoryTotal } from "../../types";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";

interface CategoryChartProps {
  data: CategoryTotal[];
  title?: string;
  showLegend?: boolean;
  showPercentages?: boolean;
}

const CategoryChart: React.FC<CategoryChartProps> = ({
  data,
  title = "Distribución por Categorías",
  showLegend = true,
  showPercentages = true
}) => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get("window").width;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
        {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}
        <View style={styles.emptyState}>
          <Ionicons name="pie-chart-outline" size={48} color={colors.gray300} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay datos para mostrar
          </Text>
        </View>
      </View>
    );
  }

  const total = data.reduce((sum, item) => sum + item.total, 0);

  // Colores predefinidos para las categorías
  const categoryColors = [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.warning,
    colors.error,
    colors.success,
    "#8E24AA", // Púrpura
    "#FF7043", // Naranja profundo
    "#26A69A", // Teal
    "#AB47BC", // Púrpura claro
  ];

  // Preparar datos para el gráfico
  const chartData = data.map((item, index) => ({
    name: item.categoryName,
    population: item.total,
    color: categoryColors[index % categoryColors.length],
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));

  const chartConfig = {
    backgroundGradientFrom: colors.cardBackground,
    backgroundGradientTo: colors.cardBackground,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.textSecondary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPercentage = (amount: number) => {
    return total > 0 ? ((amount / total) * 100).toFixed(1) : "0.0";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}

      <View style={styles.chartContainer}>
        <PieChart
          data={chartData}
          width={screenWidth - (SPACING.md * 2) - 40}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 0]}
          absolute={false}
        />
      </View>

      {showLegend && (
        <View style={styles.legendContainer}>
          {data.map((item, index) => (
            <View key={item.categoryName} style={styles.legendItem}>
              <View style={styles.legendRow}>
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: categoryColors[index % categoryColors.length] }
                  ]}
                />
                <Text style={[styles.categoryName, { color: colors.textPrimary }]}>
                  {item.categoryName}
                </Text>
                <View style={styles.amountContainer}>
                  <Text style={[styles.amount, { color: colors.textPrimary }]}>
                    {formatCurrency(item.total)}
                  </Text>
                  {showPercentages && (
                    <Text style={[styles.percentage, { color: colors.textSecondary }]}>
                      ({getPercentage(item.total)}%)
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.summaryContainer, { borderTopColor: colors.border }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Total gastado:
          </Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>
            {formatCurrency(total)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Categorías activas:
          </Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
            {data.length}
          </Text>
        </View>
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
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  legendContainer: {
    marginTop: SPACING.sm,
  },
  legendItem: {
    marginBottom: SPACING.xs,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  categoryName: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  percentage: {
    fontSize: FONT_SIZES.xs,
    fontStyle: "italic",
  },
  summaryContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "700",
  },
  emptyState: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
});

export default CategoryChart;