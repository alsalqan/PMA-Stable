import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PMAColors } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { WalletService } from '../services/WalletService';
import { Transaction } from '../types';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { wallet, refreshWallet, transactions } = useWallet();
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

  useEffect(() => {
    if (wallet) {
      refreshWallet();
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshWallet();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh wallet data');
    } finally {
      setRefreshing(false);
    }
  };

  const getTotalBalance = () => {
    if (!wallet) return 0;
    return wallet.balance.USDT + wallet.balance.USDC + wallet.balance.AECoin;
  };

  const getRecentTransactions = () => {
    return transactions.slice(0, 3);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'send':
        navigation.navigate('Send');
        break;
      case 'receive':
        navigation.navigate('Receive');
        break;
      case 'scan':
        navigation.navigate('Scan');
        break;
      case 'topup':
        navigation.navigate('TopUp');
        break;
      default:
        break;
    }
  };

  const renderBalanceCard = () => (
    <LinearGradient
      colors={[PMAColors.primary, PMAColors.accent]}
      style={styles.balanceCard}
    >
      <View style={styles.balanceHeader}>
        <Text style={styles.balanceTitle}>Total Balance</Text>
        <TouchableOpacity
          onPress={() => setBalanceVisible(!balanceVisible)}
          style={styles.eyeButton}
        >
          <Text style={styles.eyeIcon}>{balanceVisible ? '👁️' : '👁️‍🗨️'}</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.balanceAmount}>
        {balanceVisible ? `$${getTotalBalance().toFixed(2)}` : '****'}
      </Text>
      
      <View style={styles.walletInfo}>
        <Text style={styles.walletLabel}>Wallet Address</Text>
        <Text style={styles.walletAddress}>
          {wallet ? WalletService.formatAddress(wallet.address) : 'Loading...'}
        </Text>
      </View>
      
      <View style={styles.currencyBalances}>
        <View style={styles.currencyItem}>
          <Text style={styles.currencyLabel}>USDT</Text>
          <Text style={styles.currencyValue}>
            {balanceVisible ? formatCurrency(wallet?.balance.USDT || 0, 'USDT') : '****'}
          </Text>
        </View>
        <View style={styles.currencyItem}>
          <Text style={styles.currencyLabel}>USDC</Text>
          <Text style={styles.currencyValue}>
            {balanceVisible ? formatCurrency(wallet?.balance.USDC || 0, 'USDC') : '****'}
          </Text>
        </View>
        <View style={styles.currencyItem}>
          <Text style={styles.currencyLabel}>AE Coin</Text>
          <Text style={styles.currencyValue}>
            {balanceVisible ? formatCurrency(wallet?.balance.AECoin || 0, 'AE') : '****'}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => handleQuickAction('send')}
        >
          <View style={styles.quickActionIcon}>
            <Text style={styles.quickActionIconText}>📤</Text>
          </View>
          <Text style={styles.quickActionText}>Send</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => handleQuickAction('receive')}
        >
          <View style={styles.quickActionIcon}>
            <Text style={styles.quickActionIconText}>📥</Text>
          </View>
          <Text style={styles.quickActionText}>Receive</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => handleQuickAction('scan')}
        >
          <View style={styles.quickActionIcon}>
            <Text style={styles.quickActionIconText}>📱</Text>
          </View>
          <Text style={styles.quickActionText}>Scan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => handleQuickAction('topup')}
        >
          <View style={styles.quickActionIcon}>
            <Text style={styles.quickActionIconText}>💰</Text>
          </View>
          <Text style={styles.quickActionText}>Top Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentTransactions = () => (
    <View style={styles.transactionsContainer}>
      <View style={styles.transactionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      {getRecentTransactions().length === 0 ? (
        <View style={styles.noTransactions}>
          <Text style={styles.noTransactionsText}>No transactions yet</Text>
          <Text style={styles.noTransactionsSubtext}>
            Start by sending or receiving funds
          </Text>
        </View>
      ) : (
        getRecentTransactions().map((transaction, index) => (
          <TouchableOpacity
            key={transaction.id}
            style={styles.transactionItem}
            onPress={() => navigation.navigate('Transactions')}
          >
            <View style={styles.transactionIcon}>
              <Text style={styles.transactionIconText}>
                {transaction.type === 'send' ? '📤' : '📥'}
              </Text>
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>
                {transaction.type === 'send' ? 'Sent' : 'Received'}
              </Text>
              <Text style={styles.transactionAddress}>
                {transaction.type === 'send' 
                  ? WalletService.formatAddress(transaction.toAddress)
                  : WalletService.formatAddress(transaction.fromAddress)
                }
              </Text>
            </View>
            <View style={styles.transactionAmount}>
              <Text style={[
                styles.transactionAmountText,
                transaction.type === 'send' ? styles.sendAmount : styles.receiveAmount
              ]}>
                {transaction.type === 'send' ? '-' : '+'}
                {formatCurrency(transaction.amount, transaction.currency)}
              </Text>
              <Text style={styles.transactionStatus}>
                {transaction.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PMAColors.primary} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Welcome back, {user?.firstName || 'User'}!
          </Text>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.profileButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {renderBalanceCard()}
        {renderQuickActions()}
        {renderRecentTransactions()}
      </ScrollView>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: PMAColors.primary,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PMAColors.white,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PMAColors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    fontSize: 20,
  },
  balanceCard: {
    margin: 20,
    marginTop: -10,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceTitle: {
    fontSize: 16,
    color: PMAColors.white,
    opacity: 0.9,
  },
  eyeButton: {
    padding: 5,
  },
  eyeIcon: {
    fontSize: 20,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PMAColors.white,
    marginBottom: 15,
  },
  walletInfo: {
    marginBottom: 20,
  },
  walletLabel: {
    fontSize: 14,
    color: PMAColors.white,
    opacity: 0.8,
    marginBottom: 5,
  },
  walletAddress: {
    fontSize: 16,
    color: PMAColors.white,
    fontWeight: '500',
  },
  currencyBalances: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currencyItem: {
    alignItems: 'center',
  },
  currencyLabel: {
    fontSize: 12,
    color: PMAColors.white,
    opacity: 0.8,
    marginBottom: 4,
  },
  currencyValue: {
    fontSize: 14,
    color: PMAColors.white,
    fontWeight: '500',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PMAColors.text,
    marginBottom: 15,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    width: (width - 60) / 4,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PMAColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionIconText: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: 12,
    color: PMAColors.text,
    textAlign: 'center',
  },
  transactionsContainer: {
    paddingHorizontal: 20,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: PMAColors.primary,
    fontWeight: '500',
  },
  noTransactions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noTransactionsText: {
    fontSize: 16,
    color: PMAColors.gray,
    marginBottom: 5,
  },
  noTransactionsSubtext: {
    fontSize: 14,
    color: PMAColors.gray,
    opacity: 0.8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PMAColors.white,
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PMAColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: PMAColors.text,
    marginBottom: 4,
  },
  transactionAddress: {
    fontSize: 14,
    color: PMAColors.gray,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  sendAmount: {
    color: PMAColors.error,
  },
  receiveAmount: {
    color: PMAColors.success,
  },
  transactionStatus: {
    fontSize: 12,
    color: PMAColors.gray,
    textTransform: 'capitalize',
  },
});

export default HomeScreen; 