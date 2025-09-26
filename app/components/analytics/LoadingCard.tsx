import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

interface LoadingCardProps {
  height?: number;
}

const LoadingCard: React.FC<LoadingCardProps> = ({ height = 200 }) => {
  const { colors } = useTheme();

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.cardBackground, height }
    ]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.small,
  },
});

export default LoadingCard;