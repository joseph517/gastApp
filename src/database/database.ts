import * as SQLite from 'expo-sqlite';
import {
  CREATE_EXPENSES_TABLE,
  CREATE_CATEGORIES_TABLE,
  CREATE_SETTINGS_TABLE,
  CREATE_INDEXES,
  DEFAULT_SETTINGS
} from './schema';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { Expense, Category, Setting } from '../types';

// Simple mutex implementation
class Mutex {
  private locked = false;
  private queue: Array<() => void> = [];

  async lock(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    return new Promise(resolve => {
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

      console.log('Initializing database...');

      // Always create a fresh connection
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (error) {
          console.warn('Error closing existing connection:', error);
        }
      }

      this.db = await SQLite.openDatabaseAsync('gastapp.db');

      // Test connection immediately
      await this.db.getFirstAsync('SELECT 1');

      await this.createTables();
      await this.createIndexes();
      await this.insertDefaultData();

      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
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
        throw new Error('Failed to establish database connection');
      }

      // Test connection before use
      try {
        await this.db.getFirstAsync('SELECT 1');
      } catch (error) {
        console.log(`Database connection invalid for ${operationName}, reinitializing...`);
        this.initialized = false;
        this.db = null;
        await this.init();

        if (!this.db) {
          throw new Error('Failed to reestablish database connection');
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
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(CREATE_EXPENSES_TABLE);
    await this.db.execAsync(CREATE_CATEGORIES_TABLE);
    await this.db.execAsync(CREATE_SETTINGS_TABLE);
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    for (const index of CREATE_INDEXES) {
      await this.db.execAsync(index);
    }
  }

  private async insertDefaultData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Insert default settings
    for (const setting of DEFAULT_SETTINGS) {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
        [setting.key, setting.value]
      );
    }

    // Insert default categories
    for (const category of DEFAULT_CATEGORIES) {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO categories (name, icon, color, is_premium) VALUES (?, ?, ?, ?)',
        [category.name, category.icon, category.color, category.isPremium ? 1 : 0]
      );
    }
  }

  // Expense operations
  async addExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'synced'>): Promise<number> {
    return this.executeWithConnection(async (db) => {
      const result = await db.runAsync(
        'INSERT INTO expenses (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [expense.amount, expense.description, expense.category, expense.date]
      );
      return result.lastInsertRowId;
    }, 'addExpense');
  }

  async getExpenses(limit?: number, offset?: number): Promise<Expense[]> {
    return this.executeWithConnection(async (db) => {
      let query = 'SELECT * FROM expenses ORDER BY date DESC, created_at DESC';
      const params: any[] = [];

      if (limit !== undefined) {
        query += ' LIMIT ?';
        params.push(limit);

        if (offset !== undefined) {
          query += ' OFFSET ?';
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
        synced: Boolean(row.synced)
      }));
    }, 'getExpenses');
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    return this.executeWithConnection(async (db) => {
      const result = await db.getAllAsync(
        'SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC, created_at DESC',
        [startDate, endDate]
      );

      return result.map((row: any) => ({
        id: row.id,
        amount: row.amount,
        description: row.description,
        category: row.category,
        date: row.date,
        createdAt: row.created_at,
        synced: Boolean(row.synced)
      }));
    }, 'getExpensesByDateRange');
  }

  async deleteExpense(id: number): Promise<void> {
    return this.executeWithConnection(async (db) => {
      await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
    }, 'deleteExpense');
  }

  async updateExpense(id: number, data: Partial<Expense>): Promise<void> {
    return this.executeWithConnection(async (db) => {
      // Map camelCase to snake_case for database columns
      const fieldMap: Record<string, string> = {
        'createdAt': 'created_at'
      };

      const fields = Object.keys(data)
        .filter(key => key !== 'id')
        .map(key => {
          const dbField = fieldMap[key] || key;
          return `${dbField} = ?`;
        });

      const values = Object.values(data).filter((_, index) => Object.keys(data)[index] !== 'id');

      if (fields.length === 0) return;

      const query = `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`;
      await db.runAsync(query, [...values, id]);
    }, 'updateExpense');
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return this.executeWithConnection(async (db) => {
      const result = await db.getAllAsync('SELECT * FROM categories ORDER BY name');

      return result.map((row: any) => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        color: row.color,
        isPremium: Boolean(row.is_premium)
      }));
    }, 'getCategories');
  }

  // Settings operations
  async getSetting(key: string): Promise<string | null> {
    return this.executeWithConnection(async (db) => {
      const result = await db.getFirstAsync(
        'SELECT value FROM settings WHERE key = ?',
        [key]
      ) as { value: string } | null;

      return result?.value || null;
    }, 'getSetting');
  }

  async setSetting(key: string, value: string): Promise<void> {
    return this.executeWithConnection(async (db) => {
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value]
      );
    }, 'setSetting');
  }

  async getAllSettings(): Promise<Record<string, string>> {
    return this.executeWithConnection(async (db) => {
      const results = await db.getAllAsync('SELECT key, value FROM settings');
      const settings: Record<string, string> = {};

      for (const row of results as { key: string, value: string }[]) {
        settings[row.key] = row.value;
      }

      return settings;
    }, 'getAllSettings');
  }

  async clearAllData(): Promise<void> {
    return this.executeWithConnection(async (db) => {
      // Eliminar todos los gastos
      await db.runAsync('DELETE FROM expenses');

      // Eliminar todas las categorías personalizadas
      await db.runAsync('DELETE FROM categories');

      // Opcional: Resetear configuraciones excepto el tema
      await db.runAsync('DELETE FROM settings WHERE key != ?', ['theme']);

      console.log('Todos los datos han sido eliminados exitosamente');
    }, 'clearAllData');
  }

  async getExpenseCountForToday(): Promise<number> {
    return this.executeWithConnection(async (db) => {
      const today = new Date().toISOString().split('T')[0];
      const result = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM expenses WHERE date = ?',
        [today]
      ) as { count: number };

      return result.count;
    }, 'getExpenseCountForToday');
  }

  async getTotalByCategory(startDate: string, endDate: string): Promise<any[]> {
    return this.executeWithConnection(async (db) => {
      const result = await db.getAllAsync(`
        SELECT
          category,
          SUM(amount) as total,
          COUNT(*) as count
        FROM expenses
        WHERE date BETWEEN ? AND ?
        GROUP BY category
        ORDER BY total DESC
      `, [startDate, endDate]);

      return result || [];
    }, 'getTotalByCategory');
  }
}

export const databaseService = DatabaseService.getInstance();