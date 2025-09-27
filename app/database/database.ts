import * as SQLite from "expo-sqlite";
import {
  CREATE_EXPENSES_TABLE,
  CREATE_CATEGORIES_TABLE,
  CREATE_SETTINGS_TABLE,
  CREATE_BUDGETS_TABLE,
  CREATE_INDEXES,
  DEFAULT_SETTINGS,
} from "./schema";
import {
  DEFAULT_CATEGORIES,
  PREMIUM_CATEGORIES,
} from "../constants/categories";
import { Expense, Category, Setting, Budget } from "../types";

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
  async createBudget(budget: Omit<Budget, "id" | "createdAt" | "updatedAt">): Promise<number> {
    return this.executeWithConnection(async (db) => {
      const result = await db.runAsync(
        "INSERT INTO budgets (amount, period, start_date, end_date, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
        [budget.amount, budget.period, budget.startDate, budget.endDate || null, budget.isActive ? 1 : 0]
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
      const result = await db.getFirstAsync(
        "SELECT * FROM budgets WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1"
      ) as any;

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
      await db.runAsync(query, [...values.filter(v => v !== undefined), id]);
    }, "updateBudget");
  }

  async deleteBudget(id: number): Promise<void> {
    return this.executeWithConnection(async (db) => {
      await db.runAsync("DELETE FROM budgets WHERE id = ?", [id]);
    }, "deleteBudget");
  }

  async getTotalSpentInBudgetPeriod(budget: Budget): Promise<number> {
    return this.executeWithConnection(async (db) => {
      const endDate = budget.endDate || new Date().toISOString().split('T')[0];

      const result = await db.getFirstAsync(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date BETWEEN ? AND ?",
        [budget.startDate, endDate]
      ) as { total: number };

      return result.total;
    }, "getTotalSpentInBudgetPeriod");
  }
}

export const databaseService = DatabaseService.getInstance();
