import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";
import { SPACING, FONT_SIZES, BORDER_RADIUS } from "../../constants/colors";

export interface SettingItemData {
  id: string;
  title: string;
  subtitle?: string;
  type: "toggle" | "select" | "navigation" | "action";
  icon: keyof typeof Ionicons.glyphMap;
  value?: any;
  options?: { label: string; value: any }[];
  isPremium?: boolean;
  isImplemented?: boolean;
  featureId?: string;
  onPress?: () => void;
}

interface SettingItemProps {
  item: SettingItemData;
  isPremiumUser: boolean;
  onToggle?: (id: string, value: any) => void;
  onUpgradePress?: () => void;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  item,
  isPremiumUser,
  onToggle,
  onUpgradePress,
}) => {
  const { colors } = useTheme();
  const { checkFeatureAccess, shouldShowLock, shouldShowComingSoon } =
    useFeatureAccess();

  // Si el item tiene featureId, usar el sistema de control de acceso
  const accessResult = item.featureId
    ? checkFeatureAccess(item.featureId)
    : null;

  // Determinar si el item está deshabilitado
  const isDisabled = item.featureId
    ? !accessResult?.isAccessible
    : item.isPremium && !isPremiumUser;

  const showLock = item.featureId
    ? shouldShowLock(item.featureId)
    : item.isPremium && !isPremiumUser;
  const showComingSoon = item.featureId
    ? shouldShowComingSoon(item.featureId)
    : item.isImplemented === false;

  const handlePress = () => {
    if (isDisabled) {
      // Si es premium y no tiene acceso, mostrar modal de upgrade
      if (showLock && onUpgradePress) {
        onUpgradePress();
      }
      // Si es "próximamente", no hacer nada
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

  const getStatusIcon = () => {
    if (showLock) {
      return <Ionicons name="lock-closed" size={16} color={colors.accent} />;
    } else if (showComingSoon) {
      return <Ionicons name="time-outline" size={16} color={colors.gray400} />;
    }
    return null;
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.container, isDisabled && styles.disabled]}
        onPress={handlePress}
        disabled={item.type === "toggle" && isDisabled}
      >
        <View style={styles.left}>
          <View
            style={[styles.iconContainer, isDisabled && styles.disabledIcon]}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={isDisabled ? colors.gray400 : colors.primary}
            />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, isDisabled && styles.disabledText]}>
                {item.title}
              </Text>
              {getStatusIcon()}
            </View>
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

      {(showComingSoon || showLock) && (
        <View
          style={[
            styles.statusBadge,
            showLock ? styles.premiumBadge : styles.comingSoonBadge,
          ]}
        >
          <Text style={styles.badgeText}>
            {showLock ? "Premium" : "Próximamente"}
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    wrapper: {
      position: "relative",
    },
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
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
    },
    title: {
      fontSize: FONT_SIZES.md,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    disabledText: {
      color: colors.gray400,
    },
    subtitle: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    disabledSubtitle: {
      color: colors.gray300,
    },
    right: {
      alignItems: "center",
      justifyContent: "center",
    },
    statusBadge: {
      position: "absolute",
      top: SPACING.xs,
      right: SPACING.xs,
      paddingHorizontal: SPACING.xs,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.sm,
    },
    comingSoonBadge: {
      backgroundColor: colors.gray400,
    },
    premiumBadge: {
      backgroundColor: colors.accent,
    },
    badgeText: {
      fontSize: FONT_SIZES.xs,
      fontWeight: "600",
      color: colors.background,
    },
  });
