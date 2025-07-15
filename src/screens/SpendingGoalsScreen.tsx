import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PMAColors } from '../theme';
import { useWallet } from '../contexts/WalletContext';

const { width: screenWidth } = Dimensions.get('window');

interface SpendingGoalsScreenProps {
  navigation: any;
}

interface Goal {
  id: string;
  category: string;
  budget: number;
  spent: number;
  icon: string;
  color: string;
}

const SpendingGoalsScreen: React.FC<SpendingGoalsScreenProps> = ({ navigation }) => {
  const { transactions } = useWallet();
  const [modalVisible, setModalVisible] = useState(false);
  const [newGoalCategory, setNewGoalCategory] = useState('');
  const [newGoalBudget, setNewGoalBudget] = useState('');

  // Sample goals data - in real app, this would come from AsyncStorage/API
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      category: 'Digital Transfer',
      budget: 1000,
      spent: 750,
      icon: 'send',
      color: PMAColors.primary,
    },
    {
      id: '2',
      category: 'Bank Transfer',
      budget: 500,
      spent: 200,
      icon: 'account-balance',
      color: '#E91E63',
    },
    {
      id: '3',
      category: 'Shopping',
      budget: 300,
      spent: 420,
      icon: 'shopping-cart',
      color: '#FF9800',
    },
  ]);

  // Calculate current month spending by category
  const currentMonthSpending = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions
      .filter(tx => {
        const txDate = new Date(tx.timestamp);
        return (
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear &&
          (tx.type === 'send' || tx.type === 'bank_transfer') &&
          tx.status === 'confirmed'
        );
      })
      .reduce((acc, tx) => {
        const category = tx.type === 'bank_transfer' ? 'Bank Transfer' : 'Digital Transfer';
        acc[category] = (acc[category] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [transactions]);

  const addNewGoal = () => {
    if (!newGoalCategory.trim() || !newGoalBudget.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const budget = parseFloat(newGoalBudget);
    if (isNaN(budget) || budget <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    const newGoal: Goal = {
      id: Date.now().toString(),
      category: newGoalCategory,
      budget,
      spent: currentMonthSpending[newGoalCategory] || 0,
      icon: 'track-changes',
      color: '#9C27B0',
    };

    setGoals([...goals, newGoal]);
    setNewGoalCategory('');
    setNewGoalBudget('');
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteGoal = (goalId: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this spending goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setGoals(goals.filter(goal => goal.id !== goalId));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return '#FF6B6B';
    if (percentage >= 80) return '#FF9800';
    return '#4ECDC4';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderGoalCard = (goal: Goal) => {
    const actualSpent = currentMonthSpending[goal.category] || 0;
    const progress = Math.min((actualSpent / goal.budget) * 100, 100);
    const remaining = Math.max(goal.budget - actualSpent, 0);
    const isOverBudget = actualSpent > goal.budget;

    return (
      <View key={goal.id} style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalInfo}>
            <View style={[styles.goalIcon, { backgroundColor: goal.color }]}>
              <Icon name={goal.icon} size={24} color="white" />
            </View>
            <View style={styles.goalDetails}>
              <Text style={styles.goalCategory}>{goal.category}</Text>
              <Text style={styles.goalBudget}>Budget: {formatCurrency(goal.budget)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteGoal(goal.id)}
          >
            <Icon name="delete" size={20} color={PMAColors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: getProgressColor(actualSpent, goal.budget),
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.spentText}>
              Spent: {formatCurrency(actualSpent)}
            </Text>
            <Text style={[styles.remainingText, isOverBudget && { color: PMAColors.error }]}>
              {isOverBudget 
                ? `Over by ${formatCurrency(actualSpent - goal.budget)}`
                : `Remaining: ${formatCurrency(remaining)}`
              }
            </Text>
          </View>
        </View>

        <View style={styles.progressPercentage}>
          <Text style={[
            styles.percentageText,
            { color: getProgressColor(actualSpent, goal.budget) }
          ]}>
            {progress.toFixed(0)}% used
          </Text>
          {isOverBudget && (
            <View style={styles.warningBadge}>
              <Icon name="warning" size={16} color="white" />
              <Text style={styles.warningText}>Over Budget!</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderOverallSummary = () => {
    const totalBudget = goals.reduce((sum, goal) => sum + goal.budget, 0);
    const totalSpent = goals.reduce((sum, goal) => sum + (currentMonthSpending[goal.category] || 0), 0);
    const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return (
      <LinearGradient
        colors={[PMAColors.primary, PMAColors.secondary]}
        style={styles.summaryCard}
      >
        <View style={styles.summaryHeader}>
          <Icon name="account-balance-wallet" size={32} color="white" />
          <Text style={styles.summaryTitle}>Monthly Overview</Text>
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Budget</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalBudget)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalSpent)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={[
              styles.summaryValue,
              totalSpent > totalBudget && { color: '#FFB3BA' }
            ]}>
              {formatCurrency(Math.max(totalBudget - totalSpent, 0))}
            </Text>
          </View>
        </View>

        <View style={styles.overallProgress}>
          <Text style={styles.progressTitle}>Overall Progress</Text>
          <View style={styles.overallProgressBar}>
            <View
              style={[
                styles.overallProgressFill,
                { width: `${Math.min(overallProgress, 100)}%` }
              ]}
            />
          </View>
          <Text style={styles.overallPercentage}>{overallProgress.toFixed(0)}%</Text>
        </View>
      </LinearGradient>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spending Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderOverallSummary()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Goals</Text>
          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="track-changes" size={64} color={PMAColors.textSecondary} />
              <Text style={styles.emptyTitle}>No Goals Set</Text>
              <Text style={styles.emptySubtitle}>
                Start by setting your first spending goal
              </Text>
            </View>
          ) : (
            goals.map(renderGoalCard)
          )}
        </View>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Goal</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={PMAColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Shopping, Food, Entertainment"
                value={newGoalCategory}
                onChangeText={setNewGoalCategory}
                placeholderTextColor={PMAColors.placeholder}
              />

              <Text style={styles.inputLabel}>Monthly Budget</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                value={newGoalBudget}
                onChangeText={setNewGoalBudget}
                keyboardType="numeric"
                placeholderTextColor={PMAColors.placeholder}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.addGoalButton]}
                  onPress={addNewGoal}
                >
                  <Text style={styles.addButtonText}>Add Goal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: PMAColors.primary,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 24,
    marginVertical: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  overallProgress: {
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 14,
    color: 'white',
    marginBottom: 8,
  },
  overallProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 8,
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  overallPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.textPrimary,
    marginBottom: 16,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8F4FD',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalDetails: {
    flex: 1,
  },
  goalCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.textPrimary,
    marginBottom: 4,
  },
  goalBudget: {
    fontSize: 14,
    color: PMAColors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spentText: {
    fontSize: 12,
    color: PMAColors.textSecondary,
  },
  remainingText: {
    fontSize: 12,
    color: PMAColors.textSecondary,
  },
  progressPercentage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PMAColors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  warningText: {
    fontSize: 10,
    color: 'white',
    marginLeft: 4,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: PMAColors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: screenWidth - 40,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: PMAColors.textPrimary,
  },
  formContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: PMAColors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: PMAColors.textPrimary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  addGoalButton: {
    backgroundColor: PMAColors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.textSecondary,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default SpendingGoalsScreen; 