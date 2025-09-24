import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useExpenseStore } from "../store/expenseStore";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../constants/colors";
import CategoryPicker from "../components/CategoryPicker";
import { ExpenseFormData } from "../types";

const AddExpenseScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    categories,
    loading,
    error,
    addExpense,
    canAddExpense,
    getExpenseCountToday,
    loadCategories,
    clearError,
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
      Alert.alert("Error", "Ingresa un monto válido");
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert("Error", "Ingresa una descripción");
      return;
    }

    if (!formData.category) {
      Alert.alert("Error", "Selecciona una categoría");
      return;
    }

    // Verificar límites
    const canAdd = await canAddExpense();
    if (!canAdd) {
      Alert.alert(
        "Límite alcanzado",
        "Has alcanzado el límite diario de gastos. Upgrade a Premium para gastos ilimitados.",
        [
          { text: "Entendido", style: "default" },
          { text: "Ver Premium", style: "default" },
        ]
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
        Alert.alert(
          "¡Gasto agregado!",
          "El gasto se ha registrado correctamente.",
          [
            {
              text: "OK",
              onPress: () => {
                // Resetear formulario
                setFormData({
                  amount: "",
                  description: "",
                  category: categories[0]?.name || "",
                  date: new Date(),
                });
                // Volver al dashboard
                navigation.navigate("DashboardTab");
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      Alert.alert("Error", "No se pudo agregar el gasto. Inténtalo de nuevo.");
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

    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "COP",
    }).format(numAmount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-CL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
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
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Agregar Gasto</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Limite Info */}
          <View style={styles.limitInfo}>
            <Text style={styles.limitText}>
              Gastos hoy: {todayExpenseCount}/5 (Gratuito)
            </Text>
          </View>

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
                placeholderTextColor={COLORS.gray300}
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
              placeholderTextColor={COLORS.gray400}
            />
          </View>

          {/* Category Picker */}
          <CategoryPicker
            categories={categories.filter((cat) => !cat.isPremium)}
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
                color={COLORS.primary}
              />
              <Text style={styles.dateText}>{formatDate(formData.date)}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.gray400}
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
            />
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <Ionicons name="close" size={20} color={COLORS.error} />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.background,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  form: {
    flex: 1,
  },
  limitInfo: {
    backgroundColor: COLORS.primary + "10",
    margin: SPACING.md,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  limitText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: "600",
  },
  amountSection: {
    backgroundColor: COLORS.background,
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.textPrimary,
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
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  amountInput: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
    minWidth: 100,
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingVertical: SPACING.xs,
  },
  formattedAmount: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  section: {
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  textInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    paddingVertical: SPACING.sm,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  dateText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  errorContainer: {
    backgroundColor: COLORS.error + "10",
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
    color: COLORS.error,
  },
  buttonContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
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
    color: COLORS.background,
  },
});

export default AddExpenseScreen;
