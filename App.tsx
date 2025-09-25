import { ThemeProvider } from "app/contexts/ThemeContext";
import AppNavigator from "app/navigation/AppNavigator";
import React from "react";
import { LogBox } from "react-native";

// Ignore warnings for demo purposes
LogBox.ignoreLogs(["Warning: ..."]);

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
