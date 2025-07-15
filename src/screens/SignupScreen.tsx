import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, RadioButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PMAColors } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

// const { width, height } = Dimensions.get('window');

interface SignupScreenProps {
  navigation: any;
}

interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  streetAddress: string;
  city: string;
  state: string;
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const { login } = useAuth();
  const { createWallet } = useWallet();
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    streetAddress: '',
    city: '',
    state: 'west-bank',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if user already exists
      const existingUsers = await AsyncStorage.getItem('pma_users');
      let users: any[] = [];
      
      if (existingUsers) {
        users = JSON.parse(existingUsers);
      }

      // Check for duplicate email
      const duplicateUser = users.find(u => 
        u.email.toLowerCase() === formData.email.toLowerCase().trim()
      );

      if (duplicateUser) {
        Alert.alert('Error', 'An account with this email already exists. Please use a different email or sign in.');
        return;
      }

      // Create wallet
      await createWallet();
      
      // Create user object that matches the User interface
      const userData = {
        id: Date.now().toString(),
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        address: {
          street: formData.streetAddress,
          city: formData.city,
          state: formData.state === 'west-bank' ? 'West Bank' as const : 'Gaza' as const,
        },
        mobile: formData.mobileNumber,
        email: formData.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create user with password for storage
      const userWithPassword = {
        ...userData,
        password: formData.password,
      };

      // Store user in users array
      users.push(userWithPassword);
      await AsyncStorage.setItem('pma_users', JSON.stringify(users));
      
      // Login user (without password)
      await login(userData);
      
      // Navigate to main app
      navigation.replace('Main');
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const required = ['firstName', 'lastName', 'dateOfBirth', 'streetAddress', 'city', 'mobileNumber', 'email', 'password', 'confirmPassword'];
    
    for (const field of required) {
      if (!formData[field as keyof FormData]) {
        Alert.alert('Error', `Please fill in all required fields`);
        return false;
      }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    // Password validation
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    // Password confirmation validation
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    // Mobile number validation (basic)
    const mobileRegex = /^[\+]?[0-9]{8,15}$/;
    if (!mobileRegex.test(formData.mobileNumber.replace(/[\s\-\(\)]/g, ''))) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return false;
    }

    return true;
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={Platform.OS === 'ios'}
        >
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Register with Palestine Monetary Authority
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.nameRow}>
                <TextInput
                  label="First Name *"
                  value={formData.firstName}
                  onChangeText={(text) => updateFormData('firstName', text)}
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                  theme={{ colors: { primary: PMAColors.primary } }}
                />
                <TextInput
                  label="Middle Name"
                  value={formData.middleName}
                  onChangeText={(text) => updateFormData('middleName', text)}
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                  theme={{ colors: { primary: PMAColors.primary } }}
                />
              </View>

              <TextInput
                label="Last Name *"
                value={formData.lastName}
                onChangeText={(text) => updateFormData('lastName', text)}
                mode="outlined"
                style={styles.input}
                theme={{ colors: { primary: PMAColors.primary } }}
              />

              <TextInput
                label="Date of Birth *"
                value={formData.dateOfBirth}
                onChangeText={(text) => updateFormData('dateOfBirth', text)}
                mode="outlined"
                style={styles.input}
                placeholder="DD/MM/YYYY"
                theme={{ colors: { primary: PMAColors.primary } }}
              />

              <TextInput
                label="Street Address *"
                value={formData.streetAddress}
                onChangeText={(text) => updateFormData('streetAddress', text)}
                mode="outlined"
                style={styles.input}
                theme={{ colors: { primary: PMAColors.primary } }}
              />

              <TextInput
                label="City *"
                value={formData.city}
                onChangeText={(text) => updateFormData('city', text)}
                mode="outlined"
                style={styles.input}
                theme={{ colors: { primary: PMAColors.primary } }}
              />

              <View style={styles.stateContainer}>
                <Text style={styles.stateLabel}>State *</Text>
                <View style={styles.radioGroup}>
                  <View style={styles.radioButton}>
                    <RadioButton
                      value="west-bank"
                      status={formData.state === 'west-bank' ? 'checked' : 'unchecked'}
                      onPress={() => updateFormData('state', 'west-bank')}
                      color={PMAColors.primary}
                    />
                    <Text style={styles.radioLabel}>West Bank</Text>
                  </View>
                  <View style={styles.radioButton}>
                    <RadioButton
                      value="gaza"
                      status={formData.state === 'gaza' ? 'checked' : 'unchecked'}
                      onPress={() => updateFormData('state', 'gaza')}
                      color={PMAColors.primary}
                    />
                    <Text style={styles.radioLabel}>Gaza</Text>
                  </View>
                </View>
              </View>

              <TextInput
                label="Mobile Number *"
                value={formData.mobileNumber}
                onChangeText={(text) => updateFormData('mobileNumber', text)}
                mode="outlined"
                style={styles.input}
                keyboardType="phone-pad"
                theme={{ colors: { primary: PMAColors.primary } }}
              />

              <TextInput
                label="Email Address *"
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                theme={{ colors: { primary: PMAColors.primary } }}
              />

              <TextInput
                label="Password *"
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                mode="outlined"
                style={styles.input}
                secureTextEntry
                theme={{ colors: { primary: PMAColors.primary } }}
              />

              <TextInput
                label="Confirm Password *"
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                mode="outlined"
                style={styles.input}
                secureTextEntry
                theme={{ colors: { primary: PMAColors.primary } }}
              />

              <Button
                mode="contained"
                onPress={handleSignup}
                loading={isLoading}
                disabled={isLoading}
                style={styles.signupButton}
                labelStyle={styles.signupButtonText}
              >
                Create Account
              </Button>

              <View style={styles.loginLinkContainer}>
                <Text style={styles.loginLinkText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Sign In</Text>
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
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PMAColors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: PMAColors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  form: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    marginBottom: 15,
    backgroundColor: PMAColors.white,
  },
  halfInput: {
    width: '48%',
  },
  stateContainer: {
    marginBottom: 15,
  },
  stateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.white,
    marginBottom: 10,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: PMAColors.white,
    borderRadius: 8,
    paddingVertical: 10,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    fontSize: 16,
    color: PMAColors.text,
    marginLeft: 5,
  },
  signupButton: {
    marginTop: 20,
    paddingVertical: 8,
    backgroundColor: PMAColors.white,
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PMAColors.primary,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    fontSize: 16,
    color: PMAColors.white,
  },
  loginLink: {
    fontSize: 16,
    color: PMAColors.white,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default SignupScreen; 