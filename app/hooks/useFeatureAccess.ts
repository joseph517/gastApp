import { useCallback } from "react";
import { useExpenseStore } from "../store/expenseStore";
import { getFeatureConfig, getAllFeatures } from "../constants/premiumFeatures";
import { PremiumFeature, FeatureAccessResult } from "../types/statistics";

export const useFeatureAccess = () => {
  const { isPremium } = useExpenseStore();

  const checkFeatureAccess = useCallback(
    (featureId: string): FeatureAccessResult => {
      const feature = getFeatureConfig(featureId);

      if (!feature) {
        return {
          isAccessible: false,
          canNavigate: false,
          shouldShowUpgrade: false,
          shouldShowComingSoon: true,
          message: "Función no encontrada",
          action: "disabled",
        };
      }

      // Función no implementada
      if (!feature.isImplemented) {
        return {
          isAccessible: false,
          canNavigate: false,
          shouldShowUpgrade: false,
          shouldShowComingSoon: true,
          message: "Próximamente",
          action: "disabled",
        };
      }

      // Función implementada y no es premium (acceso libre)
      if (feature.isImplemented && !feature.isPremium) {
        return {
          isAccessible: true,
          canNavigate: true,
          shouldShowUpgrade: false,
          shouldShowComingSoon: false,
          action: "navigate",
          targetScreen: feature.screen,
        };
      }

      // Función implementada y es premium
      if (feature.isImplemented && feature.isPremium) {
        if (isPremium) {
          // Usuario premium puede acceder
          return {
            isAccessible: true,
            canNavigate: true,
            shouldShowUpgrade: false,
            shouldShowComingSoon: false,
            action: "navigate",
            targetScreen: feature.screen,
          };
        } else {
          // Usuario free, mostrar upgrade
          return {
            isAccessible: false,
            canNavigate: false,
            shouldShowUpgrade: true,
            shouldShowComingSoon: false,
            message: "Función Premium - Actualiza tu cuenta",
            action: "upgrade",
          };
        }
      }

      // Caso por defecto (no debería llegar aquí)
      return {
        isAccessible: false,
        canNavigate: false,
        shouldShowUpgrade: false,
        shouldShowComingSoon: true,
        action: "disabled",
      };
    },
    [isPremium]
  );

  const getFeatureAction = useCallback(
    (
      featureId: string,
      navigation?: any,
      onUpgradePress?: () => void
    ): (() => void) | undefined => {
      const accessResult = checkFeatureAccess(featureId);

      switch (accessResult.action) {
        case "navigate":
          if (navigation && accessResult.targetScreen) {
            return () => navigation.navigate(accessResult.targetScreen);
          }
          return undefined;

        case "upgrade":
          return onUpgradePress;

        case "disabled":
        default:
          return undefined;
      }
    },
    [checkFeatureAccess]
  );

  const isFeatureAccessible = useCallback(
    (featureId: string): boolean => {
      return checkFeatureAccess(featureId).isAccessible;
    },
    [checkFeatureAccess]
  );

  const shouldShowLock = useCallback(
    (featureId: string): boolean => {
      const result = checkFeatureAccess(featureId);
      return result.shouldShowUpgrade;
    },
    [checkFeatureAccess]
  );

  const shouldShowComingSoon = useCallback(
    (featureId: string): boolean => {
      const result = checkFeatureAccess(featureId);
      return result.shouldShowComingSoon;
    },
    [checkFeatureAccess]
  );

  const getFeatureMessage = useCallback(
    (featureId: string): string | undefined => {
      const result = checkFeatureAccess(featureId);
      return result.message;
    },
    [checkFeatureAccess]
  );

  return {
    checkFeatureAccess,
    getFeatureAction,
    isFeatureAccessible,
    shouldShowLock,
    shouldShowComingSoon,
    getFeatureMessage,
    isPremium,
  };
};
