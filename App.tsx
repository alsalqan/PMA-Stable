import './shim';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { theme } from './src/theme';
import { WalletProvider } from './src/contexts/WalletContext';
import { AuthProvider } from './src/contexts/AuthContext';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import BankTransferScreen from './src/screens/BankTransferScreen';
import SpendingAnalyticsScreen from './src/screens/SpendingAnalyticsScreen';
import SpendingGoalsScreen from './src/screens/SpendingGoalsScreen';
import MainNavigator from './src/navigation/MainNavigator';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <AuthProvider>
            <WalletProvider>
              <StatusBar style="light" backgroundColor="#DAA520" />
              <Stack.Navigator 
                screenOptions={{ 
                  headerShown: false,
                  gestureEnabled: false 
                }}
              >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen name="Main" component={MainNavigator} />
                <Stack.Screen name="BankTransfer" component={BankTransferScreen} />
                <Stack.Screen name="SpendingAnalytics" component={SpendingAnalyticsScreen} />
                <Stack.Screen name="SpendingGoals" component={SpendingGoalsScreen} />
              </Stack.Navigator>
            </WalletProvider>
          </AuthProvider>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
} 