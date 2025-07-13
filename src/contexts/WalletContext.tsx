import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import * as SecureStore from 'expo-secure-store';
import { Wallet, Transaction, WalletContextType } from '../types';
import { WalletService } from '../services/WalletService';
import { BlockchainService } from '../services/BlockchainService';

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

  const checkExistingWallet = async () => {
    try {
      const existingWallet = await SecureStore.getItemAsync('pma_wallet');
      if (existingWallet) {
        const walletData = JSON.parse(existingWallet);
        setWallet(walletData);
        setIsWalletCreated(true);
        // Load transactions
        await loadTransactions(walletData.address);
      }
    } catch (error) {
      console.error('Error checking existing wallet:', error);
    }
  };

  const createWallet = async (mnemonic?: string): Promise<Wallet> => {
    try {
      setIsLoading(true);
      
      // Generate or use provided mnemonic
      const walletMnemonic = mnemonic || bip39.generateMnemonic();
      
      // Create wallet from mnemonic
      const ethWallet = ethers.Wallet.fromMnemonic(walletMnemonic);
      
      const newWallet: Wallet = {
        address: ethWallet.address,
        balance: {
          USDT: 0,
          USDC: 0,
          AECoin: 0,
        },
        transactions: [],
        mnemonic: walletMnemonic,
        privateKey: ethWallet.privateKey,
      };

      // Store wallet securely
      await SecureStore.setItemAsync('pma_wallet', JSON.stringify(newWallet));
      await SecureStore.setItemAsync('pma_mnemonic', walletMnemonic);
      
      setWallet(newWallet);
      setIsWalletCreated(true);
      
      // Initialize blockchain services
      await BlockchainService.initializeWallet(ethWallet);
      
      return newWallet;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const importWallet = async (mnemonic: string): Promise<Wallet> => {
    try {
      setIsLoading(true);
      
      // Validate mnemonic
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Create wallet from mnemonic
      const ethWallet = ethers.Wallet.fromMnemonic(mnemonic);
      
      const importedWallet: Wallet = {
        address: ethWallet.address,
        balance: {
          USDT: 0,
          USDC: 0,
          AECoin: 0,
        },
        transactions: [],
        mnemonic: mnemonic,
        privateKey: ethWallet.privateKey,
      };

      // Store wallet securely
      await SecureStore.setItemAsync('pma_wallet', JSON.stringify(importedWallet));
      await SecureStore.setItemAsync('pma_mnemonic', mnemonic);
      
      setWallet(importedWallet);
      setIsWalletCreated(true);
      
      // Initialize blockchain services
      await BlockchainService.initializeWallet(ethWallet);
      
      // Load existing transactions
      await loadTransactions(importedWallet.address);
      
      return importedWallet;
    } catch (error) {
      console.error('Error importing wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getBalance = async (currency: 'USDT' | 'USDC' | 'AECoin'): Promise<number> => {
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
      await SecureStore.setItemAsync('pma_wallet', JSON.stringify(updatedWallet));
      
      return balance;
    } catch (error) {
      console.error(`Error getting ${currency} balance:`, error);
      throw error;
    }
  };

  const sendTransaction = async (
    to: string,
    amount: number,
    currency: 'USDT' | 'USDC' | 'AECoin'
  ): Promise<string> => {
    if (!wallet) {
      throw new Error('No wallet available');
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
          [currency]: wallet.balance[currency] - amount,
        },
        transactions: updatedTransactions,
      };
      
      setWallet(updatedWallet);
      await SecureStore.setItemAsync('pma_wallet', JSON.stringify(updatedWallet));
      
      return txHash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWallet = async () => {
    if (!wallet) return;

    try {
      // Refresh all balances
      const balances = await Promise.all([
        getBalance('USDT'),
        getBalance('USDC'),
        getBalance('AECoin'),
      ]);

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
      await SecureStore.setItemAsync('pma_wallet', JSON.stringify(updatedWallet));
      
      // Refresh transactions
      await loadTransactions(wallet.address);
    } catch (error) {
      console.error('Error refreshing wallet:', error);
    }
  };

  const loadTransactions = async (address: string) => {
    try {
      const txHistory = await BlockchainService.getTransactionHistory(address);
      setTransactions(txHistory);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const value: WalletContextType = {
    wallet,
    isWalletCreated,
    createWallet,
    importWallet,
    getBalance,
    sendTransaction,
    refreshWallet,
    transactions,
  };

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