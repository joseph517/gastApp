import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../constants/colors";
import { databaseService } from "../database/database";
import { UserPreferences } from "../types";

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  type: "toggle" | "select" | "navigation" | "action";
  icon: keyof typeof Ionicons.glyphMap;
  value?: any;
  options?: { label: string; value: any }[];
  isPremium?: boolean;
  onPress?: () => void;
}

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences>({
    currency: "COP",
    dateFormat: "DD/MM/YYYY",
    firstDayOfWeek: 1,
    notifications: true,
    darkMode: false,
  });

  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const allSettings = await databaseService.getAllSettings();

      const currency = allSettings.currency || "COP";
      const dateFormat = allSettings.dateFormat || "DD/MM/YYYY";
      const firstDayOfWeek = parseInt(allSettings.firstDayOfWeek || "1");
      const notifications = allSettings.notifications === "true";
      const premium = allSettings.isPremium === "true";

      setPreferences({
        currency: currency as "COP",
        dateFormat: dateFormat as "DD/MM/YYYY",
        firstDayOfWeek: firstDayOfWeek as 0 | 1,
        notifications,
        darkMode: isDark, // Use theme context instead of database directly
      });

      setIsPremium(premium);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      await databaseService.setSetting(key, value.toString());

      setPreferences((prev) => ({
        ...prev,
        [key]: value,
      }));
    } catch (error) {
      console.error("Error updating setting:", error);
      Alert.alert("Error", "No se pudo guardar la configuración");
    }
  };

  const handleExportData = () => {
    if (!isPremium) {
      Alert.alert(
        "Función Premium",
        "La exportación de datos está disponible solo en la versión Premium.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Ver Premium", style: "default" },
        ]
      );
      return;
    }
    // Implementar exportación
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      "Eliminar todos los datos",
      "¿Estás seguro? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            // Implementar eliminación de datos
            Alert.alert(
              "Información",
              "Esta función estará disponible próximamente"
            );
          },
        },
      ]
    );
  };

  const settings: SettingItem[] = [
    // Personalization
    {
      id: "notifications",
      title: "Notificaciones",
      subtitle: "Recibe recordatorios y alertas",
      type: "toggle",
      icon: "notifications-outline",
      value: preferences.notifications,
    },
    {
      id: "darkMode",
      title: "Modo Oscuro",
      subtitle: isDark ? "Activado" : "Desactivado",
      type: "toggle",
      icon: isDark ? "moon" : "moon-outline",
      value: isDark,
      onPress: toggleTheme,
    },
    {
      id: "currency",
      title: "Moneda",
      subtitle: `Actual: ${preferences.currency}`,
      type: "select",
      icon: "card-outline",
      value: preferences.currency,
      options: [
        { label: "Peso Colombiano (COP)", value: "COP" },
        { label: "Dólar (USD)", value: "USD" },
        { label: "Euro (EUR)", value: "EUR" },
      ],
      isPremium: true,
    },
    {
      id: "dateFormat",
      title: "Formato de Fecha",
      subtitle: `Actual: ${preferences.dateFormat}`,
      type: "select",
      icon: "calendar-outline",
      value: preferences.dateFormat,
      options: [
        { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
        { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
      ],
    },
  ];

  const dataSettings: SettingItem[] = [
    {
      id: "exportData",
      title: "Exportar Datos",
      subtitle: "Descargar gastos en Excel/PDF",
      type: "action",
      icon: "download-outline",
      isPremium: true,
      onPress: handleExportData,
    },
    {
      id: "backup",
      title: "Respaldar Datos",
      subtitle: "Guardar en la nube (próximamente)",
      type: "action",
      icon: "cloud-upload-outline",
      isPremium: true,
      onPress: () =>
        Alert.alert("Información", "Función próximamente disponible"),
    },
    {
      id: "deleteData",
      title: "Eliminar Todos los Datos",
      subtitle: "Borrar historial completo",
      type: "action",
      icon: "trash-outline",
      onPress: handleDeleteAllData,
    },
  ];

  const aboutSettings: SettingItem[] = [
    {
      id: "premium",
      title: "Upgrade a Premium",
      subtitle: "Desbloquear todas las funciones",
      type: "navigation",
      icon: "diamond-outline",
      onPress: () =>
        Alert.alert("Información", "Función próximamente disponible"),
    },
    {
      id: "help",
      title: "Ayuda y Soporte",
      subtitle: "FAQ y contacto",
      type: "navigation",
      icon: "help-circle-outline",
      onPress: () =>
        Alert.alert("Información", "Función próximamente disponible"),
    },
    {
      id: "about",
      title: "Acerca de GastApp",
      subtitle: "Versión 1.0.0",
      type: "navigation",
      icon: "information-circle-outline",
      onPress: () =>
        Alert.alert("GastApp v1.0.0", "App de gestión de gastos personales"),
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    const isDisabled = item.isPremium && !isPremium;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.settingItem, isDisabled && styles.disabledItem]}
        onPress={() => {
          if (isDisabled) {
            Alert.alert(
              "Función Premium",
              `${item.title} está disponible solo en la versión Premium.`,
              [
                { text: "Cancelar", style: "cancel" },
                { text: "Ver Premium", style: "default" },
              ]
            );
            return;
          }

          if (item.type === "toggle") {
            if (item.id === "darkMode" && item.onPress) {
              item.onPress(); // Use theme context for dark mode
            } else {
              updateSetting(item.id, !item.value);
            }
          } else if (item.onPress) {
            item.onPress();
          }
        }}
        disabled={item.type === "toggle" && isDisabled}
      >
        <View style={styles.settingLeft}>
          <View
            style={[styles.iconContainer, isDisabled && styles.disabledIcon]}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={isDisabled ? colors.gray400 : colors.primary}
            />
          </View>
          <View style={styles.settingText}>
            <Text
              style={[styles.settingTitle, isDisabled && styles.disabledText]}
            >
              {item.title}
              {item.isPremium && " 💎"}
            </Text>
            {item.subtitle && (
              <Text
                style={[
                  styles.settingSubtitle,
                  isDisabled && styles.disabledSubtitle,
                ]}
              >
                {item.subtitle}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.settingRight}>
          {item.type === "toggle" && (
            <Switch
              value={item.value}
              onValueChange={(value) => {
                if (!isDisabled) {
                  if (item.id === "darkMode" && item.onPress) {
                    item.onPress(); // Use theme context for dark mode
                  } else {
                    updateSetting(item.id, value);
                  }
                }
              }}
              trackColor={{
                false: colors.gray200,
                true: colors.primary + "40",
              }}
              thumbColor={item.value ? colors.primary : colors.gray400}
              disabled={isDisabled}
            />
          )}
          {(item.type === "navigation" ||
            item.type === "action" ||
            item.type === "select") && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDisabled ? colors.gray300 : colors.gray400}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const SettingSection = ({
    title,
    items,
  }: {
    title: string;
    items: SettingItem[];
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{items.map(renderSettingItem)}</View>
    </View>
  );

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Configuración</Text>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>💎 Premium</Text>
            </View>
          )}
        </View>

        {/* Account Info */}
        <View style={styles.accountCard}>
          <View style={styles.accountIcon}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>Usuario Local</Text>
            <Text style={styles.accountType}>
              {isPremium ? "Cuenta Premium" : "Cuenta Gratuita"}
            </Text>
          </View>
        </View>

        {/* Settings Sections */}
        <SettingSection title="Personalización" items={settings} />
        <SettingSection title="Datos" items={dataSettings} />
        <SettingSection title="Información" items={aboutSettings} />

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.lg,
    },
    title: {
      fontSize: FONT_SIZES.xxl,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    premiumBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.sm,
    },
    premiumText: {
      fontSize: FONT_SIZES.xs,
      color: colors.background,
      fontWeight: "600",
    },
    accountCard: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.lg,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      flexDirection: "row",
      alignItems: "center",
      ...SHADOWS.small,
    },
    accountIcon: {
      width: 50,
      height: 50,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: colors.primary + "20",
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.md,
    },
    accountInfo: {
      flex: 1,
    },
    accountName: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 2,
    },
    accountType: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: SPACING.lg,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.textSecondary,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.sm,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    sectionContent: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      ...SHADOWS.small,
    },
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    disabledItem: {
      opacity: 0.6,
    },
    settingLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.primary + "10",
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.sm,
    },
    disabledIcon: {
      backgroundColor: colors.gray100,
    },
    settingText: {
      flex: 1,
    },
    settingTitle: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 2,
    },
    disabledText: {
      color: colors.gray400,
    },
    settingSubtitle: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
    },
    disabledSubtitle: {
      color: colors.gray300,
    },
    settingRight: {
      alignItems: "center",
      justifyContent: "center",
    },
  });

export default SettingsScreen;
