import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, ThemeColors } from "../contexts/ThemeContext";
import { useDashboard } from "../hooks/useDashboard";
import { useExpenseStore } from "../store/expenseStore";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import PeriodStatsCard from "../components/dashboard/PeriodStatsCard";
import BudgetOverview from "../components/dashboard/BudgetOverview";
import ChartSection from "../components/dashboard/ChartSection";
import RecentExpensesSection from "../components/dashboard/RecentExpensesSection";
import { DashboardScreenProps } from "../types/dashboard";

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets);
  const { isPremium } = useExpenseStore();

  const {
    selectedPeriod,
    categoryTotals,
    periodStats,
    recentExpenses,
    loading,
    setSelectedPeriod,
    handleRefresh,
    handleDeleteExpense: deleteExpense,
    handleImportTestData: importTestData,
    formatCurrency,
    getPeriodLabel,
  } = useDashboard();

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

  const handleImportTestData = async () => {
    Alert.alert(
      "Importar Datos de Prueba",
      "¿Quieres importar 53 gastos de prueba de agosto y septiembre?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Importar",
          style: "default",
          onPress: async () => {
            const success = await importTestData();
            if (success) {
              Alert.alert(
                "Éxito",
                "Los datos de prueba han sido importados correctamente"
              );
            } else {
              Alert.alert(
                "Error",
                "No se pudieron importar los datos de prueba"
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      >
        <DashboardHeader onImportTestData={handleImportTestData} />

        <PeriodStatsCard
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          periodStats={periodStats}
          formatCurrency={formatCurrency}
          getPeriodLabel={getPeriodLabel}
        />

        {isPremium && (
          <BudgetOverview
            onPress={() => {
              // Navegar al tab de Statistics y directamente a Budget
              const tabNavigator = navigation.getParent();
              if (tabNavigator) {
                tabNavigator.navigate("StatisticsTab", {
                  screen: "Budget",
                  initial: false,
                });
              }
            }}
          />
        )}

        <RecentExpensesSection
          expenses={recentExpenses}
          onDeleteExpense={handleDeleteExpense}
        />

        <View style={{ height: 100 }} />
      </ScrollView>
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
  });

export default DashboardScreen;
