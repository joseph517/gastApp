import React, { Suspense } from "react";
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
import LoadingCard from "../components/analytics/LoadingCard";
import { SPACING, FONT_SIZES } from "../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { CategoryTotal } from "../types";

// Lazy load componentes pesados
const TimelineChart = React.lazy(
  () => import("../components/analytics/TimelineChart")
);
const CategoryChart = React.lazy(
  () => import("../components/analytics/CategoryChart")
);
const MonthComparison = React.lazy(
  () => import("../components/analytics/MonthComparison")
);
const MonthlyPrediction = React.lazy(
  () => import("../components/analytics/MonthlyPrediction")
);
const InsightsSection = React.lazy(
  () => import("../components/analytics/InsightsSection")
);
const CategoryChanges = React.lazy(
  () => import("../components/analytics/CategoryChanges")
);
const FrequencyAnalysis = React.lazy(
  () => import("../components/analytics/FrequencyAnalysis")
);
const CalendarHeatMap = React.lazy(
  () => import("../components/analytics/CalendarHeatMap")
);
const WeeklySpendingChart = React.lazy(
  () => import("../components/analytics/WeeklySpendingChart")
);
const OverdueExpensesCard = React.lazy(
  () => import("../components/analytics/OverdueExpensesCard")
);

interface AnalyticsScreenProps {
  navigation: any;
}

const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { loading } = useExpenseStore();
  const [topCategories, setTopCategories] = React.useState<CategoryTotal[]>([]);
  const [loadingStates, setLoadingStates] = React.useState({
    prediction: true,
    comparison: true,
    timeline: true,
    categories: true,
  });

  const {
    timelineData,
    timelineRange,
    monthComparison,
    monthlyPrediction,
    getTopCategories,
    getBasicInsights,
    getCategoryChanges,
    getFrequencyAnalysis,
    getCalendarHeatMapData,
    getCalendarDataForMonth,
    getWeeklySpendingData,
    getWeeklyDataForWeek,
    refreshData,
    setTimelineRange,
    loading: analyticsLoading,
  } = useAnalytics();

  const styles = createStyles(colors, insets);

  // Actualizar estados de carga cuando los datos estén listos
  React.useEffect(() => {
    if (monthlyPrediction !== null) {
      setLoadingStates((prev) => ({ ...prev, prediction: false }));
    }
  }, [monthlyPrediction]);

  React.useEffect(() => {
    if (monthComparison !== null) {
      setLoadingStates((prev) => ({ ...prev, comparison: false }));
    }
  }, [monthComparison]);

  React.useEffect(() => {
    if (timelineData.length > 0) {
      setLoadingStates((prev) => ({ ...prev, timeline: false }));
    }
  }, [timelineData]);

  // Cargar datos de forma progresiva
  React.useEffect(() => {
    let isMounted = true;

    const loadTopCategories = async () => {
      try {
        const categories = await getTopCategories("month");
        if (isMounted) {
          setTopCategories(categories);
          setLoadingStates((prev) => ({ ...prev, categories: false }));
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        if (isMounted) {
          setLoadingStates((prev) => ({ ...prev, categories: false }));
        }
      }
    };

    if (!analyticsLoading) {
      // Añadir un pequeño delay para mejorar la percepción de rendimiento
      const timeoutId = setTimeout(loadTopCategories, 100);
      return () => clearTimeout(timeoutId);
    }

    return () => {
      isMounted = false;
    };
  }, [analyticsLoading, getTopCategories]);

  const handleRefresh = async () => {
    await refreshData();
    const categories = await getTopCategories("month");
    setTopCategories(categories);
  };

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

        {/* Insights Automáticos */}
        <Suspense fallback={<LoadingCard height={150} />}>
          <InsightsSection insights={getBasicInsights()} />
        </Suspense>

        {/* Phase 2: Gastos Vencidos */}
        <Suspense fallback={<LoadingCard height={200} />}>
          <OverdueExpensesCard />
        </Suspense>

        {/* Predicción mensual */}
        {loadingStates.prediction ? (
          <LoadingCard height={300} />
        ) : (
          <Suspense fallback={<LoadingCard height={300} />}>
            <MonthlyPrediction prediction={monthlyPrediction} />
          </Suspense>
        )}

        {/* Comparación mensual */}
        {loadingStates.comparison ? (
          <LoadingCard height={200} />
        ) : (
          <Suspense fallback={<LoadingCard height={200} />}>
            <MonthComparison comparison={monthComparison} />
          </Suspense>
        )}

        {/* Cambios por categoría */}
        <Suspense fallback={<LoadingCard height={300} />}>
          <CategoryChanges {...getCategoryChanges()} title="Cambios Este Mes" />
        </Suspense>

        {/* Gráfico de línea temporal */}
        {loadingStates.timeline ? (
          <LoadingCard height={280} />
        ) : (
          <Suspense fallback={<LoadingCard height={280} />}>
            <TimelineChart
              data={timelineData}
              timelineRange={timelineRange}
              onRangeChange={setTimelineRange}
            />
          </Suspense>
        )}

        {/* Gráfico de categorías */}
        {loadingStates.categories ? (
          <LoadingCard height={350} />
        ) : (
          <Suspense fallback={<LoadingCard height={350} />}>
            <CategoryChart
              data={topCategories}
              title="Top 5 Categorías del Mes"
              showPercentages={true}
            />
          </Suspense>
        )}

        {/* Análisis de frecuencia */}
        <Suspense fallback={<LoadingCard height={400} />}>
          <FrequencyAnalysis
            frequencies={getFrequencyAnalysis()}
            title="Patrones de Gasto"
          />
        </Suspense>

        {/* Heat Map del Calendario */}
        <Suspense fallback={<LoadingCard height={450} />}>
          <CalendarHeatMap
            data={getCalendarHeatMapData()}
            month={new Date()}
            title="Mapa de Calor - Gastos Diarios"
            getCalendarDataForMonth={getCalendarDataForMonth}
          />
        </Suspense>

        {/* Gastos por Día de Semana */}
        <Suspense fallback={<LoadingCard height={350} />}>
          <WeeklySpendingChart
            {...getWeeklySpendingData()}
            title="Patrones Semanales"
            getWeeklyDataForWeek={getWeeklyDataForWeek}
          />
        </Suspense>

        {/* Espacio adicional para el bottom tab */}
        <View style={{ height: 30 }} />
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
