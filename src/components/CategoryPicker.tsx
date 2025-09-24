import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/colors';
import { Category } from '../types';

interface CategoryPickerProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Categoría</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              selectedCategory === category.name && styles.selectedCategory,
              { backgroundColor: category.color + '20' }
            ]}
            onPress={() => onSelectCategory(category.name)}
          >
            <View 
              style={[
                styles.iconContainer,
                { backgroundColor: category.color }
              ]}
            >
              <Text style={styles.icon}>{category.icon}</Text>
            </View>
            <Text 
              style={[
                styles.categoryName,
                selectedCategory === category.name && styles.selectedCategoryName
              ]}
              numberOfLines={1}
            >
              {category.name}
            </Text>
            {category.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>💎</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
  scrollContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCategory: {
    borderColor: COLORS.primary,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  icon: {
    fontSize: 18,
  },
  categoryName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedCategoryName: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.full,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumText: {
    fontSize: 10,
  },
});

export default CategoryPicker;