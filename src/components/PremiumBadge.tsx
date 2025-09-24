import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/colors';

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
            color={disabled ? COLORS.gray400 : COLORS.accent} 
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
    position: 'relative',
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.7,
    borderColor: COLORS.gray200,
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
    backgroundColor: COLORS.accent + '20',
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
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  lockContainer: {
    padding: SPACING.xs,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  comingSoonText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    fontWeight: '600',
  },
});

export default PremiumBadge;