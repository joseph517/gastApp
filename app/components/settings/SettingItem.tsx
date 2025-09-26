import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from "../../constants/colors";

export interface SettingItemData {
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

interface SettingItemProps {
  item: SettingItemData;
  isPremiumUser: boolean;
  onToggle?: (id: string, value: any) => void;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  item,
  isPremiumUser,
  onToggle,
}) => {
  const { colors } = useTheme();
  const isDisabled = item.isPremium && !isPremiumUser;

  const handlePress = () => {
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
        item.onPress();
      } else {
        onToggle?.(item.id, !item.value);
      }
    } else if (item.onPress) {
      item.onPress();
    }
  };

  const handleToggleChange = (value: boolean) => {
    if (!isDisabled) {
      if (item.id === "darkMode" && item.onPress) {
        item.onPress();
      } else {
        onToggle?.(item.id, value);
      }
    }
  };

  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={[styles.container, isDisabled && styles.disabled]}
      onPress={handlePress}
      disabled={item.type === "toggle" && isDisabled}
    >
      <View style={styles.left}>
        <View style={[styles.iconContainer, isDisabled && styles.disabledIcon]}>
          <Ionicons
            name={item.icon}
            size={20}
            color={isDisabled ? colors.gray400 : colors.primary}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, isDisabled && styles.disabledText]}>
            {item.title}
            {item.isPremium && " 💎"}
          </Text>
          {item.subtitle && (
            <Text
              style={[styles.subtitle, isDisabled && styles.disabledSubtitle]}
            >
              {item.subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.right}>
        {item.type === "toggle" && (
          <Switch
            value={item.value}
            onValueChange={handleToggleChange}
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

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    disabled: {
      opacity: 0.6,
    },
    left: {
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
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 2,
    },
    disabledText: {
      color: colors.gray400,
    },
    subtitle: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
    },
    disabledSubtitle: {
      color: colors.gray300,
    },
    right: {
      alignItems: "center",
      justifyContent: "center",
    },
  });