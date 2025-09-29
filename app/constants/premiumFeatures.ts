import { PremiumFeature } from "../types/statistics";

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: "advanced-analytics",
    title: "Análisis Avanzado",
    description: "Gráficos de tendencias, comparativas anuales y predicciones",
    icon: "📊",
    isImplemented: true,
    isPremium: true,
    screen: "Analytics",
  },
  {
    id: "csv-xlsx-visualizer",
    title: "Visualizador CSV y XLSX Avanzado",
    description:
      "Visualiza tus datos de gastos en formato CSV y XLSX de manera intuitiva",
    icon: "📊",
    isImplemented: false,
    isPremium: true,
    comingSoonMessage: "Función en desarrollo - Próximamente",
  },
  {
    id: "budget-tracking",
    title: "Control de Presupuesto",
    description: "Establece límites por categoría y recibe alertas",
    icon: "🎯",
    isImplemented: true,
    isPremium: true,
    screen: "Budget",
  },
  {
    id: "custom-reports",
    title: "Reportes Personalizados",
    description: "Crea reportes detallados por fechas y categorías",
    icon: "📋",
    isImplemented: false,
    isPremium: true,
    comingSoonMessage: "Reportes personalizados - Próximamente",
  },
  {
    id: "export-data",
    title: "Exportar Datos",
    description: "Exporta tus gastos a Excel, PDF y otros formatos",
    icon: "📤",
    isImplemented: false,
    isPremium: true,
    comingSoonMessage: "Exportación de datos - Próximamente",
  },
  {
    id: "recurring-expenses",
    title: "Gastos Recurrentes",
    description: "Programa gastos que se repiten automáticamente",
    icon: "🔄",
    isImplemented: true,
    isPremium: true,
    screen: "RecurringExpenses",
  },
  {
    id: "multi-currency",
    title: "Multi-Moneda",
    description: "Soporte para múltiples monedas con conversión automática",
    icon: "💱",
    isImplemented: false,
    isPremium: true,
    comingSoonMessage: "Soporte multi-moneda - Próximamente",
  },
];

export const getFeatureConfig = (featureId: string): PremiumFeature | null => {
  return PREMIUM_FEATURES.find(feature => feature.id === featureId) || null;
};

export const getAllFeatures = (): PremiumFeature[] => {
  return PREMIUM_FEATURES;
};

export const getImplementedFeatures = (): PremiumFeature[] => {
  return PREMIUM_FEATURES.filter(feature => feature.isImplemented);
};

export const getPremiumFeatures = (): PremiumFeature[] => {
  return PREMIUM_FEATURES.filter(feature => feature.isPremium);
};
