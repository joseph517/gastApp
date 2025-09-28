import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { Budget } from "../../types";
import { budgetReportService, ExportOptions } from "../../services/budgetReportService";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

interface BudgetExportCardProps {
  budget?: Budget | null;
  onClose?: () => void;
}

const BudgetExportCard: React.FC<BudgetExportCardProps> = ({
  budget,
  onClose,
}) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'detailed',
    includeExpenses: true,
    includeCategoryBreakdown: true,
    includeDailyBreakdown: false,
  });

  const exportFormats = [
    {
      key: 'detailed',
      label: 'Reporte Detallado',
      description: 'Reporte completo con análisis y recomendaciones',
      icon: 'document-text',
    },
    {
      key: 'csv',
      label: 'CSV (Excel)',
      description: 'Formato compatible con hojas de cálculo',
      icon: 'grid',
    },
    {
      key: 'json',
      label: 'JSON',
      description: 'Datos estructurados para desarrolladores',
      icon: 'code',
    },
  ];

  const handleExport = async () => {
    if (!budget) {
      Alert.alert('Error', 'No hay presupuesto seleccionado para exportar');
      return;
    }

    try {
      setLoading(true);

      const reportContent = await budgetReportService.exportBudgetReport(
        budget,
        exportOptions
      );

      const fileName = `presupuesto_${budget.period}_${budget.startDate}.${exportOptions.format === 'csv' ? 'csv' : 'txt'}`;

      // Share the report
      await Share.share({
        message: reportContent,
        title: `Reporte de Presupuesto - ${formatPeriod(budget.period)}`,
      });

    } catch (error) {
      console.error('Error exporting budget:', error);
      Alert.alert(
        'Error',
        'No se pudo exportar el reporte. Inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!budget) return;

    try {
      setLoading(true);

      const reportContent = await budgetReportService.exportBudgetReport(
        budget,
        { ...exportOptions, format: 'detailed' }
      );

      // Show preview in an alert
      Alert.alert(
        'Vista Previa del Reporte',
        reportContent.substring(0, 500) + '...\n\n¿Deseas exportar el reporte completo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Exportar', onPress: handleExport },
        ]
      );

    } catch (error) {
      console.error('Error generating preview:', error);
      Alert.alert('Error', 'No se pudo generar la vista previa');
    } finally {
      setLoading(false);
    }
  };

  const toggleOption = (option: keyof ExportOptions) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const setFormat = (format: 'json' | 'csv' | 'detailed') => {
    setExportOptions(prev => ({
      ...prev,
      format
    }));
  };

  const formatPeriod = (period: string): string => {
    const periodLabels = {
      'weekly': 'Semanal',
      'monthly': 'Mensual',
      'quarterly': 'Trimestral',
      'custom': 'Personalizado'
    };
    return periodLabels[period] || 'Mensual';
  };

  if (!budget) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Exportar Reporte
          </Text>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Selecciona un presupuesto para exportar su reporte
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Exportar Reporte
        </Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Budget Info */}
        <View style={[styles.budgetInfo, { backgroundColor: colors.surface }]}>
          <Text style={[styles.budgetTitle, { color: colors.textPrimary }]}>
            Presupuesto {formatPeriod(budget.period)}
          </Text>
          <Text style={[styles.budgetAmount, { color: colors.primary }]}>
            {new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 0,
            }).format(budget.amount)}
          </Text>
          <Text style={[styles.budgetPeriod, { color: colors.textSecondary }]}>
            {new Date(budget.startDate).toLocaleDateString("es-CO")} -{' '}
            {budget.endDate && new Date(budget.endDate).toLocaleDateString("es-CO")}
          </Text>
        </View>

        {/* Format Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Formato de Exportación
          </Text>

          {exportFormats.map((format) => (
            <TouchableOpacity
              key={format.key}
              style={[
                styles.formatOption,
                { backgroundColor: colors.surface },
                exportOptions.format === format.key && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => setFormat(format.key as any)}
            >
              <View style={styles.formatOptionContent}>
                <Ionicons
                  name={format.icon as any}
                  size={24}
                  color={exportOptions.format === format.key ? colors.primary : colors.textSecondary}
                />
                <View style={styles.formatOptionText}>
                  <Text style={[
                    styles.formatOptionTitle,
                    { color: exportOptions.format === format.key ? colors.primary : colors.textPrimary }
                  ]}>
                    {format.label}
                  </Text>
                  <Text style={[styles.formatOptionDesc, { color: colors.textSecondary }]}>
                    {format.description}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={exportOptions.format === format.key ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={exportOptions.format === format.key ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Opciones de Contenido
          </Text>

          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.surface }]}
            onPress={() => toggleOption('includeExpenses')}
          >
            <View style={styles.optionContent}>
              <Ionicons name="list" size={20} color={colors.primary} />
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>
                Incluir gastos individuales
              </Text>
            </View>
            <Ionicons
              name={exportOptions.includeExpenses ? 'checkbox' : 'square-outline'}
              size={20}
              color={exportOptions.includeExpenses ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.surface }]}
            onPress={() => toggleOption('includeCategoryBreakdown')}
          >
            <View style={styles.optionContent}>
              <Ionicons name="pie-chart" size={20} color={colors.primary} />
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>
                Desglose por categorías
              </Text>
            </View>
            <Ionicons
              name={exportOptions.includeCategoryBreakdown ? 'checkbox' : 'square-outline'}
              size={20}
              color={exportOptions.includeCategoryBreakdown ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.surface }]}
            onPress={() => toggleOption('includeDailyBreakdown')}
          >
            <View style={styles.optionContent}>
              <Ionicons name="bar-chart" size={20} color={colors.primary} />
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>
                Gastos diarios
              </Text>
            </View>
            <Ionicons
              name={exportOptions.includeDailyBreakdown ? 'checkbox' : 'square-outline'}
              size={20}
              color={exportOptions.includeDailyBreakdown ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.previewButton, { backgroundColor: colors.surface }]}
            onPress={handlePreview}
            disabled={loading}
          >
            <Ionicons name="eye" size={20} color={colors.primary} />
            <Text style={[styles.previewButtonText, { color: colors.primary }]}>
              Vista Previa
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: colors.primary }]}
            onPress={handleExport}
            disabled={loading}
          >
            <Ionicons name="download" size={20} color={colors.background} />
            <Text style={[styles.exportButtonText, { color: colors.background }]}>
              {loading ? 'Exportando...' : 'Exportar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
  },
  closeButton: {
    padding: SPACING.xs,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  budgetInfo: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    alignItems: "center",
  },
  budgetTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  budgetAmount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  budgetPeriod: {
    fontSize: FONT_SIZES.sm,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  },
  formatOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  formatOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  formatOptionText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  formatOptionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    marginBottom: 2,
  },
  formatOptionDesc: {
    fontSize: FONT_SIZES.xs,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
    marginLeft: SPACING.sm,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.md,
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    flex: 1,
    marginRight: SPACING.sm,
    justifyContent: "center",
  },
  previewButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    flex: 1,
    marginLeft: SPACING.sm,
    justifyContent: "center",
  },
  exportButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
});

export default BudgetExportCard;