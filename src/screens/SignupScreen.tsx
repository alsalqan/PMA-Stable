import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { PMAColors } from '../theme';
import { SignupFormData, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { WalletService } from '../services/WalletService';

interface SignupScreenProps {
  navigation: any;
}

interface FormErrors {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
  };
  mobile?: string;
  email?: string;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const { login } = useAuth();
  const { createWallet } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: 'West Bank',
    },
    mobile: '',
    email: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'address') {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            [child]: value,
          },
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
    
    // Clear error when user starts typing
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'address' && errors.address?.[child as keyof typeof errors.address]) {
        setErrors(prev => ({
          ...prev,
          address: {
            ...prev.address,
            [child]: undefined,
          },
        }));
      }
    } else if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      // Simple date validation (you can enhance this)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.dateOfBirth)) {
        newErrors.dateOfBirth = 'Date format should be YYYY-MM-DD';
      }
    }
    
    if (!formData.address.street.trim()) {
      newErrors.address = { ...newErrors.address, street: 'Street address is required' };
    }
    
    if (!formData.address.city.trim()) {
      newErrors.address = { ...newErrors.address, city: 'City is required' };
    }
    
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else {
      // Simple mobile validation
      const mobileRegex = /^(\+970|0)?[59]\d{8}$/;
      if (!mobileRegex.test(formData.mobile)) {
        newErrors.mobile = 'Please enter a valid Palestinian mobile number';
      }
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Create wallet first
      const wallet = await createWallet();
      
      // Create user object
      const newUser: User = {
        id: await WalletService.generateWalletId(),
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        mobile: formData.mobile,
        email: formData.email,
        walletAddress: wallet.address,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Login user
      await login(newUser);
      
      // Navigate to main app
      navigation.replace('Main');
      
      Alert.alert(
        'Account Created Successfully',
        `Welcome to PMA Wallet! Your wallet address is: ${WalletService.formatAddress(wallet.address)}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={PMAColors.primary} />
      <LinearGradient
        colors={[PMAColors.primary, PMAColors.accent]}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>
              Join the PMA Wallet community
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={[styles.input, errors.firstName ? styles.inputError : null]}
                placeholder="Enter your first name"
                placeholderTextColor={PMAColors.placeholder}
                value={formData.firstName}
                onChangeText={(text) => handleInputChange('firstName', text)}
                autoCapitalize="words"
              />
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Middle Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your middle name (optional)"
                placeholderTextColor={PMAColors.placeholder}
                value={formData.middleName}
                onChangeText={(text) => handleInputChange('middleName', text)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={[styles.input, errors.lastName ? styles.inputError : null]}
                placeholder="Enter your last name"
                placeholderTextColor={PMAColors.placeholder}
                value={formData.lastName}
                onChangeText={(text) => handleInputChange('lastName', text)}
                autoCapitalize="words"
              />
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TextInput
                style={[styles.input, errors.dateOfBirth ? styles.inputError : null]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={PMAColors.placeholder}
                value={formData.dateOfBirth}
                onChangeText={(text) => handleInputChange('dateOfBirth', text)}
                maxLength={10}
              />
              {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
            </View>

            <Text style={styles.sectionTitle}>Address Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address *</Text>
              <TextInput
                style={[styles.input, errors.address?.street ? styles.inputError : null]}
                placeholder="Enter your street address"
                placeholderTextColor={PMAColors.placeholder}
                value={formData.address.street}
                onChangeText={(text) => handleInputChange('address.street', text)}
                multiline
                numberOfLines={2}
              />
              {errors.address?.street && <Text style={styles.errorText}>{errors.address.street}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={[styles.input, errors.address?.city ? styles.inputError : null]}
                placeholder="Enter your city"
                placeholderTextColor={PMAColors.placeholder}
                value={formData.address.city}
                onChangeText={(text) => handleInputChange('address.city', text)}
                autoCapitalize="words"
              />
              {errors.address?.city && <Text style={styles.errorText}>{errors.address.city}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>State *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.address.state}
                  onValueChange={(value) => handleInputChange('address.state', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="West Bank" value="West Bank" />
                  <Picker.Item label="Gaza" value="Gaza" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number *</Text>
              <TextInput
                style={[styles.input, errors.mobile ? styles.inputError : null]}
                placeholder="+970 59 XXX XXXX"
                placeholderTextColor={PMAColors.placeholder}
                value={formData.mobile}
                onChangeText={(text) => handleInputChange('mobile', text)}
                keyboardType="phone-pad"
              />
              {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="Enter your email address"
                placeholderTextColor={PMAColors.placeholder}
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[PMAColors.white, PMAColors.secondary]}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Wallet & Account'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PMAColors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: PMAColors.white,
    opacity: 0.9,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.white,
    marginTop: 20,
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: PMAColors.white,
    marginBottom: 8,
  },
  input: {
    backgroundColor: PMAColors.white,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: PMAColors.text,
  },
  inputError: {
    borderColor: PMAColors.error,
    borderWidth: 1,
  },
  errorText: {
    color: PMAColors.error,
    fontSize: 14,
    marginTop: 5,
    fontWeight: '500',
  },
  pickerContainer: {
    backgroundColor: PMAColors.white,
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    color: PMAColors.text,
  },
  submitButton: {
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 25,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PMAColors.primary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: PMAColors.white,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 18,
  },
});

export default SignupScreen; 