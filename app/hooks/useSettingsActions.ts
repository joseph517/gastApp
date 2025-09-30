import { Alert } from "react-native";
import { useExpenseStore } from "../store/expenseStore";

export const useSettingsActions = (
  isPremium: boolean,
  onUpgradePress?: () => void
) => {
  const { clearAllData } = useExpenseStore();

  const handleExportData = () => {
    if (!isPremium) {
      showPremiumAlert("La exportación de datos");
      return;
    }
    // TODO: Implementar exportación
  };

  const handleBackupData = () => {
    Alert.alert("Información", "Función próximamente disponible");
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      "Eliminar todos los datos",
      "¿Estás seguro? Esta acción eliminará todos los gastos y datos de la aplicación. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert(
                "Datos eliminados",
                "Todos los datos han sido eliminados exitosamente",
                [{ text: "OK" }]
              );
            } catch (error) {
              console.error("Error deleting all data:", error);
              Alert.alert(
                "Error",
                "Hubo un error al eliminar los datos. Inténtalo de nuevo."
              );
            }
          },
        },
      ]
    );
  };

  const handleUpgradeToPremium = () => {
    if (onUpgradePress) {
      onUpgradePress();
    }
  };

  const handleHelp = () => {
    Alert.alert("Información", "Función próximamente disponible");
  };

  const handleAbout = () => {
    Alert.alert("GastApp v1.0.0", "App de gestión de gastos personales");
  };

  const showPremiumAlert = (featureName: string) => {
    Alert.alert(
      "Función Premium",
      `${featureName} está disponible solo en la versión Premium.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Ver Premium", style: "default" },
      ]
    );
  };

  return {
    handleExportData,
    handleBackupData,
    handleDeleteAllData,
    handleUpgradeToPremium,
    handleHelp,
    handleAbout,
  };
};