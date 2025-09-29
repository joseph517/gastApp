export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  text: string;
  onPress: () => void;
}

export interface ToastConfig {
  duration?: number;
  position?: 'top' | 'bottom';
  action?: ToastAction;
  persistent?: boolean;
  haptic?: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  config: ToastConfig;
  timestamp: number;
}

export interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: ToastType, config?: ToastConfig) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

export const DEFAULT_TOAST_CONFIG: ToastConfig = {
  duration: 4000,
  position: 'top',
  persistent: false,
  haptic: true,
};

export const TOAST_COLORS = {
  success: {
    background: '#10B981',
    icon: '#FFFFFF',
    text: '#FFFFFF',
  },
  error: {
    background: '#EF4444',
    icon: '#FFFFFF',
    text: '#FFFFFF',
  },
  warning: {
    background: '#F59E0B',
    icon: '#FFFFFF',
    text: '#FFFFFF',
  },
  info: {
    background: '#4F46E5',
    icon: '#FFFFFF',
    text: '#FFFFFF',
  },
};

export const TOAST_ICONS = {
  success: 'checkmark-circle',
  error: 'close-circle',
  warning: 'warning',
  info: 'information-circle',
} as const;