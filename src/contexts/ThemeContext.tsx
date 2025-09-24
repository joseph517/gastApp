import React, { createContext, useContext, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LIGHT_THEME, DARK_THEME } from '../constants/colors';
import { databaseService } from '../database/database';

export type ThemeType = 'light' | 'dark';

export interface ThemeColors {
  [key: string]: any;
}

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('light');
  const [colors, setColors] = useState<ThemeColors>(LIGHT_THEME);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await databaseService.getSetting('darkMode');
      const isDarkMode = savedTheme === 'true';
      const newTheme: ThemeType = isDarkMode ? 'dark' : 'light';
      setThemeState(newTheme);
      setColors(isDarkMode ? DARK_THEME : LIGHT_THEME);
    } catch (error) {
      console.error('Error loading theme:', error);
      // Default to light theme on error
      setThemeState('light');
      setColors(LIGHT_THEME);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    try {
      setThemeState(newTheme);
      setColors(newTheme === 'dark' ? DARK_THEME : LIGHT_THEME);

      // Save to database
      await databaseService.setSetting('darkMode', newTheme === 'dark' ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme: ThemeType = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        isDark,
        toggleTheme,
        setTheme,
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor="transparent" translucent />
      {children}
    </ThemeContext.Provider>
  );
};