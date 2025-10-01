import React, { useEffect, useState, useImperativeHandle } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../../contexts/ThemeContext";
import { databaseService } from "../../database/database";
import { useExpenseStore } from "../../store/expenseStore";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/colors";
import {
  getCategoryLimitsWithStatus,
  CategoryLimitStatus,
} from "../../utils/budgetLimitsUtils";
import { formatCurrency } from "../../utils/recurringExpensesUtils";

interface CategoryLimitsInsightsCardProps {
  onConfigureLimits?: () => void;
}

export interface CategoryLimitsInsightsCardRef {
  refresh: () => Promise<void>;
}

const CategoryLimitsInsightsCard = React.forwardRef<
  CategoryLimitsInsightsCardRef,
  CategoryLimitsInsightsCardProps
>(({ onConfigureLimits }, ref) => {
  const { colors } = useTheme();
  const { getTotalsByCategory } = useExpenseStore();
  const [limitsWithStatus, setLimitsWithStatus] = useState<
    CategoryLimitStatus[]
  >([]);
  const [loading, setLoading] = useState(true);

  const loadCategoryLimits = async () => {
    try {
      setLoading(true);

      // Cargar configuración de límites
      const savedSettings = await databaseService.getSetting("budgetSettings");
      if (!savedSettings) {
        setLimitsWithStatus([]);
        return;
      }

      const settings = JSON.parse(savedSettings);
      const categoryLimits = settings.categoryLimits || {};

      // Si no hay límites configurados, no mostrar nada
      if (Object.keys(categoryLimits).length === 0) {
        setLimitsWithStatus([]);
        return;
      }

      // Obtener gastos del mes actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const categoryTotals = await getTotalsByCategory(
        startOfMonth.toISOString().split("T")[0],
        endOfMonth.toISOString().split("T")[0]
      );

      // Calcular estado de límites
      const limitsStatus = getCategoryLimitsWithStatus(
        categoryLimits,
        categoryTotals
      );

      setLimitsWithStatus(limitsStatus);
    } catch (error) {
      console.error("Error loading category limits:", error);
      setLimitsWithStatus([]);
    } finally {
      setLoading(false);
    }
  };

  // Exponer método refresh al componente padre
  useImperativeHandle(ref, () => ({
    refresh: loadCategoryLimits,
  }));

  useEffect(() => {
    loadCategoryLimits();
  }, []);

  const getStatusColor = (status: CategoryLimitStatus["status"]) => {
    switch (status) {
      case "exceeded":
        return colors.error;
      case "warning":
        return colors.warning;
      default:
        return colors.success;
    }
  };

  const getStatusIcon = (status: CategoryLimitStatus["status"]) => {
    switch (status) {
      case "exceeded":
        return "alert-circle";
      case "warning":
        return "warning";
      default:
        return "checkmark-circle";
    }
  };

  const getStatusText = (status: CategoryLimitStatus["status"]) => {
    switch (status) {
      case "exceeded":
        return "¡Excedido!";
      case "warning":
        return "Cerca del límite";
      default:
        return "En control";
    }
  };

  // No mostrar si no hay límites configurados
  if (!loading && limitsWithStatus.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.cardBackground }]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Límites por Categoría
        </Text>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando límites...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Límites por Categoría
        </Text>
        {onConfigureLimits && (
          <TouchableOpacity
            style={styles.configButton}
            onPress={onConfigureLimits}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {limitsWithStatus.map((limitStatus) => (
        <View
          key={limitStatus.category}
          style={[
            styles.limitItem,
            { backgroundColor: colors.surface },
            limitStatus.status === "exceeded" && styles.exceededItem,
            limitStatus.status === "exceeded" && {
              borderLeftColor: colors.error,
            },
          ]}
        >
          {/* Header de categoría */}
          <View style={styles.limitHeader}>
            <Text style={[styles.categoryName, { color: colors.textPrimary }]}>
              {limitStatus.category}
            </Text>
            <View style={styles.statusBadge}>
              <Ionicons
                name={getStatusIcon(limitStatus.status)}
                size={14}
                color={getStatusColor(limitStatus.status)}
              />
              <Text
                style={[
                  styles.percentageText,
                  { color: getStatusColor(limitStatus.status) },
                ]}
              >
                {limitStatus.percentage.toFixed(0)}%
              </Text>
            </View>
          </View>

          {/* Barra de progreso */}
          <View style={styles.progressContainer}>
            <View
              style={[styles.progressBar, { backgroundColor: colors.border }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: getStatusColor(limitStatus.status),
                    width: `${Math.min(limitStatus.percentage, 100)}%`,
                  },
                ]}
              />
              {limitStatus.percentage > 100 && (
                <View
                  style={[
                    styles.progressOverflow,
                    {
                      backgroundColor: colors.error + "40",
                      width: `${Math.min(limitStatus.percentage - 100, 100)}%`,
                    },
                  ]}
                />
              )}
            </View>
          </View>

          {/* Detalles del gasto */}
          <View style={styles.detailsContainer}>
            <View style={styles.amountsRow}>
              <Text style={[styles.spentText, { color: colors.textPrimary }]}>
                {formatCurrency(limitStatus.spent)}
              </Text>
              <Text style={[styles.limitText, { color: colors.textSecondary }]}>
                de {formatCurrency(limitStatus.limit)}
              </Text>
            </View>

            {limitStatus.status === "exceeded" && (
              <View style={styles.exceededBadge}>
                <Text style={[styles.exceededText, { color: colors.error }]}>
                  {getStatusText(limitStatus.status)}
                </Text>
              </View>
            )}

            {limitStatus.status === "warning" && (
              <Text style={[styles.warningText, { color: colors.warning }]}>
                Restante: {formatCurrency(Math.max(0, limitStatus.remaining))}
              </Text>
            )}

            {limitStatus.status === "safe" && (
              <Text style={[styles.safeText, { color: colors.textSecondary }]}>
                Restante: {formatCurrency(limitStatus.remaining)}
              </Text>
            )}
          </View>
        </View>
      ))}

      {/* Summary */}
      <View
        style={[styles.summaryContainer, { borderTopColor: colors.border }]}
      >
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {limitsWithStatus.filter((l) => l.status === "exceeded").length > 0 &&
            `⚠️ ${
              limitsWithStatus.filter((l) => l.status === "exceeded").length
            } categoría(s) excedida(s)`}
          {limitsWithStatus.filter((l) => l.status === "warning").length > 0 &&
            limitsWithStatus.filter((l) => l.status === "exceeded").length ===
              0 &&
            `${
              limitsWithStatus.filter((l) => l.status === "warning").length
            } categoría(s) cerca del límite`}
          {limitsWithStatus.filter((l) => l.status === "exceeded").length ===
            0 &&
            limitsWithStatus.filter((l) => l.status === "warning").length ===
              0 &&
            "✓ Todas las categorías bajo control"}
        </Text>
      </View>
    </View>
  );
});

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
  configButton: {
    padding: SPACING.xs,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
  },
  limitItem: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  exceededItem: {
    borderLeftWidth: 4,
  },
  limitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  percentageText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "700",
  },
  progressContainer: {
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    position: "absolute",
    left: 0,
    top: 0,
  },
  progressOverflow: {
    height: "100%",
    borderRadius: 4,
    position: "absolute",
    left: 0,
    top: 0,
  },
  detailsContainer: {
    gap: 4,
  },
  amountsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: SPACING.xs,
  },
  spentText: {
    fontSize: FONT_SIZES.md,
    fontWeight: "700",
  },
  limitText: {
    fontSize: FONT_SIZES.sm,
  },
  exceededBadge: {
    alignSelf: "flex-start",
  },
  exceededText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "600",
  },
  warningText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
  },
  safeText: {
    fontSize: FONT_SIZES.xs,
  },
  summaryContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    alignItems: "center",
  },
  summaryText: {
    fontSize: FONT_SIZES.sm,
    fontStyle: "italic",
  },
});

export default CategoryLimitsInsightsCard;
