import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Share,
  Linking,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PMAColors } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { wallet } = useWallet();
  
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  
  // Bank account settings
  const [bankSettings, setBankSettings] = useState({
    bankName: 'Palestine Monetary Authority',
    branchName: 'Ramallah Main Branch',
    accountNumber: '1234567890',
    accountHolderName: user?.firstName + ' ' + user?.lastName || 'Account Holder',
    iban: 'PS92PALS000000001234567890'
  });

  const [tempBankSettings, setTempBankSettings] = useState(bankSettings);

  const appVersion = '1.0.0';

  const settingsGroups = [
    {
      title: 'Profile',
      items: [
        {
          icon: 'person',
          label: 'Profile Information',
          subtitle: user?.email || 'Update your profile',
          onPress: () => handleProfileEdit(),
        },
        {
          icon: 'account-balance',
          label: 'Bank Account Address',
          subtitle: wallet ? `${wallet.address.substring(0, 20)}...` : 'No account',
          onPress: () => handleAccountInfo(),
        },
      ],
    },
    {
      title: 'Bank Account Settings',
      items: [
        {
          icon: 'account-balance',
          label: 'Manage Bank Account',
          subtitle: `${bankSettings.bankName} • ${bankSettings.accountNumber}`,
          onPress: () => handleBankAccountEdit(),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: 'security',
          label: 'Backup Account',
          subtitle: 'Save your recovery phrase',
          onPress: () => handleBackupAccount(),
          showChevron: true,
        },
        {
          icon: 'fingerprint',
          label: 'Biometric Authentication',
          subtitle: 'Use fingerprint or face ID',
          component: (
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: PMAColors.lightGray, true: PMAColors.primary }}
              thumbColor={PMAColors.white}
            />
          ),
        },
        {
          icon: 'lock',
          label: 'Auto Lock',
          subtitle: 'Lock app after inactivity',
          component: (
            <Switch
              value={autoLockEnabled}
              onValueChange={setAutoLockEnabled}
              trackColor={{ false: PMAColors.lightGray, true: PMAColors.primary }}
              thumbColor={PMAColors.white}
            />
          ),
        },
        {
          icon: 'vpn-key',
          label: 'Change PIN',
          subtitle: 'Update your security PIN',
          onPress: () => handleChangePIN(),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'notifications',
          label: 'Notifications',
          subtitle: 'Transaction alerts and updates',
          component: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: PMAColors.lightGray, true: PMAColors.primary }}
              thumbColor={PMAColors.white}
            />
          ),
        },
        {
          icon: 'language',
          label: 'Language',
          subtitle: 'English',
          onPress: () => handleLanguageChange(),
          showChevron: true,
        },
        {
          icon: 'palette',
          label: 'Theme',
          subtitle: 'Light mode',
          onPress: () => handleThemeChange(),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help',
          label: 'Help Center',
          subtitle: 'FAQs and guides',
          onPress: () => handleHelpCenter(),
          showChevron: true,
        },
        {
          icon: 'contact-support',
          label: 'Contact Support',
          subtitle: 'Get help with your account',
          onPress: () => handleContactSupport(),
          showChevron: true,
        },
        {
          icon: 'share',
          label: 'Share App',
          subtitle: 'Tell friends about PMA Digital Banking',
          onPress: () => handleShareApp(),
          showChevron: true,
        },
        {
          icon: 'star-rate',
          label: 'Rate App',
          subtitle: 'Rate us on the app store',
          onPress: () => handleRateApp(),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          icon: 'description',
          label: 'Terms of Service',
          subtitle: 'Read our terms',
          onPress: () => handleTermsOfService(),
          showChevron: true,
        },
        {
          icon: 'privacy-tip',
          label: 'Privacy Policy',
          subtitle: 'How we protect your data',
          onPress: () => handlePrivacyPolicy(),
          showChevron: true,
        },
      ],
    },
  ];

  const handleProfileEdit = () => {
    Alert.alert(
      'Profile Information',
      `Name: ${user?.firstName} ${user?.lastName}\nEmail: ${user?.email}`,
      [
        { text: 'Edit Profile', onPress: () => {
          // Navigate to profile edit screen
          Alert.alert('Info', 'Profile editing feature coming soon');
        }},
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const handleAccountInfo = () => {
    if (!wallet) {
      Alert.alert('No Account', 'Please create or import an account first');
      return;
    }

    Alert.alert(
      'Bank Account Information',
      `Address: ${wallet.address}\n\nBalances:\nUSDT: $${wallet.balance.USDT.toFixed(2)}\nUSDC: $${wallet.balance.USDC.toFixed(2)}\nAE Coin: $${wallet.balance.AECoin.toFixed(2)}`,
      [
        { text: 'Copy Address', onPress: () => {
          Alert.alert('Copied', 'Account address copied to clipboard');
        }},
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const handleBackupAccount = () => {
    Alert.alert(
      'Backup Account',
      'Your recovery phrase is the only way to restore your account. Keep it safe and never share it with anyone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Show Recovery Phrase', onPress: showRecoveryPhrase },
      ]
    );
  };

  const showRecoveryPhrase = () => {
    if (!wallet?.mnemonic) {
      Alert.alert('Error', 'No recovery phrase found');
      return;
    }

    Alert.alert(
      'Recovery Phrase',
      `⚠️ KEEP THIS SAFE ⚠️\n\n${wallet.mnemonic}\n\nWrite this down and store it securely. Anyone with this phrase can access your account.`,
      [
        { text: 'I\'ve Saved It', style: 'default' },
        { text: 'Copy to Clipboard', onPress: () => {
          Alert.alert('Copied', 'Recovery phrase copied to clipboard');
        }},
      ]
    );
  };

  const handleBankAccountEdit = () => {
    setTempBankSettings(bankSettings);
    setShowBankForm(true);
  };

  const handleSaveBankSettings = () => {
    setBankSettings(tempBankSettings);
    setShowBankForm(false);
    Alert.alert('Success', 'Bank account details updated successfully');
  };

  const handleCancelBankEdit = () => {
    setTempBankSettings(bankSettings);
    setShowBankForm(false);
  };

  const updateTempBankSetting = (field: keyof typeof bankSettings, value: string) => {
    setTempBankSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleChangePIN = () => {
    Alert.alert('Change PIN', 'PIN change feature coming soon');
  };

  const handleLanguageChange = () => {
    Alert.alert('Language', 'Language selection coming soon');
  };

  const handleThemeChange = () => {
    Alert.alert('Theme', 'Theme selection coming soon');
  };

  const handleHelpCenter = () => {
    Alert.alert('Help Center', 'Opening help center...');
    // Linking.openURL('https://help.pma-wallet.com');
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose how to contact our support team:',
      [
        { text: 'Email', onPress: () => {
          Linking.openURL('mailto:support@pma-wallet.com');
        }},
        { text: 'Live Chat', onPress: () => {
          Alert.alert('Live Chat', 'Live chat feature coming soon');
        }},
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out PMA Wallet - the secure way to manage your crypto! Download it now.',
        title: 'PMA Wallet',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share app');
    }
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate PMA Wallet',
      'Help us improve by rating our app!',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Rate Now', onPress: () => {
          // Open app store rating
          Alert.alert('Thank you!', 'Rating feature coming soon');
        }},
      ]
    );
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'Opening terms of service...');
    // Linking.openURL('https://pma-wallet.com/terms');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Opening privacy policy...');
    // Linking.openURL('https://pma-wallet.com/privacy');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Make sure you have backed up your wallet.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const toggleDarkMode = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('darkMode', JSON.stringify(value));
      setDarkModeEnabled(value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Alert.alert(
        'Theme Changed',
        'Please restart the app to apply the new theme.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to save dark mode preference:', error);
    }
  };

  const toggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleBiometric = (value: boolean) => {
    setBiometricEnabled(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderSettingItem = (item: any) => (
    <TouchableOpacity
      key={item.label}
      style={styles.settingItem}
      onPress={item.onPress}
      disabled={!item.onPress}
    >
      <View style={styles.settingItemLeft}>
        <View style={styles.settingIcon}>
          <Icon name={item.icon} size={24} color={PMAColors.primary} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>{item.label}</Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      
      <View style={styles.settingItemRight}>
        {item.component || (
          item.showChevron && (
            <Icon name="chevron-right" size={20} color={PMAColors.gray} />
          )
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={PMAColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={Platform.OS === 'ios'}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={[PMAColors.primary, PMAColors.accent]}
            style={styles.profileGradient}
          >
            <View style={styles.profileInfo}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {user?.firstName?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : 'User'
                  }
                </Text>
                <Text style={styles.profileEmail}>
                  {user?.email || 'user@example.com'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <View key={group.title} style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupContainer}>
              {group.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          {renderSettingItem({
            title: 'Dark Mode',
            description: 'Switch between light and dark theme',
            icon: 'brightness-6',
            onPress: undefined,
            rightElement: (
              <Switch
                value={darkModeEnabled}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#E0E0E0', true: PMAColors.primary }}
                thumbColor={darkModeEnabled ? '#FFFFFF' : '#F4F3F4'}
              />
            ),
          })}
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          {renderSettingItem({
            title: 'Biometric Authentication',
            description: 'Use fingerprint or face recognition',
            icon: 'fingerprint',
            onPress: undefined,
            rightElement: (
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                trackColor={{ false: '#E0E0E0', true: PMAColors.primary }}
                thumbColor={biometricEnabled ? '#FFFFFF' : '#F4F3F4'}
              />
            ),
          })}
          {renderSettingItem({
            title: 'Change PIN',
            description: 'Update your security PIN',
            icon: 'lock',
            onPress: () => Alert.alert('Coming Soon', 'PIN change feature will be available soon'),
          })}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {renderSettingItem({
            icon: 'notifications',
            label: 'Push Notifications',
            subtitle: 'Receive transaction and security alerts',
            component: (
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#E0E0E0', true: PMAColors.primary }}
                thumbColor={notificationsEnabled ? '#FFFFFF' : '#F4F3F4'}
              />
            )
          })}
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {renderSettingItem({
            icon: 'download',
            label: 'Export Data',
            subtitle: 'Download your transaction history',
            onPress: () => Alert.alert('Coming Soon', 'Data export feature will be available soon'),
            showChevron: true
          })}
          {renderSettingItem({
            icon: 'delete-forever',
            label: 'Delete Account',
            subtitle: 'Permanently delete your account',
            onPress: () => Alert.alert(
              'Delete Account',
              'This action cannot be undone. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive' }
              ]
            ),
            showChevron: true
          })}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LinearGradient
              colors={[PMAColors.error, '#FF8A80']}
              style={styles.logoutButtonGradient}
            >
              <Icon name="logout" size={20} color={PMAColors.white} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>PMA Wallet v{appVersion}</Text>
          <Text style={styles.versionSubtext}>Built with ❤️ for secure transactions</Text>
        </View>
      </ScrollView>

      {/* Bank Account Edit Form Modal */}
      <Modal
        visible={showBankForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelBankEdit}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancelBankEdit}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Bank Account</Text>
            <TouchableOpacity onPress={handleSaveBankSettings}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Bank Name</Text>
              <TextInput
                style={styles.formInput}
                value={tempBankSettings.bankName}
                onChangeText={(text) => updateTempBankSetting('bankName', text)}
                placeholder="Enter bank name"
                placeholderTextColor={PMAColors.placeholder}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Branch Name</Text>
              <TextInput
                style={styles.formInput}
                value={tempBankSettings.branchName}
                onChangeText={(text) => updateTempBankSetting('branchName', text)}
                placeholder="Enter branch name"
                placeholderTextColor={PMAColors.placeholder}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Account Number</Text>
              <TextInput
                style={styles.formInput}
                value={tempBankSettings.accountNumber}
                onChangeText={(text) => updateTempBankSetting('accountNumber', text)}
                placeholder="Enter account number"
                placeholderTextColor={PMAColors.placeholder}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Account Holder Name</Text>
              <TextInput
                style={styles.formInput}
                value={tempBankSettings.accountHolderName}
                onChangeText={(text) => updateTempBankSetting('accountHolderName', text)}
                placeholder="Enter account holder name"
                placeholderTextColor={PMAColors.placeholder}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>IBAN</Text>
              <TextInput
                style={styles.formInput}
                value={tempBankSettings.iban}
                onChangeText={(text) => updateTempBankSetting('iban', text)}
                placeholder="PS92PALS000000001234567890"
                placeholderTextColor={PMAColors.placeholder}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PMAColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: PMAColors.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 120,
  },
  profileCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: PMAColors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileGradient: {
    padding: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PMAColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PMAColors.primary,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PMAColors.white,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: PMAColors.white,
    opacity: 0.9,
  },
  settingsGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  groupContainer: {
    backgroundColor: PMAColors.white,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: PMAColors.lightGray,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PMAColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: PMAColors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: PMAColors.gray,
  },
  settingItemRight: {
    marginLeft: 12,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.white,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 14,
    color: PMAColors.gray,
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: PMAColors.placeholder,
    textAlign: 'center',
  },
  // New styles for the new code
  section: {
    marginBottom: 24,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.text,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: PMAColors.text,
    marginBottom: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.white,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: PMAColors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: PMAColors.lightGray,
    backgroundColor: PMAColors.white,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.text,
  },
  modalCancelText: {
    fontSize: 16,
    color: PMAColors.gray,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: PMAColors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: PMAColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PMAColors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: PMAColors.text,
  },
});

export default SettingsScreen; 