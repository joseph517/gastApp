import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { databaseService } from "../database/database";
import { UserPreferences } from "../types";

const DEFAULT_PREFERENCES: UserPreferences = {
  currency: "COP",
  dateFormat: "DD/MM/YYYY",
  firstDayOfWeek: 1,
  notifications: true,
  darkMode: false,
};

export const useSettings = (isDarkMode: boolean) => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const allSettings = await databaseService.getAllSettings();

      const loadedPreferences: UserPreferences = {
        currency: (allSettings.currency || DEFAULT_PREFERENCES.currency) as "COP",
        dateFormat: (allSettings.dateFormat || DEFAULT_PREFERENCES.dateFormat) as "DD/MM/YYYY",
        firstDayOfWeek: parseInt(allSettings.firstDayOfWeek || DEFAULT_PREFERENCES.firstDayOfWeek.toString()) as 0 | 1,
        notifications: allSettings.notifications === "true",
        darkMode: isDarkMode,
      };

      const premium = allSettings.isPremium === "true";

      setPreferences(loadedPreferences);
      setIsPremium(premium);
    } catch (error) {
      console.error("Error loading settings:", error);
      Alert.alert("Error", "No se pudieron cargar las configuraciones");
    } finally {
      setLoading(false);
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

  return {
    preferences,
    isPremium,
    loading,
    updateSetting,
    loadSettings,
  };
};