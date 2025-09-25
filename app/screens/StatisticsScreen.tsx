import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useExpenseStore } from "../store/expenseStore";
import { useTheme } from "../contexts/ThemeContext";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../constants/colors";
import PremiumBadge from "../components/PremiumBadge";
import PieChart from "../components/PieChart";

const { width } = Dimensions.get("window");

const StatisticsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const {
    expenses,
    categories,
    isPremium,
    getTotalsByCategory,
    getPeriodStats,
  } = useExpenseStore();

  const [monthlyTotals, setMonthlyTotals] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    previousTotal: 0,
    percentageChange: 0,
    expenseCount: 0,
  });

  useEffect(() => {
    loadBasicStats();
  }, [expenses]);

  const loadBasicStats = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 1);

      const totals = await getTotalsByCategory(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );
      setMonthlyTotals(totals);

      const periodStats = await getPeriodStats("month");
      setStats(periodStats);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  const BasicStatsCard = () => (
    <View style={styles.statsCard}>
      <Text style={styles.cardTitle}>Resumen del Mes</Text>
      <View style={styles.basicStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(stats.total)}</Text>
          <Text style={styles.statLabel}>Total gastado</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.expenseCount}</Text>
          <Text style={styles.statLabel}>Gastos registrados</Text>
        </View>
      </View>
      <View style={styles.changeIndicator}>
        <Ionicons
          name={stats.percentageChange >= 0 ? "trending-up" : "trending-down"}
          size={16}
          color={stats.percentageChange >= 0 ? colors.error : colors.success}
        />
        <Text
          style={[
            styles.changeText,
            {
              color:
                stats.percentageChange >= 0 ? colors.error : colors.success,
            },
          ]}
        >
          {Math.abs(stats.percentageChange).toFixed(1)}% vs mes anterior
        </Text>
      </View>
    </View>
  );

  const FreeTierChart = () => (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.cardTitle}>Distribución por Categorías</Text>
        <View style={styles.freeLabel}>
          <Text style={styles.freeLabelText}>Gratuito</Text>
        </View>
      </View>
      <PieChart data={monthlyTotals} />
    </View>
  );

  const PremiumFeatures = [
    {
      id: "advanced-analytics",
      title: "Análisis Avanzado",
      description:
        "Gráficos de tendencias, comparativas anuales y predicciones",
      icon: "📊",
    },
    {
      id: "budget-tracking",
      title: "Control de Presupuesto",
      description: "Establece límites por categoría y recibe alertas",
      icon: "🎯",
    },
    {
      id: "custom-reports",
      title: "Reportes Personalizados",
      description: "Crea reportes detallados por fechas y categorías",
      icon: "📋",
    },
    {
      id: "export-data",
      title: "Exportar Datos",
      description: "Exporta tus gastos a Excel, PDF y otros formatos",
      icon: "📤",
    },
    {
      id: "recurring-expenses",
      title: "Gastos Recurrentes",
      description: "Programa gastos que se repiten automáticamente",
      icon: "🔄",
    },
    {
      id: "multi-currency",
      title: "Multi-Moneda",
      description: "Soporte para múltiples monedas con conversión automática",
      icon: "💱",
    },
  ];

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Estadísticas</Text>
          <Text style={styles.subtitle}>
            {isPremium ? "Premium" : "Versión Gratuita"}
          </Text>
        </View>

        {/* Basic Stats */}
        <BasicStatsCard />

        {/* Free Tier Chart */}
        <FreeTierChart />

        {/* Premium Features Section */}
        <View style={styles.premiumSection}>
          <View style={styles.premiumHeader}>
            <Text style={styles.premiumTitle}>
              <Text style={styles.diamond}>💎</Text> Funciones Premium
            </Text>
            <Text style={styles.premiumSubtitle}>
              Desbloquea análisis avanzados y más control
            </Text>
          </View>

          {PremiumFeatures.map((feature) => (
            <PremiumBadge
              key={feature.id}
              title={feature.title}
              description={feature.description}
              disabled={!isPremium}
            />
          ))}

          {/* Upgrade CTA */}
          {!isPremium && (
            <TouchableOpacity style={styles.upgradeButton}>
              <View style={styles.upgradeContent}>
                <View style={styles.upgradeIcon}>
                  <Text style={styles.upgradeIconText}>💎</Text>
                </View>
                <View style={styles.upgradeText}>
                  <Text style={styles.upgradeTitle}>Upgrade a Premium</Text>
                  <Text style={styles.upgradeDescription}>
                    Gastos ilimitados • Exportar datos • Análisis avanzado
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.background}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: SPACING.md,
  },
  basicStats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray200,
    marginHorizontal: SPACING.md,
  },
  changeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  changeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    marginLeft: 4,
  },
  chartCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  freeLabel: {
    backgroundColor: colors.success + "20",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  freeLabelText: {
    fontSize: FONT_SIZES.xs,
    color: colors.success,
    fontWeight: "600",
  },
  premiumSection: {
    paddingTop: SPACING.lg,
  },
  premiumHeader: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: "center",
  },
  premiumTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  diamond: {
    fontSize: FONT_SIZES.xl,
  },
  premiumSubtitle: {
    fontSize: FONT_SIZES.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  upgradeContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
  },
  upgradeIcon: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: colors.background + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  upgradeIconText: {
    fontSize: 24,
  },
  upgradeText: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: colors.background,
    marginBottom: 4,
  },
  upgradeDescription: {
    fontSize: FONT_SIZES.sm,
    color: colors.background + "CC",
  },
});

export default StatisticsScreen;
