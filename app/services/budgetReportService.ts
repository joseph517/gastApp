import { Budget, BudgetStatus, Expense } from '../types';
import { databaseService } from '../database/database';

export interface BudgetReportData {
  budget: Budget;
  status: BudgetStatus | null;
  expenses: Expense[];
  summary: {
    totalSpent: number;
    totalRemaining: number;
    percentageUsed: number;
    averageDailySpending: number;
    daysRemaining: number;
    projectedTotal: number;
    categoryBreakdown: { [category: string]: number };
    dailySpending: { [date: string]: number };
  };
  period: {
    startDate: string;
    endDate: string;
    totalDays: number;
    daysElapsed: number;
  };
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'detailed';
  includeExpenses: boolean;
  includeCategoryBreakdown: boolean;
  includeDailyBreakdown: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

class BudgetReportService {
  private static instance: BudgetReportService;

  static getInstance(): BudgetReportService {
    if (!BudgetReportService.instance) {
      BudgetReportService.instance = new BudgetReportService();
    }
    return BudgetReportService.instance;
  }

  async generateBudgetReport(budget: Budget): Promise<BudgetReportData> {
    try {
      // Get budget status
      const spent = await databaseService.getTotalSpentInBudgetPeriod(budget);
      const remaining = budget.amount - spent;
      const percentage = (spent / budget.amount) * 100;

      let status: 'safe' | 'warning' | 'exceeded' = 'safe';
      if (percentage >= 100) {
        status = 'exceeded';
      } else if (percentage >= 75) {
        status = 'warning';
      }

      // Calculate period info
      const now = new Date();
      const startDate = new Date(budget.startDate);
      const endDate = budget.endDate ? new Date(budget.endDate) : this.calculateEndDate(budget);

      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, totalDays - daysElapsed);

      const averageDailySpending = daysElapsed > 0 ? spent / daysElapsed : 0;
      const recommendedDailyLimit = daysRemaining > 0 ? remaining / daysRemaining : 0;
      const projectedTotal = averageDailySpending * totalDays;

      const budgetStatus: BudgetStatus = {
        budget,
        spent,
        remaining,
        percentage,
        status,
        daysRemaining,
        totalDays,
        averageDailySpending,
        recommendedDailyLimit,
        projectedTotal,
      };

      // Get expenses for the budget period
      const expenses = await databaseService.getExpensesByDateRange(
        budget.startDate,
        budget.endDate || endDate.toISOString().split('T')[0]
      );

      // Calculate category breakdown
      const categoryBreakdown = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as { [category: string]: number });

      // Calculate daily spending
      const dailySpending = expenses.reduce((acc, expense) => {
        const date = expense.date;
        acc[date] = (acc[date] || 0) + expense.amount;
        return acc;
      }, {} as { [date: string]: number });

