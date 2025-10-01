/**
 * Utilidades para gestión de límites de presupuesto por categoría
 */

import { CategoryTotal } from '../types';
import { getCategoryColor } from './categoryUtils';

export interface CategoryLimitStatus {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'exceeded';
  color: string;
  count: number;
}

/**
 * Calcula el estado de un límite por categoría
 */
export const calculateCategoryLimitStatus = (
  category: string,
  limit: number,
  spent: number,
  count: number = 0
): CategoryLimitStatus => {
  const remaining = limit - spent;
  const percentage = limit > 0 ? (spent / limit) * 100 : 0;

  let status: 'safe' | 'warning' | 'exceeded' = 'safe';
  if (percentage >= 100) {
    status = 'exceeded';
  } else if (percentage >= 75) {
    status = 'warning';
  }

  return {
    category,
    limit,
    spent,
    remaining,
    percentage,
    status,
    color: getCategoryColor(category),
    count,
  };
};

/**
 * Obtiene todos los límites de categoría con su estado actual
 * Solo retorna categorías que tienen límite configurado
 */
export const getCategoryLimitsWithStatus = (
  categoryLimits: Record<string, number>,
  categoryTotals: CategoryTotal[]
): CategoryLimitStatus[] => {
  const limitsWithStatus: CategoryLimitStatus[] = [];

  // Iterar sobre todas las categorías que tienen límite configurado
  Object.entries(categoryLimits).forEach(([category, limit]) => {
    if (limit <= 0) return; // Ignorar límites no configurados

    // Buscar el total gastado en esta categoría
    const categoryTotal = categoryTotals.find(
      (ct) => ct.category === category
    );

    const spent = categoryTotal?.total || 0;
    const count = categoryTotal?.count || 0;

    const status = calculateCategoryLimitStatus(category, limit, spent, count);
    limitsWithStatus.push(status);
  });

  // Ordenar por porcentaje descendente (más críticos primero)
  return limitsWithStatus.sort((a, b) => b.percentage - a.percentage);
};

/**
 * Filtra categorías que han excedido el límite
 */
export const getExceededCategoryLimits = (
  categoryLimits: CategoryLimitStatus[]
): CategoryLimitStatus[] => {
  return categoryLimits.filter((limit) => limit.status === 'exceeded');
};

/**
 * Filtra categorías en estado de advertencia (75-100%)
 */
export const getWarningCategoryLimits = (
  categoryLimits: CategoryLimitStatus[]
): CategoryLimitStatus[] => {
  return categoryLimits.filter((limit) => limit.status === 'warning');
};

/**
 * Obtiene el número de categorías con límite excedido
 */
export const getExceededCount = (
  categoryLimits: CategoryLimitStatus[]
): number => {
  return categoryLimits.filter((limit) => limit.status === 'exceeded').length;
};

/**
 * Obtiene el número de categorías en advertencia
 */
export const getWarningCount = (
  categoryLimits: CategoryLimitStatus[]
): number => {
  return categoryLimits.filter((limit) => limit.status === 'warning').length;
};

/**
 * Verifica si alguna categoría ha excedido su límite
 */
export const hasExceededLimits = (
  categoryLimits: CategoryLimitStatus[]
): boolean => {
  return categoryLimits.some((limit) => limit.status === 'exceeded');
};

/**
 * Verifica si alguna categoría está en advertencia
 */
export const hasWarningLimits = (
  categoryLimits: CategoryLimitStatus[]
): boolean => {
  return categoryLimits.some((limit) => limit.status === 'warning');
};
