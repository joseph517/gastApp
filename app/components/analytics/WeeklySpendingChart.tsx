import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/colors";

export interface WeeklySpendingData {
  dayOfWeek: number; // 0-6 (Domingo-Sábado)
  dayName: string;
  totalAmount: number; // Total gastado ese día
  totalTransactions: number;
  percentage: number; // Porcentaje relativo al día con más gastos
}

export interface WeeklyInsight {
  highestDay: string;
  lowestDay: string;
  percentageDifference: number;
  insight: string;
}

interface WeeklySpendingChartProps {
  data: WeeklySpendingData[];
  insight: WeeklyInsight | null;
  title?: string;
  getWeeklyDataForWeek?: (weekOffset: number) => {
    data: WeeklySpendingData[];
    insight: WeeklyInsight | null;
  };
}

const WeeklySpendingChart: React.FC<WeeklySpendingChartProps> = React.memo(
  ({
    data,
    insight,
    title = "Gastos por Día de Semana",
    getWeeklyDataForWeek,
  }) => {
    const { colors } = useTheme();
    const screenWidth = Dimensions.get("window").width;
    const chartWidth = screenWidth - SPACING.md * 4; // Accounting for margins and padding
    const [selectedDay, setSelectedDay] = useState<WeeklySpendingData | null>(
      null
    );
    const [modalVisible, setModalVisible] = useState(false);
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = esta semana, 1 = semana pasada, etc.
    const [currentData, setCurrentData] = useState(data);
    const [currentInsight, setCurrentInsight] = useState(insight);

    // Efecto para actualizar datos cuando cambia la semana
    React.useEffect(() => {
      if (getWeeklyDataForWeek && currentWeekOffset > 0) {
        const weekData = getWeeklyDataForWeek(currentWeekOffset);
        setCurrentData(weekData.data);
        setCurrentInsight(weekData.insight);
      } else {
        setCurrentData(data);
        setCurrentInsight(insight);
      }
    }, [currentWeekOffset, data, insight, getWeeklyDataForWeek]);

    const formatCurrency = (amount: number) => {
      if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`;
      } else if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(0)}K`;
      } else {
        return `$${amount.toFixed(0)}`;
      }
    };

    const formatFullCurrency = (amount: number) => {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const handleBarPress = (dayData: WeeklySpendingData) => {
      setSelectedDay(dayData);
      setModalVisible(true);
    };

    const getBarColor = (dayName: string, percentage: number) => {
      if (currentInsight) {
        if (dayName === currentInsight.highestDay) return colors.error;
        if (dayName === currentInsight.lowestDay) return colors.success;
      }

      // Color gradient based on percentage
      if (percentage > 80) return colors.error;
      if (percentage > 60) return colors.warning || "#FF9800";
      if (percentage > 40) return colors.primary;
      return colors.gray400;
    };

    const renderBar = (item: WeeklySpendingData, index: number) => {
      const barHeight = Math.max((item.percentage / 100) * 100, 12); // Min height 12, max 100
      const barColor = getBarColor(item.dayName, item.percentage);

      return (
        <TouchableOpacity
          key={index}
          style={styles.barContainer}
          onPress={() => handleBarPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: barColor,
                },
              ]}
            />
          </View>
          <Text
            style={[styles.dayLabel, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.dayName}
          </Text>
          <Text
            style={[styles.amountLabel, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {formatCurrency(item.totalAmount)}
          </Text>
          <Text
            style={[styles.transactionLabel, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.totalTransactions}
          </Text>
        </TouchableOpacity>
      );
    };

    const getWeekTitle = () => {
      const now = new Date();
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay());

      const targetWeekStart = new Date(currentWeekStart);
      targetWeekStart.setDate(
        currentWeekStart.getDate() - currentWeekOffset * 7
      );

      const targetWeekEnd = new Date(targetWeekStart);
      targetWeekEnd.setDate(targetWeekStart.getDate() + 6);

      const startDay = targetWeekStart.getDate();
      const endDay = targetWeekEnd.getDate();
      const startMonth = targetWeekStart.toLocaleDateString("es-CO", {
        month: "short",
      });
      const endMonth = targetWeekEnd.toLocaleDateString("es-CO", {
        month: "short",
      });

      let weekLabel;
      if (currentWeekOffset === 0) {
        weekLabel = "Esta Semana";
      } else if (currentWeekOffset === 1) {
        weekLabel = "Semana Pasada";
      } else {
        weekLabel = `Hace ${currentWeekOffset} Semanas`;
      }

      const dateRange =
        startMonth === endMonth
          ? `${startDay}-${endDay} ${startMonth}`
          : `${startDay} ${startMonth} - ${endDay} ${endMonth}`;

      return `${weekLabel}\n${dateRange}`;
    };

    const handlePreviousWeek = () => {
      setCurrentWeekOffset((prev) => prev + 1);
    };

    const handleNextWeek = () => {
      if (currentWeekOffset > 0) {
        setCurrentWeekOffset((prev) => prev - 1);
      }
    };

    const renderWeekNavigation = () => {
      if (!getWeeklyDataForWeek) return null;

      return (
        <View style={styles.weekNavigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              { backgroundColor: colors.primary + "15" },
            ]}
            onPress={handlePreviousWeek}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.weekTitleContainer}>
            <Text style={[styles.weekTitle, { color: colors.textPrimary }]}>
              {getWeekTitle()}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.navButton,
              {
                backgroundColor:
                  currentWeekOffset > 0
                    ? colors.primary + "15"
                    : colors.gray200,
                opacity: currentWeekOffset > 0 ? 1 : 0.5,
              },
            ]}
            onPress={handleNextWeek}
            disabled={currentWeekOffset === 0}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={currentWeekOffset > 0 ? colors.primary : colors.gray400}
            />
          </TouchableOpacity>
        </View>
      );
    };

    const renderInsight = () => {
      if (!currentInsight) return null;

      return (
        <View
          style={[
            styles.insightContainer,
            { backgroundColor: colors.primary + "10" },
          ]}
        >
          <View style={styles.insightHeader}>
            <Ionicons name="bulb" size={20} color={colors.primary} />
            <Text style={[styles.insightTitle, { color: colors.primary }]}>
              Insight de Patrones
            </Text>
          </View>
          <Text style={[styles.insightText, { color: colors.textPrimary }]}>
            {currentInsight.insight}
          </Text>
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.error }]}
              />
              <Text
                style={[styles.comparisonText, { color: colors.textSecondary }]}
              >
                Día más caro: {currentInsight.highestDay}
              </Text>
            </View>
            <View style={styles.comparisonItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.success }]}
              />
              <Text
                style={[styles.comparisonText, { color: colors.textSecondary }]}
              >
                Día más barato: {currentInsight.lowestDay}
              </Text>
            </View>
          </View>
        </View>
      );
    };

    if (currentData.length === 0) {
      return (
        <View
          style={[styles.container, { backgroundColor: colors.cardBackground }]}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Total de gastos por día de la semana
          </Text>

          {renderWeekNavigation()}

          <View style={styles.emptyState}>
            <Ionicons
              name="bar-chart-outline"
              size={48}
              color={colors.gray300}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No hay gastos en esta semana
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Usa las flechas para navegar entre semanas
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View
        style={[styles.container, { backgroundColor: colors.cardBackground }]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Total de gastos por día de la semana
        </Text>

        {renderWeekNavigation()}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContainer}
          style={styles.chartContainer}
        >
          <View style={styles.chart}>
            {currentData.map((item, index) => renderBar(item, index))}
          </View>
        </ScrollView>

        {renderInsight()}

        {/* Modal con información detallada */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
          >
            <Pressable
              style={[styles.modal, { backgroundColor: colors.cardBackground }]}
            >
              {selectedDay && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.closeButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>

                  <Text
                    style={[styles.modalTitle, { color: colors.textPrimary }]}
                  >
                    {selectedDay.dayName}
                  </Text>

                  <View style={styles.modalContent}>
                    <View style={styles.modalItem}>
                      <Ionicons name="cash" size={20} color={colors.primary} />
                      <Text
                        style={[
                          styles.modalLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Total gastado
                      </Text>
                      <Text
                        style={[
                          styles.modalValue,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {formatFullCurrency(selectedDay.totalAmount)}
                      </Text>
                    </View>

                    <View style={styles.modalItem}>
                      <Ionicons
                        name="receipt"
                        size={20}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.modalLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Número de gastos
                      </Text>
                      <Text
                        style={[
                          styles.modalValue,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {selectedDay.totalTransactions} transacciones
                      </Text>
                    </View>

                    <View style={styles.modalItem}>
                      <Ionicons
                        name="bar-chart"
                        size={20}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.modalLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Comparado con el día más alto
                      </Text>
                      <Text
                        style={[
                          styles.modalValue,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {selectedDay.percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  }
);

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
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  chartContainer: {
    marginVertical: SPACING.md,
  },
  chartScrollContainer: {
    paddingHorizontal: SPACING.sm,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 180,
    minWidth: 350,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 2,
    maxWidth: 50,
  },
  barWrapper: {
    height: 100,
    justifyContent: "flex-end",
    marginBottom: SPACING.sm,
    width: "100%",
    alignItems: "center",
  },
  bar: {
    borderRadius: 6,
    minHeight: 12,
    width: 32,
  },
  dayLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  amountLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
  },
  transactionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
    textAlign: "center",
  },
  insightContainer: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  insightTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  insightText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  comparisonItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 120,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  comparisonText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    textAlign: "center",
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    textAlign: "center",
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    ...SHADOWS.medium,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    position: "relative",
    minWidth: 280,
    maxWidth: "90%",
  },
  closeButton: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
    textTransform: "capitalize",
  },
  modalContent: {
    gap: SPACING.md,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  modalLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: "500",
    flex: 1,
    marginLeft: SPACING.sm,
  },
  modalValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: "700",
    textAlign: "right",
  },
  weekNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  weekTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  weekTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
});

export default WeeklySpendingChart;
