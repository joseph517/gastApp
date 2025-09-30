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
import { RecurringExpense } from "../types";
import { databaseService } from "../database/database";
import RecurringExpenseCard from "../components/recurring/RecurringExpenseCard";

interface RecurringExpensesScreenProps {
  navigation: any;
}

const RecurringExpensesScreen: React.FC<RecurringExpensesScreenProps> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isPremium } = useExpenseStore();

  const [recurringExpenses, setRecurringExpenses] = useState<
    RecurringExpense[]
  >([]);
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
      setLoading(true);

      const recurring = await databaseService.getRecurringExpenses();
      setRecurringExpenses(recurring);
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
      await databaseService.updateRecurringExpense(expense.id!, {
        isActive: !expense.isActive,
      });
      await loadData();
    } catch (error) {
      console.error("Error toggling expense:", error);
      Alert.alert("Error", "No se pudo actualizar el gasto recurrente");
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


  const renderRecurringExpenseCard = (expense: RecurringExpense) => (
    <RecurringExpenseCard
      key={expense.id}
      expense={expense}
      onToggleActive={handleToggleActive}
      onDelete={handleDeleteRecurring}
    />
  );

  const renderActiveContent = () => {
    return (
      <View style={styles.content}>
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
          onPress={() => navigation.navigate("AddRecurringExpense")}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
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
        {renderActiveContent()}
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
    scrollView: {
      flex: 1,
    },
    content: {
      padding: SPACING.md,
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
