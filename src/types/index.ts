export interface User {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: 'West Bank' | 'Gaza';
  };
  mobile: string;
  email: string;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  address: string;
  balance: {
    USDT: number;
    USDC: number;
    AECoin: number;
  };
  transactions: Transaction[];
  mnemonic?: string; // Only stored locally for non-custodial wallet
  privateKey?: string; // Only stored locally for non-custodial wallet
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'topup' | 'bank_transfer';
  amount: number;
  currency: 'USDT' | 'USDC' | 'AECoin';
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  blockNumber?: number;
  gasUsed?: number;
  gasPrice?: number;
  transferFee?: number;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    iban: string;
  };
}

export interface QRCodeData {
  address: string;
  amount?: number;
  currency?: 'USDT' | 'USDC' | 'AECoin';
  memo?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

export interface WalletContextType {
  wallet: Wallet | null;
  isWalletCreated: boolean;
  isLoading: boolean;
  createWallet: (mnemonic?: string) => Promise<Wallet>;
  importWallet: (mnemonic: string) => Promise<Wallet>;
  getBalance: (currency: 'USDT' | 'USDC' | 'AECoin') => Promise<number>;
  sendTransaction: (to: string, amount: number, currency: 'USDT' | 'USDC' | 'AECoin') => Promise<string>;
  refreshWallet: () => Promise<void>;
  transactions: Transaction[];
  clearWalletData: () => Promise<void>;
}

export interface NavigationParamList {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Home: undefined;
  Send: undefined;
  Receive: undefined;
  Scan: undefined;
  Transactions: undefined;
  Settings: undefined;
  Profile: undefined;
  Security: undefined;
  TopUp: undefined;
  SpendingAnalytics: undefined;
  BankTransfer: {
    bankAccount?: {
      bankName: string;
      accountNumber: string;
      accountHolderName: string;
      iban: string;
      branchName?: string;
    };
  } | undefined;
  SendConfirm: {
    toAddress: string;
    amount: number;
    currency: 'USDT' | 'USDC' | 'AECoin';
  };
}

export interface SignupFormData {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: 'West Bank' | 'Gaza';
  };
  mobile: string;
  email: string;
} 