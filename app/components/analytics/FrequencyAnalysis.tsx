import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

export interface CategoryFrequency {
  categoryName: string;
  transactionCount: number;
  averageDaysBetween: number;
  lastTransactionDaysAgo: number;
  frequency: 'alta' | 'media' | 'baja';
}

interface FrequencyAnalysisProps {
  frequencies: CategoryFrequency[];
  title?: string;
}

const FrequencyAnalysis: React.FC<FrequencyAnalysisProps> = React.memo(({
  frequencies,
  title = "Análisis de Frecuencia"
}) => {
  const { colors } = useTheme();

  const getFrequencyColor = (frequency: CategoryFrequency['frequency']) => {
    switch (frequency) {
      case 'alta':
        return colors.error;
      case 'media':
        return colors.warning || '#FF9800';
      case 'baja':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const getFrequencyIcon = (frequency: CategoryFrequency['frequency']) => {
    switch (frequency) {
      case 'alta':
        return 'flame';
      case 'media':
        return 'time';
      case 'baja':
        return 'leaf';
      default:
        return 'help-circle';
    }
  };

  const formatDaysText = (days: number) => {
    if (days < 1) return 'hoy';
    if (days === 1) return '1 día';
    if (days < 7) return `${Math.round(days)} días`;
    if (days < 30) return `${Math.round(days / 7)} semanas`;
    return `${Math.round(days / 30)} meses`;
  };

  const renderFrequencyItem = ({ item }: { item: CategoryFrequency }) => {
    const frequencyColor = getFrequencyColor(item.frequency);
    const frequencyIcon = getFrequencyIcon(item.frequency);

    return (
      <View style={[styles.frequencyItem, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.itemHeader}>
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryName, { color: colors.textPrimary }]}>
              {item.categoryName}
            </Text>
            <View style={[styles.frequencyBadge, { backgroundColor: frequencyColor + '20' }]}>
              <Ionicons name={frequencyIcon} size={12} color={frequencyColor} />
              <Text style={[styles.frequencyText, { color: frequencyColor }]}>
                {item.frequency}
              </Text>
            </View>
          </View>
          <Text style={[styles.transactionCount, { color: colors.textSecondary }]}>
            {item.transactionCount} gastos
          </Text>
        </View>

        <View style={styles.itemContent}>
          <View style={styles.statRow}>
            <Ionicons name="repeat" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              Cada {formatDaysText(item.averageDaysBetween)}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              Último: hace {formatDaysText(item.lastTransactionDaysAgo)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (frequencies.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color={colors.gray300} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay suficientes datos para analizar frecuencias
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Patrones de gasto por categoría
      </Text>

      <FlatList
        data={frequencies}
        renderItem={renderFrequencyItem}
        keyExtractor={(item, index) => `frequency-${index}`}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
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
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  frequencyItem: {
    ...SHADOWS.small,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  categoryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginRight: SPACING.sm,
  },
  frequencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  frequencyText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    marginLeft: 2,
    textTransform: 'capitalize',
  },
  transactionCount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  itemContent: {
    gap: SPACING.xs,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.xs,
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

export default FrequencyAnalysis;