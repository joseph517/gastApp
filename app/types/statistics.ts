export interface PremiumFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface StatisticsScreenProps {
  navigation: any;
}

export interface StatCard {
  value: string | number;
  label: string;
  type: 'currency' | 'number';
}