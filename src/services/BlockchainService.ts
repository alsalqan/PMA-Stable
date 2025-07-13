import { ethers } from 'ethers';
import { Transaction } from '../types';

// Ethereum Mainnet provider (you can switch to other networks)
const ETHEREUM_RPC_URL = 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID';

// Stablecoin contract addresses on Ethereum mainnet
const STABLECOIN_CONTRACTS = {
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  USDC: '0xA0b86a33E6c0113b7c13c8B2f8B56D3e1Fc5E6e8',
  AECoin: '0x0000000000000000000000000000000000000000', // Placeholder - replace with actual AE Coin address
};

// ERC-20 ABI for stablecoin operations
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

export class BlockchainService {
  private static provider: ethers.providers.JsonRpcProvider;
  private static wallet: ethers.Wallet;

  static async initializeWallet(wallet: ethers.Wallet) {
    this.provider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC_URL);
    this.wallet = wallet.connect(this.provider);
  }

  static async getBalance(address: string, currency: 'USDT' | 'USDC' | 'AECoin'): Promise<number> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const contractAddress = STABLECOIN_CONTRACTS[currency];
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        // Return mock balance for AE Coin or if contract address is not set
        return 0;
      }

      const contract = new ethers.Contract(contractAddress, ERC20_ABI, this.provider);
      const balance = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      
      // Convert from wei to human readable format
      return parseFloat(ethers.utils.formatUnits(balance, decimals));
    } catch (error) {
      console.error(`Error getting ${currency} balance:`, error);
      return 0;
    }
  }

  static async sendTransaction(
    fromAddress: string,
    toAddress: string,
    amount: number,
    currency: 'USDT' | 'USDC' | 'AECoin'
  ): Promise<string> {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }

      const contractAddress = STABLECOIN_CONTRACTS[currency];
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        // Mock transaction for AE Coin
        return `0x${Math.random().toString(16).substr(2, 64)}`;
      }

      const contract = new ethers.Contract(contractAddress, ERC20_ABI, this.wallet);
      const decimals = await contract.decimals();
      
      // Convert amount to wei
      const amountWei = ethers.utils.parseUnits(amount.toString(), decimals);
      
      // Send transaction
      const tx = await contract.transfer(toAddress, amountWei);
      
      return tx.hash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  static async getTransactionHistory(address: string): Promise<Transaction[]> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const transactions: Transaction[] = [];
      
      // Get transactions for each stablecoin
      for (const [currency, contractAddress] of Object.entries(STABLECOIN_CONTRACTS)) {
        if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
          continue;
        }

        const contract = new ethers.Contract(contractAddress, ERC20_ABI, this.provider);
        
        // Get Transfer events
        const transferFilter = contract.filters.Transfer(null, address);
        const receivedEvents = await contract.queryFilter(transferFilter, -1000); // Last 1000 blocks
        
        const sentFilter = contract.filters.Transfer(address, null);
        const sentEvents = await contract.queryFilter(sentFilter, -1000);
        
        // Process received transactions
        for (const event of receivedEvents) {
          if (event.args) {
            const block = await this.provider.getBlock(event.blockNumber);
            const decimals = await contract.decimals();
            
            transactions.push({
              id: event.transactionHash,
              type: 'receive',
              amount: parseFloat(ethers.utils.formatUnits(event.args.value, decimals)),
              currency: currency as 'USDT' | 'USDC' | 'AECoin',
              fromAddress: event.args.from,
              toAddress: event.args.to,
              timestamp: new Date(block.timestamp * 1000).toISOString(),
              status: 'confirmed',
              txHash: event.transactionHash,
              blockNumber: event.blockNumber,
            });
          }
        }
        
        // Process sent transactions
        for (const event of sentEvents) {
          if (event.args) {
            const block = await this.provider.getBlock(event.blockNumber);
            const decimals = await contract.decimals();
            
            transactions.push({
              id: event.transactionHash,
              type: 'send',
              amount: parseFloat(ethers.utils.formatUnits(event.args.value, decimals)),
              currency: currency as 'USDT' | 'USDC' | 'AECoin',
              fromAddress: event.args.from,
              toAddress: event.args.to,
              timestamp: new Date(block.timestamp * 1000).toISOString(),
              status: 'confirmed',
              txHash: event.transactionHash,
              blockNumber: event.blockNumber,
            });
          }
        }
      }
      
      // Sort transactions by timestamp (newest first)
      return transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  static async getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return 'pending';
      }
      
      return receipt.status === 1 ? 'confirmed' : 'failed';
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return 'failed';
    }
  }

  static async estimateGas(
    toAddress: string,
    amount: number,
    currency: 'USDT' | 'USDC' | 'AECoin'
  ): Promise<ethers.BigNumber> {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }

      const contractAddress = STABLECOIN_CONTRACTS[currency];
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        return ethers.BigNumber.from('21000'); // Standard ETH transfer gas limit
      }

      const contract = new ethers.Contract(contractAddress, ERC20_ABI, this.wallet);
      const decimals = await contract.decimals();
      const amountWei = ethers.utils.parseUnits(amount.toString(), decimals);
      
      return await contract.estimateGas.transfer(toAddress, amountWei);
    } catch (error) {
      console.error('Error estimating gas:', error);
      return ethers.BigNumber.from('100000'); // Default gas limit
    }
  }

  static async getCurrentGasPrice(): Promise<ethers.BigNumber> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      return await this.provider.getGasPrice();
    } catch (error) {
      console.error('Error getting gas price:', error);
      return ethers.BigNumber.from('20000000000'); // 20 gwei default
    }
  }
} 