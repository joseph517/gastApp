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
import { RecurringExpenseFormData } from "../types";
import { databaseService } from "../database/database";
import { recurringExpenseService } from "../services/recurringExpenseService";
import {
  INTERVAL_OPTIONS,
  NOTIFICATION_OPTIONS,
  formatCurrency as formatCurrencyUtil,
  formatDateLong,
  isValidDay,
} from "../utils/recurringExpensesUtils";
import { useToast } from "../contexts/ToastContext";

const AddRecurringExpenseScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { categories, loadCategories } = useExpenseStore();

  const [formData, setFormData] = useState<RecurringExpenseFormData>({
    amount: "",
    description: "",
    category: "",
    intervalDays: 30,
    startDate: new Date(),
    endDate: undefined,
    executionDates: [],
    notifyDaysBefore: 1,
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [useMultipleDates, setUseMultipleDates] = useState(false);
  const [newExecutionDay, setNewExecutionDay] = useState("");
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  const styles = createStyles(colors, insets);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData((prev) => ({ ...prev, category: categories[0].name }));
    }
  }, [categories]);

  const handleAmountChange = (text: string) => {
    const numericText = text.replace(/[^0-9.]/g, "");
    const parts = numericText.split(".");
    if (parts.length > 2) return;

    setFormData((prev) => ({ ...prev, amount: numericText }));
  };

  const handleAddExecutionDate = () => {
    const day = parseInt(newExecutionDay);
    if (isValidDay(day) && !formData.executionDates.includes(day)) {
      setFormData((prev) => ({
        ...prev,
        executionDates: [...prev.executionDates, day].sort((a, b) => a - b),
      }));
      setNewExecutionDay("");
    }
  };

  const handleRemoveExecutionDate = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      executionDates: prev.executionDates.filter((d) => d !== day),
    }));
  };

  const calculateNextDueDate = () => {
    return recurringExpenseService.calculateAdvancedNextDueDate(
      formData.startDate.toISOString().split("T")[0],
      formData.intervalDays,
      useMultipleDates ? formData.executionDates : undefined
    );
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

    if (useMultipleDates && formData.executionDates.length === 0) {
      showToast("Selecciona al menos un dia de ejecución", "error", {
        duration: 2000,
      });
      return;
    }

    try {
      setLoading(true);

      const recurringExpense = {
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        category: formData.category,
        frequency: "custom" as const,
        intervalDays: formData.intervalDays,
        startDate: formData.startDate.toISOString().split("T")[0],
        endDate: formData.endDate?.toISOString().split("T")[0],
        nextDueDate: calculateNextDueDate(),
        isActive: true,
        requiresConfirmation: true,
        executionDates: useMultipleDates ? formData.executionDates : [],
        notifyDaysBefore: formData.notifyDaysBefore,
      };

      // Validar con el servicio
      const validation =
        recurringExpenseService.validateRecurringExpense(recurringExpense);
      if (!validation.isValid) {
        Alert.alert("Error de validación", validation.errors.join("\n"));
        return;
      }

      await databaseService.createRecurringExpense(recurringExpense);
      console.log("Recurring expense created successfully, navigating back...");

      showToast("¡Gasto recurrente creado!", "success", {
        duration: 2000,
      });

      if (navigation.canGoBack()) navigation.goBack();
    } catch (error) {
      console.error("Error creating recurring expense:", error);
      Alert.alert(
        "Error",
        "No se pudo crear el gasto recurrente. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setFormData((prev) => ({ ...prev, startDate: selectedDate }));
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setFormData((prev) => ({ ...prev, endDate: selectedDate }));
    }
  };

  const formatCurrency = (amount: string) => {
    if (!amount) return "";
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return amount;
    return formatCurrencyUtil(numAmount);
  };

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
          <Text style={styles.title}>Crear Gasto Recurrente</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
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
                placeholderTextColor={colors.textSecondary}
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
              placeholder="Ej: Renta mensual, Netflix, Gym"
              returnKeyType="done"
              maxLength={100}
              placeholderTextColor={colors.textSecondary}
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

          {/* Frequency Configuration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuración de Frecuencia</Text>

            {/* Toggle for multiple dates */}
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => {
                setUseMultipleDates(!useMultipleDates);
                if (!useMultipleDates) {
                  setFormData((prev) => ({ ...prev, executionDates: [] }));
                }
              }}
            >
              <Ionicons
                name={useMultipleDates ? "checkbox" : "square-outline"}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.toggleText}>
                Usar fechas específicas del mes
              </Text>
            </TouchableOpacity>

            {!useMultipleDates ? (
              // Interval selection
              <View style={styles.intervalContainer}>
                <Text style={styles.label}>Repetir cada:</Text>
                <View style={styles.intervalOptions}>
                  {INTERVAL_OPTIONS.map((days) => (
                    <TouchableOpacity
                      key={days}
                      style={[
                        styles.intervalOption,
                        formData.intervalDays === days &&
                          styles.selectedInterval,
                      ]}
                      onPress={() =>
                        setFormData((prev) => ({ ...prev, intervalDays: days }))
                      }
                    >
                      <Text
                        style={[
                          styles.intervalText,
                          formData.intervalDays === days &&
                            styles.selectedIntervalText,
                        ]}
                      >
                        {days} días
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              // Multiple dates configuration
              <View style={styles.multipleDatesContainer}>
                <Text style={styles.label}>Días del mes:</Text>
                <View style={styles.addDateContainer}>
                  <TextInput
                    style={styles.dayInput}
                    value={newExecutionDay}
                    onChangeText={setNewExecutionDay}
                    placeholder="Día (1-31)"
                    keyboardType="numeric"
                    maxLength={2}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TouchableOpacity
                    style={styles.addDayButton}
                    onPress={handleAddExecutionDate}
                  >
                    <Ionicons name="add" size={20} color={colors.background} />
                  </TouchableOpacity>
                </View>

                {formData.executionDates.length > 0 && (
                  <View style={styles.selectedDates}>
                    {formData.executionDates.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={styles.selectedDate}
                        onPress={() => handleRemoveExecutionDate(day)}
                      >
                        <Text style={styles.selectedDateText}>{day}</Text>
                        <Ionicons
                          name="close"
                          size={14}
                          color={colors.background}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Start Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fecha de Inicio</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.dateText}>
                {formatDateLong(formData.startDate)}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* End Date (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fecha de Fin (Opcional)</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={styles.dateText}>
                {formData.endDate
                  ? formatDateLong(formData.endDate)
                  : "Sin límite"}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {formData.endDate && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() =>
                  setFormData((prev) => ({ ...prev, endDate: undefined }))
                }
              >
                <Text style={styles.clearDateText}>Quitar fecha límite</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notification Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notificaciones</Text>
            <Text style={styles.label}>Notificar días antes:</Text>
            <View style={styles.notificationOptions}>
              {NOTIFICATION_OPTIONS.map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.notificationOption,
                    formData.notifyDaysBefore === days &&
                      styles.selectedNotification,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, notifyDaysBefore: days }))
                  }
                >
                  <Text
                    style={[
                      styles.notificationText,
                      formData.notifyDaysBefore === days &&
                        styles.selectedNotificationText,
                    ]}
                  >
                    {days} {days === 1 ? "día" : "días"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Vista Previa</Text>
            <Text style={styles.previewText}>
              📅 Próxima ejecución:{" "}
              {formData.startDate ? calculateNextDueDate() : "N/A"}
            </Text>
            <Text style={styles.previewText}>
              🔄{" "}
              {useMultipleDates
                ? `Días ${formData.executionDates.join(", ")} del mes`
                : `Cada ${formData.intervalDays} días`}
            </Text>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={formData.startDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleStartDateChange}
              minimumDate={new Date()}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={formData.endDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleEndDateChange}
              minimumDate={formData.startDate}
            />
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
              {loading ? "Creando..." : "Crear Gasto Recurrente"}
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
      backgroundColor: colors.background,
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
      backgroundColor: colors.surface,
      ...SHADOWS.small,
    },
    backButton: {
      padding: SPACING.xs,
    },
    title: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    placeholder: {
      width: 40,
    },
    form: {
      flex: 1,
    },
    section: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: SPACING.md,
      marginVertical: SPACING.xs,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      ...SHADOWS.small,
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
    },
    label: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: SPACING.xs,
    },
    textInput: {
      fontSize: FONT_SIZES.md,
      color: colors.textPrimary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: SPACING.sm,
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
    toggleContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.md,
    },
    toggleText: {
      fontSize: FONT_SIZES.md,
      color: colors.textPrimary,
      marginLeft: SPACING.xs,
    },
    intervalContainer: {
      marginTop: SPACING.sm,
    },
    intervalOptions: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    intervalOption: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedInterval: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    intervalText: {
      fontSize: FONT_SIZES.sm,
      color: colors.textPrimary,
    },
    selectedIntervalText: {
      color: colors.background,
    },
    multipleDatesContainer: {
      marginTop: SPACING.sm,
    },
    addDateContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    dayInput: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      color: colors.textPrimary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: SPACING.sm,
    },
    addDayButton: {
      backgroundColor: colors.primary,
      width: 36,
      height: 36,
      borderRadius: BORDER_RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedDates: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.xs,
    },
    selectedDate: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.md,
      gap: 4,
    },
    selectedDateText: {
      fontSize: FONT_SIZES.sm,
      color: colors.background,
      fontWeight: "600",
    },
    dateButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dateText: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      color: colors.textPrimary,
      marginLeft: SPACING.sm,
    },
    clearDateButton: {
      marginTop: SPACING.xs,
    },
    clearDateText: {
      fontSize: FONT_SIZES.sm,
      color: colors.error,
    },
    notificationOptions: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    notificationOption: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedNotification: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    notificationText: {
      fontSize: FONT_SIZES.sm,
      color: colors.textPrimary,
    },
    selectedNotificationText: {
      color: colors.background,
    },
    previewSection: {
      backgroundColor: colors.primary + "10",
      marginHorizontal: SPACING.md,
      marginVertical: SPACING.md,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    previewTitle: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.primary,
      marginBottom: SPACING.sm,
    },
    previewText: {
      fontSize: FONT_SIZES.sm,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    buttonContainer: {
      padding: SPACING.md,
      backgroundColor: colors.surface,
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

export default AddRecurringExpenseScreen;
