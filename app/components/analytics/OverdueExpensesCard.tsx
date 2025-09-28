import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/colors';
import { recurringExpenseService } from '../../services/recurringExpenseService';
import { OverdueExpense } from '../../types';

export default function OverdueExpensesCard() {
  const { colors } = useTheme();
  const [overdueExpenses, setOverdueExpenses] = useState<OverdueExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverdueExpenses();
  }, []);

  const loadOverdueExpenses = async () => {
    try {
      setLoading(true);
      const overdue = await recurringExpenseService.getOverdueExpenses();
      setOverdueExpenses(overdue);
    } catch (error) {
      console.error('Error loading overdue expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (expense: OverdueExpense) => {
    try {
      const success = await recurringExpenseService.markOverdueAsPaid(expense);
      if (success) {
        await loadOverdueExpenses();
        Alert.alert('Éxito', 'Gasto marcado como pagado');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo marcar como pagado');
    }
  };

  const handleIgnore = async (expense: OverdueExpense) => {
    try {
      const success = await recurringExpenseService.ignoreOverdueExpense(expense.id);
      if (success) {
        await loadOverdueExpenses();
        Alert.alert('Éxito', 'Gasto ignorado');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo ignorar el gasto');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#D32F2F';
      case 'high': return '#F57C00';
      case 'medium': return '#1976D2';
      default: return colors.textSecondary;
    }
  };

  const renderOverdueItem = ({ item }: { item: OverdueExpense }) => (
    <View style={[styles.overdueItem, {
      backgroundColor: colors.surface,
      borderColor: colors.border
    }]}>
      <View style={styles.overdueHeader}>
        <Text style={[styles.overdueDescription, { color: colors.textPrimary }]}>
          {item.description}
        </Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.overdueDetails}>
        <Text style={[styles.overdueAmount, { color: colors.textPrimary }]}>
          {formatCurrency(item.amount)}
        </Text>
        <Text style={[styles.overdueDays, { color: colors.textSecondary }]}>
          {item.daysOverdue} días vencido
        </Text>
      </View>

      <View style={styles.overdueActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          onPress={() => handleMarkAsPaid(item)}
        >
          <Ionicons name="checkmark" size={16} color="white" />
          <Text style={styles.actionButtonText}>Pagar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.gray400 }]}
          onPress={() => handleIgnore(item)}
        >
          <Ionicons name="close" size={16} color="white" />
          <Text style={styles.actionButtonText}>Ignorar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          ⚠️ Gastos Vencidos
        </Text>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Cargando...
        </Text>
      </View>
    );
  }

  if (overdueExpenses.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          ✅ Gastos al Día
        </Text>
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No tienes gastos vencidos
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          ⚠️ Gastos Vencidos ({overdueExpenses.length})
        </Text>
        <TouchableOpacity onPress={loadOverdueExpenses} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={overdueExpenses}
        renderItem={renderOverdueItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  refreshButton: {
    padding: SPACING.xs,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  emptyState: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  overdueItem: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  overdueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  overdueDescription: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    flex: 1,
    marginRight: SPACING.sm,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  priorityText: {
    color: 'white',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  overdueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  overdueAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  overdueDays: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  overdueActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});