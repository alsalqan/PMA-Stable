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
import { PMAColors } from '../theme';
import { useWallet } from '../contexts/WalletContext';

interface SendScreenProps {
  navigation: any;
  route?: {
    params?: {
      recipientAddress?: string;
      amount?: string;
      currency?: 'USDT' | 'USDC' | 'AECoin';
    };
  };
}

type Currency = 'USDT' | 'USDC' | 'AECoin';

const SendScreen: React.FC<SendScreenProps> = ({ navigation, route }) => {
  const { wallet, sendTransaction, getBalance } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState(route?.params?.recipientAddress || '');
  const [amount, setAmount] = useState(route?.params?.amount || '');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(route?.params?.currency || 'USDT');
  const [transferType, setTransferType] = useState<'wallet' | 'bank'>('wallet');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [amountError, setAmountError] = useState('');

  const currencies = [
    { key: 'USDT' as Currency, name: 'USDT', icon: 'account-balance-wallet' },
    { key: 'USDC' as Currency, name: 'USDC', icon: 'account-balance' },
    { key: 'AECoin' as Currency, name: 'AE Coin', icon: 'stars' },
  ];

  const estimatedFee = 0.001; // Mock transaction fee

  useEffect(() => {
    validateAddress(recipientAddress);
  }, [recipientAddress]);

  useEffect(() => {
    validateAmount(amount);
  }, [amount, selectedCurrency, wallet]);

  const validateAddress = (address: string) => {
    if (!address) {
      setAddressError('');
      return;
    }

    // Basic Ethereum address validation
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(address)) {
      setAddressError('Invalid account address format');
    } else if (wallet && address.toLowerCase() === wallet.address.toLowerCase()) {
      setAddressError('Cannot send to your own address');
    } else {
      setAddressError('');
    }
  };

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

    if (numAmount < 0.001) {
      setAmountError('Minimum amount is 0.001');
      return;
    }

    setAmountError('');
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  const getCurrentBalance = () => {
    return wallet?.balance[selectedCurrency] || 0;
  };

  const canSend = () => {
    return (
      wallet &&
      recipientAddress &&
      amount &&
      parseFloat(amount) > 0 &&
      !addressError &&
      !amountError &&
      !isLoading
    );
  };

  const handleScanQR = () => {
    navigation.navigate('Scan', {
      onScanResult: (scannedData: string) => {
        // Parse scanned QR code data
        try {
          const url = new URL(scannedData);
          setRecipientAddress(url.pathname || scannedData);
          
          const amountParam = url.searchParams.get('amount');
          const currencyParam = url.searchParams.get('currency') as Currency;
          
          if (amountParam) setAmount(amountParam);
          if (currencyParam && currencies.some(c => c.key === currencyParam)) {
            setSelectedCurrency(currencyParam);
          }
        } catch {
          // If not a URL, treat as plain address
          setRecipientAddress(scannedData);
        }
      },
    });
  };

  const handleMaxAmount = () => {
    const balance = getCurrentBalance();
    if (balance > estimatedFee) {
      setAmount((balance - estimatedFee).toString());
    } else {
      setAmount(balance.toString());
    }
  };

  const handleSend = async () => {
    if (!canSend()) return;

    const numAmount = parseFloat(amount);
    
    Alert.alert(
      'Confirm Transaction',
      `Send ${formatBalance(numAmount)} ${selectedCurrency} to:\n${recipientAddress.substring(0, 10)}...${recipientAddress.substring(recipientAddress.length - 8)}\n\nEstimated fee: ${estimatedFee} ETH`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send',
          style: 'default',
          onPress: confirmSend,
        },
      ]
    );
  };

  const confirmSend = async () => {
    if (!wallet) return;

    try {
      setIsLoading(true);
      
      const txHash = await sendTransaction(
        recipientAddress,
        parseFloat(amount),
        selectedCurrency
      );

      Alert.alert(
        'Transaction Sent',
        `Your transaction has been submitted successfully!\n\nTransaction ID: ${txHash.substring(0, 10)}...`,
        [
          {
            text: 'View on Explorer',
            onPress: () => {
              // TODO: Open blockchain explorer
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );

      // Reset form
      setRecipientAddress('');
      setAmount('');
      setNote('');
      
    } catch (error: any) {
      Alert.alert(
        'Transaction Failed',
        error.message || 'Failed to send transaction. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
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
            <Text style={styles.headerTitle}>Send Funds</Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScanQR}
            >
              <Icon name="qr-code-scanner" size={24} color={PMAColors.primary} />
            </TouchableOpacity>
          </View>

          {/* Transfer Type Selection */}
          <View style={styles.transferTypeSelection}>
            <Text style={styles.sectionTitle}>Transfer Type</Text>
            <View style={styles.transferTypeTabs}>
              <TouchableOpacity
                style={[
                  styles.transferTypeTab,
                  transferType === 'wallet' && styles.transferTypeTabActive,
                ]}
                onPress={() => setTransferType('wallet')}
              >
                <Icon
                  name="account-balance-wallet"
                  size={20}
                  color={transferType === 'wallet' ? PMAColors.white : PMAColors.primary}
                />
                <Text
                  style={[
                    styles.transferTypeTabText,
                    transferType === 'wallet' && styles.transferTypeTabTextActive,
                  ]}
                >
                  Account to Account
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.transferTypeTab,
                  transferType === 'bank' && styles.transferTypeTabActive,
                ]}
                onPress={() => {
                  setTransferType('bank');
                  navigation.navigate('BankTransfer');
                }}
              >
                <Icon
                  name="account-balance"
                  size={20}
                  color={transferType === 'bank' ? PMAColors.white : PMAColors.primary}
                />
                <Text
                  style={[
                    styles.transferTypeTabText,
                    transferType === 'bank' && styles.transferTypeTabTextActive,
                  ]}
                >
                  Bank Transfer
                </Text>
              </TouchableOpacity>
            </View>
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
              <Text style={styles.balanceLabel}>Available Balance:</Text>
              <Text style={styles.balanceAmount}>
                {formatBalance(getCurrentBalance())} {selectedCurrency}
              </Text>
            </View>
          </View>

          {/* Recipient Address */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Recipient Address</Text>
            <View style={[styles.inputContainer, addressError && styles.inputError]}>
              <TextInput
                style={styles.addressInput}
                placeholder="0x1234...abcd or scan QR code"
                placeholderTextColor={PMAColors.placeholder}
                value={recipientAddress}
                onChangeText={setRecipientAddress}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.scanIconButton} onPress={handleScanQR}>
                <Icon name="qr-code-scanner" size={20} color={PMAColors.primary} />
              </TouchableOpacity>
            </View>
            {addressError ? (
              <Text style={styles.errorText}>{addressError}</Text>
            ) : null}
          </View>

          {/* Amount */}
          <View style={styles.inputSection}>
            <View style={styles.amountHeader}>
              <Text style={styles.sectionTitle}>Amount</Text>
              <TouchableOpacity onPress={handleMaxAmount}>
                <Text style={styles.maxButton}>MAX</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, amountError && styles.inputError]}>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={PMAColors.placeholder}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <Text style={styles.currencyLabel}>{selectedCurrency}</Text>
            </View>
            {amountError ? (
              <Text style={styles.errorText}>{amountError}</Text>
            ) : null}
          </View>

          {/* Transaction Details */}
          <View style={styles.transactionDetails}>
            <Text style={styles.sectionTitle}>Transaction Details</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>
                  {amount ? formatBalance(parseFloat(amount)) : '0.00'} {selectedCurrency}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Network Fee:</Text>
                <Text style={styles.detailValue}>~{estimatedFee} ETH</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabelBold}>Total:</Text>
                <Text style={styles.detailValueBold}>
                  {amount ? formatBalance(parseFloat(amount)) : '0.00'} {selectedCurrency}
                </Text>
              </View>
            </View>
          </View>

          {/* Note (Optional) */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Note (Optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Transaction memo or description"
              placeholderTextColor={PMAColors.placeholder}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        {/* Send Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.sendButton, !canSend() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!canSend()}
          >
            <LinearGradient
              colors={
                canSend()
                  ? [PMAColors.primary, PMAColors.accent]
                  : [PMAColors.lightGray, PMAColors.lightGray]
              }
              style={styles.sendButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={PMAColors.white} />
              ) : (
                <>
                  <Icon name="send" size={20} color={PMAColors.white} />
                  <Text style={styles.sendButtonText}>
                    Send {selectedCurrency}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  scanButton: {
    padding: 8,
  },
  transferTypeSelection: {
    padding: 20,
    backgroundColor: PMAColors.white,
    marginBottom: 8,
  },
  transferTypeTabs: {
    flexDirection: 'row',
    backgroundColor: PMAColors.lightGray,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  transferTypeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  transferTypeTabActive: {
    backgroundColor: PMAColors.primary,
  },
  transferTypeTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: PMAColors.primary,
    textAlign: 'center',
  },
  transferTypeTabTextActive: {
    color: PMAColors.white,
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
    backgroundColor: PMAColors.white,
    borderRadius: 8,
    padding: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: PMAColors.gray,
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: PMAColors.primary,
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PMAColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PMAColors.lightGray,
  },
  inputError: {
    borderColor: PMAColors.error,
  },
  addressInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: PMAColors.text,
  },
  scanIconButton: {
    padding: 16,
  },
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  maxButton: {
    fontSize: 14,
    fontWeight: '600',
    color: PMAColors.primary,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.text,
  },
  currencyLabel: {
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    color: PMAColors.primary,
  },
  transactionDetails: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  detailsContainer: {
    backgroundColor: PMAColors.white,
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: PMAColors.gray,
  },
  detailValue: {
    fontSize: 14,
    color: PMAColors.text,
  },
  detailLabelBold: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.text,
  },
  detailValueBold: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: PMAColors.lightGray,
    marginVertical: 8,
  },
  noteInput: {
    backgroundColor: PMAColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PMAColors.lightGray,
    padding: 16,
    fontSize: 16,
    color: PMAColors.text,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 10,
  },
  sendButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 12,
    color: PMAColors.error,
    marginTop: 4,
  },
});

export default SendScreen; 