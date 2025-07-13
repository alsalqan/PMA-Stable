import * as SecureStore from 'expo-secure-store';
import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import { Wallet, User } from '../types';

export class WalletService {
  
  static async generateWalletId(): Promise<string> {
    // Generate a unique wallet ID based on current timestamp and random values
    const timestamp = Date.now();
    const randomValue = Math.random().toString(36).substring(2, 15);
    return `PMA_${timestamp}_${randomValue}`;
  }

  static async validateMnemonic(mnemonic: string): Promise<boolean> {
    try {
      return bip39.validateMnemonic(mnemonic);
    } catch (error) {
      return false;
    }
  }

  static async getWalletFromMnemonic(mnemonic: string): Promise<ethers.Wallet> {
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }
    
    return ethers.Wallet.fromMnemonic(mnemonic);
  }

  static async securelyStoreWallet(wallet: Wallet): Promise<void> {
    try {
      await SecureStore.setItemAsync('pma_wallet', JSON.stringify(wallet));
      if (wallet.mnemonic) {
        await SecureStore.setItemAsync('pma_mnemonic', wallet.mnemonic);
      }
      if (wallet.privateKey) {
        await SecureStore.setItemAsync('pma_private_key', wallet.privateKey);
      }
    } catch (error) {
      console.error('Error storing wallet securely:', error);
      throw error;
    }
  }

  static async getStoredWallet(): Promise<Wallet | null> {
    try {
      const walletData = await SecureStore.getItemAsync('pma_wallet');
      if (walletData) {
        return JSON.parse(walletData);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving stored wallet:', error);
      return null;
    }
  }

  static async getStoredMnemonic(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('pma_mnemonic');
    } catch (error) {
      console.error('Error retrieving stored mnemonic:', error);
      return null;
    }
  }

  static async clearWalletData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('pma_wallet');
      await SecureStore.deleteItemAsync('pma_mnemonic');
      await SecureStore.deleteItemAsync('pma_private_key');
    } catch (error) {
      console.error('Error clearing wallet data:', error);
    }
  }

  static formatAddress(address: string): string {
    if (!address) return '';
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  static formatBalance(balance: number, decimals: number = 4): string {
    return balance.toFixed(decimals);
  }

  static formatTransactionAmount(amount: number, currency: string): string {
    return `${this.formatBalance(amount)} ${currency}`;
  }

  static isValidAddress(address: string): boolean {
    try {
      return ethers.utils.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  static generateQRCodeData(address: string, amount?: number, currency?: string): string {
    let qrData = `ethereum:${address}`;
    
    if (amount && currency) {
      qrData += `?amount=${amount}&currency=${currency}`;
    }
    
    return qrData;
  }

  static parseQRCodeData(qrData: string): {
    address: string;
    amount?: number;
    currency?: string;
  } | null {
    try {
      // Handle ethereum: scheme
      if (qrData.startsWith('ethereum:')) {
        const [addressPart, paramsPart] = qrData.substring(9).split('?');
        const result: any = { address: addressPart };
        
        if (paramsPart) {
          const params = new URLSearchParams(paramsPart);
          if (params.has('amount')) {
            result.amount = parseFloat(params.get('amount') || '0');
          }
          if (params.has('currency')) {
            result.currency = params.get('currency');
          }
        }
        
        return result;
      }
      
      // Handle plain address
      if (this.isValidAddress(qrData)) {
        return { address: qrData };
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing QR code data:', error);
      return null;
    }
  }

  static async backupWallet(wallet: Wallet): Promise<string> {
    // Generate a backup string that includes essential wallet information
    const backupData = {
      address: wallet.address,
      mnemonic: wallet.mnemonic,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    
    return JSON.stringify(backupData);
  }

  static async restoreWalletFromBackup(backupString: string): Promise<Wallet | null> {
    try {
      const backupData = JSON.parse(backupString);
      
      if (!backupData.mnemonic || !backupData.address) {
        throw new Error('Invalid backup data');
      }
      
      // Validate mnemonic
      if (!this.validateMnemonic(backupData.mnemonic)) {
        throw new Error('Invalid mnemonic in backup');
      }
      
      // Recreate wallet from mnemonic
      const ethWallet = ethers.Wallet.fromMnemonic(backupData.mnemonic);
      
      // Verify address matches
      if (ethWallet.address !== backupData.address) {
        throw new Error('Address mismatch in backup');
      }
      
      const restoredWallet: Wallet = {
        address: ethWallet.address,
        balance: {
          USDT: 0,
          USDC: 0,
          AECoin: 0,
        },
        transactions: [],
        mnemonic: backupData.mnemonic,
        privateKey: ethWallet.privateKey,
      };
      
      return restoredWallet;
    } catch (error) {
      console.error('Error restoring wallet from backup:', error);
      return null;
    }
  }

  static async linkWalletToUser(wallet: Wallet, user: User): Promise<User> {
    // Link wallet address to user profile
    const updatedUser: User = {
      ...user,
      walletAddress: wallet.address,
      updatedAt: new Date().toISOString(),
    };
    
    return updatedUser;
  }

  static generateWalletName(address: string): string {
    return `PMA Wallet (${this.formatAddress(address)})`;
  }

  static async calculateTransactionFee(
    amount: number,
    currency: 'USDT' | 'USDC' | 'AECoin'
  ): Promise<number> {
    // This is a simplified fee calculation
    // In production, you would calculate based on current gas prices
    const baseFee = 0.001; // Base fee in ETH
    const currencyMultiplier = currency === 'AECoin' ? 0.5 : 1;
    
    return baseFee * currencyMultiplier;
  }
} 