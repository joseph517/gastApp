export const CREATE_EXPENSES_TABLE = `
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced BOOLEAN DEFAULT 0
  );
`;

export const CREATE_CATEGORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    is_premium BOOLEAN DEFAULT 0
  );
`;

export const CREATE_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

export const CREATE_BUDGETS_TABLE = `
  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    period TEXT NOT NULL DEFAULT 'monthly',
    start_date TEXT NOT NULL,
    end_date TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

export const CREATE_RECURRING_EXPENSES_TABLE = `
  CREATE TABLE IF NOT EXISTS recurring_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    frequency TEXT DEFAULT 'custom',
    interval_days INTEGER NOT NULL CHECK (interval_days IN (7, 15, 30)),
    start_date TEXT NOT NULL,
    end_date TEXT,
    next_due_date TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    requires_confirmation INTEGER DEFAULT 1,
    last_executed TEXT,
    execution_dates TEXT, -- JSON array de días del mes
    notify_days_before INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

export const CREATE_PENDING_RECURRING_EXPENSES_TABLE = `
  CREATE TABLE IF NOT EXISTS pending_recurring_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recurring_expense_id INTEGER NOT NULL,
    scheduled_date TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recurring_expense_id) REFERENCES recurring_expenses(id) ON DELETE CASCADE
  );
`;

export const CREATE_INDEXES = [
  "CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);",
  "CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);",
  "CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);",
  "CREATE INDEX IF NOT EXISTS idx_budgets_date ON budgets(start_date);",
  "CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(is_active);",
  "CREATE INDEX IF NOT EXISTS idx_recurring_next_due ON recurring_expenses(next_due_date);",
  "CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_expenses(is_active);",
  "CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_recurring_expenses(status);",
  "CREATE INDEX IF NOT EXISTS idx_pending_scheduled ON pending_recurring_expenses(scheduled_date);",
];

export const DEFAULT_SETTINGS = [
  { key: "currency", value: "COP" },
  { key: "dateFormat", value: "DD/MM/YYYY" },
  { key: "firstDayOfWeek", value: "1" },
  { key: "notifications", value: "true" },
  { key: "darkMode", value: "false" },
  { key: "isPremium", value: "false" },
  { key: "dailyExpenseLimit", value: "5" },
  { key: "historyDays", value: "30" },
];
