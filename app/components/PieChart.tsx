import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import { useTheme } from "../contexts/ThemeContext";
import { SPACING, FONT_SIZES, BORDER_RADIUS } from "../constants/colors";
import { CategoryTotal } from "../types";

interface PieChartProps {
  data: CategoryTotal[];
}

const { width } = Dimensions.get("window");
const chartSize = Math.min(width * 0.8, 280);

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
            if (segment.angle < 1) return null;

            const pathData = createPieSlice(
              centerX,
              centerY,
              radius,
              segment.startAngle,
              segment.endAngle
            );

            const midAngle = (segment.startAngle + segment.endAngle) / 2;
            const labelRadius = radius * 0.55;
            const labelPos = polarToCartesian(
              centerX,
              centerY,
              labelRadius,
              midAngle
            );

            return (
              <React.Fragment key={`${segment.category}-${index}`}>
                <Path
                  d={pathData}
                  fill={segment.color}
                  stroke={colors.surface}
                  strokeWidth={2}
                />
                {segment.angle > 15 && (
                  <SvgText
                    x={labelPos.x - 2}
                    y={labelPos.y}
                    fill={colors.textOnPrimary || "#fff"}
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {`${segment.percentage.toFixed(0)}%`}
                  </SvgText>
                )}
              </React.Fragment>
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
    legend: {
      width: "100%",
      maxWidth: 320,
      paddingHorizontal: SPACING.md,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginVertical: SPACING.xs,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border || "#e0e0e0",
      paddingBottom: SPACING.xs,
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
      fontWeight: "700",
      color: colors.textSecondary,
      minWidth: 40,
      textAlign: "right",
    },
  });

export default PieChart;
