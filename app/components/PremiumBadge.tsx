import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { SPACING, BORDER_RADIUS, FONT_SIZES } from "../constants/colors";
import { useFeatureAccess } from "../hooks/useFeatureAccess";

interface PremiumBadgeProps {
  featureId: string;
  title: string;
  description: string;
  onPress?: () => void;
  navigation?: any;
  onUpgradePress?: () => void;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  featureId,
  title,
  description,
  onPress,
  navigation,
  onUpgradePress,
}) => {
  const { colors } = useTheme();
  const {
    checkFeatureAccess,
    getFeatureAction,
    shouldShowLock,
    shouldShowComingSoon,
    getFeatureMessage,
  } = useFeatureAccess();

  const accessResult = checkFeatureAccess(featureId);
  const isDisabled = !accessResult.isAccessible;
  const showLock = shouldShowLock(featureId);
  const showComingSoon = shouldShowComingSoon(featureId);
  const message = getFeatureMessage(featureId);

  const handlePress =
    onPress || getFeatureAction(featureId, navigation, onUpgradePress);

  const styles = createStyles(colors);

  // Determinar icono del estado
  const getStatusIcon = () => {
    if (showLock) {
      return <Ionicons name="lock-closed" size={20} color={colors.accent} />;
    } else if (showComingSoon) {
      return <Ionicons name="time-outline" size={20} color={colors.gray400} />;
    } else {
      return (
        <Ionicons name="chevron-forward" size={20} color={colors.accent} />
      );
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, isDisabled && styles.disabled]}
      onPress={isDisabled ? undefined : handlePress}
      disabled={isDisabled}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.diamondIcon}>💎</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={styles.lockContainer}>{getStatusIcon()}</View>
      </View>
      {(showComingSoon || showLock) && message && (
        <View
          style={[
            styles.statusBadge,
            showLock ? styles.upgradeBadge : styles.comingSoonBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              showLock ? styles.upgradeText : styles.comingSoonText,
            ]}
          >
            {showLock ? "Premium" : message}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: SPACING.md,
      marginVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.accent + "40",
      position: "relative",
      overflow: "hidden",
    },
    disabled: {
      opacity: 0.7,
      borderColor: colors.gray200,
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      padding: SPACING.md,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: colors.accent + "20",
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.sm,
    },
    diamondIcon: {
      fontSize: 20,
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
    description: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
    },
    lockContainer: {
      padding: SPACING.xs,
    },
    statusBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.sm,
    },
    comingSoonBadge: {
      backgroundColor: colors.gray400,
    },
    upgradeBadge: {
      backgroundColor: colors.accent,
    },
    statusText: {
      fontSize: FONT_SIZES.xs,
      fontWeight: "600",
    },
    comingSoonText: {
      color: colors.background,
    },
    upgradeText: {
      color: colors.background,
    },
  });

export default PremiumBadge;
