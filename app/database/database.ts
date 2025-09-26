import * as SQLite from 'expo-sqlite';
import {
  CREATE_EXPENSES_TABLE,
  CREATE_CATEGORIES_TABLE,
  CREATE_SETTINGS_TABLE,
  CREATE_INDEXES,
  DEFAULT_SETTINGS
} from './schema';
import { DEFAULT_CATEGORIES, PREMIUM_CATEGORIES } from '../constants/categories';
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

    // Insert premium categories
    for (const category of PREMIUM_CATEGORIES) {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO categories (name, icon, color, is_premium) VALUES (?, ?, ?, ?)',
        [category.name, category.icon, category.color, category.isPremium ? 1 : 0]
      );
    }
  }

  async forceInsertPremiumCategories(): Promise<void> {
    return this.executeWithConnection(async (db) => {
      // Delete existing premium categories first
      await db.runAsync('DELETE FROM categories WHERE is_premium = 1');

      // Insert premium categories
      for (const category of PREMIUM_CATEGORIES) {
        await db.runAsync(
          'INSERT INTO categories (name, icon, color, is_premium) VALUES (?, ?, ?, ?)',
          [category.name, category.icon, category.color, category.isPremium ? 1 : 0]
        );
      }
    }, 'forceInsertPremiumCategories');
  }

  async reinitializeDefaultData(): Promise<void> {
    return this.executeWithConnection(async (db) => {
      // Insert default settings
      for (const setting of DEFAULT_SETTINGS) {
        await db.runAsync(
          'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
          [setting.key, setting.value]
        );
      }

      // Insert default categories
      for (const category of DEFAULT_CATEGORIES) {
        await db.runAsync(
          'INSERT OR IGNORE INTO categories (name, icon, color, is_premium) VALUES (?, ?, ?, ?)',
          [category.name, category.icon, category.color, category.isPremium ? 1 : 0]
        );
      }

      // Insert premium categories
      for (const category of PREMIUM_CATEGORIES) {
        await db.runAsync(
          'INSERT OR IGNORE INTO categories (name, icon, color, is_premium) VALUES (?, ?, ?, ?)',
          [category.name, category.icon, category.color, category.isPremium ? 1 : 0]
        );
      }
    }, 'reinitializeDefaultData');
  }

  async importTestData(): Promise<void> {
    return this.executeWithConnection(async (db) => {
      // Datos de prueba para agosto (mes pasado)
      const testExpenses = [
        // Agosto semana 1
        { amount: 52000, description: "Supermercado semanal", category: "Comida", date: "2025-08-01" },
        { amount: 8500, description: "Gasolina", category: "Transporte", date: "2025-08-01" },
        { amount: 18500, description: "Almuerzo trabajo", category: "Comida", date: "2025-08-02" },
        { amount: 25000, description: "Cinema", category: "Entretenimiento", date: "2025-08-02" },
        { amount: 35000, description: "Cena restaurante", category: "Comida", date: "2025-08-03" },
        { amount: 12000, description: "Uber", category: "Transporte", date: "2025-08-03" },
        { amount: 15000, description: "Desayuno café", category: "Comida", date: "2025-08-04" },
        { amount: 45000, description: "Medicina farmacia", category: "Salud", date: "2025-08-04" },

        // Agosto semana 2
        { amount: 48000, description: "Supermercado", category: "Comida", date: "2025-08-05" },
        { amount: 15000, description: "Taxi aeropuerto", category: "Transporte", date: "2025-08-06" },
        { amount: 22000, description: "Comida rápida", category: "Comida", date: "2025-08-06" },
        { amount: 65000, description: "Teatro", category: "Entretenimiento", date: "2025-08-07" },
        { amount: 28000, description: "Almuerzo", category: "Comida", date: "2025-08-08" },
        { amount: 120000, description: "Ropa y zapatos", category: "Compras", date: "2025-08-09" },
        { amount: 32000, description: "Brunch domingo", category: "Comida", date: "2025-08-10" },
        { amount: 85000, description: "Peluquería y spa", category: "Servicios", date: "2025-08-11" },

        // Agosto semana 3
        { amount: 41000, description: "Supermercado", category: "Comida", date: "2025-08-12" },
        { amount: 9500, description: "Metro y bus", category: "Transporte", date: "2025-08-12" },
        { amount: 25000, description: "Almuerzo restaurante", category: "Comida", date: "2025-08-13" },
        { amount: 45000, description: "Concierto", category: "Entretenimiento", date: "2025-08-14" },
        { amount: 18000, description: "Cena delivery", category: "Comida", date: "2025-08-14" },
        { amount: 75000, description: "Materiales oficina", category: "Trabajo", date: "2025-08-15" },
        { amount: 30000, description: "Comida familiar", category: "Comida", date: "2025-08-16" },
        { amount: 95000, description: "Consulta médica", category: "Salud", date: "2025-08-17" },
        { amount: 21000, description: "Café y postres", category: "Comida", date: "2025-08-18" },

        // Agosto semana 4
        { amount: 55000, description: "Supermercado grande", category: "Comida", date: "2025-08-19" },
        { amount: 18000, description: "Gasolina semanal", category: "Transporte", date: "2025-08-20" },
        { amount: 80000, description: "Cena y drinks", category: "Entretenimiento", date: "2025-08-20" },
        { amount: 28500, description: "Almuerzo ejecutivo", category: "Comida", date: "2025-08-21" },
        { amount: 150000, description: "Electrodoméstico", category: "Compras", date: "2025-08-22" },
        { amount: 65000, description: "Mantenimiento auto", category: "Servicios", date: "2025-08-23" },
        { amount: 35000, description: "Parrillada", category: "Comida", date: "2025-08-24" },
        { amount: 42000, description: "Regalos cumpleaños", category: "Otros", date: "2025-08-25" },

        // Agosto semana 5
        { amount: 24000, description: "Desayuno especial", category: "Comida", date: "2025-08-26" },
        { amount: 11000, description: "Taxi", category: "Transporte", date: "2025-08-27" },
        { amount: 38000, description: "Comida italiana", category: "Comida", date: "2025-08-28" },
        { amount: 55000, description: "Karaoke y bar", category: "Entretenimiento", date: "2025-08-29" },
        { amount: 45000, description: "Supermercado fin mes", category: "Comida", date: "2025-08-30" },
        { amount: 25000, description: "Varios gastos menores", category: "Otros", date: "2025-08-31" },

        // Septiembre semana anterior
        { amount: 38200, description: "Supermercado", category: "Comida", date: "2025-09-11" },
        { amount: 10000, description: "Metro", category: "Transporte", date: "2025-09-12" },
        { amount: 15500, description: "Almuerzo", category: "Comida", date: "2025-09-12" },
        { amount: 42800, description: "Supermercado", category: "Comida", date: "2025-09-13" },
        { amount: 19000, description: "Café", category: "Comida", date: "2025-09-14" },
        { amount: 28000, description: "Streaming", category: "Entretenimiento", date: "2025-09-15" },
        { amount: 35750, description: "Cena", category: "Comida", date: "2025-09-15" },
        { amount: 12000, description: "Uber", category: "Transporte", date: "2025-09-16" },
        { amount: 24500, description: "Comida rápida", category: "Comida", date: "2025-09-17" },

        // Septiembre semana actual
        { amount: 45500, description: "Supermercado", category: "Comida", date: "2025-09-18" },
        { amount: 12000, description: "Uber", category: "Transporte", date: "2025-09-18" },
        { amount: 23750, description: "Almuerzo", category: "Comida", date: "2025-09-19" },
        { amount: 35000, description: "Cine", category: "Entretenimiento", date: "2025-09-19" },
        { amount: 67300, description: "Supermercado", category: "Comida", date: "2025-09-20" },
        { amount: 8500, description: "Gasolina", category: "Transporte", date: "2025-09-20" },
        { amount: 18900, description: "Café y snacks", category: "Comida", date: "2025-09-21" },
        { amount: 89990, description: "Ropa tienda departamental", category: "Compras", date: "2025-09-22" },
        { amount: 42000, description: "Cena restaurante", category: "Comida", date: "2025-09-22" },
        { amount: 25000, description: "Farmacia", category: "Salud", date: "2025-09-23" },
        { amount: 31200, description: "Comida a domicilio", category: "Comida", date: "2025-09-23" },
        { amount: 15000, description: "Taxi", category: "Transporte", date: "2025-09-24" },
        { amount: 28500, description: "Desayuno fuera", category: "Comida", date: "2025-09-24" }
      ];

      // Insertar cada gasto de prueba
      for (const expense of testExpenses) {
        await db.runAsync(
          'INSERT OR IGNORE INTO expenses (amount, description, category, date, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
          [expense.amount, expense.description, expense.category, expense.date]
        );
      }

      console.log(`Importados ${testExpenses.length} gastos de prueba`);

      // Verificar que se insertaron correctamente
      const result = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM expenses'
      ) as { count: number };
      console.log(`Total de gastos en la base de datos: ${result.count}`);
    }, 'importTestData');
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