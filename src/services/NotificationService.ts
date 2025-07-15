// import * as Notifications from 'expo-notifications';
// import { Platform } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Transaction } from '../types';

// // Configure notifications
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//   }),
// });

// export class NotificationService {
//   static async requestPermissions(): Promise<boolean> {
//     try {
//       const { status: existingStatus } = await Notifications.getPermissionsAsync();
//       let finalStatus = existingStatus;
      
//       if (existingStatus !== 'granted') {
//         const { status } = await Notifications.requestPermissionsAsync();
//         finalStatus = status;
//       }
      
//       if (finalStatus !== 'granted') {
//         console.log('Failed to get push token for push notification!');
//         return false;
//       }
      
//       // For Android, set up notification channel
//       if (Platform.OS === 'android') {
//         await Notifications.setNotificationChannelAsync('default', {
//           name: 'PMA Bank Notifications',
//           importance: Notifications.AndroidImportance.MAX,
//           vibrationPattern: [0, 250, 250, 250],
//           lightColor: '#DAA520',
//         });
//       }
      
//       return true;
//     } catch (error) {
//       console.error('Error requesting notification permissions:', error);
//       return false;
//     }
//   }

//   static async sendTransactionNotification(transaction: Transaction) {
//     try {
//       const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
//       if (notificationsEnabled === 'false') return;

//       const isReceived = transaction.type === 'receive';
//       const title = isReceived ? '💰 Money Received!' : '📤 Transaction Sent';
//       const body = isReceived 
//         ? `You received ${transaction.amount} ${transaction.currency}`
//         : `You sent ${transaction.amount} ${transaction.currency}`;

//       await Notifications.scheduleNotificationAsync({
//         content: {
//           title,
//           body,
//           sound: 'default',
//           data: {
//             transactionId: transaction.id,
//             type: 'transaction',
//           },
//         },
//         trigger: null, // Show immediately
//       });
//     } catch (error) {
//       console.error('Error sending transaction notification:', error);
//     }
//   }

//   static async sendSpendingAlert(amount: number, limit: number, category: string) {
//     try {
//       const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
//       if (notificationsEnabled === 'false') return;

//       const percentage = Math.round((amount / limit) * 100);
      
//       let title = '💳 Spending Alert';
//       let body = '';
      
//       if (percentage >= 100) {
//         title = '🚨 Budget Exceeded!';
//         body = `You've exceeded your ${category} budget by ${percentage - 100}%`;
//       } else if (percentage >= 90) {
//         title = '⚠️ Budget Almost Reached';
//         body = `You've used ${percentage}% of your ${category} budget`;
//       } else if (percentage >= 75) {
//         title = '📊 Spending Update';
//         body = `You've used ${percentage}% of your ${category} budget`;
//       }

//       if (body) {
//         await Notifications.scheduleNotificationAsync({
//           content: {
//             title,
//             body,
//             sound: 'default',
//             data: {
//               category,
//               type: 'spending_alert',
//             },
//           },
//           trigger: null,
//         });
//       }
//     } catch (error) {
//       console.error('Error sending spending alert:', error);
//     }
//   }

//   static async sendSecurityAlert(message: string) {
//     try {
//       await Notifications.scheduleNotificationAsync({
//         content: {
//           title: '🔒 Security Alert',
//           body: message,
//           sound: 'default',
//           priority: Notifications.AndroidImportance.HIGH,
//           data: {
//             type: 'security',
//           },
//         },
//         trigger: null,
//       });
//     } catch (error) {
//       console.error('Error sending security alert:', error);
//     }
//   }

//   static async sendBalanceUpdate(balance: number, currency: string) {
//     try {
//       const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
//       if (notificationsEnabled === 'false') return;

//       await Notifications.scheduleNotificationAsync({
//         content: {
//           title: '💰 Balance Updated',
//           body: `Your current balance: ${balance} ${currency}`,
//           sound: 'default',
//           data: {
//             balance,
//             currency,
//             type: 'balance_update',
//           },
//         },
//         trigger: null,
//       });
//     } catch (error) {
//       console.error('Error sending balance update:', error);
//     }
//   }

//   static async scheduleMonthlyBudgetReminder() {
//     try {
//       const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
//       if (notificationsEnabled === 'false') return;

//       // Schedule for the first day of next month
//       const now = new Date();
//       const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
//       await Notifications.scheduleNotificationAsync({
//         content: {
//           title: '📅 Monthly Budget Reminder',
//           body: 'Time to review and set your spending goals for this month!',
//           sound: 'default',
//           data: {
//             type: 'monthly_reminder',
//           },
//         },
//         trigger: {
//           date: nextMonth,
//           repeats: true,
//         },
//       });
//     } catch (error) {
//       console.error('Error scheduling monthly reminder:', error);
//     }
//   }

//   static async cancelAllNotifications() {
//     try {
//       await Notifications.cancelAllScheduledNotificationsAsync();
//     } catch (error) {
//       console.error('Error canceling notifications:', error);
//     }
//   }

//   static async setBadgeCount(count: number) {
//     try {
//       await Notifications.setBadgeCountAsync(count);
//     } catch (error) {
//       console.error('Error setting badge count:', error);
//     }
//   }

//   // Weekly spending summary notification
//   static async scheduleWeeklySummary() {
//     try {
//       const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
//       if (notificationsEnabled === 'false') return;

//       // Schedule for every Sunday at 6 PM
//       await Notifications.scheduleNotificationAsync({
//         content: {
//           title: '📊 Weekly Spending Summary',
//           body: 'Check out your weekly spending insights and trends',
//           sound: 'default',
//           data: {
//             type: 'weekly_summary',
//           },
//         },
//         trigger: {
//           weekday: 1, // Sunday
//           hour: 18,
//           minute: 0,
//           repeats: true,
//         },
//       });
//     } catch (error) {
//       console.error('Error scheduling weekly summary:', error);
//     }
//   }
// } 