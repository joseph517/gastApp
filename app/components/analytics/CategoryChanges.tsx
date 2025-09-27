import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

export interface CategoryChange {
  categoryName: string;
  currentAmount: number;
  previousAmount: number;
  percentageChange: number;
  changeType: 'increase' | 'decrease' | 'new' | 'unchanged';
}

interface CategoryChangesProps {
  increases: CategoryChange[];
  decreases: CategoryChange[];
  title?: string;
}

const CategoryChanges: React.FC<CategoryChangesProps> = React.memo(({
  increases,
  decreases,
  title = "Cambios por Categoría"
}) => {
  const { colors } = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderCategoryItem = ({ item }: { item: CategoryChange }) => {
    const isIncrease = item.changeType === 'increase';
    const changeColor = isIncrease ? colors.error : colors.success;
    const changeIcon = isIncrease ? 'trending-up' : 'trending-down';

    return (
      <View style={[styles.categoryItem, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.categoryHeader}>
          <Text style={[styles.categoryName, { color: colors.textPrimary }]}>
            {item.categoryName}
          </Text>
          <View style={[styles.changeContainer, { backgroundColor: changeColor + '20' }]}>
            <Ionicons name={changeIcon} size={12} color={changeColor} />
            <Text style={[styles.changeText, { color: changeColor }]}>
              {Math.abs(item.percentageChange).toFixed(1)}%
            </Text>
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.currentAmount, { color: colors.textPrimary }]}>
            {formatCurrency(item.currentAmount)}
          </Text>
          <Text style={[styles.previousAmount, { color: colors.textSecondary }]}>
            vs {formatCurrency(item.previousAmount)}
          </Text>
        </View>
      </View>
    );
  };

  if (increases.length === 0 && decreases.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.gray300} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay suficientes datos para comparar
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>

      {increases.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={16} color={colors.error} />
            <Text style={[styles.sectionTitle, { color: colors.error }]}>
              Mayor Gasto ({increases.length})
            </Text>
          </View>
          <FlatList
            data={increases.slice(0, 3)}
            renderItem={renderCategoryItem}
            keyExtractor={(item, index) => `increase-${index}`}
            scrollEnabled={false}
          />
        </View>
      )}

      {decreases.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-down" size={16} color={colors.success} />
            <Text style={[styles.sectionTitle, { color: colors.success }]}>
              Menor Gasto ({decreases.length})
            </Text>
          </View>
          <FlatList
            data={decreases.slice(0, 3)}
            renderItem={renderCategoryItem}
            keyExtractor={(item, index) => `decrease-${index}`}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...SHADOWS.small,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  categoryItem: {
    ...SHADOWS.small,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    flex: 1,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  changeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    marginLeft: 2,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  previousAmount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});

export default CategoryChanges;