import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExpenseStore } from "../store/expenseStore";
import { useTheme, ThemeColors } from "../contexts/ThemeContext";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../constants/colors";
import { useStatistics } from "../hooks/useStatistics";
import StatsCard from "../components/statistics/StatsCard";
import ChartCard from "../components/statistics/ChartCard";
import PremiumSection from "../components/statistics/PremiumSection";
import PremiumUpgradeModal from "../components/PremiumUpgradeModal";
import { StatisticsScreenProps } from "../types/statistics";
import { Ionicons } from "@expo/vector-icons";

const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isPremium, upgradeToPremium } = useExpenseStore();
  const { monthlyTotals, stats, formatCurrency } = useStatistics();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgradePress = () => {
    setShowUpgradeModal(true);
  };

  const handleUpgradeSuccess = async () => {
    await upgradeToPremium();
  };

  const styles = createStyles(colors, insets);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Estadísticas</Text>
          <Text style={styles.subtitle}>
            {isPremium ? "Premium" : "Versión Gratuita"}
          </Text>
        </View>

        <StatsCard stats={stats} formatCurrency={formatCurrency} />

        <ChartCard data={monthlyTotals} />

        <PremiumSection
          onUpgradePress={handleUpgradePress}
          navigation={navigation}
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      <PremiumUpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgradeSuccess={handleUpgradeSuccess}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors, insets: { top: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
      paddingTop: insets.top,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.lg,
    },
    title: {
      fontSize: FONT_SIZES.xxl,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      marginTop: 4,
    },
  });

export default StatisticsScreen;
