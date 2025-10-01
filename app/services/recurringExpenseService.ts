import { databaseService } from '../database/database';
import { RecurringExpense, PendingRecurringExpense, Expense, OverdueExpense, MultipleDatesConfig } from '../types';

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
  calculateNextDueDate(startDate: string, intervalDays: number): string {
    const start = new Date(startDate);
    const nextDate = new Date(start);
    nextDate.setDate(nextDate.getDate() + intervalDays);
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
        // Solo crear pendientes si el gasto está activo
        if (!recurring.isActive) {
          continue;
        }

        if (recurring.nextDueDate <= today) {
          // Phase 2: Soporte para múltiples fechas
          if (recurring.executionDates) {
            const currentDate = new Date();
            await this.generatePendingExpensesForMultipleDates(
              recurring,
              currentDate.getFullYear(),
              currentDate.getMonth()
            );

            // Calcular próxima fecha usando lógica avanzada
            const nextDueDate = this.calculateAdvancedNextDueDate(
              recurring.nextDueDate,
              recurring.intervalDays,
              this.parseExecutionDates(recurring.executionDates)
            );

            await databaseService.updateRecurringExpense(recurring.id!, {
              nextDueDate,
              lastExecuted: today
            });
          } else {
            // Lógica simple para intervalos regulares
            await this.createPendingExpenseFromRecurring(recurring);

            const nextDueDate = this.calculateNextDueDate(
              recurring.nextDueDate,
              recurring.intervalDays
            );

            await databaseService.updateRecurringExpense(recurring.id!, {
              nextDueDate,
              lastExecuted: today
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking pending expenses:', error);
    }
  }

  /**
   * Helper para parsear execution dates de forma segura
   */
  private parseExecutionDates(executionDates: any): number[] | undefined {
    try {
      if (typeof executionDates === 'string') {
        const parsed = JSON.parse(executionDates);
        return Array.isArray(parsed) ? parsed : undefined;
      }
      return Array.isArray(executionDates) ? executionDates : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Crea un gasto pendiente a partir de un gasto recurrente
   */
  private async createPendingExpenseFromRecurring(
    recurring: RecurringExpense,
    scheduledDate?: string
  ): Promise<void> {
    const pendingExpense: Omit<PendingRecurringExpense, "id" | "createdAt"> = {
      recurringExpenseId: recurring.id!,
      scheduledDate: scheduledDate || recurring.nextDueDate,
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

      // Eliminar el pending después de confirmar
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
   * Calcula la proyección mensual de gastos recurrentes
   */
  async calculateMonthlyProjection(): Promise<number> {
    try {
      const activeRecurring = await databaseService.getActiveRecurringExpenses();
      let monthlyTotal = 0;

      for (const recurring of activeRecurring) {
        // Calcular cuántas veces se ejecutará en un mes
        let monthlyExecutions = 0;

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
          default:
            monthlyExecutions = 30 / recurring.intervalDays;
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

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Phase 2: Automatización de Procesos

  /**
   * Cálculo automático de próximas fechas con soporte para reglas personalizadas
   */
  calculateAdvancedNextDueDate(startDate: string, intervalDays: number, executionDates?: number[]): string {
    if (executionDates && executionDates.length > 0) {
      return this.calculateNextDueDateForMultipleDates(executionDates);
    }

    // Para intervalos especiales como último día del mes
    if (intervalDays === 30) {
      return this.calculateMonthlyDueDate(startDate);
    }

    return this.calculateNextDueDate(startDate, intervalDays);
  }

  /**
   * Calcular próxima fecha para múltiples fechas del mes
   */
  private calculateNextDueDateForMultipleDates(executionDates: number[]): string {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Validar y ordenar fechas
    const validDates = executionDates
      .filter(day => day >= 1 && day <= 31)
      .sort((a, b) => a - b);

    // Buscar próxima fecha en el mes actual
    for (const day of validDates) {
      if (day > currentDay) {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const adjustedDay = Math.min(day, daysInMonth);
        return new Date(currentYear, currentMonth, adjustedDay).toISOString().split('T')[0];
      }
    }

    // Si no hay fechas en el mes actual, usar la primera del próximo mes
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const firstDay = validDates[0];
    const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    const adjustedDay = Math.min(firstDay, daysInNextMonth);

    return new Date(nextYear, nextMonth, adjustedDay).toISOString().split('T')[0];
  }

  /**
   * Calcular fecha mensual (último día del mes, etc.)
   */
  private calculateMonthlyDueDate(startDate: string): string {
    const start = new Date(startDate);
    const today = new Date();
    const startDay = start.getDate();

    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    // Si ya pasó el día en el mes actual, ir al siguiente mes
    if (today.getDate() >= startDay) {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }

    // Manejar el último día del mes
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dayToUse = Math.min(startDay, daysInMonth);

    return new Date(currentYear, currentMonth, dayToUse).toISOString().split('T')[0];
  }

  /**
   * Gestión de gastos vencidos
   */
  async getOverdueExpenses(): Promise<OverdueExpense[]> {
    try {
      const pending = await databaseService.getPendingRecurringExpenses();
      const today = new Date().toISOString().split('T')[0];
      const overdueExpenses: OverdueExpense[] = [];

      for (const pendingExpense of pending) {
        if (pendingExpense.scheduledDate < today) {
          const dueDate = new Date(pendingExpense.scheduledDate);
          const todayDate = new Date(today);
          const daysOverdue = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

          overdueExpenses.push({
            id: pendingExpense.id!,
            recurringExpenseId: pendingExpense.recurringExpenseId,
            description: pendingExpense.description,
            amount: pendingExpense.amount,
            category: pendingExpense.category,
            dueDate: pendingExpense.scheduledDate,
            daysOverdue,
            priority: this.calculateOverduePriority(daysOverdue, pendingExpense.amount),
          });
        }
      }

      return overdueExpenses.sort((a, b) => b.daysOverdue - a.daysOverdue);
    } catch (error) {
      console.error('Error getting overdue expenses:', error);
      return [];
    }
  }

  /**
   * Marcar gasto vencido como pagado
   */
  async markOverdueAsPaid(overdueExpense: OverdueExpense, actualAmount?: number): Promise<boolean> {
    try {
      const expense: Omit<Expense, "id" | "createdAt" | "synced"> = {
        amount: actualAmount || overdueExpense.amount,
        description: overdueExpense.description,
        category: overdueExpense.category,
        date: new Date().toISOString().split('T')[0]
      };

      await databaseService.addExpense(expense);
      await databaseService.deletePendingRecurringExpense(overdueExpense.id);

      return true;
    } catch (error) {
      console.error('Error marking overdue as paid:', error);
      return false;
    }
  }

  /**
   * Ignorar gasto vencido
   */
  async ignoreOverdueExpense(overdueExpenseId: number): Promise<boolean> {
    try {
      await databaseService.deletePendingRecurringExpense(overdueExpenseId);
      return true;
    } catch (error) {
      console.error('Error ignoring overdue expense:', error);
      return false;
    }
  }

  /**
   * Soporte para múltiples fechas por mes
   */
  validateMultipleDatesConfig(dates: number[]): MultipleDatesConfig {
    const warnings: string[] = [];
    const validDates = dates.filter(day => day >= 1 && day <= 31);

    if (validDates.length !== dates.length) {
      warnings.push('Algunos días están fuera del rango válido (1-31) y fueron eliminados');
    }

    const uniqueDates = [...new Set(validDates)];
    if (uniqueDates.length !== validDates.length) {
      warnings.push('Se eliminaron días duplicados');
    }

    const problemDays = uniqueDates.filter(day => day > 28);
    if (problemDays.length > 0) {
      warnings.push(`Los días ${problemDays.join(', ')} pueden no existir en todos los meses`);
    }

    return {
      dates: uniqueDates.sort((a, b) => a - b),
      isValid: uniqueDates.length > 0,
      warnings
    };
  }

  /**
   * Generar gastos pendientes para múltiples fechas del mes
   */
  async generatePendingExpensesForMultipleDates(
    recurring: RecurringExpense,
    year: number,
    month: number
  ): Promise<void> {
    try {
      if (!recurring.executionDates) return;

      let executionDates: number[];
      try {
        executionDates = typeof recurring.executionDates === 'string'
          ? JSON.parse(recurring.executionDates)
          : recurring.executionDates;
      } catch {
        return;
      }

      const config = this.validateMultipleDatesConfig(executionDates);
      if (!config.isValid) return;

      const today = new Date();
      for (const day of config.dates) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const adjustedDay = Math.min(day, daysInMonth);
        const date = new Date(year, month, adjustedDay);

        if (date >= today) {
          const scheduledDate = date.toISOString().split('T')[0];

          // Verificar que no exista ya
          const existing = await databaseService.getPendingRecurringExpenseByDate(
            recurring.id!,
            scheduledDate
          );

          if (!existing) {
            await this.createPendingExpenseFromRecurring(recurring, scheduledDate);
          }
        }
      }
    } catch (error) {
      console.error('Error generating pending expenses for multiple dates:', error);
    }
  }

  /**
   * Calcular prioridad para gastos vencidos
   */
  private calculateOverduePriority(daysOverdue: number, amount: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (daysOverdue >= 7) return 'urgent';
    if (daysOverdue >= 3) return 'high';
    if (amount > 100000) return 'high';
    return 'medium';
  }

  /**
   * Procesar automáticamente todos los gastos recurrentes
   */
  async processAllRecurringExpenses(): Promise<void> {
    try {
      await this.checkAndCreatePendingExpenses();
      console.log('Recurring expenses processed successfully');
    } catch (error) {
      console.error('Error processing recurring expenses:', error);
    }
  }
}

export const recurringExpenseService = RecurringExpenseService.getInstance();