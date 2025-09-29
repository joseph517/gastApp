import { Period } from "../types";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export const getPeriodDateRange = (period: Period): DateRange => {
  const now = new Date();
  let startDate: Date, endDate: Date;

  switch (period) {
    case "week":
      // Semana calendario actual (lunes a domingo)
      startDate = getWeekStart(now);
      endDate = getWeekEnd(now);
      break;

    case "month":
      // Mes calendario actual
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "year":
      // Año calendario actual
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(now.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;

    default:
      startDate = new Date(now);
      endDate = new Date(now);
  }

  return { startDate, endDate };
};

export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Obtiene el día de la semana donde lunes = 0, martes = 1, ..., domingo = 6
 * En lugar del comportamiento por defecto de JavaScript donde domingo = 0
 */
export const getMondayBasedDayOfWeek = (date: Date): number => {
  const jsDay = date.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
  return jsDay === 0 ? 6 : jsDay - 1; // Convertir a lunes = 0, ..., domingo = 6
};

/**
 * Obtiene el inicio de la semana (lunes) para una fecha dada
 */
export const getWeekStart = (date: Date): Date => {
  const dayOfWeek = getMondayBasedDayOfWeek(date);
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

/**
 * Obtiene el final de la semana (domingo) para una fecha dada
 */
export const getWeekEnd = (date: Date): Date => {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

/**
 * Obtiene el rango de una semana específica basado en un offset desde la semana actual
 * weekOffset: 0 = esta semana, 1 = semana pasada, -1 = próxima semana
 */
export const getWeekRange = (weekOffset: number = 0): { start: Date; end: Date } => {
  const now = new Date();
  const currentWeekStart = getWeekStart(now);

  const targetWeekStart = new Date(currentWeekStart);
  targetWeekStart.setDate(currentWeekStart.getDate() - (weekOffset * 7));

  const targetWeekEnd = getWeekEnd(targetWeekStart);

  return {
    start: targetWeekStart,
    end: targetWeekEnd
  };
};

/**
 * Nombres de días ordenados de lunes a domingo
 */
export const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/**
 * Parsea una fecha en formato ISO string para crear un objeto Date en hora local
 * Evita problemas de zona horaria que hacen que las fechas se muestren un día anterior
 * @param dateString - Fecha en formato ISO (ej: "2024-03-15" o "2024-03-15T10:30:00.000Z")
 * @returns Date object en hora local
 */
export const parseLocalDate = (dateString: string): Date => {
  // Si la fecha ya incluye información de hora, extraer solo la parte de la fecha
  const dateOnly = dateString.split('T')[0];

  // Separar año, mes y día
  const [year, month, day] = dateOnly.split('-').map(Number);

  // Crear fecha local (mes - 1 porque los meses en JS van de 0 a 11)
  return new Date(year, month - 1, day);
};