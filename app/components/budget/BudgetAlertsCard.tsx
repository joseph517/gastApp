import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { budgetNotificationService, BudgetAlert } from "../../services/budgetNotificationService";
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from "../../constants/colors";

interface BudgetAlertsCardProps {
  maxAlertsShown?: number;
  showTitle?: boolean;
  onViewAll?: () => void;
}

const BudgetAlertsCard: React.FC<BudgetAlertsCardProps> = ({
  maxAlertsShown = 3,
  showTitle = true,
  onViewAll,
}) => {
  const { colors } = useTheme();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);

  useEffect(() => {
    // Cargar alertas iniciales
    setAlerts(budgetNotificationService.getAllAlerts());

    // Suscribirse a cambios en alertas
    const unsubscribe = budgetNotificationService.subscribeToAlerts((newAlerts) => {
      setAlerts(newAlerts);
    });

    return unsubscribe;
  }, []);

  const getAlertIcon = (type: BudgetAlert['type']) => {
    switch (type) {
      case 'warning_75':
        return 'warning-outline';
      case 'warning_90':
        return 'alert';
      case 'exceeded_100':
        return 'alert-circle';
      case 'daily_limit':
        return 'calendar-outline';
      case 'monthly_prediction':
        return 'trending-up-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getAlertColor = (type: BudgetAlert['type'], priority: BudgetAlert['priority']) => {
    if (priority === 'high') return colors.error;
    if (type === 'warning_75' || type === 'warning_90') return colors.warning;
    if (type === 'exceeded_100') return colors.error;
    return colors.primary;
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    }
    if (diffHours > 0) {
      return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    }
    return 'hace un momento';
  };

  const handleMarkAsRead = (alertId: string) => {
    budgetNotificationService.markAlertAsRead(alertId);
  };

  const handleDeleteAlert = (alertId: string) => {
    Alert.alert(
      "Eliminar Alerta",
      "¿Estás seguro de que deseas eliminar esta alerta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => budgetNotificationService.deleteAlert(alertId),
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Limpiar Alertas",
      "¿Estás seguro de que deseas eliminar todas las alertas?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpiar Todo",
          style: "destructive",
          onPress: () => budgetNotificationService.clearAllAlerts(),
        },
      ]
    );
  };

  const displayedAlerts = alerts.slice(0, maxAlertsShown);
  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  if (alerts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
        {showTitle && (
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Alertas de Presupuesto
          </Text>
        )}
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            ¡Todo bajo control! No hay alertas de presupuesto.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      {showTitle && (
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Alertas de Presupuesto
            </Text>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={[styles.badgeText, { color: colors.background }]}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            {alerts.length > maxAlertsShown && onViewAll && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={onViewAll}
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  Ver todas
                </Text>
              </TouchableOpacity>
            )}

            {alerts.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearAll}
              >
                <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <ScrollView
        style={styles.alertsList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {displayedAlerts.map((alert) => (
          <View
            key={alert.id}
            style={[
              styles.alertItem,
              { backgroundColor: colors.surface },
              !alert.isRead && styles.unreadAlert,
              !alert.isRead && { borderLeftColor: getAlertColor(alert.type, alert.priority) }
            ]}
          >
            <View style={styles.alertContent}>
              <View style={styles.alertIcon}>
                <Ionicons
                  name={getAlertIcon(alert.type)}
                  size={24}
                  color={getAlertColor(alert.type, alert.priority)}
                />
              </View>

              <View style={styles.alertText}>
                <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>
                  {alert.title}
                </Text>
                <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
                  {alert.message}
                </Text>
                <Text style={[styles.alertTime, { color: colors.textSecondary }]}>
                  {formatTimeAgo(alert.timestamp)}
                </Text>
              </View>

              <View style={styles.alertActions}>
                {!alert.isRead && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleMarkAsRead(alert.id)}
                  >
                    <Ionicons name="checkmark" size={16} color={colors.success} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteAlert(alert.id)}
                >
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {alerts.length > maxAlertsShown && (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Mostrando {maxAlertsShown} de {alerts.length} alertas
          </Text>
        </View>
      )}
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
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
  },
  badge: {
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: SPACING.xs,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllButton: {
    marginRight: SPACING.sm,
  },
  viewAllText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  clearButton: {
    padding: SPACING.xs,
  },
  alertsList: {
    maxHeight: 300,
  },
  alertItem: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  unreadAlert: {
    borderLeftWidth: 4,
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  alertIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: FONT_SIZES.xs,
    lineHeight: 16,
    marginBottom: 4,
  },
  alertTime: {
    fontSize: FONT_SIZES.xs,
    fontStyle: "italic",
  },
  alertActions: {
    flexDirection: "row",
    marginLeft: SPACING.xs,
  },
  actionButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  footer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    alignItems: "center",
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
});

export default BudgetAlertsCard;