import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useExpenseStore } from "../store/expenseStore";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../constants/colors";
import { BudgetStatus } from "../types";
import BudgetCard from "../components/budget/BudgetCard";
import BudgetForm from "../components/budget/BudgetForm";
import BudgetStatusCard from "../components/budget/BudgetStatusCard";

interface BudgetScreenProps {
  navigation: any;
}

const BudgetScreen: React.FC<BudgetScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    activeBudget,
    budgets,
    isPremium,
    loading,
    createBudget,
    updateBudget,
    deleteBudget,
    getBudgetStatus,
    loadBudgets,
  } = useExpenseStore();

  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);

  const styles = createStyles(colors, insets);

  useEffect(() => {
    loadBudgetStatus();
  }, [activeBudget]);

  const loadBudgetStatus = async () => {
    if (activeBudget) {
      const status = await getBudgetStatus();
      setBudgetStatus(status);
    } else {
      setBudgetStatus(null);
    }
  };

  const handleCreateBudget = async (budgetData: any) => {
    const success = await createBudget({
      amount: budgetData.amount,
      period: 'monthly',
      startDate: budgetData.startDate,
      endDate: budgetData.endDate,
      isActive: true,
    });

    if (success) {
      setShowCreateModal(false);
      await loadBudgetStatus();
    }
  };

  const handleEditBudget = async (budgetData: any) => {
    if (!editingBudget) return;

    const success = await updateBudget(editingBudget.id, {
      amount: budgetData.amount,
      startDate: budgetData.startDate,
      endDate: budgetData.endDate,
    });

    if (success) {
      setShowEditModal(false);
      setEditingBudget(null);
      await loadBudgetStatus();
    }
  };

  const handleDeleteBudget = (budget: any) => {
    Alert.alert(
      "Eliminar Presupuesto",
      "¿Estás seguro de que deseas eliminar este presupuesto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const success = await deleteBudget(budget.id);
            if (success) {
              await loadBudgetStatus();
            }
          },
        },
      ]
    );
  };

  const openEditModal = (budget: any) => {
    setEditingBudget(budget);
    setShowEditModal(true);
  };

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
            <Text style={styles.backButtonText}>Presupuestos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.premiumRequired}>
          <Ionicons name="diamond" size={64} color={colors.accent} />
          <Text style={styles.premiumTitle}>Función Premium</Text>
          <Text style={styles.premiumSubtitle}>
            El control de presupuesto está disponible solo para usuarios Premium.
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.upgradeButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
            <Text style={styles.backButtonText}>Presupuestos</Text>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Control de Presupuesto</Text>
            <Text style={styles.subtitle}>
              Gestiona tus límites de gasto mensual
            </Text>
          </View>
        </View>

        {/* Budget Status */}
        {budgetStatus && <BudgetStatusCard budgetStatus={budgetStatus} />}

        {/* Active Budget */}
        {activeBudget && (
          <BudgetCard
            budget={activeBudget}
            budgetStatus={budgetStatus}
            onEdit={() => openEditModal(activeBudget)}
            onDelete={() => handleDeleteBudget(activeBudget)}
          />
        )}

        {/* Create Budget Button */}
        {!activeBudget && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle" size={24} color={colors.background} />
            <Text style={styles.createButtonText}>Crear Presupuesto</Text>
          </TouchableOpacity>
        )}

        {/* Previous Budgets */}
        {budgets.filter(b => !b.isActive).length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Presupuestos Anteriores</Text>
            {budgets
              .filter(b => !b.isActive)
              .map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  budgetStatus={null}
                  isHistorical={true}
                  onEdit={() => openEditModal(budget)}
                  onDelete={() => handleDeleteBudget(budget)}
                />
              ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Budget Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <BudgetForm
          onSave={handleCreateBudget}
          onCancel={() => setShowCreateModal(false)}
          title="Crear Presupuesto"
        />
      </Modal>

      {/* Edit Budget Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <BudgetForm
          budget={editingBudget}
          onSave={handleEditBudget}
          onCancel={() => {
            setShowEditModal(false);
            setEditingBudget(null);
          }}
          title="Editar Presupuesto"
        />
      </Modal>
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
    createButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.lg,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      ...SHADOWS.medium,
    },
    createButtonText: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "600",
      color: colors.background,
      marginLeft: SPACING.sm,
    },
    historySection: {
      marginTop: SPACING.xl,
      paddingHorizontal: SPACING.md,
    },
    historyTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: SPACING.md,
    },
    premiumRequired: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: SPACING.xl,
    },
    premiumTitle: {
      fontSize: FONT_SIZES.xl,
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: SPACING.lg,
      marginBottom: SPACING.sm,
    },
    premiumSubtitle: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: SPACING.xl,
    },
    upgradeButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
    },
    upgradeButtonText: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.background,
    },
  });

export default BudgetScreen;