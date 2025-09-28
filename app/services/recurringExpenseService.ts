import { databaseService } from '../database/database';
import { RecurringExpense, PendingRecurringExpense, Expense } from '../types';

class RecurringExpenseService {
  private static instance: RecurringExpenseService;

  static getInstance(): RecurringExpenseService {
    if (!RecurringExpenseService.instance) {
      RecurringExpenseService.instance = new RecurringExpenseService();
    }
    return RecurringExpenseService.instance;
  }

  private constructor() {}

  /**
   * Calcula la próxima fecha de vencimiento basada en la frecuencia
   */
  calculateNextDueDate(startDate: string, intervalDays: number, executionDates?: number[]): string {
    const start = new Date(startDate);
    const today = new Date();

    // Si hay fechas específicas del mes (ej: [1, 15])
    if (executionDates && executionDates.length > 0) {
      return this.calculateNextDueDateForMultipleDates(executionDates);
    }

    // Para intervalos simples (7, 15, 30 días)
    let nextDate = new Date(start);

    // Avanzar hasta encontrar la próxima fecha >= hoy
    while (nextDate <= today) {
      nextDate.setDate(nextDate.getDate() + intervalDays);
    }

    return nextDate.toISOString().split('T')[0];
  }

  /**
   * Calcula la próxima fecha para múltiples fechas del mes
   */
  private calculateNextDueDateForMultipleDates(executionDates: number[]): string {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    // Buscar la próxima fecha en el mes actual
    const sortedDates = executionDates.sort((a, b) => a - b);

    for (const day of sortedDates) {
      if (day > currentDay) {
        const nextDate = new Date(currentYear, currentMonth, day);
        return nextDate.toISOString().split('T')[0];
      }
    }

    // Si no hay fechas restantes en el mes actual, usar la primera del próximo mes
    const firstDayNextMonth = sortedDates[0];
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    const nextDate = new Date(nextYear, nextMonth, firstDayNextMonth);
    return nextDate.toISOString().split('T')[0];
  }

  /**
   * Verifica y crea gastos pendientes para gastos recurrentes vencidos
   */
  async checkAndCreatePendingExpenses(): Promise<void> {
    try {
      const activeRecurringExpenses = await databaseService.getActiveRecurringExpenses();
      const today = new Date().toISOString().split('T')[0];

      for (const recurring of activeRecurringExpenses) {
        // Si la fecha de vencimiento es hoy o anterior
        if (recurring.nextDueDate <= today) {
          await this.createPendingExpenseFromRecurring(recurring);

          // Actualizar la próxima fecha de vencimiento
          const nextDueDate = this.calculateNextDueDate(
            recurring.nextDueDate,
            recurring.intervalDays,
            recurring.executionDates
          );

          await databaseService.updateRecurringExpense(recurring.id!, {
            nextDueDate,
            lastExecuted: today
          });
        }
      }
    } catch (error) {
      console.error('Error checking pending expenses:', error);
    }
  }

  /**
   * Crea un gasto pendiente a partir de un gasto recurrente
   */
  private async createPendingExpenseFromRecurring(recurring: RecurringExpense): Promise<void> {
    const pendingExpense: Omit<PendingRecurringExpense, "id" | "createdAt"> = {
      recurringExpenseId: recurring.id!,
      scheduledDate: recurring.nextDueDate,
      amount: recurring.amount,
      description: recurring.description,
      category: recurring.category,
      status: 'pending'
    };

    await databaseService.createPendingRecurringExpense(pendingExpense);
  }

  /**
   * Confirma un gasto pendiente y lo convierte en gasto real
   */
  async confirmPendingExpense(
    pendingId: number,
    modifications?: { amount?: number; description?: string }
  ): Promise<boolean> {
    try {
      const pending = await databaseService.getPendingRecurringExpenses();
      const targetPending = pending.find(p => p.id === pendingId);

      if (!targetPending) {
        throw new Error('Pending expense not found');
      }

      // Crear el gasto real
      const expense: Omit<Expense, "id" | "createdAt" | "synced"> = {
        amount: modifications?.amount || targetPending.amount,
        description: modifications?.description || targetPending.description,
        category: targetPending.category,
        date: targetPending.scheduledDate
      };

      await databaseService.addExpense(expense);

      // Marcar como confirmado y eliminar
      await databaseService.updatePendingRecurringExpense(pendingId, {
        status: 'confirmed'
      });

      // Opcional: eliminar el pending después de confirmar
      await databaseService.deletePendingRecurringExpense(pendingId);

      return true;
    } catch (error) {
      console.error('Error confirming pending expense:', error);
      return false;
    }
  }

