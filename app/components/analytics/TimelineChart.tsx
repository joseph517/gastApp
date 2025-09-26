import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useTheme } from "../../contexts/ThemeContext";
import { TimelineData } from "../../hooks/useAnalytics";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

interface TimelineChartProps {
  data: TimelineData[];
  title?: string;
  height?: number;
}

const TimelineChart: React.FC<TimelineChartProps> = React.memo(({
  data,
  title = "Evolución de Gastos (15 días)",
  height = 200
}) => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get("window").width;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
        {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay datos suficientes para mostrar el gráfico
          </Text>
        </View>
      </View>
    );
  }

  // Preparar datos para el gráfico
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => item.amount),
        color: (opacity = 1) => colors.primary,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: colors.cardBackground,
    backgroundGradientTo: colors.cardBackground,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.textSecondary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: "4",
      strokeWidth: "1",
      stroke: colors.primary,
      fill: colors.primary,
    },
    propsForBackgroundLines: {
      stroke: colors.border,
      strokeWidth: 1,
      strokeOpacity: 0.3,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  // Calcular estadísticas básicas
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
  const averageDaily = totalAmount / data.length;
  const maxAmount = Math.max(...data.map(item => item.amount));
  const minAmount = Math.min(...data.map(item => item.amount));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}

      <LineChart
        data={chartData}
        width={screenWidth - (SPACING.md * 2) - 20}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withDots={true}
        withShadow={false}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
        segments={4}
        formatYLabel={(value) => {
          const num = parseFloat(value);
          if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
          if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
          return num.toFixed(0);
        }}
        fromZero={true}
      />

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Promedio diario
          </Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {formatCurrency(averageDaily)}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Día más alto
          </Text>
          <Text style={[styles.statValue, { color: colors.error }]}>
            {formatCurrency(maxAmount)}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total período
          </Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {formatCurrency(totalAmount)}
          </Text>
        </View>
      </View>
    </View>
  );
});

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
  chart: {
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
    marginBottom: 4,
  },
  statValue: {
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
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default TimelineChart;