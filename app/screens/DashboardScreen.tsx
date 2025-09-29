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
import { useRecurringExpenseProcessor } from "../hooks/useRecurringExpenseProcessor";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import PeriodStatsCard from "../components/dashboard/PeriodStatsCard";
import RecentExpensesSection from "../components/dashboard/RecentExpensesSection";
import { DashboardScreenProps } from "../types/dashboard";
import { useToast } from "app/contexts/ToastContext";

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets);

  // Activar procesamiento de gastos recurrentes en background
  useRecurringExpenseProcessor();

  const {
    selectedPeriod,
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

  const { showToast } = useToast();

  const handleDeleteExpense = (expenseId: number) => {
    showToast("Gasto eliminado", "success");
    deleteExpense(expenseId);
  };

  const handleImportTestData = async () => {
    Alert.alert(
      "Importar Datos de Prueba",
      "Estas seguro de importar los datos de prueba?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Importar",
          style: "default",
          onPress: async () => {
            const success = await importTestData();
            if (success) {
              showToast("Datos de prueba importados", "success");
            } else {
              showToast("Error al importar datos de prueba", "error");
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
