import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#DAA520',        // Gold from PMA logo
    accent: '#B8860B',         // Dark gold
    background: '#FAFAFA',     // Light background
    surface: '#FFFFFF',        // White surface
    text: '#1A1A1A',          // Dark text
    placeholder: '#666666',    // Gray placeholder
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#FF6B6B',   // Error red
    success: '#4CAF50',        // Success green
    warning: '#FF9800',        // Warning orange
    card: '#FFFFFF',           // Card background
    border: '#E0E0E0',         // Border color
    secondary: '#F5F5F5',      // Secondary background
    goldAccent: '#FFD700',     // Bright gold accent
    darkGold: '#8B7355',       // Dark gold for text
  },
  roundness: 12,
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100' as const,
    },
  },
};

export const PMAColors = {
  primary: '#DAA520',
  accent: '#B8860B',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  placeholder: '#666666',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF6B6B',
  goldAccent: '#FFD700',
  darkGold: '#8B7355',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#666666',
  lightGray: '#E0E0E0',
  darkGray: '#333333',
  secondary: '#F5F5F5',
}; 