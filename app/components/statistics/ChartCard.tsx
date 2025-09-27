import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { SPACING, FONT_SIZES, BORDER_RADIUS } from "../../constants/colors";
import { CategoryTotal } from "../../types";
import UniversalPieChart from "../shared/UniversalPieChart";

interface ChartCardProps {
  data: CategoryTotal[];
  title?: string;
  showFreeLabel?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({
  data,
  title = "Distribución por Categorías",
  showFreeLabel = true
}) => {
  const { colors } = useTheme();

  const freeLabelComponent = showFreeLabel ? (
    <View style={[styles.freeLabel, { backgroundColor: colors.success + "20" }]}>
      <Text style={[styles.freeLabelText, { color: colors.success }]}>Gratuito</Text>
    </View>
  ) : undefined;

  return (
    <UniversalPieChart
      data={data}
      title={title}
      showLegend={true}
      showPercentages={true}
      showSummary={false}
      height={200}
      actions={freeLabelComponent}
    />
  );
};

const styles = StyleSheet.create({
  freeLabel: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  freeLabelText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "600",
  },
});

export default ChartCard;