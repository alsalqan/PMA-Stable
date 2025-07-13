import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PMAColors } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  navigation: any;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const { isWalletCreated } = useWallet();

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAppState();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const checkAppState = () => {
    if (isAuthenticated && isWalletCreated) {
      navigation.replace('Main');
    } else if (isAuthenticated && !isWalletCreated) {
      navigation.replace('Main');
    } else {
      navigation.replace('Onboarding');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PMAColors.primary} />
      <LinearGradient
        colors={[PMAColors.primary, PMAColors.accent]}
        style={styles.gradient}
      >
        <View style={styles.logoContainer}>
          {/* PMA Logo Placeholder */}
          <View style={styles.logoPlaceholder}>
            <View style={styles.circularLogo}>
              <Text style={styles.logoText}>PMA</Text>
            </View>
          </View>
          
          <Text style={styles.appTitle}>PMA Wallet</Text>
          <Text style={styles.appSubtitle}>Palestine Monetary Authority</Text>
          <Text style={styles.appTagline}>Non-Custodial Digital Wallet</Text>
        </View>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by Blockchain Technology</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.1,
  },
  logoPlaceholder: {
    marginBottom: 30,
  },
  circularLogo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: PMAColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: PMAColors.primary,
    textAlign: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PMAColors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 18,
    color: PMAColors.white,
    textAlign: 'center',
    marginBottom: 4,
    opacity: 0.9,
  },
  appTagline: {
    fontSize: 14,
    color: PMAColors.white,
    textAlign: 'center',
    opacity: 0.8,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: height * 0.2,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PMAColors.white,
    marginHorizontal: 4,
    opacity: 0.3,
  },
  dotActive: {
    opacity: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: PMAColors.white,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 4,
  },
  versionText: {
    fontSize: 10,
    color: PMAColors.white,
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default SplashScreen; 