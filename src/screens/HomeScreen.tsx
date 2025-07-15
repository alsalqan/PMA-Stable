import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PMAColors } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import * as Haptics from 'expo-haptics';

// const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { wallet, refreshWallet, transactions } = useWallet();
  
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshWallet();
    } catch (error) {
      console.error('Error refreshing wallet:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getTotalBalance = () => {
    if (!wallet) return 0;
    return wallet.balance.USDT + wallet.balance.USDC + wallet.balance.AECoin;
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getRecentTransactions = () => {
    return transactions.slice(0, 3);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PMAColors.primary} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PMAColors.primary]}
            tintColor={PMAColors.primary}
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={[PMAColors.primary, PMAColors.accent]}
          style={styles.header}
        >
          {/* PMA Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/Pma.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.brandInfo}>
              <Text style={styles.brandName}>PMA Digital Banking</Text>
              <Text style={styles.brandSubtitle}>Palestine Monetary Authority</Text>
            </View>
          </View>

          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Icon name="settings" size={24} color={PMAColors.white} />
            </TouchableOpacity>
          </View>

          {/* Account Address */}
          <View style={styles.walletAddressContainer}>
            <Text style={styles.walletAddressLabel}>Account Address</Text>
            <TouchableOpacity style={styles.addressRow}>
              <Text style={styles.walletAddress}>
                {wallet ? formatAddress(wallet.address) : 'Loading...'}
              </Text>
              <Icon name="content-copy" size={18} color={PMAColors.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceTitle}>Total Balance</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Icon name="refresh" size={20} color={PMAColors.primary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.totalBalance}>
            ${formatBalance(getTotalBalance())}
          </Text>
          
          <View style={styles.balanceBreakdown}>
            <View style={styles.balanceItem}>
              <Text style={styles.currencyName}>USDT</Text>
              <Text style={styles.currencyBalance}>
                ${formatBalance(wallet?.balance.USDT || 0)}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.currencyName}>USDC</Text>
              <Text style={styles.currencyBalance}>
                ${formatBalance(wallet?.balance.USDC || 0)}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.currencyName}>AE Coin</Text>
              <Text style={styles.currencyBalance}>
                ${formatBalance(wallet?.balance.AECoin || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Send')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1976D2', '#1565C0']}
              style={styles.actionButtonGradient}
            >
              <Icon name="send" size={24} color={PMAColors.white} />
              <Text style={styles.actionButtonText}>Send</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Receive')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#388E3C', '#2E7D32']}
              style={styles.actionButtonGradient}
            >
              <Icon name="call-received" size={24} color={PMAColors.white} />
              <Text style={styles.actionButtonText}>Receive</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Scan')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F57C00', '#EF6C00']}
              style={styles.actionButtonGradient}
            >
              <Icon name="qr-code-scanner" size={24} color={PMAColors.white} />
              <Text style={styles.actionButtonText}>Scan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Bank Transfer Section */}
        <View style={styles.bankTransferSection}>
          <TouchableOpacity
            style={styles.bankTransferButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('BankTransfer');
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6A4C93', '#9A6ABA']}
              style={styles.bankTransferGradient}
            >
              <Icon name="account-balance" size={24} color={PMAColors.white} />
              <Text style={styles.bankTransferText}>Transfer to Bank Account</Text>
              <Icon name="arrow-forward" size={20} color={PMAColors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Spending Analytics Section */}
        <View style={styles.analyticsSection}>
          <TouchableOpacity
            style={styles.analyticsButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('SpendingAnalytics');
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#E91E63', '#AD1457']}
              style={styles.analyticsGradient}
            >
              <Icon name="analytics" size={24} color={PMAColors.white} />
              <Text style={styles.analyticsText}>View Spending Analytics</Text>
              <Icon name="arrow-forward" size={20} color={PMAColors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Spending Goals Section */}
        <View style={styles.goalsSection}>
          <TouchableOpacity
            style={styles.goalsButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('SpendingGoals');
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#9C27B0', '#7B1FA2']}
              style={styles.goalsGradient}
            >
              <Icon name="track-changes" size={24} color={PMAColors.white} />
              <Text style={styles.goalsText}>Manage Spending Goals</Text>
              <Icon name="arrow-forward" size={20} color={PMAColors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentTransactions}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {getRecentTransactions().length > 0 ? (
            getRecentTransactions().map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Icon
                    name={transaction.type === 'bank_transfer' ? 'account-balance' : transaction.type === 'send' ? 'arrow-upward' : 'arrow-downward'}
                    size={20}
                    color={transaction.type === 'bank_transfer' ? '#6A4C93' : transaction.type === 'send' ? PMAColors.error : PMAColors.success}
                  />
                </View>
                
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionType}>
                    {transaction.type === 'bank_transfer' 
                      ? `Bank Transfer ${transaction.currency}`
                      : transaction.type === 'send' 
                        ? `Sent ${transaction.currency}` 
                        : `Received ${transaction.currency}`
                    }
                  </Text>
                  <Text style={styles.transactionAddress}>
                    {transaction.type === 'bank_transfer'
                      ? transaction.bankAccount 
                        ? `To: ${transaction.bankAccount.bankName}`
                        : 'Bank Transfer'
                      : transaction.type === 'send' 
                        ? `To: ${formatAddress(transaction.toAddress)}`
                        : `From: ${formatAddress(transaction.fromAddress)}`
                    }
                  </Text>
                </View>
                
                <View style={styles.transactionAmount}>
                  <Text style={[
                    styles.transactionAmountText,
                    { color: transaction.type === 'send' ? PMAColors.error : PMAColors.success }
                  ]}>
                    {transaction.type === 'send' ? '-' : '+'}${formatBalance(transaction.amount)}
                  </Text>
                  <Text style={styles.transactionStatus}>
                    {transaction.status}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noTransactions}>
              <Icon name="receipt" size={48} color={PMAColors.placeholder} />
              <Text style={styles.noTransactionsText}>No transactions yet</Text>
              <Text style={styles.noTransactionsSubtext}>
                Start by sending or receiving funds
              </Text>
            </View>
          )}
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
    paddingBottom: 100, // Add padding to the bottom of the ScrollView
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  logoContainer: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: PMAColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: PMAColors.black,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PMAColors.white,
    marginBottom: 2,
  },
  brandSubtitle: {
    fontSize: 12,
    color: PMAColors.white,
    opacity: 0.9,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: PMAColors.white,
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PMAColors.white,
  },
  settingsButton: {
    padding: 8,
  },
  walletAddressContainer: {
    marginTop: 10,
  },
  walletAddressLabel: {
    fontSize: 14,
    color: PMAColors.white,
    opacity: 0.8,
    marginBottom: 5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletAddress: {
    fontSize: 16,
    color: PMAColors.white,
    fontWeight: '500',
    marginRight: 10,
  },
  balanceCard: {
    backgroundColor: PMAColors.white,
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.text,
  },
  totalBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PMAColors.primary,
    marginBottom: 20,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    alignItems: 'center',
  },
  currencyName: {
    fontSize: 12,
    color: PMAColors.textSecondary,
    marginBottom: 5,
  },
  currencyBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: PMAColors.text,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: Platform.OS === 'ios' ? 6 : 4,
    borderRadius: Platform.OS === 'ios' ? 18 : 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Platform.OS === 'ios' ? 4 : 2,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 6 : 4,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  actionButtonGradient: {
    paddingVertical: Platform.OS === 'ios' ? 22 : 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  actionButtonText: {
    color: PMAColors.white,
    fontSize: Platform.OS === 'ios' ? 15 : 14,
    fontWeight: Platform.OS === 'ios' ? '700' : '600',
    marginTop: 8,
    textAlign: 'center',
  },
  bankTransferSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  bankTransferButton: {
    borderRadius: Platform.OS === 'ios' ? 18 : 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Platform.OS === 'ios' ? 4 : 2,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 6 : 4,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  bankTransferGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'ios' ? 18 : 16,
    paddingHorizontal: 20,
    minHeight: 60,
  },
  bankTransferText: {
    flex: 1,
    color: PMAColors.white,
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    fontWeight: Platform.OS === 'ios' ? '700' : '600',
    marginLeft: 12,
    textAlign: 'left',
  },
  analyticsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  analyticsButton: {
    borderRadius: Platform.OS === 'ios' ? 18 : 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Platform.OS === 'ios' ? 4 : 2,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 6 : 4,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  analyticsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'ios' ? 18 : 16,
    paddingHorizontal: 20,
    minHeight: 60,
  },
  analyticsText: {
    flex: 1,
    color: PMAColors.white,
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    fontWeight: Platform.OS === 'ios' ? '700' : '600',
    marginLeft: 12,
    textAlign: 'left',
  },
  goalsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  goalsButton: {
    borderRadius: Platform.OS === 'ios' ? 18 : 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Platform.OS === 'ios' ? 4 : 2,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 6 : 4,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  goalsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'ios' ? 18 : 16,
    paddingHorizontal: 20,
    minHeight: 60,
  },
  goalsText: {
    flex: 1,
    color: PMAColors.white,
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    fontWeight: Platform.OS === 'ios' ? '700' : '600',
    marginLeft: 12,
    textAlign: 'left',
  },
  recentTransactions: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: PMAColors.primary,
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PMAColors.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PMAColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
    color: PMAColors.text,
    marginBottom: 3,
  },
  transactionAddress: {
    fontSize: 12,
    color: PMAColors.textSecondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  transactionStatus: {
    fontSize: 12,
    color: PMAColors.textSecondary,
    textTransform: 'capitalize',
  },
  noTransactions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noTransactionsText: {
    fontSize: 18,
    fontWeight: '500',
    color: PMAColors.text,
    marginTop: 15,
    marginBottom: 5,
  },
  noTransactionsSubtext: {
    fontSize: 14,
    color: PMAColors.textSecondary,
    textAlign: 'center',
  },
});

export default HomeScreen; 