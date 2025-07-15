import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PMAColors } from '../theme';
import { useWallet } from '../contexts/WalletContext';

interface ReceiveScreenProps {
  navigation: any;
}

type Currency = 'USDT' | 'USDC' | 'AECoin';

const ReceiveScreen: React.FC<ReceiveScreenProps> = ({ navigation }) => {
  const { wallet } = useWallet();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USDT');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const currencies = [
    { key: 'USDT' as Currency, name: 'USDT', icon: 'account-balance-wallet' },
    { key: 'USDC' as Currency, name: 'USDC', icon: 'account-balance' },
    { key: 'AECoin' as Currency, name: 'AE Coin', icon: 'stars' },
  ];

  const getQRData = () => {
    if (!wallet) return '';
    
    let qrData = wallet.address;
    
    // Add amount and currency if specified
    if (amount && parseFloat(amount) > 0) {
      qrData += `?amount=${amount}&currency=${selectedCurrency}`;
      if (note) {
        qrData += `&note=${encodeURIComponent(note)}`;
      }
    }
    
    return qrData;
  };

  const copyToClipboard = async () => {
    if (!wallet) return;
    
    try {
          await Clipboard.setStringAsync(wallet.address);
    Alert.alert('Copied!', 'Account address copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy address');
    }
  };

  const shareAddress = async () => {
    if (!wallet) return;
    
    try {
      let message = `My ${selectedCurrency} account address:\n${wallet.address}`;
      
      if (amount && parseFloat(amount) > 0) {
        message += `\n\nRequested amount: ${amount} ${selectedCurrency}`;
      }
      
      if (note) {
        message += `\nNote: ${note}`;
      }
      
      await Share.share({
        message,
        title: `${selectedCurrency} Account Address`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share address');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
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
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          <Text style={styles.headerTitle}>Receive Funds</Text>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={shareAddress}
          >
            <Icon name="share" size={24} color={PMAColors.primary} />
          </TouchableOpacity>
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
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <View style={styles.qrCodeWrapper}>
            <QRCode
              value={getQRData()}
              size={200}
              color={PMAColors.text}
              backgroundColor={PMAColors.white}
              logo={require('../../assets/icon.png')}
              logoSize={50}
              logoBackgroundColor={PMAColors.white}
            />
          </View>
          
          <Text style={styles.qrDescription}>
            Scan this QR code to send {selectedCurrency} to your account
          </Text>
        </View>

        {/* Account Address */}
        <View style={styles.addressContainer}>
          <Text style={styles.sectionTitle}>Your Account Address</Text>
          <View style={styles.addressBox}>
            <Text style={styles.addressText}>{formatAddress(wallet.address)}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
              <Icon name="content-copy" size={20} color={PMAColors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.fullAddress}>{wallet.address}</Text>
        </View>

        {/* Optional Amount Request */}
        <View style={styles.amountContainer}>
          <Text style={styles.sectionTitle}>Request Specific Amount (Optional)</Text>
          <View style={styles.inputContainer}>
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
        </View>

        {/* Optional Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.sectionTitle}>Add Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Payment description or memo"
            placeholderTextColor={PMAColors.placeholder}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={copyToClipboard}>
            <LinearGradient
              colors={[PMAColors.primary, PMAColors.accent]}
              style={styles.actionButtonGradient}
            >
              <Icon name="content-copy" size={20} color={PMAColors.white} />
              <Text style={styles.actionButtonText}>Copy Address</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={shareAddress}>
            <LinearGradient
              colors={[PMAColors.secondary, PMAColors.accent]}
              style={styles.actionButtonGradient}
            >
              <Icon name="share" size={20} color={PMAColors.white} />
              <Text style={styles.actionButtonText}>Share</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PMAColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30, // Add padding to the bottom of the scroll view content
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
  shareButton: {
    padding: 8,
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
  qrContainer: {
    alignItems: 'center',
    padding: 20,
  },
  qrCodeWrapper: {
    padding: 20,
    backgroundColor: PMAColors.white,
    borderRadius: 16,
    shadowColor: PMAColors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrDescription: {
    fontSize: 14,
    color: PMAColors.gray,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  addressContainer: {
    padding: 20,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PMAColors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: PMAColors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: PMAColors.text,
  },
  copyButton: {
    padding: 8,
  },
  fullAddress: {
    fontSize: 12,
    color: PMAColors.gray,
    marginTop: 8,
    textAlign: 'center',
  },
  amountContainer: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PMAColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PMAColors.lightGray,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: PMAColors.text,
  },
  currencyLabel: {
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    color: PMAColors.primary,
  },
  noteContainer: {
    padding: 20,
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
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 16,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
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
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.text,
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: PMAColors.gray,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ReceiveScreen; 