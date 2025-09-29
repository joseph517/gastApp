import { ThemeProvider } from "app/contexts/ThemeContext";
import { ToastProvider } from "app/contexts/ToastContext";
import AppNavigator from "app/navigation/AppNavigator";
import ToastContainer from "app/components/shared/ToastContainer";
import React from "react";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Ignore warnings for demo purposes
LogBox.ignoreLogs(["Warning: ..."]);

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <AppNavigator />
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
