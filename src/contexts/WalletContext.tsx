import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as bip39 from 'bip39';
import * as SecureStore from 'expo-secure-store';
import { Wallet, Transaction, WalletContextType } from '../types';
import { BlockchainService } from '../services/BlockchainService';
import { WalletService } from '../services/WalletService';

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isWalletCreated, setIsWalletCreated] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if wallet already exists on app start
    checkExistingWallet();
  }, []);

  const checkExistingWallet = useCallback(async () => {
    try {
      const existingWallet = await WalletService.getStoredWallet();
      if (existingWallet) {
        setWallet(existingWallet);
        setIsWalletCreated(true);
        
        // Load transactions with error handling
        try {
          await loadTransactions(existingWallet.address);
        } catch (error) {
          console.warn('Failed to load transactions on startup:', error);
        }
      }
    } catch (error) {
      console.error('Error checking existing wallet:', error);
    }
  }, []);

  const createWallet = useCallback(async (mnemonic?: string): Promise<Wallet> => {
    try {
      setIsLoading(true);
      
      // Generate or use provided mnemonic
      const walletMnemonic = mnemonic || bip39.generateMnemonic();
      
      // Validate mnemonic
      if (!await WalletService.validateMnemonic(walletMnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }
      
      // Create wallet from mnemonic using ethers v6
      const ethWallet = await WalletService.getWalletFromMnemonic(walletMnemonic);
      
      const newWallet: Wallet = {
        address: ethWallet.address,
        balance: {
          USDT: 0,
          USDC: 0,
          AECoin: 100, // Mock balance for testing
        },
        transactions: [],
        mnemonic: walletMnemonic,
        privateKey: ethWallet.privateKey,
      };

      // Store wallet securely
      await WalletService.securelyStoreWallet(newWallet);
      
      setWallet(newWallet);
      setIsWalletCreated(true);
      
      // Initialize blockchain services with error handling
      try {
        await BlockchainService.initializeWallet(ethWallet);
      } catch (error) {
        console.warn('Failed to initialize blockchain service:', error);
        // Continue in offline mode
      }
      
      return newWallet;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importWallet = useCallback(async (mnemonic: string): Promise<Wallet> => {
    try {
      setIsLoading(true);
      
      // Validate mnemonic
      if (!await WalletService.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Create wallet from mnemonic using ethers v6
      const ethWallet = await WalletService.getWalletFromMnemonic(mnemonic);
      
      const importedWallet: Wallet = {
        address: ethWallet.address,
        balance: {
          USDT: 0,
          USDC: 0,
          AECoin: 100, // Mock balance for testing
        },
        transactions: [],
        mnemonic: mnemonic,
        privateKey: ethWallet.privateKey,
      };

      // Store wallet securely
      await WalletService.securelyStoreWallet(importedWallet);
      
      setWallet(importedWallet);
      setIsWalletCreated(true);
      
      // Initialize blockchain services with error handling
      try {
        await BlockchainService.initializeWallet(ethWallet);
      } catch (error) {
        console.warn('Failed to initialize blockchain service:', error);
        // Continue in offline mode
      }
      
      // Load existing transactions with error handling
      try {
        await loadTransactions(importedWallet.address);
      } catch (error) {
        console.warn('Failed to load transactions:', error);
      }
      
      return importedWallet;
    } catch (error) {
      console.error('Error importing wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getBalance = useCallback(async (currency: 'USDT' | 'USDC' | 'AECoin'): Promise<number> => {
    if (!wallet) {
      throw new Error('No wallet available');
    }

    try {
      const balance = await BlockchainService.getBalance(wallet.address, currency);
      
      // Update wallet balance
      const updatedWallet = {
        ...wallet,
        balance: {
          ...wallet.balance,
          [currency]: balance,
        },
      };
      
      setWallet(updatedWallet);
      await WalletService.securelyStoreWallet(updatedWallet);
      
      return balance;
    } catch (error) {
      console.error(`Error getting ${currency} balance:`, error);
      // Return current balance from state as fallback
      return wallet.balance[currency] || 0;
    }
  }, [wallet]);

  const sendTransaction = useCallback(async (
    to: string,
    amount: number,
    currency: 'USDT' | 'USDC' | 'AECoin'
  ): Promise<string> => {
    if (!wallet) {
      throw new Error('No wallet available');
    }

    // Validate inputs
    if (!WalletService.isValidAddress(to)) {
      throw new Error('Invalid recipient address');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (amount > wallet.balance[currency]) {
      throw new Error('Insufficient balance');
    }

    try {
      setIsLoading(true);
      
      const txHash = await BlockchainService.sendTransaction(
        wallet.address,
        to,
        amount,
        currency
      );

      // Create transaction record
      const transaction: Transaction = {
        id: txHash,
        type: 'send',
        amount,
        currency,
        fromAddress: wallet.address,
        toAddress: to,
        timestamp: new Date().toISOString(),
        status: 'pending',
        txHash,
      };

      // Update transactions
      const updatedTransactions = [transaction, ...transactions];
      setTransactions(updatedTransactions);
      
      // Update wallet balance (optimistic update)
      const updatedWallet = {
        ...wallet,
        balance: {
          ...wallet.balance,
          [currency]: Math.max(0, wallet.balance[currency] - amount),
        },
        transactions: updatedTransactions,
      };
      
      setWallet(updatedWallet);
      await WalletService.securelyStoreWallet(updatedWallet);
      
      // Wait for transaction confirmation in the background
      BlockchainService.waitForTransaction(txHash, 60000).then((confirmed) => {
        if (confirmed) {
          setTransactions(prev => prev.map(tx => 
            tx.id === txHash ? { ...tx, status: 'confirmed' } : tx
          ));
        } else {
          setTransactions(prev => prev.map(tx => 
            tx.id === txHash ? { ...tx, status: 'failed' } : tx
          ));
        }
      }).catch(error => {
        console.error('Error waiting for transaction confirmation:', error);
      });
      
      return txHash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [wallet, transactions]);

  const refreshWallet = useCallback(async () => {
    if (!wallet) return;

    try {
      setIsLoading(true);
      
      // Refresh all balances with error handling
      const balancePromises = [
        getBalance('USDT').catch(() => wallet.balance.USDT),
        getBalance('USDC').catch(() => wallet.balance.USDC),
        getBalance('AECoin').catch(() => wallet.balance.AECoin),
      ];

      const balances = await Promise.all(balancePromises);

      // Update wallet with new balances
      const updatedWallet = {
        ...wallet,
        balance: {
          USDT: balances[0],
          USDC: balances[1],
          AECoin: balances[2],
        },
      };

      setWallet(updatedWallet);
      await WalletService.securelyStoreWallet(updatedWallet);
      
      // Refresh transactions with error handling
      try {
        await loadTransactions(wallet.address);
      } catch (error) {
        console.warn('Failed to refresh transactions:', error);
      }
    } catch (error) {
      console.error('Error refreshing wallet:', error);
    } finally {
      setIsLoading(false);
    }
  }, [wallet, getBalance]);

  const loadTransactions = useCallback(async (address: string) => {
    try {
      const txHistory = await BlockchainService.getTransactionHistory(address);
      setTransactions(txHistory);
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Keep existing transactions if loading fails
    }
  }, []);

  const clearWalletData = useCallback(async () => {
    try {
      await WalletService.clearWalletData();
      setWallet(null);
      setIsWalletCreated(false);
      setTransactions([]);
    } catch (error) {
      console.error('Error clearing wallet data:', error);
      throw error;
    }
  }, []);

  const value: WalletContextType = useMemo(() => ({
    wallet,
    isWalletCreated,
    isLoading,
    createWallet,
    importWallet,
    getBalance,
    sendTransaction,
    refreshWallet,
    transactions,
    clearWalletData,
  }), [
    wallet,
    isWalletCreated,
    isLoading,
    createWallet,
    importWallet,
    getBalance,
    sendTransaction,
    refreshWallet,
    transactions,
    clearWalletData,
  ]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 