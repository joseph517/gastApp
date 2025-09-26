import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, ThemeColors } from "../../contexts/ThemeContext";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";
import PieChart from "../PieChart";

interface ChartCardProps {
  data: any[];
  title?: string;
  showFreeLabel?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({
  data,
  title = "Distribución por Categorías",
  showFreeLabel = true
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {showFreeLabel && (
          <View style={styles.freeLabel}>
            <Text style={styles.freeLabelText}>Gratuito</Text>
          </View>
        )}
      </View>
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
    chartHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.md,
    },
    cardTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    freeLabel: {
      backgroundColor: colors.success + "20",
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.sm,
    },
    freeLabelText: {
      fontSize: FONT_SIZES.xs,
      color: colors.success,
      fontWeight: "600",
    },
  });

export default ChartCard;