import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../contexts/ThemeContext";
import { Budget } from "../../types";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

interface BudgetFormProps {
  budget?: Budget | null;
  onSave: (budgetData: any) => void;
  onCancel: () => void;
  title: string;
}

const BudgetForm: React.FC<BudgetFormProps> = ({
  budget,
  onSave,
  onCancel,
  title,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState(budget?.amount?.toString() || "");
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'custom'>(
    budget?.period || 'monthly'
  );
  const [startDate, setStartDate] = useState<Date>(
    budget?.startDate ? new Date(budget.startDate) : new Date()
  );
  const [endDate, setEndDate] = useState<Date>(
    budget?.endDate ? new Date(budget.endDate) : getDefaultEndDate(budget?.period || 'monthly')
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  function getDefaultEndDate(periodType: string = 'monthly') {
    const date = new Date();

    switch (periodType) {
      case 'weekly':
        const weekEnd = new Date(date);
        weekEnd.setDate(date.getDate() + (6 - date.getDay())); // Domingo
        return weekEnd;

      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3);
        const quarterEndMonth = (quarter + 1) * 3 - 1;
        return new Date(date.getFullYear(), quarterEndMonth + 1, 0);

      case 'custom':
        const customEnd = new Date(date);
        customEnd.setMonth(date.getMonth() + 1);
        return customEnd;

      case 'monthly':
      default:
        return new Date(date.getFullYear(), date.getMonth() + 1, 0); // Último día del mes actual
    }
  }

  const styles = createStyles(colors, insets);

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    return new Intl.NumberFormat("es-CO").format(parseInt(numericValue) || 0);
  };

  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    setAmount(numericValue);
  };

  const handlePeriodChange = (newPeriod: 'weekly' | 'monthly' | 'quarterly' | 'custom') => {
    setPeriod(newPeriod);

    // Auto-update end date based on new period unless it's custom
    if (newPeriod !== 'custom') {
      setEndDate(getDefaultEndDate(newPeriod));
    }
  };

  const handleSave = () => {
    const numericAmount = parseInt(amount.replace(/[^0-9]/g, ""));

    if (!numericAmount || numericAmount <= 0) {
      Alert.alert("Error", "Por favor ingresa un monto válido");
      return;
    }

    if (startDate >= endDate) {
      Alert.alert("Error", "La fecha de fin debe ser posterior a la fecha de inicio");
      return;
    }

    const budgetData = {
      amount: numericAmount,
      period: period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };

    onSave(budgetData);
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      // Ajustar fecha de fin si es necesario
      if (selectedDate >= endDate) {
        const newEndDate = new Date(selectedDate);
        newEndDate.setMonth(selectedDate.getMonth() + 1);
        newEndDate.setDate(0); // Último día del mes
        setEndDate(newEndDate);
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monto del Presupuesto</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>
              $
            </Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={formatCurrency(amount)}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Establece tu límite de gasto para este período
          </Text>
        </View>

        {/* Period Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Tipo de Período</Text>
          <View style={styles.periodOptions}>
            {[
              { key: 'weekly', label: 'Semanal', icon: 'calendar-outline' },
              { key: 'monthly', label: 'Mensual', icon: 'calendar' },
              { key: 'quarterly', label: 'Trimestral', icon: 'calendar-sharp' },
              { key: 'custom', label: 'Personalizado', icon: 'create-outline' }
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.periodOption,
                  { backgroundColor: colors.surface },
                  period === option.key && { backgroundColor: colors.primary }
                ]}
                onPress={() => handlePeriodChange(option.key as any)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={period === option.key ? colors.background : colors.primary}
                />
                <Text style={[
                  styles.periodOptionText,
                  { color: period === option.key ? colors.background : colors.textPrimary }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            {period === 'weekly' && 'Presupuesto para una semana (Lun-Dom)'}
            {period === 'monthly' && 'Presupuesto mensual (por defecto)'}
            {period === 'quarterly' && 'Presupuesto trimestral (3 meses)'}
            {period === 'custom' && 'Define fechas personalizadas'}
          </Text>
        </View>

        {/* Date Range */}
        <View style={styles.dateSection}>
          <Text style={styles.sectionTitle}>Período del Presupuesto</Text>

          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.surface }]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <View style={styles.dateButtonContent}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <View style={styles.dateButtonText}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                  Fecha de inicio
                </Text>
                <Text style={[styles.dateValue, { color: colors.textPrimary }]}>
                  {startDate.toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dateButton,
              { backgroundColor: colors.surface },
              period !== 'custom' && { opacity: 0.6 }
            ]}
            onPress={() => period === 'custom' && setShowEndDatePicker(true)}
            disabled={period !== 'custom'}
          >
            <View style={styles.dateButtonContent}>
              <Ionicons
                name="calendar"
                size={20}
                color={period === 'custom' ? colors.primary : colors.textSecondary}
              />
              <View style={styles.dateButtonText}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                  Fecha de fin
                  {period !== 'custom' && ' (automática)'}
                </Text>
                <Text style={[styles.dateValue, { color: colors.textPrimary }]}>
                  {endDate.toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
            <Ionicons
              name={period === 'custom' ? 'chevron-forward' : 'lock-closed'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Duration Info */}
        <View style={[styles.durationInfo, { backgroundColor: colors.primary + '10' }]}>
          <Ionicons name="time" size={20} color={colors.primary} />
          <Text style={[styles.durationText, { color: colors.primary }]}>
            Duración: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} días
          </Text>
        </View>
      </View>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onStartDateChange}
          minimumDate={new Date()}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onEndDateChange}
          minimumDate={startDate}
        />
      )}
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
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    cancelButton: {
      padding: SPACING.xs,
    },
    cancelButtonText: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
    },
    saveButton: {
      padding: SPACING.xs,
    },
    saveButtonText: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.primary,
    },
    form: {
      flex: 1,
      padding: SPACING.lg,
    },
    inputGroup: {
      marginBottom: SPACING.xl,
    },
    label: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: SPACING.sm,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: BORDER_RADIUS.lg,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    currencySymbol: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "600",
      marginRight: SPACING.xs,
    },
    input: {
      flex: 1,
      fontSize: FONT_SIZES.lg,
      fontWeight: "600",
      textAlign: "right",
    },
    helperText: {
      fontSize: FONT_SIZES.sm,
      marginTop: SPACING.xs,
      fontStyle: "italic",
    },
    periodOptions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginBottom: SPACING.xs,
    },
    periodOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.lg,
      minWidth: "45%",
    },
    periodOptionText: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "500",
      marginLeft: SPACING.xs,
    },
    dateSection: {
      marginBottom: SPACING.xl,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: SPACING.md,
    },
    dateButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
    },
    dateButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    dateButtonText: {
      marginLeft: SPACING.sm,
      flex: 1,
    },
    dateLabel: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "500",
    },
    dateValue: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      marginTop: 2,
    },
    durationInfo: {
      flexDirection: "row",
      alignItems: "center",
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
    },
    durationText: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "600",
      marginLeft: SPACING.sm,
    },
  });

export default BudgetForm;