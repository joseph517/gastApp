import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/colors';

interface PremiumBadgeProps {
  title: string;
  description: string;
  onPress?: () => void;
  disabled?: boolean;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  title,
  description,
  onPress,
  disabled = true
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <TouchableOpacity 
      style={[styles.container, disabled && styles.disabled]} 
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.diamondIcon}>💎</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={styles.lockContainer}>
          <Ionicons 
            name="lock-closed" 
            size={20} 
            color={disabled ? colors.gray400 : colors.accent} 
          />
        </View>
      </View>
      {disabled && (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Próximamente</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.accent + '40',
    position: 'relative',
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.7,
    borderColor: colors.gray200,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
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
  comingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  comingSoonText: {
    fontSize: FONT_SIZES.xs,
    color: colors.background,
    fontWeight: '600',
  },
});

export default PremiumBadge;