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
      console.error('Error validating mnemonic:', error);
      return false;
    }
  }

  static async getWalletFromMnemonic(mnemonic: string): Promise<ethers.HDNodeWallet> {
    if (!await this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }
    
    try {
      // Using ethers v6 proper method to create wallet from mnemonic
      const mnemonicObject = ethers.Mnemonic.fromPhrase(mnemonic);
      return ethers.HDNodeWallet.fromMnemonic(mnemonicObject);
    } catch (error) {
      console.error('Error creating wallet from mnemonic:', error);
      throw new Error('Failed to create wallet from mnemonic');
    }
  }

  static async securelyStoreWallet(wallet: Wallet): Promise<void> {
    try {
      const tasks = [
        SecureStore.setItemAsync('pma_wallet', JSON.stringify(wallet)),
      ];
      
      if (wallet.mnemonic) {
        tasks.push(SecureStore.setItemAsync('pma_mnemonic', wallet.mnemonic));
      }
      
      if (wallet.privateKey) {
        tasks.push(SecureStore.setItemAsync('pma_private_key', wallet.privateKey));
      }
      
      await Promise.all(tasks);
    } catch (error) {
      console.error('Error storing wallet securely:', error);
      throw new Error('Failed to store wallet securely');
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
      const keys = ['pma_wallet', 'pma_mnemonic', 'pma_private_key'];
      const tasks = keys.map(key => 
        SecureStore.deleteItemAsync(key).catch(err => 
          console.warn(`Failed to delete ${key}:`, err)
        )
      );
      await Promise.all(tasks);
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
    if (isNaN(balance)) return '0.0000';
    return balance.toFixed(decimals);
  }

  static formatTransactionAmount(amount: number, currency: string): string {
    return `${this.formatBalance(amount)} ${currency}`;
  }

  static isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      console.error('Error validating address:', error);
      return false;
    }
  }

  static generateQRCodeData(address: string, amount?: number, currency?: string): string {
    if (!this.isValidAddress(address)) {
      throw new Error('Invalid address for QR code generation');
    }
    
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
            const amount = parseFloat(params.get('amount') || '0');
            if (!isNaN(amount)) result.amount = amount;
          }
          if (params.has('currency')) {
            result.currency = params.get('currency');
          }
        }
        
        return this.isValidAddress(result.address) ? result : null;
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
    try {
      // Generate a backup string that includes essential wallet information
      const backupData = {
        address: wallet.address,
        mnemonic: wallet.mnemonic,
        timestamp: new Date().toISOString(),
        version: '2.0', // Updated version for ethers v6
      };
      
      return JSON.stringify(backupData);
    } catch (error) {
      console.error('Error creating wallet backup:', error);
      throw new Error('Failed to create wallet backup');
    }
  }

  static async restoreWalletFromBackup(backupString: string): Promise<Wallet | null> {
    try {
      const backupData = JSON.parse(backupString);
      
      if (!backupData.mnemonic || !backupData.address) {
        throw new Error('Invalid backup data: missing mnemonic or address');
      }
      
      // Validate mnemonic
      if (!await this.validateMnemonic(backupData.mnemonic)) {
        throw new Error('Invalid mnemonic in backup');
      }
      
      // Recreate wallet from mnemonic using ethers v6
      const ethWallet = await this.getWalletFromMnemonic(backupData.mnemonic);
      
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
      throw new Error('Failed to restore wallet from backup');
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
    try {
      // Enhanced fee calculation for ethers v6
      const baseFee = 0.001; // Base fee in ETH
      const currencyMultiplier = currency === 'AECoin' ? 0.5 : 1;
      
      // Add amount-based fee scaling
      const amountMultiplier = amount > 1000 ? 1.2 : 1.0;
      
      return baseFee * currencyMultiplier * amountMultiplier;
    } catch (error) {
      console.error('Error calculating transaction fee:', error);
      return 0.001; // Default fee
    }
  }

  static async estimateGasPrice(): Promise<string> {
    try {
      // Mock gas price estimation - in production, you'd call a real provider
      const gasPrice = Math.floor(Math.random() * 50) + 10; // 10-60 gwei
      return `${gasPrice} gwei`;
    } catch (error) {
      console.error('Error estimating gas price:', error);
      return '20 gwei'; // Default gas price
    }
  }
} 