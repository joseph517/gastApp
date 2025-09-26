import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, ThemeColors } from "../../contexts/ThemeContext";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";
import { CategoryTotal } from "../../types";
import PieChart from "../PieChart";

interface ChartSectionProps {
  data: CategoryTotal[];
  title?: string;
}

const ChartSection: React.FC<ChartSectionProps> = ({
  data,
  title = "Gastos por Categoría"
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      <PieChart data={data} />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    chartCard: {
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
  });

export default ChartSection;