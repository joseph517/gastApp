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

export type Period = 'week' | 'month' | 'year';

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
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
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
  period: 'monthly';
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
  status: 'safe' | 'warning' | 'exceeded';
  daysRemaining: number;
  totalDays: number;
  averageDailySpending: number;
  recommendedDailyLimit: number;
  projectedTotal: number;
}