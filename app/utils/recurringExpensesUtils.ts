/**
 * Utilidades compartidas para gestión de gastos recurrentes
 */

// Constantes
export const INTERVAL_OPTIONS = [7, 15, 30] as const;
export const NOTIFICATION_OPTIONS = [1, 3, 7] as const;

/**
 * Formatea un monto como moneda colombiana (COP)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formatea una fecha en formato corto (DD/MM/YYYY)
 */
export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formatea una fecha en formato largo (con día de la semana)
 */
export const formatDateLong = (date: Date): string => {
  return date.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Obtiene la etiqueta de frecuencia para un gasto recurrente
 */
export const getFrequencyLabel = (
  intervalDays: number,
  executionDates?: number[]
): string => {
  if (executionDates && executionDates.length > 0) {
    return `Días ${executionDates.join(", ")} del mes`;
  }

  switch (intervalDays) {
    case 7:
      return "Cada 7 días";
    case 15:
      return "Cada 15 días";
    case 30:
      return "Cada 30 días";
    default:
      return `Cada ${intervalDays} días`;
  }
};

/**
 * Valida que un número de día sea válido (1-31)
 */
export const isValidDay = (day: number): boolean => {
  return day >= 1 && day <= 31;
};