import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

export interface InsightData {
  title: string;
  value: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

interface InsightCardProps {
  insight: InsightData;
}

const InsightCard: React.FC<InsightCardProps> = React.memo(({ insight }) => {
  const { colors } = useTheme();

  const getTrendIcon = () => {
    switch (insight.trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'neutral':
        return 'remove';
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (insight.trend) {
      case 'up':
        return colors.error;
      case 'down':
        return colors.success;
      case 'neutral':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons
            name={insight.icon}
            size={20}
            color={insight.iconColor || colors.primary}
          />
        </View>
        {insight.trend && insight.trendValue && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={getTrendIcon()!}
              size={16}
              color={getTrendColor()}
            />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {insight.trendValue}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          {insight.title}
        </Text>
        <Text style={[styles.value, { color: colors.textPrimary }]}>
          {insight.value}
        </Text>
        {insight.subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {insight.subtitle}
          </Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...SHADOWS.small,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.xs,
    marginVertical: SPACING.xs,
    minHeight: 120,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    marginLeft: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '400',
  },
});

export default InsightCard;