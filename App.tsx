import React from 'react';
import { LogBox } from 'react-native';
import { ThemeProvider } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

// Ignore warnings for demo purposes
LogBox.ignoreLogs(['Warning: ...']);

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}