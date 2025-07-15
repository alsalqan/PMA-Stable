import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PMAColors } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import SendScreen from '../screens/SendScreen';
import ReceiveScreen from '../screens/ReceiveScreen';
import ScanScreen from '../screens/ScanScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const getTabBarIcon = (routeName: string) => {
  const iconMap: { [key: string]: string } = {
    Home: 'home',
    Send: 'arrow-upward',
    Receive: 'arrow-downward',
    Scan: 'qr-code-scanner',
    Transactions: 'history',
    Settings: 'settings',
  };
  
  return iconMap[routeName] || 'home';
};

const MainNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : PMAColors.white,
          borderTopWidth: 0,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 12),
          paddingTop: 12,
          height: Math.max(
            Platform.OS === 'ios' ? 85 : 70,
            55 + insets.bottom
          ),
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={95}
              style={StyleSheet.absoluteFillObject}
              tint="light"
            />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, { 
              backgroundColor: PMAColors.white, 
              borderTopLeftRadius: 20, 
              borderTopRightRadius: 20,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: -4,
              },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 15,
            }]} />
          )
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -1,
          marginBottom: 2,
        },
        tabBarActiveTintColor: PMAColors.primary,
        tabBarInactiveTintColor: PMAColors.gray,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getTabBarIcon(route.name);
          return (
            <View style={[
              styles.tabIconContainer,
              focused && styles.tabIconContainerActive
            ]}>
              <Icon
                name={iconName}
                size={size || 22}
                color={focused ? PMAColors.white : color}
                style={[
                  styles.tabIcon,
                  { opacity: focused ? 1 : 0.7 }
                ]}
              />
            </View>
          );
        },
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          paddingVertical: 4,
          borderRadius: 12,
          marginHorizontal: 2,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tab.Screen
        name="Send"
        component={SendScreen}
        options={{
          tabBarLabel: 'Send',
          tabBarAccessibilityLabel: 'Send money tab',
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarAccessibilityLabel: 'Scan QR code tab',
        }}
      />
      <Tab.Screen
        name="Receive"
        component={ReceiveScreen}
        options={{
          tabBarLabel: 'Receive',
          tabBarAccessibilityLabel: 'Receive money tab',
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'History',
          tabBarAccessibilityLabel: 'Transaction history tab',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarAccessibilityLabel: 'Settings tab',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIcon: {
    marginBottom: 2,
  },
  tabIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  tabIconContainerActive: {
    backgroundColor: PMAColors.primary,
  },
});

export default MainNavigator; 