import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PMAColors, responsive } from '../theme';
import { useWallet } from '../contexts/WalletContext';

interface BankTransferScreenProps {
  navigation: any;
  route?: {
    params?: {
      bankAccount?: BankAccount;
    };
  };
}

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  iban: string;
  branchName?: string;
}

type Currency = 'USDT' | 'USDC' | 'AECoin';

const BankTransferScreen: React.FC<BankTransferScreenProps> = ({ navigation, route }) => {
  const { wallet } = useWallet();
  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USDT');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [amountError, setAmountError] = useState('');
  
  // Bank account details
  const [bankAccount, setBankAccount] = useState<BankAccount>(
    route?.params?.bankAccount || {
      bankName: 'Palestine Monetary Authority',
      accountNumber: '',
      accountHolderName: '',
      iban: '',
      branchName: 'Ramallah Main Branch',
    }
  );

  // Saved bank account from user settings
  const [savedBankAccount] = useState<BankAccount>({
    bankName: 'Palestine Monetary Authority',
    branchName: 'Ramallah Main Branch',
    accountNumber: '1234567890',
    accountHolderName: 'Your Account',
    iban: 'PS92PALS000000001234567890'
  });

  const currencies = [
    { key: 'USDT' as Currency, name: 'USDT', icon: 'account-balance-wallet' },
    { key: 'USDC' as Currency, name: 'USDC', icon: 'account-balance' },
    { key: 'AECoin' as Currency, name: 'AE Coin', icon: 'stars' },
  ];

  const transferFee = 2.50; // Bank transfer fee in USD

  useEffect(() => {
    validateAmount(amount);
  }, [amount, selectedCurrency, wallet]);

  const validateAmount = (amountValue: string) => {
    if (!amountValue) {
      setAmountError('');
      return;
    }

    const numAmount = parseFloat(amountValue);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError('Amount must be greater than 0');
      return;
    }

    if (wallet && numAmount > wallet.balance[selectedCurrency]) {
      setAmountError(`Insufficient ${selectedCurrency} balance`);
      return;
    }

    if (numAmount < 10) {
      setAmountError('Minimum bank transfer amount is $10');
      return;
    }

    setAmountError('');
  };

  const validateBankAccount = (): boolean => {
    if (!bankAccount.accountNumber.trim()) {
      Alert.alert('Error', 'Please enter bank account number');
      return false;
    }
    if (!bankAccount.accountHolderName.trim()) {
      Alert.alert('Error', 'Please enter account holder name');
      return false;
    }
    if (!bankAccount.iban.trim()) {
      Alert.alert('Error', 'Please enter IBAN');
      return false;
    }
    return true;
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getCurrentBalance = () => {
    return wallet?.balance[selectedCurrency] || 0;
  };

  const canTransfer = () => {
    return (
      wallet &&
      amount &&
      parseFloat(amount) > 0 &&
      !amountError &&
      validateBankAccount() &&
      parseFloat(amount) + transferFee <= getCurrentBalance()
    );
  };

  const handleMaxAmount = () => {
    const maxAmount = Math.max(0, getCurrentBalance() - transferFee);
    setAmount(maxAmount.toString());
  };

  const handleTransfer = async () => {
    if (!canTransfer()) {
      return;
    }

    Alert.alert(
      'Confirm Bank Transfer',
      `Transfer $${formatBalance(parseFloat(amount))} ${selectedCurrency} to:\n\n` +
      `Bank: ${bankAccount.bankName}\n` +
      `Account: ${bankAccount.accountNumber}\n` +
      `Holder: ${bankAccount.accountHolderName}\n` +
      `IBAN: ${bankAccount.iban}\n\n` +
      `Transfer Fee: $${transferFee}\n` +
      `Total Cost: $${formatBalance(parseFloat(amount) + transferFee)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm Transfer', onPress: confirmTransfer },
      ]
    );
  };

  const confirmTransfer = async () => {
    setIsLoading(true);
    
    try {
      // Simulate bank transfer API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create mock transaction
      const transferAmount = parseFloat(amount);
      const totalCost = transferAmount + transferFee;
      
      Alert.alert(
        'Transfer Initiated',
        `Your bank transfer of $${formatBalance(transferAmount)} ${selectedCurrency} has been initiated. ` +
        `It may take 1-3 business days to complete.\n\n` +
        `Transaction ID: TXN${Date.now()}\n` +
        `Total Cost: $${formatBalance(totalCost)}`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Transactions') 
          }
        ]
      );
      
      // Reset form
      setAmount('');
      setNote('');
      
    } catch (error) {
      console.error('Bank transfer error:', error);
      Alert.alert('Transfer Failed', 'Unable to process bank transfer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateBankAccount = (field: keyof BankAccount, value: string) => {
    setBankAccount(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const loadSavedBankAccount = () => {
    setBankAccount(savedBankAccount);
    Alert.alert('Success', 'Your saved bank account details have been loaded');
  };

  const isSavedAccountLoaded = () => {
    return bankAccount.accountNumber === savedBankAccount.accountNumber &&
           bankAccount.iban === savedBankAccount.iban;
  };

  if (!wallet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="account-balance" size={48} color={PMAColors.placeholder} />
          <Text style={styles.errorText}>No account available</Text>
          <Text style={styles.errorSubtext}>Please create or import an account first</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={Platform.OS === 'ios'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={PMAColors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Bank Transfer</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Currency Selection */}
          <View style={styles.currencySelection}>
            <Text style={styles.sectionTitle}>Select Currency</Text>
            <View style={styles.currencyTabs}>
              {currencies.map((currency) => (
                <TouchableOpacity
                  key={currency.key}
                  style={[
                    styles.currencyTab,
                    selectedCurrency === currency.key && styles.currencyTabActive,
                  ]}
                  onPress={() => setSelectedCurrency(currency.key)}
                >
                  <Icon
                    name={currency.icon}
                    size={20}
                    color={
                      selectedCurrency === currency.key
                        ? PMAColors.white
                        : PMAColors.primary
                    }
                  />
                  <Text
                    style={[
                      styles.currencyTabText,
                      selectedCurrency === currency.key && styles.currencyTabTextActive,
                    ]}
                  >
                    {currency.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>
                ${formatBalance(getCurrentBalance())} {selectedCurrency}
              </Text>
            </View>
          </View>

          {/* My Bank Account */}
          <View style={styles.myBankSection}>
            <Text style={styles.sectionTitle}>My Bank Account</Text>
            <View style={styles.myBankCard}>
              <View style={styles.myBankHeader}>
                <Icon name="account-balance" size={24} color={PMAColors.primary} />
                <Text style={styles.myBankName}>{savedBankAccount.bankName}</Text>
              </View>
              
              <View style={styles.myBankDetails}>
                <View style={styles.myBankRow}>
                  <Text style={styles.myBankLabel}>Account Holder:</Text>
                  <Text style={styles.myBankValue}>{savedBankAccount.accountHolderName}</Text>
                </View>
                <View style={styles.myBankRow}>
                  <Text style={styles.myBankLabel}>Account Number:</Text>
                  <Text style={styles.myBankValue}>{savedBankAccount.accountNumber}</Text>
                </View>
                <View style={styles.myBankRow}>
                  <Text style={styles.myBankLabel}>IBAN:</Text>
                  <Text style={styles.myBankValue}>{savedBankAccount.iban}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.useBankButton,
                  isSavedAccountLoaded() && styles.useBankButtonLoaded
                ]}
                onPress={loadSavedBankAccount}
                disabled={isSavedAccountLoaded()}
              >
                <Icon 
                  name={isSavedAccountLoaded() ? "check-circle" : "account-balance"} 
                  size={18} 
                  color={isSavedAccountLoaded() ? PMAColors.success : PMAColors.white} 
                />
                <Text style={[
                  styles.useBankButtonText,
                  isSavedAccountLoaded() && styles.useBankButtonTextLoaded
                ]}>
                  {isSavedAccountLoaded() ? 'Account Loaded' : 'Use This Account'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bank Account Details */}
          <View style={styles.bankSection}>
            <Text style={styles.sectionTitle}>Manual Bank Account Entry</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <TextInput
                style={styles.input}
                value={bankAccount.bankName}
                onChangeText={(text) => updateBankAccount('bankName', text)}
                placeholder="Enter bank name"
                placeholderTextColor={PMAColors.placeholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <TextInput
                style={styles.input}
                value={bankAccount.accountNumber}
                onChangeText={(text) => updateBankAccount('accountNumber', text)}
                placeholder="Enter account number"
                placeholderTextColor={PMAColors.placeholder}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Name</Text>
              <TextInput
                style={styles.input}
                value={bankAccount.accountHolderName}
                onChangeText={(text) => updateBankAccount('accountHolderName', text)}
                placeholder="Enter account holder name"
                placeholderTextColor={PMAColors.placeholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>IBAN</Text>
              <TextInput
                style={styles.input}
                value={bankAccount.iban}
                onChangeText={(text) => updateBankAccount('iban', text)}
                placeholder="PS92PALS000000001234567890"
                placeholderTextColor={PMAColors.placeholder}
              />
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.amountSection}>
            <Text style={styles.sectionTitle}>Transfer Amount</Text>
            <View style={styles.amountContainer}>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={[styles.amountInput, amountError && styles.inputError]}
                  placeholder="0.00"
                  placeholderTextColor={PMAColors.placeholder}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.currencyCode}>{selectedCurrency}</Text>
              </View>
              
              <TouchableOpacity style={styles.maxButton} onPress={handleMaxAmount}>
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
            
            {amountError ? (
              <Text style={styles.errorText}>{amountError}</Text>
            ) : null}
            
            {/* Fee Information */}
            <View style={styles.feeContainer}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Transfer Amount:</Text>
                <Text style={styles.feeValue}>
                  ${amount ? formatBalance(parseFloat(amount)) : '0.00'}
                </Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Transfer Fee:</Text>
                <Text style={styles.feeValue}>${formatBalance(transferFee)}</Text>
              </View>
              <View style={[styles.feeRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Cost:</Text>
                <Text style={styles.totalValue}>
                  ${amount ? formatBalance(parseFloat(amount) + transferFee) : formatBalance(transferFee)}
                </Text>
              </View>
            </View>
          </View>

          {/* Note */}
          <View style={styles.noteSection}>
            <Text style={styles.sectionTitle}>Transfer Note (Optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note for this transfer"
              placeholderTextColor={PMAColors.placeholder}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Transfer Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.transferButton, (!canTransfer() || isLoading) && styles.transferButtonDisabled]}
              onPress={handleTransfer}
              disabled={!canTransfer() || isLoading}
            >
              <LinearGradient
                colors={canTransfer() && !isLoading ? [PMAColors.primary, PMAColors.accent] : [PMAColors.lightGray, PMAColors.gray]}
                style={styles.transferButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={PMAColors.white} />
                ) : (
                  <>
                    <Icon name="account-balance" size={20} color={PMAColors.white} />
                    <Text style={styles.transferButtonText}>Transfer to Bank</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 100 : 120,
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
  currencySelection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.text,
    marginBottom: 12,
  },
  currencyTabs: {
    flexDirection: 'row',
    backgroundColor: PMAColors.lightGray,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  currencyTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  currencyTabActive: {
    backgroundColor: PMAColors.primary,
  },
  currencyTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: PMAColors.primary,
  },
  currencyTabTextActive: {
    color: PMAColors.white,
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: PMAColors.textSecondary,
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: PMAColors.success,
  },
  myBankSection: {
    padding: 20,
    backgroundColor: PMAColors.background,
  },
  myBankCard: {
    backgroundColor: PMAColors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: PMAColors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  myBankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  myBankName: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.text,
  },
  myBankDetails: {
    marginBottom: 16,
  },
  myBankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  myBankLabel: {
    fontSize: 14,
    color: PMAColors.textSecondary,
    flex: 1,
  },
  myBankValue: {
    fontSize: 14,
    fontWeight: '500',
    color: PMAColors.text,
    flex: 2,
    textAlign: 'right',
  },
  useBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PMAColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  useBankButtonLoaded: {
    backgroundColor: PMAColors.background,
    borderWidth: 1,
    borderColor: PMAColors.success,
  },
  useBankButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PMAColors.white,
  },
  useBankButtonTextLoaded: {
    color: PMAColors.success,
  },
  bankSection: {
    padding: 20,
    backgroundColor: PMAColors.white,
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: PMAColors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: PMAColors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PMAColors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: PMAColors.text,
  },
  amountSection: {
    padding: 20,
    backgroundColor: PMAColors.white,
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PMAColors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PMAColors.lightGray,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.text,
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: '500',
    color: PMAColors.textSecondary,
    marginLeft: 8,
  },
  inputError: {
    borderColor: PMAColors.error,
  },
  maxButton: {
    backgroundColor: PMAColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  maxButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: PMAColors.white,
  },
  errorText: {
    fontSize: 12,
    color: PMAColors.error,
    marginTop: 4,
  },
  feeContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: PMAColors.background,
    borderRadius: 12,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: PMAColors.textSecondary,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: PMAColors.text,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PMAColors.lightGray,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: PMAColors.primary,
  },
  noteSection: {
    padding: 20,
    backgroundColor: PMAColors.white,
    marginBottom: 8,
  },
  noteInput: {
    backgroundColor: PMAColors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PMAColors.lightGray,
    padding: 16,
    fontSize: 16,
    color: PMAColors.text,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  buttonContainer: {
    padding: 20,
  },
  transferButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  transferButtonDisabled: {
    opacity: 0.6,
  },
  transferButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  transferButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorSubtext: {
    fontSize: 14,
    color: PMAColors.gray,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default BankTransferScreen; 