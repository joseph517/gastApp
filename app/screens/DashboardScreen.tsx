import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useExpenseStore } from "../store/expenseStore";
import { useTheme } from "../contexts/ThemeContext";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../constants/colors";
import ExpenseCard from "../components/ExpenseCard";
import PieChart from "../components/PieChart";
import FloatingActionButton from "../components/FloatingActionButton";
import { Period, CategoryTotal } from "../types";

const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const {
    expenses,
    loading,
    error,
    initializeStore,
    getExpenses,
    deleteExpense,
    clearError,
    getTotalsByCategory,
    getRecentExpenses,
    getPeriodStats,
  } = useExpenseStore();

  const [selectedPeriod, setSelectedPeriod] = useState<Period>("month");
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [periodStats, setPeriodStats] = useState({
    total: 0,
    previousTotal: 0,
    percentageChange: 0,
    expenseCount: 0,
  });

  useEffect(() => {
    initializeStore();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadDashboardData();
    }
  }, [selectedPeriod, expenses, loading]);

  const loadDashboardData = async () => {
    try {
      // Calcular fechas basadas en el período seleccionado
      const endDate = new Date();
      const startDate = new Date();

      switch (selectedPeriod) {
        case "week":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Obtener totales por categoría
      const totals = await getTotalsByCategory(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );
      setCategoryTotals(totals);

      // Obtener estadísticas del período
      const stats = await getPeriodStats(selectedPeriod);
      setPeriodStats(stats);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const handleRefresh = async () => {
    await getExpenses();
    await loadDashboardData();
  };

  const handleDeleteExpense = (expenseId: number) => {
    Alert.alert(
      "Eliminar Gasto",
      "¿Estás seguro de que deseas eliminar este gasto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteExpense(expenseId),
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "week":
        return "Esta semana";
      case "month":
        return "Este mes";
      case "year":
        return "Este año";
    }
  };

  const recentExpenses = getRecentExpenses(5);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={clearError}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>¡Hola! 👋</Text>
          <Text style={styles.subtitle}>Controla tus gastos</Text>
        </View>

        {/* Period Stats */}
        <View style={styles.statsCard}>
          <View style={styles.periodSelector}>
            {(["week", "month", "year"] as Period[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.activePeriodButton,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.activePeriodButtonText,
                  ]}
                >
                  {period === "week"
                    ? "Semana"
                    : period === "month"
                    ? "Mes"
                    : "Año"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>{getPeriodLabel()}</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(periodStats.total)}
            </Text>
            <View style={styles.changeContainer}>
              <Ionicons
                name={
                  periodStats.percentageChange >= 0
                    ? "trending-up"
                    : "trending-down"
                }
                size={16}
                color={
                  periodStats.percentageChange >= 0
                    ? colors.error
                    : colors.success
                }
              />
              <Text
                style={[
                  styles.changeText,
                  {
                    color:
                      periodStats.percentageChange >= 0
                        ? colors.error
                        : colors.success,
                  },
                ]}
              >
                {Math.abs(periodStats.percentageChange).toFixed(1)}% vs período
                anterior
              </Text>
            </View>
          </View>
        </View>

        {/* Pie Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Gastos por Categoría</Text>
          <PieChart data={categoryTotals} />
        </View>

        {/* Recent Expenses */}
        <View style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <Text style={styles.cardTitle}>Gastos Recientes</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {recentExpenses.length > 0 ? (
            recentExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onDelete={() => handleDeleteExpense(expense.id)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="receipt-outline"
                size={48}
                color={colors.gray300}
              />
              <Text style={styles.emptyStateText}>
                No hay gastos registrados
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Toca el botón + para agregar tu primer gasto
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* <FloatingActionButton
        onPress={() => navigation.navigate("AddExpenseTab")}
      /> */}
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.lg,
    },
    greeting: {
      fontSize: FONT_SIZES.xxl,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      marginTop: 4,
    },
    statsCard: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      ...SHADOWS.small,
    },
    periodSelector: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: 4,
      marginBottom: SPACING.lg,
    },
    periodButton: {
      flex: 1,
      paddingVertical: SPACING.sm,
      alignItems: "center",
      borderRadius: BORDER_RADIUS.md,
    },
    activePeriodButton: {
      backgroundColor: colors.primary,
    },
    periodButtonText: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    activePeriodButtonText: {
      color: colors.background,
    },
    totalContainer: {
      alignItems: "center",
    },
    totalLabel: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    totalAmount: {
      fontSize: FONT_SIZES.xxxl,
      fontWeight: "800",
      color: colors.textPrimary,
      marginBottom: SPACING.sm,
    },
    changeContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    changeText: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "600",
      marginLeft: 4,
    },
    chartCard: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      ...SHADOWS.small,
    },
    recentCard: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      paddingTop: SPACING.lg,
      ...SHADOWS.small,
    },
    cardTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: SPACING.md,
      marginHorizontal: SPACING.md,
    },
    recentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SPACING.md,
      marginBottom: SPACING.sm,
    },
    viewAllText: {
      fontSize: FONT_SIZES.sm,
      color: colors.primary,
      fontWeight: "600",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: SPACING.xl,
      paddingHorizontal: SPACING.md,
    },
    emptyStateText: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.textSecondary,
      marginTop: SPACING.sm,
      textAlign: "center",
    },
    emptyStateSubtext: {
      fontSize: FONT_SIZES.sm,
      color: colors.textLight,
      marginTop: 4,
      textAlign: "center",
    },
    errorContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.md,
    },
    errorText: {
      fontSize: FONT_SIZES.md,
      color: colors.error,
      textAlign: "center",
      marginVertical: SPACING.md,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.md,
    },
    retryButtonText: {
      fontSize: FONT_SIZES.md,
      color: colors.background,
      fontWeight: "600",
    },
  });

export default DashboardScreen;
