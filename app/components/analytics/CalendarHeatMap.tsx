import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

export interface ExpenseDetail {
  id: string;
  description: string;
  amount: number;
  category: string;
}

export interface DayData {
  date: string;
  amount: number;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  intensity: number; // 0-4 scale
  expenses?: ExpenseDetail[]; // Lista de gastos del día
}

interface CalendarHeatMapProps {
  data: DayData[];
  month?: Date;
  title?: string;
  getCalendarDataForMonth?: (monthOffset: number) => DayData[];
}

const CalendarHeatMap: React.FC<CalendarHeatMapProps> = React.memo(({
  data,
  month = new Date(),
  title = "Mapa de Calor - Gastos Diarios",
  getCalendarDataForMonth
}) => {
  const { colors } = useTheme();
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0); // 0 = este mes, 1 = mes pasado, etc.
  const [currentData, setCurrentData] = useState(data);
  const [currentMonth, setCurrentMonth] = useState(month);

  // Efecto para actualizar datos cuando cambia el mes
  React.useEffect(() => {
    if (getCalendarDataForMonth && currentMonthOffset > 0) {
      const monthData = getCalendarDataForMonth(currentMonthOffset);
      setCurrentData(monthData);

      const newMonth = new Date(month);
      newMonth.setMonth(month.getMonth() - currentMonthOffset);
      setCurrentMonth(newMonth);
    } else {
      setCurrentData(data);
      setCurrentMonth(month);
    }
  }, [currentMonthOffset, data, month, getCalendarDataForMonth]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getIntensityColor = (intensity: number) => {
    const baseColor = colors.primary;
    switch (intensity) {
      case 0:
        return colors.gray100;
      case 1:
        return baseColor + '30';
      case 2:
        return baseColor + '60';
      case 3:
        return baseColor + '90';
      case 4:
        return baseColor;
      default:
        return colors.gray100;
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonthOffset(prev => prev + 1);
  };

  const handleNextMonth = () => {
    if (currentMonthOffset > 0) {
      setCurrentMonthOffset(prev => prev - 1);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const monthIndex = currentMonth.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startDate = new Date(firstDay);

    // Retroceder al lunes de la semana que contiene el primer día
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);

    const days: DayData[] = [];
    const currentDate = new Date(startDate);

    // Generar 42 días (6 semanas x 7 días) para el calendario completo
    for (let i = 0; i < 42; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = currentData.find(d => d.date === dateStr);
      const isCurrentMonth = currentDate.getMonth() === monthIndex;

      days.push({
        date: dateStr,
        amount: dayData?.amount || 0,
        dayOfMonth: currentDate.getDate(),
        isCurrentMonth,
        intensity: dayData?.intensity || 0,
        expenses: dayData?.expenses || []
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const handleDayPress = (day: DayData) => {
    if (day.isCurrentMonth && day.amount > 0) {
      setSelectedDay(day);
      setTooltipVisible(true);
    }
  };

  const renderDay = (day: DayData, index: number) => {
    const backgroundColor = getIntensityColor(day.intensity);
    const textColor = day.isCurrentMonth ? colors.textPrimary : colors.textSecondary;
    const opacity = day.isCurrentMonth ? 1 : 0.3;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          { backgroundColor, opacity }
        ]}
        onPress={() => handleDayPress(day)}
        disabled={!day.isCurrentMonth || day.amount === 0}
      >
        <Text style={[styles.dayText, { color: textColor }]}>
          {day.dayOfMonth}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderWeekHeader = () => {
    const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    return (
      <View style={styles.weekHeader}>
        {weekDays.map((day, index) => (
          <View key={index} style={styles.weekDayCell}>
            <Text style={[styles.weekDayText, { color: colors.textSecondary }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderMonthNavigation = () => {
    if (!getCalendarDataForMonth) return null;

    return (
      <View style={styles.monthNavigation}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.primary + '15' }]}
          onPress={handlePreviousMonth}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.monthTitleContainer}>
          <Text style={[styles.monthNavigationTitle, { color: colors.textPrimary }]}>
            {currentMonth.toLocaleDateString('es-CO', {
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor: currentMonthOffset > 0 ? colors.primary + '15' : colors.gray200,
              opacity: currentMonthOffset > 0 ? 1 : 0.5
            }
          ]}
          onPress={handleNextMonth}
          disabled={currentMonthOffset === 0}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={currentMonthOffset > 0 ? colors.primary : colors.gray400}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderLegend = () => {
    const intensityLevels = [0, 1, 2, 3, 4];
    const labels = ['Ninguno', 'Bajo', 'Medio', 'Alto', 'Muy Alto'];

    return (
      <View style={styles.legend}>
        <Text style={[styles.legendTitle, { color: colors.textSecondary }]}>
          Intensidad de Gasto
        </Text>
        <View style={styles.legendItems}>
          {intensityLevels.map((level, index) => (
            <View key={level} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: getIntensityColor(level) }
                ]}
              />
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
                {labels[index]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const monthName = currentMonth.toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric'
  });

  const daysArray = getDaysInMonth();
  const weeks = [];
  for (let i = 0; i < daysArray.length; i += 7) {
    weeks.push(daysArray.slice(i, i + 7));
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.monthTitle, { color: colors.textSecondary }]}>
          {monthName}
        </Text>
      </View>

      {renderMonthNavigation()}

      {renderWeekHeader()}

      <View style={styles.calendar}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day, dayIndex) => renderDay(day, weekIndex * 7 + dayIndex))}
          </View>
        ))}
      </View>

      {renderLegend()}

      {/* Tooltip Modal */}
      <Modal
        visible={tooltipVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTooltipVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setTooltipVisible(false)}
        >
          <Pressable style={[styles.tooltip, { backgroundColor: colors.cardBackground }]}>
            {selectedDay && (
              <>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.primary }]}
                  onPress={() => setTooltipVisible(false)}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>

                <Text style={[styles.tooltipDate, { color: colors.textPrimary }]}>
                  {new Date(selectedDay.date).toLocaleDateString('es-CO', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </Text>

                <Text style={[styles.tooltipAmount, { color: colors.primary }]}>
                  Total: {formatCurrency(selectedDay.amount)}
                </Text>

                {selectedDay.expenses && selectedDay.expenses.length > 0 && (
                  <>
                    <View style={styles.expensesHeader}>
                      <Ionicons name="list" size={16} color={colors.textSecondary} />
                      <Text style={[styles.expensesTitle, { color: colors.textSecondary }]}>
                        Gastos del día ({selectedDay.expenses.length})
                      </Text>
                    </View>

                    <ScrollView
                      style={[
                        styles.expensesList,
                        {
                          borderColor: colors.gray200,
                          backgroundColor: colors.surface,
                        }
                      ]}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                      contentContainerStyle={styles.expensesListContent}
                    >
                      {selectedDay.expenses.map((expense, index) => (
                        <View key={expense.id}>
                          <View
                            style={[
                              styles.expenseItem,
                              {
                                backgroundColor: colors.cardBackground,
                                borderWidth: 1,
                                borderColor: colors.gray200,
                              },
                            ]}
                          >
                            <View style={styles.expenseHeader}>
                              <Text style={[styles.expenseDescription, { color: colors.textPrimary }]} numberOfLines={2}>
                                {expense.description}
                              </Text>
                              <Text style={[styles.expenseAmount, { color: colors.primary }]}>
                                {formatCurrency(expense.amount)}
                              </Text>
                            </View>
                            <View style={styles.expenseFooter}>
                              <View style={[styles.categoryContainer, { backgroundColor: colors.gray100 }]}>
                                <Ionicons name="bookmark" size={12} color={colors.textSecondary} />
                                <Text style={[styles.expenseCategory, { color: colors.textSecondary }]}>
                                  {expense.category}
                                </Text>
                              </View>
                            </View>
                          </View>
                          {index < selectedDay.expenses!.length - 1 && (
                            <View style={[styles.expenseSeparator, { backgroundColor: colors.gray200 }]} />
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )}

                {(!selectedDay.expenses || selectedDay.expenses.length === 0) && (
                  <View style={styles.noExpensesContainer}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.noExpensesText, { color: colors.textSecondary }]}>
                      No hay detalles de gastos disponibles
                    </Text>
                  </View>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  header: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  monthTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  weekDayText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  calendar: {
    marginBottom: SPACING.md,
  },
  week: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1,
    borderRadius: 4,
  },
  dayText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  legend: {
    alignItems: 'center',
  },
  legendTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  legendItem: {
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 2,
    marginBottom: 2,
  },
  legendLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltip: {
    ...SHADOWS.medium,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    position: 'relative',
    maxHeight: '85%',
    minWidth: 320,
    maxWidth: '95%',
    width: '90%',
  },
  tooltipDate: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textTransform: 'capitalize',
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  tooltipAmount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  expensesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  expensesTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  expensesList: {
    maxHeight: 240,
    width: '100%',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
  },
  expensesListContent: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  expenseItem: {
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
  },
  expenseSeparator: {
    height: 1,
    marginVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  expenseDescription: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    flex: 1,
    marginRight: SPACING.sm,
    lineHeight: 20,
  },
  expenseAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    textAlign: 'right',
    minWidth: 80,
  },
  expenseFooter: {
    marginTop: SPACING.xs,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  expenseCategory: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    marginLeft: SPACING.xs,
    textTransform: 'capitalize',
  },
  noExpensesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    padding: SPACING.sm,
  },
  noExpensesText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    marginLeft: SPACING.xs,
    textAlign: 'center',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthNavigationTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
});

export default CalendarHeatMap;