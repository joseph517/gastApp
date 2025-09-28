import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { databaseService } from "../../database/database";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

interface BudgetSettings {
  autoRollover: boolean;
  rolloverPercentage: number;
  weeklyNotifications: boolean;
  dailyLimitWarnings: boolean;
  predictiveAlerts: boolean;
  strictMode: boolean;
  categoryLimits: { [category: string]: number };
  overspendingAction: 'warn' | 'block' | 'auto_adjust';
  budgetStartDay: number; // 1 = Monday, 0 = Sunday
  emergencyBuffer: number; // Percentage
  goalSavings: number; // Monthly savings goal
}

interface BudgetSettingsCardProps {
  onClose?: () => void;
}

const BudgetSettingsCard: React.FC<BudgetSettingsCardProps> = ({
  onClose,
}) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<BudgetSettings>({
    autoRollover: false,
    rolloverPercentage: 20,
    weeklyNotifications: true,
    dailyLimitWarnings: true,
    predictiveAlerts: true,
    strictMode: false,
    categoryLimits: {},
    overspendingAction: 'warn',
    budgetStartDay: 1,
    emergencyBuffer: 10,
    goalSavings: 0,
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryLimits, setShowCategoryLimits] = useState(false);

  useEffect(() => {
    loadSettings();
    loadCategories();
  }, []);

  const loadSettings = async () => {
    try {
      // Load existing settings from database
      const savedSettings = await databaseService.getSetting('budgetSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...settings, ...parsedSettings });
      }
    } catch (error) {
      console.error('Error loading budget settings:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const allCategories = await databaseService.getCategories();
      setCategories(allCategories.map(cat => cat.name));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      await databaseService.setSetting('budgetSettings', JSON.stringify(settings));
      Alert.alert('Éxito', 'Configuraciones guardadas correctamente');
    } catch (error) {
      console.error('Error saving budget settings:', error);
      Alert.alert('Error', 'No se pudieron guardar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    Alert.alert(
      'Restablecer Configuraciones',
      '¿Estás seguro de que deseas restablecer todas las configuraciones a sus valores por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: () => {
            setSettings({
              autoRollover: false,
              rolloverPercentage: 20,
              weeklyNotifications: true,
              dailyLimitWarnings: true,
              predictiveAlerts: true,
              strictMode: false,
              categoryLimits: {},
              overspendingAction: 'warn',
              budgetStartDay: 1,
              emergencyBuffer: 10,
              goalSavings: 0,
            });
          },
        },
      ]
    );
  };

  const updateSetting = (key: keyof BudgetSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateCategoryLimit = (category: string, limit: string) => {
    const numericLimit = parseInt(limit.replace(/[^0-9]/g, ''));
    setSettings(prev => ({
      ...prev,
      categoryLimits: {
        ...prev.categoryLimits,
        [category]: numericLimit || 0
      }
    }));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatInput = (value: string): string => {
    const numericValue = value.replace(/[^0-9]/g, "");
    return new Intl.NumberFormat("es-CO").format(parseInt(numericValue) || 0);
  };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Configuraciones Avanzadas
        </Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Auto-Rollover Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Transferencia Automática
          </Text>

          <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <View style={styles.settingContent}>
              <Ionicons name="refresh" size={20} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Auto-transferencia
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Transferir dinero no gastado al próximo período
                </Text>
              </View>
            </View>
            <Switch
              value={settings.autoRollover}
              onValueChange={(value) => updateSetting('autoRollover', value)}
              trackColor={{ false: colors.border, true: colors.primary + '30' }}
              thumbColor={settings.autoRollover ? colors.primary : colors.textSecondary}
            />
          </View>

          {settings.autoRollover && (
            <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
              <View style={styles.settingContent}>
                <Ionicons name="percent" size={20} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                    Porcentaje a transferir
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    Máximo {settings.rolloverPercentage}% del presupuesto
                  </Text>
                </View>
              </View>
              <TextInput
                style={[styles.numberInput, { backgroundColor: colors.background, color: colors.textPrimary }]}
                value={settings.rolloverPercentage.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 0;
                  updateSetting('rolloverPercentage', Math.min(100, Math.max(0, num)));
                }}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          )}
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Notificaciones
          </Text>

          <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <View style={styles.settingContent}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Reportes semanales
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Recibir resumen de gastos cada semana
                </Text>
              </View>
            </View>
            <Switch
              value={settings.weeklyNotifications}
              onValueChange={(value) => updateSetting('weeklyNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primary + '30' }}
              thumbColor={settings.weeklyNotifications ? colors.primary : colors.textSecondary}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <View style={styles.settingContent}>
              <Ionicons name="warning" size={20} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Alertas de límite diario
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Avisar cuando excedas el gasto diario recomendado
                </Text>
              </View>
            </View>
            <Switch
              value={settings.dailyLimitWarnings}
              onValueChange={(value) => updateSetting('dailyLimitWarnings', value)}
              trackColor={{ false: colors.border, true: colors.primary + '30' }}
              thumbColor={settings.dailyLimitWarnings ? colors.primary : colors.textSecondary}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <View style={styles.settingContent}>
              <Ionicons name="analytics" size={20} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Alertas predictivas
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Predicciones de gastos basadas en patrones
                </Text>
              </View>
            </View>
            <Switch
              value={settings.predictiveAlerts}
              onValueChange={(value) => updateSetting('predictiveAlerts', value)}
              trackColor={{ false: colors.border, true: colors.primary + '30' }}
              thumbColor={settings.predictiveAlerts ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Budget Controls */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Control de Presupuesto
          </Text>

          <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <View style={styles.settingContent}>
              <Ionicons name="shield" size={20} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Modo estricto
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Bloquear gastos que excedan el presupuesto
                </Text>
              </View>
            </View>
            <Switch
              value={settings.strictMode}
              onValueChange={(value) => updateSetting('strictMode', value)}
              trackColor={{ false: colors.border, true: colors.primary + '30' }}
              thumbColor={settings.strictMode ? colors.primary : colors.textSecondary}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <View style={styles.settingContent}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Día de inicio semanal
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Actualmente: {dayNames[settings.budgetStartDay]}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: colors.background }]}
              onPress={() => {
                Alert.alert(
                  'Día de inicio',
                  'Selecciona el día de inicio para presupuestos semanales',
                  dayNames.map((day, index) => ({
                    text: day,
                    onPress: () => updateSetting('budgetStartDay', index)
                  }))
                );
              }}
            >
              <Text style={[styles.selectButtonText, { color: colors.primary }]}>
                {dayNames[settings.budgetStartDay]}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <View style={styles.settingContent}>
              <Ionicons name="umbrella" size={20} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Buffer de emergencia
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Reservar {settings.emergencyBuffer}% para gastos inesperados
                </Text>
              </View>
            </View>
            <TextInput
              style={[styles.numberInput, { backgroundColor: colors.background, color: colors.textPrimary }]}
              value={settings.emergencyBuffer.toString()}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                updateSetting('emergencyBuffer', Math.min(50, Math.max(0, num)));
              }}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
        </View>

        {/* Category Limits */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowCategoryLimits(!showCategoryLimits)}
          >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Límites por Categoría
            </Text>
            <Ionicons
              name={showCategoryLimits ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showCategoryLimits && (
            <View>
              {categories.map((category) => (
                <View key={category} style={[styles.categoryLimitItem, { backgroundColor: colors.surface }]}>
                  <View style={styles.categoryLimitContent}>
                    <Text style={[styles.categoryName, { color: colors.textPrimary }]}>
                      {category}
                    </Text>
                    <Text style={[styles.categoryLimitDesc, { color: colors.textSecondary }]}>
                      Límite mensual opcional
                    </Text>
                  </View>
                  <View style={styles.categoryLimitInput}>
                    <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>$</Text>
                    <TextInput
                      style={[styles.categoryInput, { backgroundColor: colors.background, color: colors.textPrimary }]}
                      value={formatInput((settings.categoryLimits[category] || 0).toString())}
                      onChangeText={(text) => updateCategoryLimit(category, text)}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Savings Goal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Meta de Ahorro
          </Text>

          <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
            <View style={styles.settingContent}>
              <Ionicons name="trending-up" size={20} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Meta mensual de ahorro
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  {settings.goalSavings > 0 ? formatCurrency(settings.goalSavings) : 'No establecida'}
                </Text>
              </View>
            </View>
            <View style={styles.currencyInputContainer}>
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>$</Text>
              <TextInput
                style={[styles.currencyInput, { backgroundColor: colors.background, color: colors.textPrimary }]}
                value={formatInput(settings.goalSavings.toString())}
                onChangeText={(text) => {
                  const numericValue = parseInt(text.replace(/[^0-9]/g, ''));
                  updateSetting('goalSavings', numericValue || 0);
                }}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.surface }]}
            onPress={resetSettings}
          >
            <Ionicons name="refresh" size={20} color={colors.error} />
            <Text style={[styles.resetButtonText, { color: colors.error }]}>
              Restablecer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={saveSettings}
            disabled={loading}
          >
            <Ionicons name="save" size={20} color={colors.background} />
            <Text style={[styles.saveButtonText, { color: colors.background }]}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
  },
  closeButton: {
    padding: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  settingTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: FONT_SIZES.xs,
  },
  numberInput: {
    width: 60,
    textAlign: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  selectButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 60,
  },
  selectButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    textAlign: "center",
  },
  categoryLimitItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  categoryLimitContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    marginBottom: 2,
  },
  categoryLimitDesc: {
    fontSize: FONT_SIZES.xs,
  },
  categoryLimitInput: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryInput: {
    width: 100,
    textAlign: "right",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  currencySymbol: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  currencyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencyInput: {
    width: 120,
    textAlign: "right",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.md,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    flex: 1,
    marginRight: SPACING.sm,
    justifyContent: "center",
  },
  resetButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    flex: 1,
    marginLeft: SPACING.sm,
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
});

export default BudgetSettingsCard;