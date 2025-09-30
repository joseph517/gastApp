import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { useSettings } from "../hooks/useSettings";
import { useSettingsActions } from "../hooks/useSettingsActions";
import { useExpenseStore } from "../store/expenseStore";
import {
  SettingSection,
  AccountCard,
  SettingsHeader,
} from "../components/settings";
import {
  createPersonalizationSettings,
  createDataSettings,
  createAboutSettings,
} from "../config/settingsConfig";
import PremiumUpgradeModal from "../components/PremiumUpgradeModal";

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { preferences, updateSetting } = useSettings(isDark);
  const { isPremium, upgradeToPremium } = useExpenseStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgradePress = () => {
    setShowUpgradeModal(true);
  };

  const actions = useSettingsActions(isPremium, handleUpgradePress);

  const personalizationSettings = createPersonalizationSettings(
    preferences,
    isDark,
    toggleTheme
  );
  const dataSettings = createDataSettings(actions);
  const aboutSettings = createAboutSettings(actions, isPremium);

  const handleUpgradeSuccess = async () => {
    await upgradeToPremium();
  };

  const styles = createStyles(colors, insets);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHeader isPremium={isPremium} />
        <AccountCard isPremium={isPremium} />

        <SettingSection
          title="Personalización"
          items={personalizationSettings}
          isPremiumUser={isPremium}
          onToggle={updateSetting}
          onUpgradePress={handleUpgradePress}
        />
        <SettingSection
          title="Datos"
          items={dataSettings}
          isPremiumUser={isPremium}
          onToggle={updateSetting}
          onUpgradePress={handleUpgradePress}
        />
        <SettingSection
          title="Información"
          items={aboutSettings}
          isPremiumUser={isPremium}
          onToggle={updateSetting}
          onUpgradePress={handleUpgradePress}
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      <PremiumUpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgradeSuccess={handleUpgradeSuccess}
      />
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
    scrollView: {
      flex: 1,
    },
  });

export default SettingsScreen;
