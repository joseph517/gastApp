import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useExpenseStore } from "../store/expenseStore";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../constants/colors";
import { RecurringExpense, PendingRecurringExpense } from "../types";
import { databaseService } from "../database/database";
import RecurringExpenseCard from "../components/recurring/RecurringExpenseCard";
import PendingExpenseCard from "../components/recurring/PendingExpenseCard";
import { recurringExpenseService } from "../services/recurringExpenseService";

interface RecurringExpensesScreenProps {
  navigation: any;
}

type TabType = "list" | "pending";
type FilterMode = "all" | "active" | "paused";

const RecurringExpensesScreen: React.FC<RecurringExpensesScreenProps> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isPremium } = useExpenseStore();

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<PendingRecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("list");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const styles = createStyles(colors, insets);

  // Verificar acceso premium
  useEffect(() => {
    if (!isPremium) {
      Alert.alert(
        "Función Premium",
        "Los gastos recurrentes están disponibles solo para usuarios Premium.",
        [{ text: "Entendido", onPress: () => navigation.goBack() }]
      );
      return;
    }
  }, [isPremium, navigation]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [recurring, pending] = await Promise.all([
        databaseService.getRecurringExpenses(),
        databaseService.getPendingRecurringExpenses(),
      ]);

      setRecurringExpenses(recurring);
      setPendingExpenses(pending);
    } catch (error) {
      console.error("Error loading recurring expenses:", error);
      Alert.alert("Error", "No se pudieron cargar los gastos recurrentes");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos cuando la pantalla reciba el foco
  useFocusEffect(
    useCallback(() => {
      if (isPremium) {
        loadData();
      }
    }, [isPremium, loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleActive = async (expense: RecurringExpense) => {
    try {
      const newActiveState = !expense.isActive;

      // Si se está reactivando un gasto pausado, verificar si la fecha está vencida
      if (newActiveState && expense.nextDueDate < new Date().toISOString().split('T')[0]) {
        Alert.alert(
          "Gasto Vencido",
          "Este gasto recurrente tiene una fecha de pago vencida. ¿Deseas actualizar la fecha de próximo pago a partir de hoy?",
          [
            {
              text: "Mantener fecha",
              style: "cancel",
              onPress: async () => {
                await databaseService.updateRecurringExpense(expense.id!, {
                  isActive: newActiveState,
                });
                await loadData();
              },
            },
            {
              text: "Actualizar fecha",
              onPress: async () => {
                const nextDueDate = recurringExpenseService.calculateAdvancedNextDueDate(
                  new Date().toISOString().split('T')[0],
                  expense.intervalDays,
                  expense.executionDates
                );

                await databaseService.updateRecurringExpense(expense.id!, {
                  isActive: newActiveState,
                  nextDueDate,
                });
                await loadData();
              },
            },
          ]
        );
      } else {
        await databaseService.updateRecurringExpense(expense.id!, {
          isActive: newActiveState,
        });
        await loadData();
      }
    } catch (error) {
      console.error("Error toggling expense:", error);
      Alert.alert("Error", "No se pudo actualizar el gasto recurrente");
    }
  };

  const handleConfirmPending = async (id: number, amount: number) => {
    try {
      const success = await recurringExpenseService.confirmPendingExpense(id, { amount });
      if (success) {
        await loadData();
      } else {
        Alert.alert("Error", "No se pudo confirmar el gasto");
      }
    } catch (error) {
      console.error("Error confirming pending expense:", error);
      Alert.alert("Error", "No se pudo confirmar el gasto");
    }
  };

  const handleSkipPending = async (id: number) => {
    try {
      const success = await recurringExpenseService.skipPendingExpense(id);
      if (success) {
        await loadData();
      } else {
        Alert.alert("Error", "No se pudo omitir el gasto");
      }
    } catch (error) {
      console.error("Error skipping pending expense:", error);
      Alert.alert("Error", "No se pudo omitir el gasto");
    }
  };

  const handleDeleteRecurring = async (expense: RecurringExpense) => {
    Alert.alert(
      "Eliminar Gasto Recurrente",
      `¿Estás seguro de que quieres eliminar "${expense.description}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await databaseService.deleteRecurringExpense(expense.id!);
              await loadData();
            } catch (error) {
              console.error("Error deleting expense:", error);
              Alert.alert("Error", "No se pudo eliminar el gasto recurrente");
            }
          },
        },
      ]
    );
  };


  const getFilteredRecurringExpenses = () => {
    if (filterMode === "all") return recurringExpenses;
    if (filterMode === "active") return recurringExpenses.filter(e => e.isActive);
    if (filterMode === "paused") return recurringExpenses.filter(e => !e.isActive);
    return recurringExpenses;
  };

  const getTodayPending = () => {
    const today = new Date().toISOString().split('T')[0];
    return pendingExpenses.filter(p => p.scheduledDate === today);
  };

  const getOverduePending = () => {
    const today = new Date().toISOString().split('T')[0];
    return pendingExpenses.filter(p => p.scheduledDate < today);
  };

  const renderRecurringExpenseCard = (expense: RecurringExpense) => (
    <RecurringExpenseCard
      key={expense.id}
      expense={expense}
      onToggleActive={handleToggleActive}
      onDelete={handleDeleteRecurring}
    />
  );

  const renderPendingExpenseCard = (pending: PendingRecurringExpense, isOverdue: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(pending.scheduledDate);
    const todayDate = new Date(today);
    const daysOverdue = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    return (
      <PendingExpenseCard
        key={pending.id}
        expense={pending}
        isOverdue={isOverdue}
        daysOverdue={isOverdue ? daysOverdue : undefined}
        onConfirm={handleConfirmPending}
        onSkip={handleSkipPending}
      />
    );
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, filterMode === "all" && styles.filterButtonActive]}
        onPress={() => setFilterMode("all")}
      >
        <Text style={[styles.filterButtonText, filterMode === "all" && styles.filterButtonTextActive]}>
          Todas
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, filterMode === "active" && styles.filterButtonActive]}
        onPress={() => setFilterMode("active")}
      >
        <Text style={[styles.filterButtonText, filterMode === "active" && styles.filterButtonTextActive]}>
          Activas
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, filterMode === "paused" && styles.filterButtonActive]}
        onPress={() => setFilterMode("paused")}
      >
        <Text style={[styles.filterButtonText, filterMode === "paused" && styles.filterButtonTextActive]}>
          Pausadas
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderListTab = () => {
    const filteredExpenses = getFilteredRecurringExpenses();

    return (
      <View style={styles.content}>
        {renderFilterButtons()}
        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Sin gastos recurrentes</Text>
            <Text style={styles.emptyStateText}>
              {filterMode === "all"
                ? "Crea tu primer gasto recurrente para automatizar tus finanzas"
                : `No hay gastos ${filterMode === "active" ? "activos" : "pausados"}`}
            </Text>
          </View>
        ) : (
          filteredExpenses.map(renderRecurringExpenseCard)
        )}
      </View>
    );
  };

  const renderPendingTab = () => {
    const todayPending = getTodayPending();
    const overduePending = getOverduePending();

    return (
      <View style={styles.content}>
        {overduePending.length > 0 && (
          <View style={styles.pendingSection}>
            <Text style={styles.sectionTitle}>Vencidos ({overduePending.length})</Text>
            {overduePending.map(p => renderPendingExpenseCard(p, true))}
          </View>
        )}

        {todayPending.length > 0 && (
          <View style={styles.pendingSection}>
            <Text style={styles.sectionTitle}>Para hoy ({todayPending.length})</Text>
            {todayPending.map(p => renderPendingExpenseCard(p, false))}
          </View>
        )}

        {todayPending.length === 0 && overduePending.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Sin gastos pendientes</Text>
            <Text style={styles.emptyStateText}>
              Todos tus gastos recurrentes están al día
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!isPremium) {
    return null;
  }

  const pendingCount = pendingExpenses.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Gastos Recurrentes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddRecurringExpense")}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "list" && styles.tabActive]}
          onPress={() => setActiveTab("list")}
        >
          <Text style={[styles.tabText, activeTab === "list" && styles.tabTextActive]}>
            Lista
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.tabActive]}
          onPress={() => setActiveTab("pending")}
        >
          <View style={styles.tabWithBadge}>
            <Text style={[styles.tabText, activeTab === "pending" && styles.tabTextActive]}>
              Pendientes
            </Text>
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "list" ? renderListTab() : renderPendingTab()}
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      backgroundColor: colors.surface,
      ...SHADOWS.small,
    },
    backButton: {
      padding: SPACING.xs,
    },
    title: {
      fontSize: FONT_SIZES.xl,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    addButton: {
      padding: SPACING.xs,
    },
    tabsContainer: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: SPACING.sm,
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
    },
    tabWithBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
    },
    badge: {
      backgroundColor: colors.error,
      borderRadius: BORDER_RADIUS.full,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      fontSize: FONT_SIZES.xs,
      fontWeight: "700",
      color: colors.background,
    },
    filterContainer: {
      flexDirection: "row",
      marginBottom: SPACING.md,
      gap: SPACING.xs,
    },
    filterButton: {
      flex: 1,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.surface,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    filterButtonTextActive: {
      color: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: SPACING.md,
    },
    pendingSection: {
      marginBottom: SPACING.lg,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: SPACING.md,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: SPACING.xxl,
    },
    emptyStateTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: SPACING.sm,
    },
    emptyStateText: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });

export default RecurringExpensesScreen;
