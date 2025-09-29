export interface FeatureConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  isImplemented: boolean;
  isPremium: boolean;
  screen?: string;
  comingSoonMessage?: string;
}

export interface FeatureAccessResult {
  isAccessible: boolean;
  canNavigate: boolean;
  shouldShowUpgrade: boolean;
  shouldShowComingSoon: boolean;
  message?: string;
  action?: "navigate" | "upgrade" | "disabled";
  targetScreen?: string;
}

export const FEATURE_CONFIG: Record<string, FeatureConfig> = {
  "advanced-analytics": {
    id: "advanced-analytics",
    title: "Análisis Avanzado",
    description: "Gráficos de tendencias, comparativas anuales y predicciones",
    icon: "📊",
    isImplemented: true,
    isPremium: true,
    screen: "Analytics",
  },
  "csv-xlsx-visualizer": {
    id: "csv-xlsx-visualizer",
    title: "Visualizador CSV y XLSX Avanzado",
    description:
      "Visualiza tus datos de gastos en formato CSV y XLSX de manera intuitiva",
    icon: "📊",
    isImplemented: false,
    isPremium: true,
  },
  "budget-tracking": {
    id: "budget-tracking",
    title: "Control de Presupuesto",
    description: "Establece límites por categoría y recibe alertas",
    icon: "🎯",
    isImplemented: true,
    isPremium: true,
    screen: "Budget",
  },
  "custom-reports": {
    id: "custom-reports",
    title: "Reportes Personalizados",
    description: "Crea reportes detallados por fechas y categorías",
    icon: "📋",
    isImplemented: false,
    isPremium: true,
  },
  "export-data": {
    id: "export-data",
    title: "Exportar Datos",
    description: "Exporta tus gastos a Excel, PDF y otros formatos",
    icon: "📤",
    isImplemented: false,
    isPremium: true,
  },
  "recurring-expenses": {
    id: "recurring-expenses",
    title: "Gastos Recurrentes",
    description: "Programa gastos que se repiten automáticamente",
    icon: "🔄",
    isImplemented: true,
    isPremium: true,
    screen: "RecurringExpenses",
  },
  "multi-currency": {
    id: "multi-currency",
    title: "Multi-Moneda",
    description: "Soporte para múltiples monedas con conversión automática",
    icon: "💱",
    isImplemented: false,
    isPremium: true,
  },
};

export const getFeatureConfig = (featureId: string): FeatureConfig | null => {
  return FEATURE_CONFIG[featureId] || null;
};

export const getAllFeatures = (): FeatureConfig[] => {
  return Object.values(FEATURE_CONFIG);
};

export const getImplementedFeatures = (): FeatureConfig[] => {
  return getAllFeatures().filter((feature) => feature.isImplemented);
};

export const getPremiumFeatures = (): FeatureConfig[] => {
  return getAllFeatures().filter((feature) => feature.isPremium);
};
