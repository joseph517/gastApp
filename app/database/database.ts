import * as SQLite from "expo-sqlite";
import {
  CREATE_EXPENSES_TABLE,
  CREATE_CATEGORIES_TABLE,
  CREATE_SETTINGS_TABLE,
  CREATE_BUDGETS_TABLE,
  CREATE_RECURRING_EXPENSES_TABLE,
  CREATE_PENDING_RECURRING_EXPENSES_TABLE,
  CREATE_INDEXES,
  DEFAULT_SETTINGS,
} from "./schema";
import {
  DEFAULT_CATEGORIES,
  PREMIUM_CATEGORIES,
} from "../constants/categories";
import {
  Expense,
  Category,
  Setting,
  Budget,
  RecurringExpense,
  PendingRecurringExpense,
} from "../types";

// Simple mutex implementation
class Mutex {
  private locked = false;
  private queue: Array<() => void> = [];

  async lock(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  unlock(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next?.();
    } else {
      this.locked = false;
    }
  }
}

class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;
  private mutex = new Mutex();

  // Singleton pattern
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private constructor() {}

  async init(): Promise<void> {
    await this.mutex.lock();
    try {
      if (this.initialized && this.db) {
        return;
      }

      console.log("Initializing database...");

      // Always create a fresh connection
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (error) {
          console.warn("Error closing existing connection:", error);
        }
      }

      this.db = await SQLite.openDatabaseAsync("gastapp.db");
      console.log("Database opened successfully:", this.db);

      // Test connection immediately
      await this.db.getFirstAsync("SELECT 1");

      await this.createTables();
      await this.createIndexes();
      await this.insertDefaultData();

      this.initialized = true;
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Error initializing database:", error);
      this.initialized = false;
      this.db = null;
      throw error;
    } finally {
      this.mutex.unlock();
    }
  }

  private async executeWithConnection<T>(
    operation: (db: SQLite.SQLiteDatabase) => Promise<T>,
    operationName: string
  ): Promise<T> {
    await this.mutex.lock();
    try {
      // Ensure we have a connection
      if (!this.initialized || !this.db) {
        this.initialized = false;
        this.db = null;
        await this.init();
      }

      if (!this.db) {
        throw new Error("Failed to establish database connection");
      }

      // Test connection before use
      try {
        await this.db.getFirstAsync("SELECT 1");
      } catch (error) {
        console.log(
          `Database connection invalid for ${operationName}, reinitializing...`
        );
        this.initialized = false;
        this.db = null;
        await this.init();

        if (!this.db) {
          throw new Error("Failed to reestablish database connection");
        }
      }

      // Execute the operation
      return await operation(this.db);
    } catch (error) {
      console.error(`Error in ${operationName}:`, error);
      throw error;
    } finally {
      this.mutex.unlock();
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execAsync(CREATE_EXPENSES_TABLE);
    await this.db.execAsync(CREATE_CATEGORIES_TABLE);
    await this.db.execAsync(CREATE_SETTINGS_TABLE);
    await this.db.execAsync(CREATE_BUDGETS_TABLE);

    // Crear las tablas de gastos recurrentes SOLO si no existen
    await this.db.execAsync(`
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
        execution_dates TEXT,
        notify_days_before INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await this.db.execAsync(`
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
    `);

    console.log("Recurring expenses tables created or verified");
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    for (const index of CREATE_INDEXES) {
      await this.db.execAsync(index);
    }
  }

  private async insertDefaultData(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    // Insert default settings
    for (const setting of DEFAULT_SETTINGS) {
      await this.db.runAsync(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
        [setting.key, setting.value]
      );
    }

    // Insert default categories
    for (const category of DEFAULT_CATEGORIES) {
      await this.db.runAsync(
        "INSERT OR IGNORE INTO categories (name, icon, color, is_premium) VALUES (?, ?, ?, ?)",
        [
          category.name,
          category.icon,
          category.color,
          category.isPremium ? 1 : 0,
        ]
      );
    }

    // Insert premium categories
    for (const category of PREMIUM_CATEGORIES) {
      await this.db.runAsync(
        "INSERT OR IGNORE INTO categories (name, icon, color, is_premium) VALUES (?, ?, ?, ?)",
        [
          category.name,
          category.icon,
          category.color,
          category.isPremium ? 1 : 0,
        ]
      );
    }
  }

  async forceInsertPremiumCategories(): Promise<void> {
    return this.executeWithConnection(async (db) => {
      // Delete existing premium categories first
      await db.runAsync("DELETE FROM categories WHERE is_premium = 1");

      // Insert premium categories
      for (const category of PREMIUM_CATEGORIES) {
        await db.runAsync(
          "INSERT INTO categories (name, icon, color, is_premium) VALUES (?, ?, ?, ?)",
          [
            category.name,
            category.icon,
            category.color,
            category.isPremium ? 1 : 0,
          ]
        );
      }
    }, "forceInsertPremiumCategories");
  }

  async reinitializeDefaultData(): Promise<void> {
    return this.executeWithConnection(async (db) => {
      // Insert default settings
      for (const setting of DEFAULT_SETTINGS) {
        await db.runAsync(
          "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
          [setting.key, setting.value]
        );
      }

      // Insert default categories
      for (const category of DEFAULT_CATEGORIES) {
        await db.runAsync(
          "INSERT OR IGNORE INTO categories (name, icon, color, is_premium) VALUES (?, ?, ?, ?)",
          [
            category.name,
            category.icon,
            category.color,
            category.isPremium ? 1 : 0,
          ]
        );
      }

      // Insert premium categories
      for (const category of PREMIUM_CATEGORIES) {
        await db.runAsync(
          "INSERT OR IGNORE INTO categories (name, icon, color, is_premium) VALUES (?, ?, ?, ?)",
          [
            category.name,
            category.icon,
            category.color,
            category.isPremium ? 1 : 0,
          ]
        );
      }
    }, "reinitializeDefaultData");
  }

  async importTestData(): Promise<void> {
    return this.executeWithConnection(async (db) => {
      // Importar datos de prueba desde archivo JSON
      const testExpenses = require("../data/testExpenses.json");

      // Insertar cada gasto de prueba
      for (const expense of testExpenses) {
        await db.runAsync(
          "INSERT OR IGNORE INTO expenses (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
          [expense.amount, expense.description, expense.category, expense.date]
        );
      }

      console.log(`Importados ${testExpenses.length} gastos de prueba`);

      // Verificar que se insertaron correctamente
      const result = (await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM expenses"
      )) as { count: number };
      console.log(`Total de gastos en la base de datos: ${result.count}`);
    }, "importTestData");
  }

  // Expense operations
  async addExpense(
    expense: Omit<Expense, "id" | "createdAt" | "synced">
  ): Promise<number> {
    return this.executeWithConnection(async (db) => {
      const result = await db.runAsync(
        "INSERT INTO expenses (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
        [expense.amount, expense.description, expense.category, expense.date]
      );
      return result.lastInsertRowId;
    }, "addExpense");
  }

  async getExpenses(limit?: number, offset?: number): Promise<Expense[]> {
    return this.executeWithConnection(async (db) => {
      let query = "SELECT * FROM expenses ORDER BY date DESC, created_at DESC";
      const params: any[] = [];

      if (limit !== undefined) {
        query += " LIMIT ?";
        params.push(limit);

        if (offset !== undefined) {
          query += " OFFSET ?";
          params.push(offset);
        }
      }

      const result = await db.getAllAsync(query, params);

      return result.map((row: any) => ({
        id: row.id,
        amount: row.amount,
        description: row.description,
        category: row.category,
        date: row.date,
        createdAt: row.created_at,
        synced: Boolean(row.synced),
      }));
    }, "getExpenses");
  }

  async getExpensesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Expense[]> {
    return this.executeWithConnection(async (db) => {
      const result = await db.getAllAsync(
        "SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC, created_at DESC",
        [startDate, endDate]
      );

      return result.map((row: any) => ({
        id: row.id,
        amount: row.amount,
        description: row.description,
        category: row.category,
        date: row.date,
        createdAt: row.created_at,
        synced: Boolean(row.synced),
      }));
    }, "getExpensesByDateRange");
  }

  async deleteExpense(id: number): Promise<void> {
    return this.executeWithConnection(async (db) => {
      await db.runAsync("DELETE FROM expenses WHERE id = ?", [id]);
    }, "deleteExpense");
  }

  async updateExpense(id: number, data: Partial<Expense>): Promise<void> {
    return this.executeWithConnection(async (db) => {
      // Map camelCase to snake_case for database columns
      const fieldMap: Record<string, string> = {
        createdAt: "created_at",
      };

      const fields = Object.keys(data)
        .filter((key) => key !== "id")
        .map((key) => {
          const dbField = fieldMap[key] || key;
          return `${dbField} = ?`;
        });

      const values = Object.values(data).filter(
        (_, index) => Object.keys(data)[index] !== "id"
      );

      if (fields.length === 0) return;

      const query = `UPDATE expenses SET ${fields.join(", ")} WHERE id = ?`;
      await db.runAsync(query, [...values, id]);
    }, "updateExpense");
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return this.executeWithConnection(async (db) => {
      const result = await db.getAllAsync(
        "SELECT * FROM categories ORDER BY name"
      );

      return result.map((row: any) => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        color: row.color,
        isPremium: Boolean(row.is_premium),
      }));
    }, "getCategories");
  }

  // Settings operations
  async getSetting(key: string): Promise<string | null> {
    return this.executeWithConnection(async (db) => {
      const result = (await db.getFirstAsync(
        "SELECT value FROM settings WHERE key = ?",
        [key]
      )) as { value: string } | null;

      return result?.value || null;
    }, "getSetting");
  }

  async setSetting(key: string, value: string): Promise<void> {
    return this.executeWithConnection(async (db) => {
      await db.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        [key, value]
      );
    }, "setSetting");
  }

  async getAllSettings(): Promise<Record<string, string>> {
    return this.executeWithConnection(async (db) => {
      const results = await db.getAllAsync("SELECT key, value FROM settings");
      const settings: Record<string, string> = {};

      for (const row of results as { key: string; value: string }[]) {
        settings[row.key] = row.value;
      }

      return settings;
    }, "getAllSettings");
  }

  async clearAllData(): Promise<void> {
    return this.executeWithConnection(async (db) => {
      // Eliminar todos los gastos
      await db.runAsync("DELETE FROM expenses");

      // Eliminar todos los presupuestos
      await db.runAsync("DELETE FROM budgets");

      // Eliminar gastos recurrentes
      await db.runAsync("DELETE FROM recurring_expenses");
      await db.runAsync("DELETE FROM pending_recurring_expenses");

      // Eliminar todas las categorías personalizadas
      await db.runAsync("DELETE FROM categories");

      // Opcional: Resetear configuraciones excepto el tema
      await db.runAsync("DELETE FROM settings WHERE key != ?", ["theme"]);

      console.log("Todos los datos han sido eliminados exitosamente");
    }, "clearAllData");
  }

  async getExpenseCountForToday(): Promise<number> {
    return this.executeWithConnection(async (db) => {
      const today = new Date().toISOString().split("T")[0];
      const result = (await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM expenses WHERE date = ?",
        [today]
      )) as { count: number };

      return result.count;
    }, "getExpenseCountForToday");
  }

  async getTotalByCategory(startDate: string, endDate: string): Promise<any[]> {
    return this.executeWithConnection(async (db) => {
      const result = await db.getAllAsync(
        `
        SELECT
          category,
          SUM(amount) as total,
          COUNT(*) as count
        FROM expenses
        WHERE date BETWEEN ? AND ?
        GROUP BY category
        ORDER BY total DESC
      `,
        [startDate, endDate]
      );

      return result || [];
    }, "getTotalByCategory");
  }

  // Budget operations
  async createBudget(
    budget: Omit<Budget, "id" | "createdAt" | "updatedAt">
  ): Promise<number> {
    return this.executeWithConnection(async (db) => {
      const result = await db.runAsync(
        "INSERT INTO budgets (amount, period, start_date, end_date, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
        [
          budget.amount,
          budget.period,
          budget.startDate,
          budget.endDate || null,
          budget.isActive ? 1 : 0,
        ]
      );
      return result.lastInsertRowId;
    }, "createBudget");
  }

  async getBudgets(): Promise<Budget[]> {
    return this.executeWithConnection(async (db) => {
      const result = await db.getAllAsync(
        "SELECT * FROM budgets ORDER BY created_at DESC"
      );

      return result.map((row: any) => ({
        id: row.id,
        amount: row.amount,
        period: row.period,
        startDate: row.start_date,
        endDate: row.end_date,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }, "getBudgets");
  }

  async getActiveBudget(): Promise<Budget | null> {
    return this.executeWithConnection(async (db) => {
      const result = (await db.getFirstAsync(
        "SELECT * FROM budgets WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1"
      )) as any;

      if (!result) return null;

      return {
        id: result.id,
        amount: result.amount,
        period: result.period,
        startDate: result.start_date,
        endDate: result.end_date,
        isActive: Boolean(result.is_active),
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      };
    }, "getActiveBudget");
  }

  async updateBudget(id: number, data: Partial<Budget>): Promise<void> {
    return this.executeWithConnection(async (db) => {
      const fieldMap: Record<string, string> = {
        startDate: "start_date",
        endDate: "end_date",
        isActive: "is_active",
        updatedAt: "updated_at",
      };

      const fields = Object.keys(data)
        .filter((key) => key !== "id" && key !== "createdAt")
        .map((key) => {
          const dbField = fieldMap[key] || key;
          return `${dbField} = ?`;
        });

      const values = Object.keys(data)
        .filter((key) => key !== "id" && key !== "createdAt")
        .map((key) => {
          const value = data[key as keyof Budget];
          if (key === "isActive") {
            return value ? 1 : 0;
          }
          return value;
        });

      if (fields.length === 0) return;

      fields.push("updated_at = CURRENT_TIMESTAMP");

      const query = `UPDATE budgets SET ${fields.join(", ")} WHERE id = ?`;
      await db.runAsync(query, [...values.filter((v) => v !== undefined), id]);
    }, "updateBudget");
  }

  async deleteBudget(id: number): Promise<void> {
    return this.executeWithConnection(async (db) => {
      await db.runAsync("DELETE FROM budgets WHERE id = ?", [id]);
    }, "deleteBudget");
  }

  async getTotalSpentInBudgetPeriod(budget: Budget): Promise<number> {
    return this.executeWithConnection(async (db) => {
      const endDate = budget.endDate || new Date().toISOString().split("T")[0];

      const result = (await db.getFirstAsync(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date BETWEEN ? AND ?",
        [budget.startDate, endDate]
      )) as { total: number };

      return result.total;
    }, "getTotalSpentInBudgetPeriod");
  }

  // Recurring Expenses operations
  async createRecurringExpense(
    expense: Omit<RecurringExpense, "id" | "createdAt" | "updatedAt">
  ): Promise<number> {
    return this.executeWithConnection(async (db) => {
      console.log("Creating recurring expense with data:", expense);

      const result = await db.runAsync(
        `INSERT INTO recurring_expenses (
          amount, description, category, frequency, interval_days,
          start_date, end_date, next_due_date, is_active, requires_confirmation,
          execution_dates, notify_days_before, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          expense.amount,
          expense.description,
          expense.category,
          expense.frequency,
          expense.intervalDays,
          expense.startDate,
          expense.endDate || null,
          expense.nextDueDate,
          expense.isActive ? 1 : 0,
          expense.requiresConfirmation ? 1 : 0,
          JSON.stringify(expense.executionDates),
          expense.notifyDaysBefore,
        ]
      );

      console.log("Recurring expense created with ID:", result.lastInsertRowId);

      // Verificar que se guardó correctamente
      const verifyResult = await db.getFirstAsync(
        "SELECT * FROM recurring_expenses WHERE id = ?",
        [result.lastInsertRowId]
      );
      console.log("Verification result:", verifyResult);

      return result.lastInsertRowId;
    }, "createRecurringExpense");
  }

  async getRecurringExpenses(): Promise<RecurringExpense[]> {
    return this.executeWithConnection(async (db) => {
      const result = await db.getAllAsync(
        "SELECT * FROM recurring_expenses ORDER BY created_at DESC"
      );

      return result.map((row: any) => ({
        id: row.id,
        amount: row.amount,
        description: row.description,
        category: row.category,
        frequency: row.frequency,
        intervalDays: row.interval_days,
        startDate: row.start_date,
        endDate: row.end_date,
        nextDueDate: row.next_due_date,
        isActive: Boolean(row.is_active),
        requiresConfirmation: Boolean(row.requires_confirmation),
        lastExecuted: row.last_executed,
        executionDates: JSON.parse(row.execution_dates || "[]"),
        notifyDaysBefore: row.notify_days_before,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }, "getRecurringExpenses");
  }

  async getActiveRecurringExpenses(): Promise<RecurringExpense[]> {
    return this.executeWithConnection(async (db) => {
      const result = await db.getAllAsync(
        "SELECT * FROM recurring_expenses WHERE is_active = 1 ORDER BY next_due_date ASC"
      );

      return result.map((row: any) => ({
        id: row.id,
        amount: row.amount,
        description: row.description,
        category: row.category,
        frequency: row.frequency,
        intervalDays: row.interval_days,
        startDate: row.start_date,
        endDate: row.end_date,
        nextDueDate: row.next_due_date,
        isActive: Boolean(row.is_active),
        requiresConfirmation: Boolean(row.requires_confirmation),
        lastExecuted: row.last_executed,
        executionDates: JSON.parse(row.execution_dates || "[]"),
        notifyDaysBefore: row.notify_days_before,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }, "getActiveRecurringExpenses");
  }

  async updateRecurringExpense(
    id: number,
    data: Partial<RecurringExpense>
  ): Promise<void> {
    return this.executeWithConnection(async (db) => {
      const fieldMap: Record<string, string> = {
        intervalDays: "interval_days",
        startDate: "start_date",
        endDate: "end_date",
        nextDueDate: "next_due_date",
        isActive: "is_active",
        requiresConfirmation: "requires_confirmation",
        lastExecuted: "last_executed",
        executionDates: "execution_dates",
        notifyDaysBefore: "notify_days_before",
      };

      const fields = Object.keys(data)
        .filter((key) => key !== "id" && key !== "createdAt")
        .map((key) => {
          const dbField = fieldMap[key] || key;
          return `${dbField} = ?`;
        });

      const values = Object.keys(data)
        .filter((key) => key !== "id" && key !== "createdAt")
        .map((key) => {
          const value = data[key as keyof RecurringExpense];
          if (key === "isActive" || key === "requiresConfirmation") {
            return value ? 1 : 0;
          }
          if (key === "executionDates") {
            return JSON.stringify(value);
          }
          return value;
        });

      if (fields.length === 0) return;

      fields.push("updated_at = CURRENT_TIMESTAMP");

      const query = `UPDATE recurring_expenses SET ${fields.join(
        ", "
      )} WHERE id = ?`;
      await db.runAsync(query, [...values.filter((v) => v !== undefined), id]);
    }, "updateRecurringExpense");
  }

  async deleteRecurringExpense(id: number): Promise<void> {
    return this.executeWithConnection(async (db) => {
      await db.runAsync("DELETE FROM recurring_expenses WHERE id = ?", [id]);
    }, "deleteRecurringExpense");
  }

  // Pending Recurring Expenses operations
  async createPendingRecurringExpense(
    pending: Omit<PendingRecurringExpense, "id" | "createdAt">
  ): Promise<number> {
    return this.executeWithConnection(async (db) => {
      const result = await db.runAsync(
        `INSERT INTO pending_recurring_expenses (
          recurring_expense_id, scheduled_date, amount, description, category, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          pending.recurringExpenseId,
          pending.scheduledDate,
          pending.amount,
          pending.description,
          pending.category,
          pending.status,
        ]
      );
      return result.lastInsertRowId;
    }, "createPendingRecurringExpense");
  }

  async getPendingRecurringExpenses(): Promise<PendingRecurringExpense[]> {
    return this.executeWithConnection(async (db) => {
      const result = await db.getAllAsync(
        `SELECT p.*
         FROM pending_recurring_expenses p
         JOIN recurring_expenses r ON p.recurring_expense_id = r.id
         WHERE p.status = 'pending'
         ORDER BY p.scheduled_date ASC`
      );

      return result.map((row: any) => ({
        id: row.id,
        recurringExpenseId: row.recurring_expense_id,
        scheduledDate: row.scheduled_date,
        amount: row.amount,
        description: row.description,
        category: row.category,
        status: row.status,
        createdAt: row.created_at,
      }));
    }, "getPendingRecurringExpenses");
  }

  async updatePendingRecurringExpense(
    id: number,
    data: Partial<PendingRecurringExpense>
  ): Promise<void> {
    return this.executeWithConnection(async (db) => {
      const fieldMap: Record<string, string> = {
        recurringExpenseId: "recurring_expense_id",
        scheduledDate: "scheduled_date",
      };

      const fields = Object.keys(data)
        .filter((key) => key !== "id" && key !== "createdAt")
        .map((key) => {
          const dbField = fieldMap[key] || key;
          return `${dbField} = ?`;
        });

      const values = Object.values(data).filter(
        (_, index) =>
          Object.keys(data)[index] !== "id" &&
          Object.keys(data)[index] !== "createdAt"
      );

      if (fields.length === 0) return;

      const query = `UPDATE pending_recurring_expenses SET ${fields.join(
        ", "
      )} WHERE id = ?`;
      await db.runAsync(query, [...values, id]);
    }, "updatePendingRecurringExpense");
  }

  async deletePendingRecurringExpense(id: number): Promise<void> {
    return this.executeWithConnection(async (db) => {
      await db.runAsync("DELETE FROM pending_recurring_expenses WHERE id = ?", [
        id,
      ]);
    }, "deletePendingRecurringExpense");
  }

  // Migration methods
  async fixRecurringExpensesTable(): Promise<boolean> {
    return this.executeWithConnection(async (db) => {
      try {
        // Verificar si la tabla existe y tiene la estructura correcta
        const tableInfo = await db.getAllAsync(
          "PRAGMA table_info(recurring_expenses)"
        );
        const hasTemplateName = tableInfo.some(
          (column: any) => column.name === "template_name"
        );

        if (!hasTemplateName) {
          console.log("Table structure is already correct");
          return true;
        }

        console.log("Fixing recurring_expenses table structure...");

        // Simplemente eliminar y recrear la tabla (solo para desarrollo)
        await db.execAsync("DROP TABLE IF EXISTS recurring_expenses;");
        await db.execAsync("DROP TABLE IF EXISTS pending_recurring_expenses;");

        // Recrear con la estructura correcta
        await db.execAsync(`
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
            execution_dates TEXT,
            notify_days_before INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await db.execAsync(`
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
        `);

        // Recrear índices
        await db.execAsync(
          "CREATE INDEX IF NOT EXISTS idx_recurring_next_due ON recurring_expenses(next_due_date);"
        );
        await db.execAsync(
          "CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_expenses(is_active);"
        );
        await db.execAsync(
          "CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_recurring_expenses(status);"
        );
        await db.execAsync(
          "CREATE INDEX IF NOT EXISTS idx_pending_scheduled ON pending_recurring_expenses(scheduled_date);"
        );

        console.log("Table structure fixed successfully");
        return true;
      } catch (error) {
        console.error("Failed to fix table structure:", error);
        return false;
      }
    }, "fixRecurringExpensesTable");
  }
}

export const databaseService = DatabaseService.getInstance();
