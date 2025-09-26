import { DEFAULT_CATEGORIES, PREMIUM_CATEGORIES } from "../constants/categories";

export const getCategoryIcon = (categoryName: string): string => {
  const allCategories = [...DEFAULT_CATEGORIES, ...PREMIUM_CATEGORIES];
  const category = allCategories.find(cat => cat.name === categoryName);
  return category?.icon || "📝";
};

export const getCategoryColor = (categoryName: string): string => {
  const allCategories = [...DEFAULT_CATEGORIES, ...PREMIUM_CATEGORIES];
  const category = allCategories.find(cat => cat.name === categoryName);
  return category?.color || "#95A5A6";
};

export const getCategoryData = (categoryName: string) => {
  const allCategories = [...DEFAULT_CATEGORIES, ...PREMIUM_CATEGORIES];
  const category = allCategories.find(cat => cat.name === categoryName);
  return category || {
    name: categoryName,
    icon: "📝",
    color: "#95A5A6",
    isPremium: false
  };
};