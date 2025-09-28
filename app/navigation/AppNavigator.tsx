import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Screens
import DashboardScreen from "../screens/DashboardScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";
import StatisticsScreen from "../screens/StatisticsScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import BudgetScreen from "../screens/BudgetScreen";
import SettingsScreen from "../screens/SettingsScreen";
import RecurringExpensesScreen from "../screens/RecurringExpensesScreen";
import AddRecurringExpenseScreen from "../screens/AddRecurringExpenseScreen";

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
  <Stack.Navigator
    initialRouteName="Statistics"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Statistics" component={StatisticsScreen} />
    <Stack.Screen name="Analytics" component={AnalyticsScreen} />
    <Stack.Screen name="Budget" component={BudgetScreen} />
    <Stack.Screen name="RecurringExpenses" component={RecurringExpensesScreen} />
    <Stack.Screen name="AddRecurringExpense" component={AddRecurringExpenseScreen} />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

const TabNavigator = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          switch (route.name) {
            case "DashboardTab":
              iconName = focused ? "home" : "home-outline";
              break;
            case "AddExpenseTab":
              iconName = focused ? "add-circle" : "add-circle-outline";
              break;
            case "StatisticsTab":
              iconName = focused ? "stats-chart" : "stats-chart-outline";
              break;
            case "SettingsTab":
              iconName = focused ? "settings" : "settings-outline";
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 5),
          paddingTop: 5,
          height: 60 + Math.max(insets.bottom - 1, 0),
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{
          tabBarLabel: "Inicio",
        }}
      />
      <Tab.Screen
        name="AddExpenseTab"
        component={AddExpenseStack}
        options={{
          tabBarLabel: "Agregar",
        }}
      />
      <Tab.Screen
        name="StatisticsTab"
        component={StatisticsStack}
        options={{
          tabBarLabel: "Estadísticas",
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{
          tabBarLabel: "Ajustes",
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { colors, isDark } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.accent,
        },
      }}
    >
      <TabNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;
