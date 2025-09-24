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

export const CREATE_INDEXES = [
  "CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);",
  "CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);",
  "CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);",
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
