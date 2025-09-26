import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../../contexts/ThemeContext";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";
import PremiumBadge from "../PremiumBadge";
import { PremiumFeature } from "../../types/statistics";

interface PremiumSectionProps {
  features: PremiumFeature[];
  isPremium: boolean;
  onUpgradePress?: () => void;
  navigation?: any;
}

const PremiumSection: React.FC<PremiumSectionProps> = ({
  features,
  isPremium,
  onUpgradePress,
  navigation
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.premiumSection}>
      <View style={styles.premiumHeader}>
        <Text style={styles.premiumTitle}>
          <Text style={styles.diamond}>💎</Text> Funciones Premium
        </Text>
        <Text style={styles.premiumSubtitle}>
          Desbloquea análisis avanzados y más control
        </Text>
      </View>

      {features.map((feature) => (
        <PremiumBadge
          key={feature.id}
          title={feature.title}
          description={feature.description}
          disabled={!isPremium && feature.id !== "advanced-analytics"}
          onPress={feature.id === "advanced-analytics" ?
            () => navigation?.navigate('Analytics') :
            undefined
          }
        />
      ))}

      {!isPremium && (
        <TouchableOpacity style={styles.upgradeButton} onPress={onUpgradePress}>
          <View style={styles.upgradeContent}>
            <View style={styles.upgradeIcon}>
              <Text style={styles.upgradeIconText}>💎</Text>
            </View>
            <View style={styles.upgradeText}>
              <Text style={styles.upgradeTitle}>Upgrade a Premium</Text>
              <Text style={styles.upgradeDescription}>
                Gastos ilimitados • Exportar datos • Análisis avanzado
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.background}
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    premiumSection: {
      paddingTop: SPACING.lg,
    },
    premiumHeader: {
      paddingHorizontal: SPACING.md,
      marginBottom: SPACING.lg,
      alignItems: "center",
    },
    premiumTitle: {
      fontSize: FONT_SIZES.xl,
      fontWeight: "700",
      color: colors.textPrimary,
      textAlign: "center",
    },
    diamond: {
      fontSize: FONT_SIZES.xl,
    },
    premiumSubtitle: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 4,
    },
    upgradeButton: {
      backgroundColor: colors.accent,
      marginHorizontal: SPACING.md,
      marginTop: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      ...SHADOWS.medium,
    },
    upgradeContent: {
      flexDirection: "row",
      alignItems: "center",
      padding: SPACING.lg,
    },
    upgradeIcon: {
      width: 50,
      height: 50,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: colors.background + "20",
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.md,
    },
    upgradeIconText: {
      fontSize: 24,
    },
    upgradeText: {
      flex: 1,
    },
    upgradeTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: "700",
      color: colors.background,
      marginBottom: 4,
    },
    upgradeDescription: {
      fontSize: FONT_SIZES.sm,
      color: colors.background + "CC",
    },
  });

export default PremiumSection;