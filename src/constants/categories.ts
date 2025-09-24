import { COLORS } from './colors';

export interface CategoryData {
  name: string;
  icon: string;
  color: string;
  isPremium: boolean;
}

export const DEFAULT_CATEGORIES: CategoryData[] = [
  { name: 'Comida', icon: '🍽️', color: COLORS.categories.comida, isPremium: false },
  { name: 'Transporte', icon: '🚗', color: COLORS.categories.transporte, isPremium: false },
  { name: 'Entretenimiento', icon: '🎬', color: COLORS.categories.entretenimiento, isPremium: false },
  { name: 'Salud', icon: '⚕️', color: COLORS.categories.salud, isPremium: false },
  { name: 'Compras', icon: '🛍️', color: COLORS.categories.compras, isPremium: false },
  { name: 'Servicios', icon: '🔧', color: COLORS.categories.servicios, isPremium: false },
  { name: 'Trabajo', icon: '💼', color: COLORS.categories.trabajo, isPremium: false },
  { name: 'Otros', icon: '📝', color: COLORS.categories.otros, isPremium: false }
];

export const PREMIUM_CATEGORIES: CategoryData[] = [
  { name: 'Inversiones', icon: '📈', color: '#8E44AD', isPremium: true },
  { name: 'Educación', icon: '📚', color: '#E67E22', isPremium: true },
  { name: 'Mascotas', icon: '🐕', color: '#F39C12', isPremium: true },
  { name: 'Regalos', icon: '🎁', color: '#E91E63', isPremium: true },
  { name: 'Hogar', icon: '🏠', color: '#795548', isPremium: true },
];

export const FREE_TIER_LIMITS = {
  maxExpensesPerDay: 5,
  historyDays: 30,
  maxCategories: DEFAULT_CATEGORIES.length,
};