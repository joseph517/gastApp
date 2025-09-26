import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Text,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { useAnalytics } from "../hooks/useAnalytics";
import { useExpenseStore } from "../store/expenseStore";
import TimelineChart from "../components/analytics/TimelineChart";
import CategoryChart from "../components/analytics/CategoryChart";
import MonthComparison from "../components/analytics/MonthComparison";
import MonthlyPrediction from "../components/analytics/MonthlyPrediction";
import { SPACING, FONT_SIZES, BORDER_RADIUS } from "../constants/colors";
import { Ionicons } from "@expo/vector-icons";

interface AnalyticsScreenProps {
  navigation: any;
}

const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { loading } = useExpenseStore();

  const {
    timelineData,
    monthComparison,
    monthlyPrediction,
    getTopCategories,
    refreshData,
    loading: analyticsLoading,
  } = useAnalytics();

  const styles = createStyles(colors, insets);

  const handleRefresh = async () => {
    await refreshData();
  };

  const topCategories = getTopCategories("month");

  const isLoading = loading || analyticsLoading;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
            <Text style={styles.backButtonText}>Estadísticas</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Análisis de Gastos</Text>
            <Text style={styles.subtitle}>
              Insights y tendencias de tus finanzas
            </Text>
          </View>
        </View>

        {/* Predicción mensual */}
        <MonthlyPrediction prediction={monthlyPrediction} />

        {/* Comparación mensual */}
        <MonthComparison comparison={monthComparison} />

        {/* Gráfico de línea temporal */}
        <TimelineChart data={timelineData} />

        {/* Gráfico de categorías */}
        <CategoryChart
          data={topCategories}
          title="Top 5 Categorías del Mes"
          showPercentages={true}
        />

        {/* Espacio adicional para el bottom tab */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any, insets: { top: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.lg,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.md,
      paddingVertical: SPACING.xs,
    },
    backButtonText: {
      fontSize: FONT_SIZES.md,
      color: colors.primary,
      fontWeight: "600",
      marginLeft: SPACING.xs,
    },
    titleContainer: {
      alignItems: "center",
    },
    title: {
      fontSize: FONT_SIZES.xxl,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });

export default AnalyticsScreen;