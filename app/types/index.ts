export interface Expense {
  id: number;
  amount: number;
  description: string;
  category: string;
  date: string;
  createdAt: string;
  synced: boolean;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  isPremium: boolean;
}

export interface Setting {
  key: string;
  value: string;
}

export interface ExpenseFilters {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  description?: string;
}

export interface CategoryTotal {
  category: string;
  total: number;
  color: string;
  percentage: number;
  count: number;
}

export interface PeriodStats {
  total: number;
  previousTotal: number;
  percentageChange: number;
  expenseCount: number;
}

export type Period = "week" | "month" | "year";

export interface ExpenseFormData {
  amount: string;
  description: string;
  category: string;
  date: Date;
}

export interface PremiumFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface UserPreferences {
  currency: string;
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY";
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  notifications: boolean;
  darkMode: boolean;
}

export interface NavigationProps {
  navigation: any;
  route?: any;
}

export interface Budget {
  id?: number;
  amount: number;
  period: "weekly" | "monthly" | "quarterly" | "custom";
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  status: "safe" | "warning" | "exceeded";
  daysRemaining: number;
  totalDays: number;
  averageDailySpending: number;
  recommendedDailyLimit: number;
  projectedTotal: number;
}

// Gastos Recurrentes
export interface RecurringExpense {
  id?: number;
  amount: number;
  description: string;
  category: string;
  frequency: "custom";
  intervalDays: 7 | 15 | 30;
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  isActive: boolean;
  requiresConfirmation: boolean;
  lastExecuted?: string;
  executionDates: number[]; // Días del mes [1, 15]
  notifyDaysBefore: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PendingRecurringExpense {
  id?: number;
  recurringExpenseId: number;
  scheduledDate: string;
  amount: number;
  description: string;
  category: string;
  status: "pending" | "confirmed" | "skipped" | "overdue";
  createdAt?: string;
}

export interface RecurringExpenseFormData {
  amount: string;
  description: string;
  category: string;
  intervalDays: 7 | 15 | 30;
  startDate: Date;
  endDate?: Date;
  executionDates: number[];
  notifyDaysBefore: number;
}

export interface RecurringExpenseStats {
  totalRecurring: number;
  totalManual: number;
  totalCombined: number;
  recurringByCategory: CategoryTotal[];
  manualByCategory: CategoryTotal[];
  monthlyRecurringProjection: number;
  viewMode: "separated" | "combined" | "recurring-only" | "manual-only";
}

export interface OverdueExpense {
  id: number;
  recurringExpenseId: number;
  description: string;
  amount: number;
  category: string;
  dueDate: string;
  daysOverdue: number;
  priority: "low" | "medium" | "high" | "urgent";
}

export interface MultipleDatesConfig {
  dates: number[]; // días del mes [1, 15, 30]
  isValid: boolean;
  warnings: string[];
}

export interface AutomationSettings {
  enableAutomaticProcessing: boolean;
  processingIntervalHours: number;
  maxDaysToShowOverdue: number;
  enableMultipleDatesPerMonth: boolean;
}
