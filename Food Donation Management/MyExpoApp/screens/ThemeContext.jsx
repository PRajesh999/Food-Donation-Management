import React, { createContext, useState, useContext } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const theme = {
    darkMode,
    colors: {
      // Background colors
      background: darkMode ? "#121212" : "#ffffff",
      card: darkMode ? "#1e1e1e" : "#ffffff",
      surface: darkMode ? "#2d2d2d" : "#f8f9fa",
      
      // Text colors
      text: darkMode ? "#ffffff" : "#000000",
      textSecondary: darkMode ? "#b0b0b0" : "#666666",
      textMuted: darkMode ? "#888888" : "#999999",
      
      // Border colors
      border: darkMode ? "#404040" : "#e0e0e0",
      borderLight: darkMode ? "#333333" : "#f0f0f0",
      
      // Primary colors
      primary: "#F47F24",
      primaryLight: "#FF6B35",
      primaryDark: "#E65A1F",
      
      // Status colors
      success: darkMode ? "#4CAF50" : "#4CAF50",
      warning: darkMode ? "#FF9800" : "#FF9800",
      error: darkMode ? "#F44336" : "#F44336",
      info: darkMode ? "#2196F3" : "#2196F3",
      
      // Placeholder colors
      placeholder: darkMode ? "#666666" : "#999999",
      
      // Overlay colors
      overlay: darkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)",
      backdrop: darkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.2)",
      
      // Shadow colors
      shadow: darkMode ? "#000000" : "#000000",
      
      // Drawer specific colors
      drawerBackground: darkMode ? "#1a1a1a" : "#ffffff",
      drawerBorder: darkMode ? "#333333" : "#e0e0e0",
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      xxl: 24,
    },
    typography: {
      h1: {
        fontSize: 32,
        fontWeight: 'bold',
      },
      h2: {
        fontSize: 24,
        fontWeight: 'bold',
      },
      h3: {
        fontSize: 20,
        fontWeight: '600',
      },
      body: {
        fontSize: 16,
        fontWeight: 'normal',
      },
      caption: {
        fontSize: 14,
        fontWeight: 'normal',
      },
      small: {
        fontSize: 12,
        fontWeight: 'normal',
      },
    },
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleDarkMode, darkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};