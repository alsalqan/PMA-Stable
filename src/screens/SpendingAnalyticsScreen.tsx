import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PMAColors } from '../theme';
import { useWallet } from '../contexts/WalletContext';
import { Transaction } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface SpendingAnalyticsScreenProps {
  navigation: any;
}

interface SpendingData {
  totalSpent: number;
  thisMonth: number;
  lastMonth: number;
  monthlyChange: number;
  topCategory: string;
  topCurrency: string;
  transactionCount: number;
}

interface CategoryData {
  name: string;
  amount: number;
  count: number;
  color: string;
  population: number;
  legendFontColor: string;
  legendFontSize: number;
}

const SpendingAnalyticsScreen: React.FC<SpendingAnalyticsScreenProps> = ({ navigation }) => {
  const { transactions, refreshWallet } = useWallet();
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');
  const [refreshing, setRefreshing] = useState(false);

  // Filter spending transactions (exclude received)
  const spendingTransactions = useMemo(() => {
    return transactions.filter(tx => 
      (tx.type === 'send' || tx.type === 'bank_transfer') && 
      tx.status === 'confirmed'
    );
  }, [transactions]);

  // Calculate spending data
  const spendingData: SpendingData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const thisMonthTx = spendingTransactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });
    
    const lastMonthTx = spendingTransactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
    });

    const totalSpent = spendingTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const thisMonth = thisMonthTx.reduce((sum, tx) => sum + tx.amount, 0);
    const lastMonth = lastMonthTx.reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyChange = lastMonth === 0 ? 0 : ((thisMonth - lastMonth) / lastMonth) * 100;

    // Find top category and currency
    const categoryCount = spendingTransactions.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

    const currencyCount = spendingTransactions.reduce((acc, tx) => {
      acc[tx.currency] = (acc[tx.currency] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, 'send'
    );

    const topCurrency = Object.keys(currencyCount).reduce((a, b) => 
      currencyCount[a] > currencyCount[b] ? a : b, 'USDT'
    );

    return {
      totalSpent,
      thisMonth,
      lastMonth,
      monthlyChange,
      topCategory,
      topCurrency,
      transactionCount: spendingTransactions.length,
    };
  }, [spendingTransactions]);

  // Monthly spending data for line chart
  const monthlySpendingData = useMemo(() => {
    const months = [];
    const data = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      months.push(monthName);
      
      const monthSpending = spendingTransactions
        .filter(tx => {
          const txDate = new Date(tx.timestamp);
          return txDate.getMonth() === date.getMonth() && 
                 txDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      data.push(Math.round(monthSpending * 100) / 100);
    }
    
    return { labels: months, datasets: [{ data }] };
  }, [spendingTransactions]);

  // Category spending data for pie chart
  const categorySpendingData: CategoryData[] = useMemo(() => {
    const categories = spendingTransactions.reduce((acc, tx) => {
      const category = tx.type === 'bank_transfer' ? 'Bank Transfer' : 
                      tx.type === 'send' ? 'Digital Transfer' : tx.type;
      acc[category] = (acc[category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

    const colors = [PMAColors.primary, PMAColors.secondary, PMAColors.gold, '#E91E63', '#4ECDC4', '#FF9800', '#9C27B0'];
    const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(categories).map(([name, amount], index) => ({
      name,
      amount,
      count: spendingTransactions.filter(tx => 
        (tx.type === 'bank_transfer' && name === 'Bank Transfer') ||
        (tx.type === 'send' && name === 'Digital Transfer')
      ).length,
      color: colors[index % colors.length],
      population: total > 0 ? Math.round((amount / total) * 100) : 0,
      legendFontColor: '#4A4A4A',
      legendFontSize: 14,
    }));
  }, [spendingTransactions]);

  // Currency breakdown data for bar chart
  const currencyBreakdownData = useMemo(() => {
    const currencies = spendingTransactions.reduce((acc, tx) => {
      acc[tx.currency] = (acc[tx.currency] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(currencies);
    const data = Object.values(currencies).map(val => Math.round(val * 100) / 100);

    return { labels, datasets: [{ data }] };
  }, [spendingTransactions]);

  // Chart configuration
  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: PMAColors.primary,
    backgroundGradientTo: PMAColors.secondary,
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(74, 74, 74, ${opacity})`,
    style: {
      borderRadius: 20,
    },
    propsForDots: {
      r: '8',
      strokeWidth: '3',
      stroke: PMAColors.gold,
      fill: '#FFFFFF',
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // solid lines
      stroke: 'rgba(0, 0, 0, 0.1)',
      strokeWidth: 1,
    },
    fillShadowGradient: PMAColors.gold,
    fillShadowGradientOpacity: 0.3,
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshWallet();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatCategoryName = (type: string) => {
    switch (type) {
      case 'send': return 'Digital Transfer';
      case 'bank_transfer': return 'Bank Transfer';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const renderSummaryCard = () => (
    <View style={styles.summaryContainer}>
      {/* Period Selector */}
      <View style={styles.periodSelectorContainer}>
        {(['1M', '3M', '6M', '1Y'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive
            ]}>
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <LinearGradient
        colors={[PMAColors.primary, PMAColors.secondary]}
        style={styles.summaryCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Total Spending</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(spendingData.totalSpent)}</Text>
        </View>
        
        <View style={styles.summaryMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>This Month</Text>
            <Text style={styles.metricValue}>{formatCurrency(spendingData.thisMonth)}</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Change</Text>
            <View style={styles.changeContainer}>
              <Icon 
                name={spendingData.monthlyChange >= 0 ? 'trending-up' : 'trending-down'} 
                size={16} 
                color={spendingData.monthlyChange >= 0 ? '#FF6B6B' : '#4ECDC4'} 
              />
              <Text style={[
                styles.metricValue, 
                { color: spendingData.monthlyChange >= 0 ? '#FF6B6B' : '#4ECDC4' }
              ]}>
                {Math.abs(spendingData.monthlyChange).toFixed(1)}%
              </Text>
            </View>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Transactions</Text>
            <Text style={styles.metricValue}>{spendingData.transactionCount}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderInsightCard = (title: string, value: string, subtitle: string, icon: string) => (
    <View style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <Icon name={icon} size={20} color={PMAColors.primary} />
        <Text style={styles.insightTitle}>{title}</Text>
      </View>
      <Text style={styles.insightValue}>{value}</Text>
      <Text style={styles.insightSubtitle}>{subtitle}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spending Analytics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
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
                 {renderSummaryCard()}

        {/* Quick Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Insights</Text>
          <View style={styles.insightsGrid}>
            {renderInsightCard(
              'Top Category', 
              formatCategoryName(spendingData.topCategory),
              'Most spending activity',
              'category'
            )}
            {renderInsightCard(
              'Top Currency', 
              spendingData.topCurrency,
              'Primary spending currency',
              'attach-money'
            )}
          </View>
          <View style={styles.insightsGrid}>
            {renderInsightCard(
              'Average Transaction', 
              spendingData.totalSpent > 0 ? formatCurrency(spendingData.totalSpent / spendingData.transactionCount) : '$0.00',
              'Per transaction average',
              'trending-up'
            )}
            {renderInsightCard(
              'Daily Average', 
              formatCurrency(spendingData.thisMonth / new Date().getDate()),
              'This month daily spending',
              'calendar-today'
            )}
          </View>
        </View>

        {/* Monthly Spending Trend */}
        {monthlySpendingData.datasets[0].data.some(val => val > 0) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Spending Trend</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={monthlySpendingData}
                width={screenWidth - 80}
                height={240}
                chartConfig={chartConfig}
                style={styles.chart}
                fromZero={true}
                segments={5}
                bezier
                withHorizontalLabels={true}
                withVerticalLabels={true}
                withDots={true}
                withShadow={true}
                withScrollableDot={false}
              />
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Spending Trend</Text>
            <View style={styles.emptyStateContainer}>
              <Icon name="show-chart" size={48} color={PMAColors.gold} />
              <Text style={styles.emptyStateTitle}>No Spending Data</Text>
              <Text style={styles.emptyStateSubtitle}>Start making transactions to see your spending trends</Text>
            </View>
          </View>
        )}

        {/* Category Breakdown */}
        {categorySpendingData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={categorySpendingData}
                width={screenWidth - 80}
                height={240}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
                center={[10, 10]}
                absolute
                hasLegend={true}
              />
            </View>
            <View style={styles.categoryList}>
              {categorySpendingData.map((category, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryCount}>{category.count} transactions</Text>
                  </View>
                  <Text style={styles.categoryAmount}>{formatCurrency(category.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Currency Breakdown */}
        {currencyBreakdownData.labels.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending by Currency</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={currencyBreakdownData}
                width={screenWidth - 80}
                height={240}
                chartConfig={chartConfig}
                style={styles.chart}
                fromZero={true}
                segments={5}
                showBarTops={true}
                showValuesOnTopOfBars={true}
                withHorizontalLabels={true}
                withVerticalLabels={true}
              />
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: PMAColors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: PMAColors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  periodSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: PMAColors.gold,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  periodButtonActive: {
    backgroundColor: PMAColors.gold,
    borderWidth: 1,
    borderColor: PMAColors.gold,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PMAColors.textSecondary,
  },
  periodButtonTextActive: {
    color: PMAColors.primary,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: PMAColors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 4,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.primary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.textPrimary,
    marginBottom: 16,
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PMAColors.gold,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  insightTitle: {
    fontSize: 14,
    color: PMAColors.textSecondary,
    fontWeight: '500',
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.textPrimary,
    marginBottom: 4,
  },
  insightSubtitle: {
    fontSize: 12,
    color: PMAColors.textSecondary,
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PMAColors.gold,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  chart: {
    borderRadius: 8,
  },
  categoryList: {
    marginTop: 16,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PMAColors.gold,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: PMAColors.textPrimary,
  },
  categoryCount: {
    fontSize: 12,
    color: PMAColors.textSecondary,
    marginTop: 2,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.primary,
  },
  bottomPadding: {
    height: 40,
  },
  emptyStateContainer: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PMAColors.gold,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: PMAColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SpendingAnalyticsScreen; 