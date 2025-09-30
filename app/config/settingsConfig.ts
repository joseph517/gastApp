import { SettingItemData } from "../components/settings/SettingItem";

export const createPersonalizationSettings = (
  preferences: any,
  isDark: boolean,
  toggleTheme: () => void
): SettingItemData[] => [
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
    featureId: "currency-selector",
  },
];

export const createDataSettings = (actions: {
  handleExportData: () => void;
  handleBackupData: () => void;
  handleDeleteAllData: () => void;
}): SettingItemData[] => [
  {
    id: "exportData",
    title: "Exportar Datos",
    subtitle: "Descargar gastos en Excel/PDF",
    type: "action",
    icon: "download-outline",
    isPremium: true,
    featureId: "export-data-settings",
    onPress: actions.handleExportData,
  },
  {
    id: "backup",
    title: "Respaldar Datos",
    subtitle: "Guardar en la nube",
    type: "action",
    icon: "cloud-upload-outline",
    isPremium: true,
    featureId: "cloud-backup",
    onPress: actions.handleBackupData,
  },
  {
    id: "deleteData",
    title: "Eliminar Todos los Datos",
    subtitle: "Borrar historial completo",
    type: "action",
    icon: "trash-outline",
    onPress: actions.handleDeleteAllData,
  },
];

export const createAboutSettings = (
  actions: {
    handleUpgradeToPremium: () => void;
    handleHelp: () => void;
    handleAbout: () => void;
  },
  isPremium: boolean
): SettingItemData[] => {
  const settings: SettingItemData[] = [];

  // Solo mostrar upgrade si NO es premium
  if (!isPremium) {
    settings.push({
      id: "premium",
      title: "Upgrade a Premium",
      subtitle: "Desbloquear todas las funciones",
      type: "navigation",
      icon: "diamond-outline",
      onPress: actions.handleUpgradeToPremium,
    });
  }

  settings.push(
    {
      id: "help",
      title: "Ayuda y Soporte",
      subtitle: "FAQ y contacto",
      type: "navigation",
      icon: "help-circle-outline",
      onPress: actions.handleHelp,
    },
    {
      id: "about",
      title: "Acerca de GastApp",
      subtitle: "Versión 1.0.0",
      type: "navigation",
      icon: "information-circle-outline",
      onPress: actions.handleAbout,
    }
  );

  return settings;
};
