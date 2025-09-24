import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

// Ignore warnings for demo purposes
LogBox.ignoreLogs(['Warning: ...']);

export default function App() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      <AppNavigator />
    </>
  );
}