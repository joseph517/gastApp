import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastType, ToastConfig, ToastContextType, DEFAULT_TOAST_CONFIG } from '../types/toast';

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 3
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const showToast = useCallback((
    message: string,
    type: ToastType,
    config: ToastConfig = {}
  ) => {
    const toastConfig = { ...DEFAULT_TOAST_CONFIG, ...config };

    // Note: Haptic feedback can be added later with expo-haptics if needed

    const newToast: Toast = {
      id: generateId(),
      message,
      type,
      config: toastConfig,
      timestamp: Date.now(),
    };

    setToasts(currentToasts => {
      // Remove oldest toasts if we exceed the maximum
      const updatedToasts = currentToasts.length >= maxToasts
        ? currentToasts.slice(-(maxToasts - 1))
        : currentToasts;

      return [...updatedToasts, newToast];
    });

    // Auto-dismiss unless persistent
    if (!toastConfig.persistent && toastConfig.duration && toastConfig.duration > 0) {
      setTimeout(() => {
        hideToast(newToast.id);
      }, toastConfig.duration);
    }
  }, [maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    toasts,
    showToast,
    hideToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};