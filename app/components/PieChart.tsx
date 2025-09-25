import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Text as SvgText } from "react-native-svg";
import { useTheme } from "../contexts/ThemeContext";
import { SPACING, FONT_SIZES, BORDER_RADIUS } from "../constants/colors";
import { CategoryTotal } from "../types";

interface PieChartProps {
  data: CategoryTotal[];
}

const { width } = Dimensions.get("window");
const chartSize = width * 0.5;

// Funciones helper para calcular el gráfico de torta
const createPieSlice = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    cx,
    cy,
    "L",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "Z",
  ].join(" ");
};

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const prepareChartData = (data: CategoryTotal[]) => {
  // Filtrar datos con valores > 0 y ordenar por total descendente
  const validData = data.filter((item) => item.total > 0);
  const sortedData = validData.sort((a, b) => b.total - a.total);

  // Mostrar máximo 6 categorías, agrupar el resto en "Otros"
  if (sortedData.length > 6) {
    const topCategories = sortedData.slice(0, 5);
    const otherCategories = sortedData.slice(5);
    const othersTotal = otherCategories.reduce(
      (sum, item) => sum + item.total,
      0
    );
    const othersPercentage = otherCategories.reduce(
      (sum, item) => sum + item.percentage,
      0
    );

    topCategories.push({
      category: "Otros",
      total: othersTotal,
      color: "#95A5A6",
      percentage: othersPercentage,
      count: otherCategories.reduce((sum, item) => sum + item.count, 0),
    });

    return topCategories;
  }

  return sortedData;
};

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

  const chartData = prepareChartData(data);
  const totalAmount = chartData.reduce((sum, item) => sum + item.total, 0);

  // Calcular ángulos para cada segmento
  let currentAngle = 0;
  const segments = chartData.map((item) => {
    const angle = (item.percentage / 100) * 360;
    const segment = {
      ...item,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      angle: angle,
    };
    currentAngle += angle;
    return segment;
  });

  const radius = chartSize * 0.35;
  const centerX = chartSize / 2;
  const centerY = chartSize / 2;

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg height={chartSize} width={chartSize} style={styles.svgChart}>
          {segments.map((segment, index) => {
            // Solo renderizar segmentos con ángulo > 1 grado para evitar segmentos invisibles
            if (segment.angle < 1) return null;

            const pathData = createPieSlice(
              centerX,
              centerY,
              radius,
              segment.startAngle,
              segment.endAngle
            );

            return (
              <Path
                key={`${segment.category}-${index}`}
                d={pathData}
                fill={segment.color}
                stroke={colors.surface}
                strokeWidth={2}
              />
            );
          })}
        </Svg>
      </View>

      <View style={styles.legend}>
        {chartData.map((item, index) => (
          <View
            key={`legend-${item.category}-${index}`}
            style={styles.legendItem}
          >
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
      </View>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
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
      alignItems: "center",
      justifyContent: "center",
    },
    svgChart: {
      backgroundColor: "transparent",
    },
    centerContent: {
      position: "absolute",
      top: "50%",
      left: "50%",
      alignItems: "center",
      justifyContent: "center",
      transform: [{ translateX: -chartSize * 0.15 }, { translateY: -20 }],
      minWidth: chartSize * 0.3,
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
