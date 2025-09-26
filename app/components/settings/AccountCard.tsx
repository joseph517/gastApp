import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/colors";

interface AccountCardProps {
  isPremium: boolean;
}

export const AccountCard: React.FC<AccountCardProps> = ({ isPremium }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Ionicons name="person" size={24} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>Usuario Local</Text>
        <Text style={styles.type}>
          {isPremium ? "Cuenta Premium" : "Cuenta Gratuita"}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.lg,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      flexDirection: "row",
      alignItems: "center",
      ...SHADOWS.small,
    },
    icon: {
      width: 50,
      height: 50,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: colors.primary + "20",
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.md,
    },
    info: {
      flex: 1,
    },
    name: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 2,
    },
    type: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
    },
  });