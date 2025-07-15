import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PMAColors } from '../theme';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  navigation: any;
}

interface LoginForm {
  email: string;
  password: string;
}

interface StoredCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login } = useAuth();
  
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });
  
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [errors, setErrors] = useState<Partial<LoginForm>>({});

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedCredentials = await AsyncStorage.getItem('pma_saved_credentials');
      if (savedCredentials) {
        const credentials: StoredCredentials = JSON.parse(savedCredentials);
        if (credentials.rememberMe) {
          setFormData({
            email: credentials.email,
            password: credentials.password,
          });
          setRememberMe(true);
        }
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const saveCredentials = async () => {
    try {
      if (rememberMe) {
        const credentials: StoredCredentials = {
          email: formData.email,
          password: formData.password,
          rememberMe: true,
        };
        await AsyncStorage.setItem('pma_saved_credentials', JSON.stringify(credentials));
      } else {
        await AsyncStorage.removeItem('pma_saved_credentials');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if user exists in AsyncStorage
      const existingUsers = await AsyncStorage.getItem('pma_users');
      let users: any[] = [];
      
      if (existingUsers) {
        users = JSON.parse(existingUsers);
      }

      // Find user with matching email and password
      const user = users.find(u => 
        u.email.toLowerCase() === formData.email.toLowerCase().trim() &&
        u.password === formData.password
      );

      if (!user) {
        Alert.alert(
          'Login Failed',
          'Invalid email or password. Please check your credentials and try again.',
          [
            { text: 'Forgot Password?', onPress: handleForgotPassword },
            { text: 'OK', style: 'cancel' },
          ]
        );
        return;
      }

      // Save credentials if remember me is checked
      await saveCredentials();

      // Remove password from user object before logging in
      const { password, ...userWithoutPassword } = user;

      // Login user
      await login(userWithoutPassword);
      
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });

    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Please contact PMA support to reset your password:\nsupport@pma.ps\n+970-2-240-7000',
      [{ text: 'OK' }]
    );
  };

  const handleSignup = () => {
    navigation.navigate('Signup');
  };

  const updateFormData = (field: keyof LoginForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (loadingCredentials) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PMAColors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <LinearGradient
            colors={[PMAColors.primary, PMAColors.accent]}
            style={styles.header}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Image
                  source={require('../../assets/Pma.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.appTitle}>Palestine Monetary Authority</Text>
              <Text style={styles.appSubtitle}>Digital Banking</Text>
            </View>
          </LinearGradient>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to access your digital banking
              </Text>
            </View>

            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  label="Email Address"
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text)}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={!!errors.email}
                  theme={{ colors: { primary: PMAColors.primary } }}
                  left={<TextInput.Icon icon="email" />}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  label="Password"
                  value={formData.password}
                  onChangeText={(text) => updateFormData('password', text)}
                  mode="outlined"
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  error={!!errors.password}
                  theme={{ colors: { primary: PMAColors.primary } }}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={togglePasswordVisibility}
                    />
                  }
                />
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberMeContainer}
                  onPress={toggleRememberMe}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && (
                      <Icon name="check" size={16} color={PMAColors.white} />
                    )}
                  </View>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleForgotPassword}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[PMAColors.primary, PMAColors.accent]}
                  style={styles.loginButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={PMAColors.white} />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Biometric Login (Future Feature) */}
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={() => Alert.alert('Biometric Login', 'Feature coming soon')}
                activeOpacity={0.7}
              >
                <Icon name="fingerprint" size={24} color={PMAColors.primary} />
                <Text style={styles.biometricText}>Use Biometric Login</Text>
              </TouchableOpacity>
            </View>

            {/* Signup Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignup} activeOpacity={0.7}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Support Section */}
            <View style={styles.supportContainer}>
              <Text style={styles.supportTitle}>Need Help?</Text>
              <TouchableOpacity
                style={styles.supportButton}
                onPress={() => Alert.alert(
                  'Contact Support',
                  'Phone: +970-2-240-7000\nEmail: support@pma.ps\nWebsite: www.pma.ps'
                )}
                activeOpacity={0.7}
              >
                <Icon name="support-agent" size={20} color={PMAColors.primary} />
                <Text style={styles.supportButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PMAColors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: PMAColors.text,
    marginTop: 16,
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: PMAColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    shadowColor: PMAColors.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 15,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PMAColors.primary,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PMAColors.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: PMAColors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  welcomeSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PMAColors.text,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: PMAColors.gray,
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: PMAColors.white,
  },
  errorText: {
    fontSize: 12,
    color: PMAColors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: PMAColors.primary,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: PMAColors.primary,
  },
  rememberMeText: {
    fontSize: 14,
    color: PMAColors.text,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: PMAColors.primary,
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.white,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: PMAColors.primary,
    borderRadius: 12,
    backgroundColor: PMAColors.white,
  },
  biometricText: {
    fontSize: 16,
    color: PMAColors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  signupText: {
    fontSize: 16,
    color: PMAColors.gray,
  },
  signupLink: {
    fontSize: 16,
    color: PMAColors.primary,
    fontWeight: '600',
  },
  supportContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: PMAColors.lightGray,
  },
  supportTitle: {
    fontSize: 16,
    color: PMAColors.text,
    marginBottom: 12,
    fontWeight: '500',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  supportButtonText: {
    fontSize: 14,
    color: PMAColors.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default LoginScreen; 