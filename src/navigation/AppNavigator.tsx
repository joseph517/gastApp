import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator para cada tab si es necesario
const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
  </Stack.Navigator>
);

const AddExpenseStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
  </Stack.Navigator>
);

const StatisticsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Statistics" component={StatisticsScreen} />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'home';

        switch (route.name) {
          case 'DashboardTab':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'AddExpenseTab':
            iconName = focused ? 'add-circle' : 'add-circle-outline';
            break;
          case 'StatisticsTab':
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
            break;
          case 'SettingsTab':
            iconName = focused ? 'settings' : 'settings-outline';
            break;
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray400,
      tabBarStyle: {
        backgroundColor: COLORS.background,
        borderTopColor: COLORS.gray200,
        borderTopWidth: 1,
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      headerShown: false,
    })}
  >
    <Tab.Screen
      name="DashboardTab"
      component={DashboardStack}
      options={{
        tabBarLabel: 'Inicio',
      }}
    />
    <Tab.Screen
      name="AddExpenseTab"
      component={AddExpenseStack}
      options={{
        tabBarLabel: 'Agregar',
      }}
    />
    <Tab.Screen
      name="StatisticsTab"
      component={StatisticsStack}
      options={{
        tabBarLabel: 'Estadísticas',
      }}
    />
    <Tab.Screen
      name="SettingsTab"
      component={SettingsStack}
      options={{
        tabBarLabel: 'Ajustes',
      }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;