  /**
   * Omite un gasto pendiente
   */
  async skipPendingExpense(pendingId: number): Promise<boolean> {
    try {
      await databaseService.updatePendingRecurringExpense(pendingId, {
        status: 'skipped'
      });

      // Eliminar después de marcar como omitido
      await databaseService.deletePendingRecurringExpense(pendingId);

      return true;
    } catch (error) {
      console.error('Error skipping pending expense:', error);
      return false;
    }
  }

  /**
   * Marca gastos pendientes como vencidos
   */
  async markOverdueExpenses(): Promise<void> {
    try {
      const pending = await databaseService.getPendingRecurringExpenses();
      const today = new Date().toISOString().split('T')[0];

      for (const pendingExpense of pending) {
        // Si la fecha programada es anterior a hoy, marcar como vencido
        if (pendingExpense.scheduledDate < today && pendingExpense.status === 'pending') {
          await databaseService.updatePendingRecurringExpense(pendingExpense.id!, {
            status: 'overdue'
          });
        }
      }
    } catch (error) {
      console.error('Error marking overdue expenses:', error);
    }
  }

  /**
   * Obtiene estadísticas de gastos recurrentes
   */
  async getRecurringExpenseStats(startDate: string, endDate: string) {
    try {
      // Obtener todos los gastos del período
      const allExpenses = await databaseService.getExpensesByDateRange(startDate, endDate);

      // Obtener gastos recurrentes confirmados (los que vienen de pending)
      const recurringExpenses = allExpenses.filter(expense => {
        // Aquí necesitaríamos una forma de identificar si un gasto vino de un recurring
        // Por simplicidad, asumiremos que llevamos un registro o identificador
        return false; // TODO: Implementar lógica de identificación
      });

      const manualExpenses = allExpenses.filter(expense =>
        !recurringExpenses.includes(expense)
      );

      const totalRecurring = recurringExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalManual = manualExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      return {
        totalRecurring,
        totalManual,
        totalCombined: totalRecurring + totalManual,
        recurringCount: recurringExpenses.length,
        manualCount: manualExpenses.length,
        recurringPercentage: totalRecurring / (totalRecurring + totalManual) * 100
      };
    } catch (error) {
      console.error('Error getting recurring stats:', error);
      return null;
    }
  }

  /**
   * Calcula la proyección mensual de gastos recurrentes
   */
  async calculateMonthlyProjection(): Promise<number> {
    try {
      const activeRecurring = await databaseService.getActiveRecurringExpenses();
      let monthlyTotal = 0;

      for (const recurring of activeRecurring) {
        // Calcular cuántas veces se ejecutará en un mes
        let monthlyExecutions = 0;

        if (recurring.executionDates && recurring.executionDates.length > 0) {
          // Para fechas específicas del mes
          monthlyExecutions = recurring.executionDates.length;
        } else {
          // Para intervalos regulares
          switch (recurring.intervalDays) {
            case 7:
              monthlyExecutions = 4.33; // ~30/7
              break;
            case 15:
              monthlyExecutions = 2;
              break;
            case 30:
              monthlyExecutions = 1;
              break;
          }
        }

        monthlyTotal += recurring.amount * monthlyExecutions;
      }

      return Math.round(monthlyTotal);
    } catch (error) {
      console.error('Error calculating monthly projection:', error);
      return 0;
    }
  }

  /**
   * Valida los datos de un gasto recurrente antes de crearlo
   */
  validateRecurringExpense(data: RecurringExpense): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.amount || data.amount <= 0) {
      errors.push('El monto debe ser mayor a 0');
    }

    if (!data.description?.trim()) {
      errors.push('La descripción es requerida');
    }

    if (!data.category?.trim()) {
      errors.push('La categoría es requerida');
    }

    if (![7, 15, 30].includes(data.intervalDays)) {
      errors.push('El intervalo debe ser 7, 15 o 30 días');
    }

    if (!data.startDate) {
      errors.push('La fecha de inicio es requerida');
    }

    if (data.executionDates && data.executionDates.length > 0) {
      const invalidDates = data.executionDates.filter(day => day < 1 || day > 31);
      if (invalidDates.length > 0) {
        errors.push('Los días de ejecución deben estar entre 1 y 31');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const recurringExpenseService = RecurringExpenseService.getInstance();