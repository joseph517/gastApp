import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { recurringExpenseService } from "../services/recurringExpenseService";

/**
 * Hook para procesamiento adicional de gastos recurrentes
 * Solo procesa cuando la app vuelve del background para evitar duplicaciones
 * El procesamiento principal ocurre en initializeStore y handleRefresh
 */
export const useRecurringExpenseProcessor = () => {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastProcessedRef = useRef<number>(Date.now());

  // Función para procesar gastos recurrentes con throttle
  const processRecurringExpenses = async () => {
    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessedRef.current;

    // Solo procesar si han pasado al menos 5 minutos desde el último procesamiento
    if (timeSinceLastProcess < 5 * 60 * 1000) {
      return;
    }

    try {
      console.log('Processing recurring expenses on app state change...');
      await recurringExpenseService.processAllRecurringExpenses();
      lastProcessedRef.current = now;
    } catch (error) {
      console.error('Error in background processing:', error);
    }
  };

  // Manejar cambios en el estado de la app
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    const prevAppState = appStateRef.current;

    if (prevAppState.match(/inactive|background/) && nextAppState === 'active') {
      // La app volvió al foreground - procesar solo si ha pasado tiempo suficiente
      processRecurringExpenses();
    }

    appStateRef.current = nextAppState;
  };

  useEffect(() => {
    // Subscribir a cambios de estado de la app
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    // Función para procesamiento manual (útil para testing o situaciones especiales)
    processNow: processRecurringExpenses
  };
};