export interface CategoryColorMap {
  [categoryName: string]: string;
}

// Colores base para las categorías (independientes del tema)
const baseCategoryColors: CategoryColorMap = {
  // Alimentación y restaurantes
  "Alimentación": "#FF6B6B",
  "Comida": "#FF6B6B",
  "Restaurantes": "#FF8A80",
  "Supermercado": "#F06292",
  "Bebidas": "#FFB74D",

  // Transporte
  "Transporte": "#4ECDC4",
  "Combustible": "#26A69A",
  "Taxi/Uber": "#81C784",
  "Transporte público": "#64B5F6",

  // Entretenimiento
  "Entretenimiento": "#9575CD",
  "Cine": "#AB47BC",
  "Juegos": "#8E24AA",
  "Música": "#BA68C8",

  // Salud
  "Salud": "#66BB6A",
  "Medicina": "#4CAF50",
  "Doctor": "#81C784",
  "Farmacia": "#A5D6A7",

  // Hogar
  "Hogar": "#FFB74D",
  "Servicios": "#FFA726",
  "Electricidad": "#FF9800",
  "Agua": "#03A9F4",
  "Internet": "#00BCD4",

  // Compras
  "Compras": "#FF7043",
  "Ropa": "#FF8A65",
  "Tecnología": "#78909C",
  "Electrónicos": "#90A4AE",

  // Educación
  "Educación": "#42A5F5",
  "Libros": "#5C6BC0",
  "Cursos": "#7986CB",

  // Otros
  "Otros": "#BDBDBD",
  "Varios": "#9E9E9E",
  "Gastos generales": "#757575",
};

// Colores de respaldo en caso de que la categoría no esté definida
const fallbackColors = [
  "#FF6B6B", // Rojo coral
  "#4ECDC4", // Verde agua
  "#45B7D1", // Azul cielo
  "#FFA07A", // Salmón
  "#98D8C8", // Verde menta
  "#FFD93D", // Amarillo dorado
  "#FF8A80", // Rosa coral
  "#81C784", // Verde claro
  "#64B5F6", // Azul claro
  "#FFB74D", // Naranja claro
  "#F06292", // Rosa
  "#9575CD", // Púrpura claro
  "#8E24AA", // Púrpura
  "#FF7043", // Naranja profundo
  "#26A69A", // Teal
];

/**
 * Obtiene el color asociado a una categoría específica
 * @param categoryName Nombre de la categoría
 * @param themeColors Colores del tema actual (opcional)
 * @returns Color hexadecimal para la categoría
 */
export const getCategoryColor = (categoryName: string, themeColors?: any): string => {
  // Validaciones defensivas
  if (!categoryName || typeof categoryName !== 'string') {
    return fallbackColors[0]; // Retornar el primer color de respaldo
  }

  // Normalizar el nombre de la categoría (sin espacios extra, capitalización consistente)
  const normalizedCategory = categoryName.trim();

  if (normalizedCategory === '') {
    return fallbackColors[0];
  }

  // Buscar color específico para la categoría
  if (baseCategoryColors[normalizedCategory]) {
    return baseCategoryColors[normalizedCategory];
  }

  // Buscar por coincidencia parcial (insensible a mayúsculas/minúsculas)
  const categoryKeys = Object.keys(baseCategoryColors);
  const partialMatch = categoryKeys.find(key =>
    key.toLowerCase().includes(normalizedCategory.toLowerCase()) ||
    normalizedCategory.toLowerCase().includes(key.toLowerCase())
  );

  if (partialMatch) {
    return baseCategoryColors[partialMatch];
  }

  // Si no se encuentra, usar un color de respaldo basado en el hash del nombre
  const hashCode = normalizedCategory.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  const colorIndex = Math.abs(hashCode) % fallbackColors.length;
  return fallbackColors[colorIndex];
};

/**
 * Obtiene un array de colores para múltiples categorías
 * @param categories Array de nombres de categorías
 * @param themeColors Colores del tema actual (opcional)
 * @returns Array de colores hexadecimales
 */
export const getCategoryColors = (categories: string[], themeColors?: any): string[] => {
  if (!categories || !Array.isArray(categories)) {
    return [];
  }
  return categories
    .filter(category => category && typeof category === 'string' && category.trim() !== '')
    .map(category => getCategoryColor(category, themeColors));
};

/**
 * Obtiene todos los colores de categorías disponibles
 * @returns Object con todas las asociaciones categoría-color
 */
export const getAllCategoryColors = (): CategoryColorMap => {
  return { ...baseCategoryColors };
};

/**
 * Añade o actualiza el color de una categoría
 * @param categoryName Nombre de la categoría
 * @param color Color hexadecimal
 */
export const setCategoryColor = (categoryName: string, color: string): void => {
  baseCategoryColors[categoryName.trim()] = color;
};