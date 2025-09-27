import React from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useTheme } from "../../contexts/ThemeContext";
import { TimelineData } from "../../hooks/useAnalytics";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

interface TimelineChartProps {
  data: TimelineData[];
  title?: string;
  height?: number;
  timelineRange?: 7 | 15 | 30;
  onRangeChange?: (range: 7 | 15 | 30) => void;
}

const TimelineChart: React.FC<TimelineChartProps> = React.memo(({
  data,
  title = "Evolución de Gastos",
  height = 200,
  timelineRange = 15,
  onRangeChange
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

  // Preparar datos para el gráfico - Optimizar labels según el rango
  const getOptimizedLabels = () => {
    if (timelineRange === 30) {
      // Para 30 días, mostrar solo cada 3 días
      return data.map((item, index) => index % 3 === 0 ? item.label : '');
    } else if (timelineRange === 15) {
      // Para 15 días, mostrar cada 2 días
      return data.map((item, index) => index % 2 === 0 ? item.label : '');
    } else {
      // Para 7 días, mostrar todos
      return data.map(item => item.label);
    }
  };

  const chartData = {
    labels: getOptimizedLabels(),
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
      r: timelineRange === 30 ? "2" : "4",
      strokeWidth: timelineRange === 30 ? "1" : "2",
      stroke: colors.primary,
      fill: colors.background,
    },
    propsForBackgroundLines: {
      stroke: colors.border,
      strokeWidth: 1,
      strokeOpacity: 0.5,
    },
    propsForLabels: {
      fontSize: timelineRange === 30 ? 8 : 10,
    },
    propsForHorizontalLabels: {
      fontSize: timelineRange === 30 ? 8 : 10,
    },
    paddingRight: timelineRange === 30 ? 40 : 20,
    paddingLeft: timelineRange === 30 ? 20 : 15,
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

      {/* Selector de rango */}
      {onRangeChange && (
        <View style={styles.rangeSelector}>
          {[7, 15, 30].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.rangeButton,
                timelineRange === range && [styles.activeRangeButton, { backgroundColor: colors.primary }]
              ]}
              onPress={() => onRangeChange(range as 7 | 15 | 30)}
            >
              <Text
                style={[
                  styles.rangeButtonText,
                  { color: timelineRange === range ? colors.background : colors.textSecondary }
                ]}
              >
                {range}d
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {timelineRange === 30 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          <LineChart
            data={chartData}
            width={screenWidth * 1.5}
            height={height}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withDots={false}
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
        </ScrollView>
      ) : (
        <LineChart
          data={chartData}
          width={screenWidth - (SPACING.md * 2) - 10}
          height={height}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withDots={timelineRange <= 15}
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
      )}

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
  rangeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: SPACING.md,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    alignItems: "center",
    borderRadius: BORDER_RADIUS.sm,
    marginHorizontal: 2,
  },
  activeRangeButton: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  rangeButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  chart: {
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: "center",
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
  scrollContainer: {
    marginVertical: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.sm,
  },
});

export default TimelineChart;