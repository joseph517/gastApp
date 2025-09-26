import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from "../../constants/colors";

interface SettingsHeaderProps {
  isPremium: boolean;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  isPremium,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>
      {isPremium && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumText}>💎 Premium</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
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
  });