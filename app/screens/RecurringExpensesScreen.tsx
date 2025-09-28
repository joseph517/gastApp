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
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../constants/colors";
import { RecurringExpense, PendingRecurringExpense } from "../types";
import { databaseService } from "../database/database";
import { recurringExpenseService } from "../services/recurringExpenseService";

interface RecurringExpensesScreenProps {
  navigation: any;
}

const RecurringExpensesScreen: React.FC<RecurringExpensesScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isPremium } = useExpenseStore();

  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'stats'>('active');
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<PendingRecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      console.log('Loading recurring expenses data...');
      setLoading(true);

      // Intentar cargar datos normalmente
      try {
        // Verificar gastos pendientes primero
        await recurringExpenseService.checkAndCreatePendingExpenses();
        await recurringExpenseService.markOverdueExpenses();

        // Cargar datos
        const [recurring, pending] = await Promise.all([
          databaseService.getRecurringExpenses(),
          databaseService.getPendingRecurringExpenses()
        ]);

        setRecurringExpenses(recurring);
        setPendingExpenses(pending);
        console.log(`Loaded ${recurring.length} recurring expenses and ${pending.length} pending expenses`);
      } catch (dataError: any) {
        // Si hay error de tabla, intentar arreglar la estructura
        if (dataError.message?.includes('template_name') || dataError.message?.includes('no such table')) {
          console.log('Fixing table structure...');
          const fixed = await databaseService.fixRecurringExpensesTable();

          if (fixed) {
            // Intentar cargar datos nuevamente después del fix
            const [recurring, pending] = await Promise.all([
              databaseService.getRecurringExpenses(),
              databaseService.getPendingRecurringExpenses()
            ]);

            setRecurringExpenses(recurring);
            setPendingExpenses(pending);
            console.log(`After fix - Loaded ${recurring.length} recurring expenses and ${pending.length} pending expenses`);
          } else {
            throw new Error('No se pudo arreglar la estructura de la base de datos');
          }
        } else {
          throw dataError;
        }
      }
    } catch (error) {
      console.error('Error loading recurring expenses:', error);
      Alert.alert('Error', 'No se pudieron cargar los gastos recurrentes');
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
      await databaseService.updateRecurringExpense(expense.id!, {
        isActive: !expense.isActive
      });
      await loadData();
    } catch (error) {
      console.error('Error toggling expense:', error);
      Alert.alert('Error', 'No se pudo actualizar el gasto recurrente');
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
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'No se pudo eliminar el gasto recurrente');
            }
          }
        }
      ]
    );
  };

  const handleConfirmPending = async (pending: PendingRecurringExpense) => {
    try {
      const success = await recurringExpenseService.confirmPendingExpense(pending.id!);
      if (success) {
        await loadData();
        Alert.alert('Éxito', 'Gasto confirmado y agregado correctamente');
      }
    } catch (error) {
      console.error('Error confirming pending:', error);
      Alert.alert('Error', 'No se pudo confirmar el gasto');
    }
  };

  const handleSkipPending = async (pending: PendingRecurringExpense) => {
    try {
      const success = await recurringExpenseService.skipPendingExpense(pending.id!);
      if (success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error skipping pending:', error);
      Alert.alert('Error', 'No se pudo omitir el gasto');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getFrequencyLabel = (intervalDays: number, executionDates?: number[]) => {
    if (executionDates && executionDates.length > 0) {
      return `Días ${executionDates.join(', ')} del mes`;
    }

    switch (intervalDays) {
      case 7: return "Cada 7 días";
      case 15: return "Cada 15 días";
      case 30: return "Cada 30 días";
      default: return `Cada ${intervalDays} días`;
    }
  };

  const renderRecurringExpenseCard = (expense: RecurringExpense) => (
    <View key={expense.id} style={[styles.card, !expense.isActive && styles.pausedCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <View style={styles.titleWithStatus}>
            <Text style={styles.cardTitle}>{expense.description}</Text>
            <View style={[styles.statusBadge, expense.isActive ? styles.activeBadge : styles.pausedBadge]}>
              <Ionicons
                name={expense.isActive ? "checkmark-circle" : "pause-circle"}
                size={14}
                color={colors.background}
              />
              <Text style={styles.statusText}>
                {expense.isActive ? 'Activo' : 'Pausado'}
              </Text>
            </View>
          </View>
          <Text style={styles.cardAmount}>{formatCurrency(expense.amount)}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, expense.isActive ? styles.pauseButton : styles.resumeButton]}
            onPress={() => handleToggleActive(expense)}
          >
            <Ionicons
              name={expense.isActive ? "pause" : "play"}
              size={16}
              color={colors.background}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteRecurring(expense)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.cardCategory}>📂 {expense.category}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.frequencyText}>
          🔄 {getFrequencyLabel(expense.intervalDays, expense.executionDates)}
        </Text>
        <Text style={styles.nextDateText}>
          📅 Próximo: {formatDate(expense.nextDueDate)}
        </Text>
      </View>
    </View>
  );

  const renderPendingExpenseCard = (pending: PendingRecurringExpense) => (
    <View key={pending.id} style={[styles.card, styles.pendingCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{pending.description}</Text>
          <Text style={styles.cardAmount}>{formatCurrency(pending.amount)}</Text>
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>
            {pending.status === 'overdue' ? '⏰ Vencido' : '⏳ Pendiente'}
          </Text>
        </View>
      </View>

      <Text style={styles.cardCategory}>📂 {pending.category}</Text>
      <Text style={styles.scheduledDateText}>
        📅 Programado: {formatDate(pending.scheduledDate)}
      </Text>

      <View style={styles.pendingActions}>
        <TouchableOpacity
          style={[styles.pendingActionButton, styles.confirmButton]}
          onPress={() => handleConfirmPending(pending)}
        >
          <Ionicons name="checkmark" size={16} color={colors.background} />
          <Text style={styles.pendingActionText}>Confirmar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pendingActionButton, styles.skipButton]}
          onPress={() => handleSkipPending(pending)}
        >
          <Ionicons name="close" size={16} color={colors.background} />
          <Text style={styles.pendingActionText}>Omitir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'active':
        return (
          <View style={styles.tabContent}>
            {recurringExpenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>Sin gastos recurrentes</Text>
                <Text style={styles.emptyStateText}>
                  Crea tu primer gasto recurrente para automatizar tus finanzas
                </Text>
              </View>
            ) : (
              recurringExpenses.map(renderRecurringExpenseCard)
            )}
          </View>
        );

      case 'pending':
        return (
          <View style={styles.tabContent}>
            {pendingExpenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>Sin gastos pendientes</Text>
                <Text style={styles.emptyStateText}>
                  Los gastos programados aparecerán aquí para tu confirmación
                </Text>
              </View>
            ) : (
              pendingExpenses.map(renderPendingExpenseCard)
            )}
          </View>
        );

      case 'stats':
        return (
          <View style={styles.tabContent}>
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>📊 Estadísticas Recurrentes</Text>
              <Text style={styles.statsText}>
                Total activos: {recurringExpenses.filter(e => e.isActive).length}
              </Text>
              <Text style={styles.statsText}>
                Pendientes: {pendingExpenses.length}
              </Text>
              <Text style={styles.statsText}>
                Esta funcionalidad se expandirá próximamente
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (!isPremium) {
    return null;
  }

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
          onPress={() => navigation.navigate('AddRecurringExpense')}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Activos ({recurringExpenses.filter(e => e.isActive).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pendientes ({pendingExpenses.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            Estadísticas
          </Text>
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
        {renderTabContent()}
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
    tabContainer: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING.md,
    },
    tab: {
      flex: 1,
      paddingVertical: SPACING.md,
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    activeTab: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.primary,
    },
    scrollView: {
      flex: 1,
    },
    tabContent: {
      padding: SPACING.md,
    },
    card: {
      backgroundColor: colors.cardBackground,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      marginBottom: SPACING.md,
      ...SHADOWS.small,
    },
    pausedCard: {
      opacity: 0.7,
      borderLeftWidth: 4,
      borderLeftColor: colors.textSecondary,
    },
    pendingCard: {
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: SPACING.sm,
    },
    cardTitleContainer: {
      flex: 1,
      marginRight: SPACING.sm,
    },
    titleWithStatus: {
      marginBottom: SPACING.xs,
    },
    cardTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: SPACING.xs,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.md,
      alignSelf: "flex-start",
      gap: 4,
    },
    activeBadge: {
      backgroundColor: colors.success,
    },
    pausedBadge: {
      backgroundColor: colors.textSecondary,
    },
    statusText: {
      fontSize: FONT_SIZES.xs,
      fontWeight: "600",
      color: colors.background,
    },
    cardAmount: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "600",
      color: colors.error,
    },
    cardActions: {
      flexDirection: "row",
      gap: SPACING.xs,
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: BORDER_RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
    },
    pauseButton: {
      backgroundColor: colors.warning,
    },
    resumeButton: {
      backgroundColor: colors.success,
    },
    deleteButton: {
      backgroundColor: colors.error,
    },
    cardDescription: {
      fontSize: FONT_SIZES.md,
      color: colors.textPrimary,
      marginBottom: SPACING.xs,
    },
    cardCategory: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
      marginBottom: SPACING.sm,
    },
    cardFooter: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: SPACING.sm,
      gap: 4,
    },
    frequencyText: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
    },
    nextDateText: {
      fontSize: FONT_SIZES.sm,
      color: colors.primary,
      fontWeight: "600",
    },
    pendingBadge: {
      backgroundColor: colors.warning,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.md,
    },
    pendingBadgeText: {
      fontSize: FONT_SIZES.xs,
      fontWeight: "600",
      color: colors.background,
    },
    scheduledDateText: {
      fontSize: FONT_SIZES.sm,
      color: colors.warning,
      fontWeight: "600",
      marginBottom: SPACING.sm,
    },
    pendingActions: {
      flexDirection: "row",
      gap: SPACING.sm,
      marginTop: SPACING.sm,
    },
    pendingActionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.md,
      gap: SPACING.xs,
    },
    confirmButton: {
      backgroundColor: colors.success,
    },
    skipButton: {
      backgroundColor: colors.textSecondary,
    },
    pendingActionText: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "600",
      color: colors.background,
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
    statsContainer: {
      backgroundColor: colors.cardBackground,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      ...SHADOWS.small,
    },
    statsTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: SPACING.md,
    },
    statsText: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      marginBottom: SPACING.xs,
    },
  });

export default RecurringExpensesScreen;