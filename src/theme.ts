import { DefaultTheme } from 'react-native-paper';
import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive utilities
export const responsive = {
  // Screen size helpers
  isSmallScreen: width < 375,
  isMediumScreen: width >= 375 && width < 414,
  isLargeScreen: width >= 414,
  
  // Platform-specific spacing
  spacing: {
    xs: Platform.OS === 'ios' ? 4 : 3,
    sm: Platform.OS === 'ios' ? 8 : 6,
    md: Platform.OS === 'ios' ? 16 : 12,
    lg: Platform.OS === 'ios' ? 24 : 20,
    xl: Platform.OS === 'ios' ? 32 : 28,
    xxl: Platform.OS === 'ios' ? 48 : 40,
  },
  
  // Platform-specific font sizes
  fontSize: {
    xs: Platform.OS === 'ios' ? 12 : 11,
    sm: Platform.OS === 'ios' ? 14 : 13,
    md: Platform.OS === 'ios' ? 16 : 15,
    lg: Platform.OS === 'ios' ? 18 : 17,
    xl: Platform.OS === 'ios' ? 24 : 22,
    xxl: Platform.OS === 'ios' ? 32 : 28,
  },
  
  // Platform-specific border radius
  borderRadius: {
    sm: Platform.OS === 'ios' ? 8 : 6,
    md: Platform.OS === 'ios' ? 12 : 10,
    lg: Platform.OS === 'ios' ? 16 : 14,
    xl: Platform.OS === 'ios' ? 20 : 18,
  },
  
  // Platform-specific shadows
  shadow: {
    small: Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : { elevation: 2 },
    medium: Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    } : { elevation: 4 },
    large: Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    } : { elevation: 8 },
  },
  
  // Platform-specific padding for safe areas
  safeArea: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 120,
    tabBarPadding: Platform.OS === 'ios' ? 20 : 12,
  },
};

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
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  placeholder: '#C0C0C0',
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
  gold: '#DAA520',
}; 