import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { useSettings } from "../hooks/useSettings";
import { useSettingsActions } from "../hooks/useSettingsActions";
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

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { preferences, isPremium, updateSetting } = useSettings(isDark);
  const actions = useSettingsActions(isPremium);

  const personalizationSettings = createPersonalizationSettings(
    preferences,
    isDark,
    toggleTheme
  );
  const dataSettings = createDataSettings(actions);
  const aboutSettings = createAboutSettings(actions);

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
        />
        <SettingSection
          title="Datos"
          items={dataSettings}
          isPremiumUser={isPremium}
          onToggle={updateSetting}
        />
        <SettingSection
          title="Información"
          items={aboutSettings}
          isPremiumUser={isPremium}
          onToggle={updateSetting}
        />

        <View style={{ height: 100 }} />
      </ScrollView>
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
