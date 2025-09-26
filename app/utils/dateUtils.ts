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
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
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