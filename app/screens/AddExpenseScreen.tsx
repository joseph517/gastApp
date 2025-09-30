import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useExpenseStore } from "../store/expenseStore";
import { useTheme } from "../contexts/ThemeContext";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../constants/colors";
import CategoryPicker from "../components/CategoryPicker";
import { ExpenseFormData } from "../types";
import { useToast } from "app/contexts/ToastContext";

const AddExpenseScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    categories,
    loading,
    error,
    addExpense,
    canAddExpense,
    getExpenseCountToday,
    loadCategories,
    clearError,
    isPremium,
  } = useExpenseStore();

  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: "",
    description: "",
    category: "",
    date: new Date(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [todayExpenseCount, setTodayExpenseCount] = useState(0);

  useEffect(() => {
    loadCategories();
    checkTodayCount();
  }, []);

  // Recargar categorías cuando cambie el estado premium
  useEffect(() => {
    loadCategories();
  }, [isPremium]);

  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData((prev) => ({ ...prev, category: categories[0].name }));
    }
  }, [categories]);

  const checkTodayCount = async () => {
    const count = await getExpenseCountToday();
    setTodayExpenseCount(count);
  };

  const handleAmountChange = (text: string) => {
    // Solo permitir números y un punto decimal
    const numericText = text.replace(/[^0-9.]/g, "");

    // Evitar múltiples puntos decimales
    const parts = numericText.split(".");
    if (parts.length > 2) return;

    setFormData((prev) => ({ ...prev, amount: numericText }));
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast("Ingresa un monto válido", "error", {
        duration: 2000,
      });
      return;
    }

    if (!formData.description.trim()) {
      showToast("Ingresa una descripción", "error", {
        duration: 2000,
      });
      return;
    }

    if (!formData.category) {
      showToast("Selecciona una categoría", "error", {
        duration: 2000,
      });
      return;
    }

    // Validación de fecha - solo permitir últimos 3 meses
    const selectedDate = formData.date;
    const today = new Date();

    // Calcular 3 meses atrás correctamente
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setDate(today.getDate() - 90);

    if (selectedDate < threeMonthsAgo) {
      Alert.alert(
        "Fecha no válida",
        "Solo puedes agregar gastos de los últimos 3 meses. Por favor selecciona una fecha más reciente.",
        [{ text: "Entendido", style: "default" }]
      );
      return;
    }

    if (selectedDate > today) {
      Alert.alert(
        "Fecha no válida",
        "No puedes agregar gastos con fecha futura.",
        [{ text: "Entendido", style: "default" }]
      );
      return;
    }

    // Verificar límites
    const canAdd = await canAddExpense();

    if (!canAdd) {
      showToast(
        "Has alcanzado el límite diario de gastos. Upgrade a Premium para gastos ilimitados.",
        "warning",
        {
          duration: 3000,
          action: {
            text: "Ver Premium",
            onPress: () => {
              // TODO: Navegar a la pantalla de Premium
            },
          },
        }
      );
      return;
    }

    try {
      const expense = {
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        category: formData.category,
        date: formData.date.toISOString().split("T")[0],
      };

      const success = await addExpense(expense);

      if (success) {
        // Resetear formulario inmediatamente
        setFormData({
          amount: "",
          description: "",
          category: categories[0]?.name || "",
          date: new Date(),
        });

        // Actualizar contador de gastos
        await checkTodayCount();

        showToast("¡Gasto agregado!", "success", {
          duration: 2000,
        });

        // Navegar al dashboard después de un breve delay
        setTimeout(() => {
          navigation.navigate("DashboardTab");
        }, 500);
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      showToast("Error al agregar el gasto", "error");
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setFormData((prev) => ({ ...prev, date: selectedDate }));
    }
  };

  const formatCurrency = (amount: string) => {
    if (!amount) return "";
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return amount;

    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(numAmount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const styles = createStyles(colors, insets);

  const { showToast } = useToast();

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Agregar Gasto</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Limite Info - Solo mostrar para usuarios gratuitos */}
          {!isPremium && (
            <View style={styles.limitInfo}>
              <Text style={styles.limitText}>
                Gastos hoy: {todayExpenseCount}/5 (Gratuito)
              </Text>
            </View>
          )}

          {/* Amount Input */}
          <View style={styles.amountSection}>
            <Text style={styles.sectionTitle}>Monto</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={formData.amount}
                onChangeText={handleAmountChange}
                placeholder="0"
                keyboardType="numeric"
                returnKeyType="next"
                placeholderTextColor={colors.gray300}
              />
            </View>
            {formData.amount && (
              <Text style={styles.formattedAmount}>
                {formatCurrency(formData.amount)}
              </Text>
            )}
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <TextInput
              style={styles.textInput}
              value={formData.description}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, description: text }))
              }
              placeholder="Ej: Almuerzo en restaurante"
              returnKeyType="done"
              maxLength={100}
              placeholderTextColor={colors.gray400}
            />
          </View>

          {/* Category Picker */}
          <CategoryPicker
            categories={categories}
            selectedCategory={formData.category}
            onSelectCategory={(category) =>
              setFormData((prev) => ({ ...prev, category }))
            }
          />

          {/* Date Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fecha</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.dateText}>{formatDate(formData.date)}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.gray400}
              />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={(() => {
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90); // 90 días = aproximadamente 3 meses
                return threeMonthsAgo;
              })()}
            />
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <Ionicons name="close" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Guardando..." : "Agregar Gasto"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
      paddingTop: insets.top,
    },
    keyboardView: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      backgroundColor: colors.cardBackground,
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
    placeholder: {
      width: 40,
    },
    form: {
      flex: 1,
    },
    limitInfo: {
      backgroundColor: colors.primary + "10",
      margin: SPACING.md,
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    limitText: {
      fontSize: FONT_SIZES.sm,
      color: colors.primary,
      fontWeight: "600",
    },
    amountSection: {
      backgroundColor: colors.cardBackground,
      margin: SPACING.md,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: "center",
      ...SHADOWS.small,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: SPACING.sm,
      alignSelf: "flex-start",
      width: "100%",
    },
    amountInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: SPACING.md,
    },
    currencySymbol: {
      fontSize: FONT_SIZES.xxxl,
      fontWeight: "700",
      color: colors.primary,
      marginRight: SPACING.xs,
    },
    amountInput: {
      fontSize: FONT_SIZES.xxxl,
      fontWeight: "700",
      color: colors.textPrimary,
      minWidth: 100,
      textAlign: "center",
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
      paddingVertical: SPACING.xs,
    },
    formattedAmount: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      marginTop: SPACING.xs,
    },
    section: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: SPACING.md,
      marginVertical: SPACING.xs,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      ...SHADOWS.small,
    },
    textInput: {
      fontSize: FONT_SIZES.md,
      color: colors.textPrimary,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray200,
      paddingVertical: SPACING.sm,
    },
    dateButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray200,
    },
    dateText: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      color: colors.textPrimary,
      marginLeft: SPACING.sm,
    },
    errorContainer: {
      backgroundColor: colors.error + "10",
      marginHorizontal: SPACING.md,
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    errorText: {
      flex: 1,
      fontSize: FONT_SIZES.sm,
      color: colors.error,
    },
    buttonContainer: {
      padding: SPACING.md,
      backgroundColor: colors.cardBackground,
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: "center",
      ...SHADOWS.medium,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "700",
      color: colors.background,
    },
  });

export default AddExpenseScreen;
