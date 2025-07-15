import { Transaction } from '../types';

export interface SpendingInsight {
  id: string;
  type: 'warning' | 'info' | 'success' | 'tip';
  title: string;
  message: string;
  icon: string;
  actionable?: boolean;
  action?: () => void;
}

export class AnalyticsService {
  static generateInsights(transactions: Transaction[]): SpendingInsight[] {
    const insights: SpendingInsight[] = [];
    const spendingTx = transactions.filter(tx => 
      (tx.type === 'send' || tx.type === 'bank_transfer') && tx.status === 'confirmed'
    );

    if (spendingTx.length === 0) {
      return [{
        id: 'no-data',
        type: 'info',
        title: 'Start Tracking',
        message: 'Make some transactions to see personalized insights',
        icon: 'lightbulb-outline'
      }];
    }

    // High spending alert
    const thisMonth = this.getCurrentMonthSpending(spendingTx);
    const lastMonth = this.getLastMonthSpending(spendingTx);
    
    if (thisMonth > lastMonth * 1.5 && lastMonth > 0) {
      insights.push({
        id: 'high-spending',
        type: 'warning',
        title: 'High Spending Alert',
        message: `You've spent ${Math.round((thisMonth/lastMonth-1)*100)}% more than last month`,
        icon: 'trending-up',
        actionable: true
      });
    }

    // Spending pattern insight
    const avgTransaction = spendingTx.reduce((sum, tx) => sum + tx.amount, 0) / spendingTx.length;
    if (avgTransaction > 500) {
      insights.push({
        id: 'large-transactions',
        type: 'info',
        title: 'Large Transactions',
        message: `Your average transaction is $${avgTransaction.toFixed(0)}. Consider smaller, frequent payments.`,
        icon: 'account-balance-wallet'
      });
    }

    // Currency diversification
    const currencies = new Set(spendingTx.map(tx => tx.currency));
    if (currencies.size === 1) {
      insights.push({
        id: 'currency-tip',
        type: 'tip',
        title: 'Currency Tip',
        message: 'Consider diversifying your spending across different currencies',
        icon: 'currency-exchange'
      });
    }

    // Positive reinforcement
    if (thisMonth < lastMonth && lastMonth > 0) {
      insights.push({
        id: 'good-control',
        type: 'success',
        title: 'Great Control!',
        message: `You've reduced spending by ${Math.round((1-thisMonth/lastMonth)*100)}% this month`,
        icon: 'thumb-up'
      });
    }

    return insights;
  }

  static predictMonthlySpending(transactions: Transaction[]): number {
    const spendingTx = transactions.filter(tx => 
      (tx.type === 'send' || tx.type === 'bank_transfer') && tx.status === 'confirmed'
    );

    const currentMonth = new Date().getMonth();
    const currentDay = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), currentMonth + 1, 0).getDate();

    const thisMonthSpending = this.getCurrentMonthSpending(spendingTx);
    const dailyAverage = thisMonthSpending / currentDay;
    
    return dailyAverage * daysInMonth;
  }

  static getSpendingTrend(transactions: Transaction[], days: number = 7): 'up' | 'down' | 'stable' {
    const spendingTx = transactions.filter(tx => 
      (tx.type === 'send' || tx.type === 'bank_transfer') && tx.status === 'confirmed'
    );

    const now = new Date();
    const weekAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);

    const lastWeek = spendingTx.filter(tx => {
      const txDate = new Date(tx.timestamp);
      return txDate >= weekAgo && txDate <= now;
    }).reduce((sum, tx) => sum + tx.amount, 0);

    const previousWeek = spendingTx.filter(tx => {
      const txDate = new Date(tx.timestamp);
      return txDate >= twoWeeksAgo && txDate < weekAgo;
    }).reduce((sum, tx) => sum + tx.amount, 0);

    if (lastWeek > previousWeek * 1.1) return 'up';
    if (lastWeek < previousWeek * 0.9) return 'down';
    return 'stable';
  }

  private static getCurrentMonthSpending(transactions: Transaction[]): number {
    const now = new Date();
    return transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }).reduce((sum, tx) => sum + tx.amount, 0);
  }

  private static getLastMonthSpending(transactions: Transaction[]): number {
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    return transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
    }).reduce((sum, tx) => sum + tx.amount, 0);
  }
} 