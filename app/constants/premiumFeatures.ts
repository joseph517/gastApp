import { PremiumFeature } from "../types/statistics";

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: "advanced-analytics",
    title: "Análisis Avanzado",
    description:
      "Gráficos de tendencias, comparativas anuales y predicciones",
    icon: "📊",
  },
  {
    id: "csv-xlsx-visualizer",
    title: "Visualizador CSV y XLSX Avanzado",
    description:
      "Visualiza tus datos de gastos en formato CSV y XLSX de manera intuitiva",
    icon: "📊",
  },
  {
    id: "budget-tracking",
    title: "Control de Presupuesto",
    description: "Establece límites por categoría y recibe alertas",
    icon: "🎯",
  },
  {
    id: "custom-reports",
    title: "Reportes Personalizados",
    description: "Crea reportes detallados por fechas y categorías",
    icon: "📋",
  },
  {
    id: "export-data",
    title: "Exportar Datos",
    description: "Exporta tus gastos a Excel, PDF y otros formatos",
    icon: "📤",
  },
  {
    id: "recurring-expenses",
    title: "Gastos Recurrentes",
    description: "Programa gastos que se repiten automáticamente",
    icon: "🔄",
  },
  {
    id: "multi-currency",
    title: "Multi-Moneda",
    description: "Soporte para múltiples monedas con conversión automática",
    icon: "💱",
  },
];