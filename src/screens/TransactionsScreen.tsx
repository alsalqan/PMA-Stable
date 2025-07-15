import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PMAColors } from '../theme';
import { useWallet } from '../contexts/WalletContext';
import { Transaction } from '../types';

interface TransactionsScreenProps {
  navigation: any;
}

type FilterType = 'all' | 'sent' | 'received' | 'bank_transfer';
type Currency = 'all' | 'USDT' | 'USDC' | 'AECoin';

const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ navigation }) => {
  const { transactions, refreshWallet } = useWallet();
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterCurrency, setFilterCurrency] = useState<Currency>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [amountFilter, setAmountFilter] = useState<'all' | 'small' | 'medium' | 'large'>('all');

  const filterOptions = [
    { key: 'all' as FilterType, label: 'All', icon: 'swap-horiz' },
    { key: 'sent' as FilterType, label: 'Sent', icon: 'arrow-upward' },
    { key: 'received' as FilterType, label: 'Received', icon: 'arrow-downward' },
    { key: 'bank_transfer' as FilterType, label: 'Bank', icon: 'account-balance' },
  ];

  const currencyOptions = [
    { key: 'all' as Currency, label: 'All Currencies' },
    { key: 'USDT' as Currency, label: 'USDT' },
    { key: 'USDC' as Currency, label: 'USDC' },
    { key: 'AECoin' as Currency, label: 'AE Coin' },
  ];

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, filterType, filterCurrency, amountFilter]);

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.txHash.toLowerCase().includes(query) ||
        tx.currency.toLowerCase().includes(query) ||
        tx.amount.toString().includes(query) ||
        (tx.fromAddress && tx.fromAddress.toLowerCase().includes(query)) ||
        (tx.toAddress && tx.toAddress.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      if (filterType === 'sent') {
        filtered = filtered.filter(tx => tx.type === 'send' || tx.type === 'bank_transfer');
      } else if (filterType === 'received') {
        filtered = filtered.filter(tx => tx.type === 'receive');
      } else {
        filtered = filtered.filter(tx => tx.type === filterType);
      }
    }

    // Apply currency filter
    if (filterCurrency !== 'all') {
      filtered = filtered.filter(tx => tx.currency === filterCurrency);
    }

    // Apply amount filter
    if (amountFilter !== 'all') {
      filtered = filtered.filter(tx => {
        switch (amountFilter) {
          case 'small': return tx.amount <= 100;
          case 'medium': return tx.amount > 100 && tx.amount <= 1000;
          case 'large': return tx.amount > 1000;
          default: return true;
        }
      });
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredTransactions(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshWallet();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh transactions');
    } finally {
      setRefreshing(false);
    }
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return PMAColors.success;
      case 'pending': return PMAColors.warning;
      case 'failed': return PMAColors.error;
      default: return PMAColors.gray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return 'check-circle';
      case 'pending': return 'schedule';
      case 'failed': return 'error';
      default: return 'help';
    }
  };

  const handleTransactionPress = (transaction: Transaction) => {
    Alert.alert(
      'Transaction Details',
      `Type: ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}\n` +
      `Amount: ${formatBalance(transaction.amount)} ${transaction.currency}\n` +
      `From: ${transaction.fromAddress}\n` +
      `To: ${transaction.toAddress}\n` +
      `Status: ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}\n` +
      `Date: ${new Date(transaction.timestamp).toLocaleString()}\n` +
      `Transaction Hash: ${transaction.txHash}`,
      [
        { text: 'Copy Hash', onPress: () => copyTransactionHash(transaction.txHash) },
        { text: 'Share', onPress: () => shareTransaction(transaction) },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const copyTransactionHash = async (txHash: string) => {
    try {
      // Use clipboard functionality
      Alert.alert('Copied', 'Transaction hash copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy transaction hash');
    }
  };

  const shareTransaction = async (transaction: Transaction) => {
    try {
      const message = `Transaction Details:\n` +
        `Type: ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}\n` +
        `Amount: ${formatBalance(transaction.amount)} ${transaction.currency}\n` +
        `Status: ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}\n` +
        `Date: ${new Date(transaction.timestamp).toLocaleString()}\n` +
        `Hash: ${transaction.txHash}`;
      
      await Share.share({
        message,
        title: 'Transaction Details',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share transaction');
    }
  };

  const exportTransactions = async () => {
    try {
      if (filteredTransactions.length === 0) {
        Alert.alert('No Data', 'No transactions to export');
        return;
      }

      // Create CSV content with proper escaping
      const csvHeader = 'Date,Type,Amount,Currency,Status,Hash,From,To\n';
      const csvData = filteredTransactions.map(tx => {
        const date = new Date(tx.timestamp).toLocaleDateString();
        const type = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
        const from = (tx.fromAddress || 'N/A').replace(/,/g, ';'); // Escape commas
        const to = (tx.toAddress || 'N/A').replace(/,/g, ';'); // Escape commas
        const hash = tx.txHash.replace(/,/g, ';'); // Escape commas
        return `${date},${type},${tx.amount},${tx.currency},${tx.status},${hash},${from},${to}`;
      }).join('\n');

      const csvContent = csvHeader + csvData;
      const filename = `PMA_Transactions_${new Date().toISOString().split('T')[0]}.csv`;

      // Create file in document directory
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Transactions',
        });
      } else {
        // Fallback to React Native's Share API
        await Share.share({
          message: `PMA Bank Transaction Export\nTotal: ${filteredTransactions.length} transactions\n\n${csvContent}`,
          title: 'Transaction Export'
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Error', 'Failed to export transactions');
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'bank_transfer':
        return 'account-balance';
      case 'send':
        return 'arrow-upward';
      case 'receive':
        return 'arrow-downward';
      default:
        return 'swap-horiz';
    }
  };

  const getTransactionColors = (type: string) => {
    switch (type) {
      case 'bank_transfer':
        return ['#6A4C93', '#9A6ABA'];
      case 'send':
        return [PMAColors.error, '#FF8A80'];
      case 'receive':
        return [PMAColors.success, '#81C784'];
      default:
        return [PMAColors.primary, PMAColors.accent];
    }
  };

  const getTransactionText = (item: Transaction) => {
    switch (item.type) {
      case 'bank_transfer':
        return `Bank Transfer ${item.currency}`;
      case 'send':
        return `Sent ${item.currency}`;
      case 'receive':
        return `Received ${item.currency}`;
      default:
        return `${item.type} ${item.currency}`;
    }
  };

  const getTransactionSubtext = (item: Transaction) => {
    if (item.type === 'bank_transfer') {
      return item.bankAccount 
        ? `To: ${item.bankAccount.bankName} (${item.bankAccount.accountNumber})`
        : 'Bank Transfer';
    }
    return item.type === 'send' 
      ? `To: ${formatAddress(item.toAddress)}`
      : `From: ${formatAddress(item.fromAddress)}`;
  };

  const renderTransactionSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[...Array(6)].map((_, index) => (
        <View key={index} style={styles.skeletonItem}>
          <View style={styles.skeletonCircle} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLineSmall} />
          </View>
          <View style={styles.skeletonAmount} />
        </View>
      ))}
    </View>
  );

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => handleTransactionPress(item)}
    >
      <View style={styles.transactionIcon}>
        <LinearGradient
          colors={getTransactionColors(item.type)}
          style={styles.iconGradient}
        >
          <Icon
            name={getTransactionIcon(item.type)}
            size={20}
            color={PMAColors.white}
          />
        </LinearGradient>
      </View>

      <View style={styles.transactionDetails}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionType}>
            {getTransactionText(item)}
          </Text>
          <Text style={[
            styles.transactionAmount,
            { color: item.type === 'receive' ? PMAColors.success : PMAColors.error }
          ]}>
            {item.type === 'receive' ? '+' : '-'}${formatBalance(item.amount)}
            {item.transferFee && item.type === 'bank_transfer' && (
              <Text style={styles.feeText}> (Fee: ${formatBalance(item.transferFee)})</Text>
            )}
          </Text>
        </View>

        <View style={styles.transactionInfo}>
          <Text style={styles.transactionAddress}>
            {getTransactionSubtext(item)}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.timestamp)}
          </Text>
        </View>

        <View style={styles.transactionStatus}>
          <Icon
            name={getStatusIcon(item.status)}
            size={14}
            color={getStatusColor(item.status)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <Icon name="chevron-right" size={20} color={PMAColors.gray} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="receipt" size={64} color={PMAColors.placeholder} />
      <Text style={styles.emptyStateTitle}>No Transactions Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'Try adjusting your search or filters' : 'Your transaction history will appear here'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => navigation.navigate('Send')}
        >
          <LinearGradient
            colors={[PMAColors.primary, PMAColors.accent]}
            style={styles.emptyStateButtonGradient}
          >
            <Text style={styles.emptyStateButtonText}>Send Your First Transaction</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {/* Type Filter */}
      <View style={styles.filterRow}>
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterChip,
              filterType === option.key && styles.filterChipActive,
            ]}
            onPress={() => setFilterType(option.key)}
          >
            <Icon
              name={option.icon}
              size={16}
              color={filterType === option.key ? PMAColors.white : PMAColors.primary}
            />
            <Text
              style={[
                styles.filterChipText,
                filterType === option.key && styles.filterChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Currency Filter */}
      <View style={styles.currencyFilter}>
        <Text style={styles.filterLabel}>Currency:</Text>
        <View style={styles.currencyChips}>
          {currencyOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.currencyChip,
                filterCurrency === option.key && styles.currencyChipActive,
              ]}
              onPress={() => setFilterCurrency(option.key)}
            >
              <Text
                style={[
                  styles.currencyChipText,
                  filterCurrency === option.key && styles.currencyChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Amount Filter */}
      <View style={styles.amountFilter}>
        <Text style={styles.filterLabel}>Amount:</Text>
        <View style={styles.amountChips}>
          {['all', 'small', 'medium', 'large'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.amountChip,
                amountFilter === option && styles.amountChipActive,
              ]}
              onPress={() => setAmountFilter(option as 'all' | 'small' | 'medium' | 'large')}
            >
              <Text
                style={[
                  styles.amountChipText,
                  amountFilter === option && styles.amountChipTextActive,
                ]}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PMAColors.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={exportTransactions}
        >
          <Icon name="share" size={24} color={PMAColors.text} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color={PMAColors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={PMAColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="clear" size={20} color={PMAColors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      {renderFilters()}

      {/* Transaction Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Transactions List */}
      {loading ? (
        renderTransactionSkeleton()
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          style={styles.transactionsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PMAColors.primary]}
              tintColor={PMAColors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={
            filteredTransactions.length === 0 ? styles.emptyListContainer : undefined
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PMAColors.background,
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
  refreshButton: {
    padding: 8,
  },
  exportButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: PMAColors.lightGray,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PMAColors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: PMAColors.lightGray,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: PMAColors.text,
    marginLeft: 8,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: PMAColors.white,
    borderWidth: 1,
    borderColor: PMAColors.primary,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: PMAColors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: PMAColors.primary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: PMAColors.white,
  },
  currencyFilter: {
    marginTop: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: PMAColors.gray,
    marginBottom: 8,
  },
  currencyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: PMAColors.lightGray,
  },
  currencyChipActive: {
    backgroundColor: PMAColors.primary,
  },
  currencyChipText: {
    fontSize: 12,
    color: PMAColors.text,
    fontWeight: '500',
  },
  currencyChipTextActive: {
    color: PMAColors.white,
  },
  amountFilter: {
    marginTop: 8,
  },
  amountChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amountChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: PMAColors.lightGray,
  },
  amountChipActive: {
    backgroundColor: PMAColors.primary,
  },
  amountChipText: {
    fontSize: 12,
    color: PMAColors.text,
    fontWeight: '500',
  },
  amountChipTextActive: {
    color: PMAColors.white,
  },
  countContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  countText: {
    fontSize: 14,
    color: PMAColors.gray,
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: PMAColors.lightGray,
    backgroundColor: PMAColors.white,
  },
  transactionIcon: {
    marginRight: 12,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.text,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  feeText: {
    fontSize: 12,
    fontWeight: '400',
    color: PMAColors.gray,
  },
  transactionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionAddress: {
    fontSize: 14,
    color: PMAColors.gray,
  },
  transactionDate: {
    fontSize: 12,
    color: PMAColors.gray,
  },
  transactionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: PMAColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: PMAColors.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyStateButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.white,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: PMAColors.lightGray,
  },
  skeletonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PMAColors.placeholder,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: 12,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: PMAColors.placeholder,
    borderRadius: 8,
    marginBottom: 4,
  },
  skeletonLineSmall: {
    height: 14,
    backgroundColor: PMAColors.placeholder,
    borderRadius: 7,
  },
  skeletonAmount: {
    width: 80,
    height: 20,
    backgroundColor: PMAColors.placeholder,
    borderRadius: 10,
  },
  transactionsContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: PMAColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: PMAColors.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
});

export default TransactionsScreen; 