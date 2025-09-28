import { BudgetStatus } from '../types';

export interface BudgetAlert {
  id: string;
  type: 'warning_75' | 'warning_90' | 'exceeded_100' | 'daily_limit' | 'monthly_prediction';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  budgetId: number;
  timestamp: Date;
  isRead: boolean;
}

class BudgetNotificationService {
  private static instance: BudgetNotificationService;
  private alerts: BudgetAlert[] = [];
  private notificationListeners: Array<(alerts: BudgetAlert[]) => void> = [];
  private lastNotificationTimestamps: Map<string, number> = new Map();

  static getInstance(): BudgetNotificationService {
    if (!BudgetNotificationService.instance) {
      BudgetNotificationService.instance = new BudgetNotificationService();
    }
    return BudgetNotificationService.instance;
  }

  private constructor() {
    // Inicialización sin expo-notifications
    console.log('Budget notification service initialized (without push notifications)');
  }

  // Verificar y generar alertas basadas en el estado del presupuesto
  async checkBudgetAlerts(budgetStatus: BudgetStatus): Promise<BudgetAlert[]> {
    const newAlerts: BudgetAlert[] = [];
    const now = new Date();
    const budgetId = budgetStatus.budget.id!;

    // Alerta 75% - Warning
    if (budgetStatus.percentage >= 75 && budgetStatus.percentage < 90) {
      const alertKey = `warning_75_${budgetId}`;
      if (!this.wasRecentlyNotified(alertKey, 24 * 60 * 60 * 1000)) { // 24 horas
        const alert = this.createAlert({
          id: `${alertKey}_${now.getTime()}`,
          type: 'warning_75',
          title: '⚠️ Presupuesto al 75%',
          message: `Has gastado ${budgetStatus.percentage.toFixed(1)}% de tu presupuesto mensual. Considera moderar tus gastos.`,
          priority: 'normal',
          budgetId,
          timestamp: now,
          isRead: false,
        });
        newAlerts.push(alert);
        // Log alert instead of push notification
        console.log('Budget Alert:', alert.title, '-', alert.message);
        this.lastNotificationTimestamps.set(alertKey, now.getTime());
      }
    }

    // Alerta 90% - Critical Warning
    if (budgetStatus.percentage >= 90 && budgetStatus.percentage < 100) {
      const alertKey = `warning_90_${budgetId}`;
      if (!this.wasRecentlyNotified(alertKey, 12 * 60 * 60 * 1000)) { // 12 horas
        const alert = this.createAlert({
          id: `${alertKey}_${now.getTime()}`,
          type: 'warning_90',
          title: '🚨 Presupuesto al 90%',
          message: `¡Cuidado! Has gastado ${budgetStatus.percentage.toFixed(1)}% de tu presupuesto. Solo tienes ${this.formatCurrency(budgetStatus.remaining)} disponibles.`,
          priority: 'high',
          budgetId,
          timestamp: now,
          isRead: false,
        });
        newAlerts.push(alert);
        // Log alert instead of push notification
        console.log('Budget Alert:', alert.title, '-', alert.message);
        this.lastNotificationTimestamps.set(alertKey, now.getTime());
      }
    }

    // Alerta 100% - Budget Exceeded
    if (budgetStatus.percentage >= 100) {
      const alertKey = `exceeded_100_${budgetId}`;
      if (!this.wasRecentlyNotified(alertKey, 6 * 60 * 60 * 1000)) { // 6 horas
        const excess = budgetStatus.spent - budgetStatus.budget.amount;
        const alert = this.createAlert({
          id: `${alertKey}_${now.getTime()}`,
          type: 'exceeded_100',
          title: '🔴 Presupuesto Excedido',
          message: `Has excedido tu presupuesto mensual por ${this.formatCurrency(excess)}. Revisa tus gastos recientes.`,
          priority: 'high',
          budgetId,
          timestamp: now,
          isRead: false,
        });
        newAlerts.push(alert);
        // Log alert instead of push notification
        console.log('Budget Alert:', alert.title, '-', alert.message);
        this.lastNotificationTimestamps.set(alertKey, now.getTime());
      }
    }

    // Alerta de límite diario recomendado
    if (budgetStatus.daysRemaining > 0 && budgetStatus.averageDailySpending > budgetStatus.recommendedDailyLimit * 1.5) {
      const alertKey = `daily_limit_${budgetId}_${now.toDateString()}`;
      if (!this.wasRecentlyNotified(alertKey, 24 * 60 * 60 * 1000)) { // Una vez por día
        const alert = this.createAlert({
          id: `${alertKey}_${now.getTime()}`,
          type: 'daily_limit',
          title: '📅 Límite Diario Excedido',
          message: `Tu gasto promedio diario (${this.formatCurrency(budgetStatus.averageDailySpending)}) supera el recomendado (${this.formatCurrency(budgetStatus.recommendedDailyLimit)}).`,
          priority: 'normal',
          budgetId,
          timestamp: now,
          isRead: false,
        });
        newAlerts.push(alert);
        // Log alert instead of push notification
        console.log('Budget Alert:', alert.title, '-', alert.message);
        this.lastNotificationTimestamps.set(alertKey, now.getTime());
      }
    }

    // Predicción de exceso mensual
    if (budgetStatus.projectedTotal > budgetStatus.budget.amount * 1.1 && budgetStatus.daysRemaining > 7) {
      const alertKey = `monthly_prediction_${budgetId}`;
      if (!this.wasRecentlyNotified(alertKey, 7 * 24 * 60 * 60 * 1000)) { // Una vez por semana
        const projectedExcess = budgetStatus.projectedTotal - budgetStatus.budget.amount;
        const alert = this.createAlert({
          id: `${alertKey}_${now.getTime()}`,
          type: 'monthly_prediction',
          title: '🔮 Predicción de Exceso',
          message: `Si continúas con este ritmo de gasto, excederás tu presupuesto por ${this.formatCurrency(projectedExcess)} este mes.`,
          priority: 'normal',
          budgetId,
          timestamp: now,
          isRead: false,
        });
        newAlerts.push(alert);
        // Log alert instead of push notification
        console.log('Budget Alert:', alert.title, '-', alert.message);
        this.lastNotificationTimestamps.set(alertKey, now.getTime());
      }
    }

    // Agregar nuevas alertas al array principal
    this.alerts.unshift(...newAlerts);

    // Limitar a las últimas 50 alertas
    this.alerts = this.alerts.slice(0, 50);

    // Notificar a los listeners
    this.notifyListeners();

    return newAlerts;
  }

