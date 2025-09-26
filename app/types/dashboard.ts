import { Period } from "./index";

export interface DashboardScreenProps {
  navigation: any;
}

export interface PeriodOption {
  key: Period;
  label: string;
}

export interface TestDataImportResult {
  success: boolean;
  message?: string;
}

export interface DashboardActions {
  onRefresh: () => Promise<void>;
  onDeleteExpense: (expenseId: number) => Promise<void>;
  onImportTestData: () => Promise<TestDataImportResult>;
  onPeriodChange: (period: Period) => void;
  onViewAllExpenses?: () => void;
}