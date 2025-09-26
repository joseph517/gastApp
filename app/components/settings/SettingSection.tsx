import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { SettingItem, SettingItemData } from "./SettingItem";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/colors";

interface SettingSectionProps {
  title: string;
  items: SettingItemData[];
  isPremiumUser: boolean;
  onToggle?: (id: string, value: any) => void;
}

export const SettingSection: React.FC<SettingSectionProps> = ({
  title,
  items,
  isPremiumUser,
  onToggle,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>
        {items.map((item) => (
          <SettingItem
            key={item.id}
            item={item}
            isPremiumUser={isPremiumUser}
            onToggle={onToggle}
          />
        ))}
      </View>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      marginBottom: SPACING.lg,
    },
    title: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.textSecondary,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.sm,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    content: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      ...SHADOWS.small,
    },
  });