      return {
        budget,
        status: budgetStatus,
        expenses,
        summary: {
          totalSpent: spent,
          totalRemaining: remaining,
          percentageUsed: percentage,
          averageDailySpending,
          daysRemaining,
          projectedTotal,
          categoryBreakdown,
          dailySpending,
        },
        period: {
          startDate: budget.startDate,
          endDate: budget.endDate || endDate.toISOString().split('T')[0],
          totalDays,
          daysElapsed,
        },
      };

    } catch (error) {
      console.error('Error generating budget report:', error);
      throw new Error('No se pudo generar el reporte del presupuesto');
    }
  }

  async exportBudgetReport(
    budget: Budget,
    options: ExportOptions
  ): Promise<string> {
    try {
      const reportData = await this.generateBudgetReport(budget);

      switch (options.format) {
        case 'json':
          return this.exportToJSON(reportData, options);
        case 'csv':
          return this.exportToCSV(reportData, options);
        case 'detailed':
          return this.exportToDetailedText(reportData, options);
        default:
          throw new Error('Formato de exportación no soportado');
      }
    } catch (error) {
      console.error('Error exporting budget report:', error);
      throw new Error('No se pudo exportar el reporte del presupuesto');
    }
  }

  private exportToJSON(data: BudgetReportData, options: ExportOptions): string {
    const exportData: any = {
      budget: {
        id: data.budget.id,
        amount: data.budget.amount,
        period: data.budget.period,
        startDate: data.budget.startDate,
        endDate: data.budget.endDate,
        isActive: data.budget.isActive,
      },
      summary: data.summary,
      period: data.period,
      exportedAt: new Date().toISOString(),
    };

    if (options.includeExpenses) {
      exportData.expenses = data.expenses;
    }

    if (options.includeCategoryBreakdown) {
      exportData.categoryBreakdown = data.summary.categoryBreakdown;
    }

    if (options.includeDailyBreakdown) {
      exportData.dailyBreakdown = data.summary.dailySpending;
    }

    return JSON.stringify(exportData, null, 2);
  }

  private exportToCSV(data: BudgetReportData, options: ExportOptions): string {
    let csv = '';

    // Header information
    csv += 'REPORTE DE PRESUPUESTO\n';
    csv += `Período: ${this.formatPeriod(data.budget.period)}\n`;
    csv += `Monto del Presupuesto: ${this.formatCurrency(data.budget.amount)}\n`;
    csv += `Fecha de Inicio: ${this.formatDate(data.budget.startDate)}\n`;
    csv += `Fecha de Fin: ${this.formatDate(data.period.endDate)}\n`;
    csv += `Total Gastado: ${this.formatCurrency(data.summary.totalSpent)}\n`;
    csv += `Restante: ${this.formatCurrency(data.summary.totalRemaining)}\n`;
    csv += `Porcentaje Usado: ${data.summary.percentageUsed.toFixed(1)}%\n`;
    csv += `Días Restantes: ${data.summary.daysRemaining}\n`;
    csv += `Promedio Diario: ${this.formatCurrency(data.summary.averageDailySpending)}\n\n`;

    // Category breakdown
    if (options.includeCategoryBreakdown) {
      csv += 'DESGLOSE POR CATEGORÍA\n';
      csv += 'Categoría,Monto,Porcentaje\n';

      Object.entries(data.summary.categoryBreakdown)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, amount]) => {
          const percentage = (amount / data.summary.totalSpent) * 100;
          csv += `${category},${amount},${percentage.toFixed(1)}%\n`;
        });
      csv += '\n';
    }

    // Daily breakdown
    if (options.includeDailyBreakdown) {
      csv += 'GASTOS DIARIOS\n';
      csv += 'Fecha,Monto\n';

      Object.entries(data.summary.dailySpending)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, amount]) => {
          csv += `${this.formatDate(date)},${amount}\n`;
        });
      csv += '\n';
    }

    // Individual expenses
    if (options.includeExpenses) {
      csv += 'GASTOS INDIVIDUALES\n';
      csv += 'Fecha,Descripción,Categoría,Monto\n';

      data.expenses
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .forEach(expense => {
          csv += `${this.formatDate(expense.date)},"${expense.description}",${expense.category},${expense.amount}\n`;
        });
    }

    return csv;
  }

  private exportToDetailedText(data: BudgetReportData, options: ExportOptions): string {
    let report = '';

    // Header
    report += '='.repeat(50) + '\n';
    report += '       REPORTE DETALLADO DE PRESUPUESTO\n';
    report += '='.repeat(50) + '\n\n';

    // Budget info
    report += `Tipo de Presupuesto: ${this.formatPeriod(data.budget.period)}\n`;
    report += `Monto Total: ${this.formatCurrency(data.budget.amount)}\n`;
    report += `Período: ${this.formatDate(data.budget.startDate)} - ${this.formatDate(data.period.endDate)}\n`;
    report += `Estado: ${data.budget.isActive ? 'Activo' : 'Inactivo'}\n\n`;

    // Status summary
    report += '-'.repeat(30) + '\n';
    report += 'RESUMEN DEL ESTADO\n';
    report += '-'.repeat(30) + '\n';
    report += `Total Gastado: ${this.formatCurrency(data.summary.totalSpent)}\n`;
    report += `Restante: ${this.formatCurrency(data.summary.totalRemaining)}\n`;
    report += `Porcentaje Usado: ${data.summary.percentageUsed.toFixed(1)}%\n`;
    report += `Días Transcurridos: ${data.period.daysElapsed} de ${data.period.totalDays}\n`;
    report += `Días Restantes: ${data.summary.daysRemaining}\n`;
    report += `Promedio Diario: ${this.formatCurrency(data.summary.averageDailySpending)}\n`;
    report += `Proyección Final: ${this.formatCurrency(data.summary.projectedTotal)}\n\n`;

    // Status assessment
    const status = data.summary.percentageUsed >= 100 ? 'EXCEDIDO' :
                   data.summary.percentageUsed >= 75 ? 'ALERTA' : 'BAJO CONTROL';
    report += `Estado del Presupuesto: ${status}\n\n`;

    // Category breakdown
    if (options.includeCategoryBreakdown) {
      report += '-'.repeat(30) + '\n';
      report += 'DESGLOSE POR CATEGORÍA\n';
      report += '-'.repeat(30) + '\n';

      Object.entries(data.summary.categoryBreakdown)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, amount]) => {
          const percentage = (amount / data.summary.totalSpent) * 100;
          report += `${category.padEnd(20)} ${this.formatCurrency(amount).padStart(15)} (${percentage.toFixed(1)}%)\n`;
        });
      report += '\n';
    }

    // Recommendations
    report += '-'.repeat(30) + '\n';
    report += 'RECOMENDACIONES\n';
    report += '-'.repeat(30) + '\n';

    if (data.summary.percentageUsed >= 100) {
      const excess = data.summary.totalSpent - data.budget.amount;
      report += `• Has excedido tu presupuesto por ${this.formatCurrency(excess)}\n`;
      report += `• Considera revisar tus gastos y ajustar para el próximo período\n`;
    } else if (data.summary.percentageUsed >= 75) {
      const recommendedDaily = data.summary.totalRemaining / Math.max(1, data.summary.daysRemaining);
      report += `• Estás cerca del límite del presupuesto\n`;
      report += `• Limita tu gasto diario a ${this.formatCurrency(recommendedDaily)}\n`;
    } else {
      report += `• Buen control del presupuesto\n`;
      report += `• Puedes gastar hasta ${this.formatCurrency(data.summary.totalRemaining)} más\n`;
    }

    if (data.summary.projectedTotal > data.budget.amount) {
      const projectedExcess = data.summary.projectedTotal - data.budget.amount;
      report += `• Al ritmo actual, excederás el presupuesto por ${this.formatCurrency(projectedExcess)}\n`;
    }

    report += '\n';

    // Export info
    report += '-'.repeat(30) + '\n';
    report += `Reporte generado el: ${new Date().toLocaleString('es-CO')}\n`;

    return report;
  }

  private calculateEndDate(budget: Budget): Date {
    const startDate = new Date(budget.startDate);

    switch (budget.period) {
      case 'weekly':
        const weekEnd = new Date(startDate);
        weekEnd.setDate(startDate.getDate() + 6);
        return weekEnd;

      case 'quarterly':
        const quarterEnd = new Date(startDate);
        quarterEnd.setMonth(startDate.getMonth() + 3);
        quarterEnd.setDate(quarterEnd.getDate() - 1);
        return quarterEnd;

      case 'monthly':
      default:
        return new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  private formatPeriod(period: string): string {
    const periodLabels = {
      'weekly': 'Semanal',
      'monthly': 'Mensual',
      'quarterly': 'Trimestral',
      'custom': 'Personalizado'
    };
    return periodLabels[period] || 'Mensual';
  }

  // Get multiple budget reports for comparison
  async generateComparisonReport(budgets: Budget[]): Promise<{
    budgets: BudgetReportData[];
    comparison: {
      totalBudgeted: number;
      totalSpent: number;
      averageCompliance: number;
      bestPerformance: { budget: Budget; percentage: number };
      worstPerformance: { budget: Budget; percentage: number };
    };
  }> {
    try {
      const budgetReports = await Promise.all(
        budgets.map(budget => this.generateBudgetReport(budget))
      );

      const totalBudgeted = budgets.reduce((acc, b) => acc + b.amount, 0);
      const totalSpent = budgetReports.reduce((acc, r) => acc + r.summary.totalSpent, 0);
      const averageCompliance = budgetReports.reduce((acc, r) => {
        return acc + (r.summary.percentageUsed <= 100 ? 1 : 0);
      }, 0) / budgets.length * 100;

      const sortedByPerformance = budgetReports.sort((a, b) =>
        a.summary.percentageUsed - b.summary.percentageUsed
      );

      return {
        budgets: budgetReports,
        comparison: {
          totalBudgeted,
          totalSpent,
          averageCompliance,
          bestPerformance: {
            budget: sortedByPerformance[0].budget,
            percentage: sortedByPerformance[0].summary.percentageUsed
          },
          worstPerformance: {
            budget: sortedByPerformance[sortedByPerformance.length - 1].budget,
            percentage: sortedByPerformance[sortedByPerformance.length - 1].summary.percentageUsed
          }
        }
      };
    } catch (error) {
      console.error('Error generating comparison report:', error);
      throw new Error('No se pudo generar el reporte comparativo');
    }
  }
}

export const budgetReportService = BudgetReportService.getInstance();