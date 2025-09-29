export interface PremiumFeature {
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

export interface StatisticsScreenProps {
  navigation: any;
}

export interface StatCard {
  value: string | number;
  label: string;
  type: 'currency' | 'number';
}