  private createAlert(alertData: Omit<BudgetAlert, 'id'> & { id: string }): BudgetAlert {
    return {
      ...alertData,
    };
  }

  // Removed push notification functionality - will be implemented with native notifications later

  private wasRecentlyNotified(key: string, cooldownMs: number): boolean {
    const lastNotification = this.lastNotificationTimestamps.get(key);
    if (!lastNotification) return false;

    return (Date.now() - lastNotification) < cooldownMs;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Gestión de alertas
  getAllAlerts(): BudgetAlert[] {
    return [...this.alerts];
  }

  getUnreadAlerts(): BudgetAlert[] {
    return this.alerts.filter(alert => !alert.isRead);
  }

  markAlertAsRead(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
      this.notifyListeners();
    }
  }

  markAllAlertsAsRead(): void {
    this.alerts.forEach(alert => alert.isRead = true);
    this.notifyListeners();
  }

  deleteAlert(alertId: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    this.notifyListeners();
  }

  clearAllAlerts(): void {
    this.alerts = [];
    this.lastNotificationTimestamps.clear();
    this.notifyListeners();
  }

  // Sistema de suscripción para cambios en alertas
  subscribeToAlerts(callback: (alerts: BudgetAlert[]) => void): () => void {
    this.notificationListeners.push(callback);

    // Retornar función de desuscripción
    return () => {
      this.notificationListeners = this.notificationListeners.filter(
        listener => listener !== callback
      );
    };
  }

  private notifyListeners(): void {
    this.notificationListeners.forEach(listener => {
      try {
        listener([...this.alerts]);
      } catch (error) {
        console.error('Error notifying alert listener:', error);
      }
    });
  }

  // Notification permissions - simplified for development
  async requestPermissions(): Promise<boolean> {
    // Always return true for development - will implement native permissions later
    return true;
  }

  async areNotificationsEnabled(): Promise<boolean> {
    // Always return true for development - will implement native permissions later
    return true;
  }
}

export const budgetNotificationService = BudgetNotificationService.getInstance();