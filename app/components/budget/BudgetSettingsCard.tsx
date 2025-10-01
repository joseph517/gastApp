import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { databaseService } from "../../database/database";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/colors";
import CategoryLimitItem from "./CategoryLimitItem";
import { useToast } from "../../contexts/ToastContext";

interface BudgetSettings {
  categoryLimits: { [category: string]: number };
  emergencyBuffer: number; // Porcentaje 0-50
}

interface BudgetSettingsCardProps {
  onClose?: () => void;
  onSettingsUpdated?: () => void;
}

const DEFAULT_SETTINGS: BudgetSettings = {
  categoryLimits: {},
  emergencyBuffer: 10,
};

const BudgetSettingsCard: React.FC<BudgetSettingsCardProps> = ({
  onClose,
  onSettingsUpdated
}) => {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<BudgetSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryLimits, setShowCategoryLimits] = useState(false);

  useEffect(() => {
    loadSettings();
    loadCategories();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await databaseService.getSetting("budgetSettings");
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsedSettings
        });
      }
    } catch (error) {
      console.error("Error loading budget settings:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const allCategories = await databaseService.getCategories();
      setCategories(allCategories.map((cat) => cat.name));
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      await databaseService.setSetting(
        "budgetSettings",
        JSON.stringify(settings)
      );

      // Notificar al padre para actualizar gráfica
      onSettingsUpdated?.();

      // Mostrar toast de éxito
      showToast("Configuraciones guardadas correctamente", "success", {
        duration: 2000,
      });
    } catch (error) {
      console.error("Error saving budget settings:", error);
      showToast("Error al guardar las configuraciones", "error", {
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    Alert.alert(
      "Restablecer Configuraciones",
      "¿Estás seguro de que deseas restablecer todas las configuraciones a sus valores por defecto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restablecer",
          style: "destructive",
          onPress: async () => {
            try {
              setSettings(DEFAULT_SETTINGS);

              // Guardar en BD inmediatamente
              await databaseService.setSetting(
                "budgetSettings",
                JSON.stringify(DEFAULT_SETTINGS)
              );

              // Notificar al padre para actualizar gráfica
              onSettingsUpdated?.();

              // Mostrar toast de éxito
              showToast("Configuraciones restablecidas", "success", {
                duration: 2000,
              });
            } catch (error) {
              console.error("Error resetting settings:", error);
              showToast("Error al restablecer configuraciones", "error", {
                duration: 2000,
              });
            }
          },
        },
      ]
    );
  };

  const updateEmergencyBuffer = (value: string) => {
    const num = parseInt(value) || 0;
    setSettings((prev) => ({
      ...prev,
      emergencyBuffer: Math.min(50, Math.max(0, num)),
    }));
  };

  const updateCategoryLimit = (category: string, limit: number) => {
    setSettings((prev) => ({
      ...prev,
      categoryLimits: {
        ...prev.categoryLimits,
        [category]: limit,
      },
    }));
  };

  const clearCategoryLimit = (category: string) => {
    setSettings((prev) => {
      const newLimits = { ...prev.categoryLimits };
      delete newLimits[category];
      return {
        ...prev,
        categoryLimits: newLimits,
      };
    });
  };

  const clearAllLimits = () => {
    Alert.alert(
      "Limpiar Límites",
      "¿Estás seguro de que deseas eliminar todos los límites por categoría?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpiar",
          style: "destructive",
          onPress: () => {
            setSettings((prev) => ({
              ...prev,
              categoryLimits: {},
            }));
          },
        },
      ]
    );
  };

  const activeLimitsCount = Object.values(settings.categoryLimits).filter(
    (limit) => limit > 0
  ).length;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
    >
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
        {/* Emergency Buffer */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Control de Presupuesto
          </Text>

          <View
            style={[styles.settingItem, { backgroundColor: colors.surface }]}
          >
            <View style={styles.settingContent}>
              <Ionicons name="umbrella" size={20} color={colors.primary} />
              <View style={styles.settingText}>
                <Text
                  style={[styles.settingTitle, { color: colors.textPrimary }]}
                >
                  Buffer de emergencia
                </Text>
                <Text
                  style={[styles.settingDesc, { color: colors.textSecondary }]}
                >
                  Reservar {settings.emergencyBuffer}% para gastos inesperados
                </Text>
              </View>
            </View>
            <TextInput
              style={[
                styles.numberInput,
                {
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                },
              ]}
              value={settings.emergencyBuffer.toString()}
              onChangeText={updateEmergencyBuffer}
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
            <View style={styles.sectionTitleContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Límites por Categoría
              </Text>
              {activeLimitsCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.badgeText, { color: colors.background }]}>
                    {activeLimitsCount}
                  </Text>
                </View>
              )}
            </View>
            <Ionicons
              name={showCategoryLimits ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showCategoryLimits && (
            <View style={styles.categoryLimitsContainer}>
              {activeLimitsCount > 0 && (
                <TouchableOpacity
                  style={[styles.clearAllButton, { backgroundColor: colors.surface }]}
                  onPress={clearAllLimits}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={[styles.clearAllText, { color: colors.error }]}>
                    Limpiar todos los límites
                  </Text>
                </TouchableOpacity>
              )}

              {categories.map((category) => (
                <CategoryLimitItem
                  key={category}
                  category={category}
                  limit={settings.categoryLimits[category] || 0}
                  onLimitChange={updateCategoryLimit}
                  onClear={clearCategoryLimit}
                />
              ))}
            </View>
          )}
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
              {loading ? "Guardando..." : "Guardar"}
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
    marginBottom: SPACING.sm,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "700",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
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
  categoryLimitsContainer: {
    marginTop: SPACING.sm,
  },
  clearAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  clearAllText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
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
