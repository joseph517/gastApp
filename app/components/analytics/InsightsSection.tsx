import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import InsightCard, { InsightData } from "./InsightCard";
import { SPACING, FONT_SIZES } from "../../constants/colors";

interface InsightsSectionProps {
  insights: InsightData[];
  title?: string;
}

const InsightsSection: React.FC<InsightsSectionProps> = React.memo(
  ({ insights, title = "Insights Automáticos" }) => {
    const { colors } = useTheme();

    if (insights.length === 0) {
      return null;
    }

    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {insights.map((insight, index) => (
            <View key={index} style={styles.cardContainer}>
              <InsightCard insight={insight} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    marginBottom: SPACING.sm,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingRight: SPACING.md,
  },
  cardContainer: {
    width: 160,
    marginRight: SPACING.xs,
  },
});

export default InsightsSection;
