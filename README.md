# PMA Wallet - Palestine Monetary Authority Mobile Wallet

A React Native mobile wallet application for the Palestine Monetary Authority (PMA) that provides secure, non-custodial cryptocurrency transactions.

## Features

### Core Features
- **Non-custodial wallet**: Your private keys remain secure on your device
- **Multi-currency support**: USDT, USDC, and AE Coin
- **QR code payments**: Send and receive payments by scanning QR codes
- **Blockchain integration**: Secure transactions on Ethereum network
- **Bank transfer top-up**: Support for stablecoin deposits

### User Management
- Comprehensive signup process with required fields:
  - Name (First, Middle, Last)
  - Date of Birth
  - Address (Street, City, State: West Bank/Gaza)
  - Mobile Number
  - Email Address
- Wallet ID assignment on blockchain
- Secure user authentication

### Wallet Features
- Real-time balance display
- Transaction history
- Send/receive functionality
- QR code scanning for payments
- Secure private key storage

## Technical Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **Blockchain**: Ethereum with ethers.js
- **Storage**: Expo SecureStore for sensitive data
- **UI**: React Native Paper with custom PMA theme
- **State Management**: React Context API
- **Authentication**: Local secure storage

## Project Structure

```
PMA-Wallet/
├── App.tsx                     # Main application entry point
├── package.json               # Dependencies and scripts
├── src/
│   ├── components/           # Reusable UI components
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx  # User authentication state
│   │   └── WalletContext.tsx # Wallet state management
│   ├── navigation/          # Navigation configuration
│   │   └── MainNavigator.tsx # Bottom tab navigation
│   ├── screens/             # Application screens
│   │   ├── SplashScreen.tsx # Loading screen
│   │   ├── OnboardingScreen.tsx # Feature introduction
│   │   ├── SignupScreen.tsx  # User registration
│   │   ├── HomeScreen.tsx    # Main wallet dashboard
│   │   ├── SendScreen.tsx    # Send funds
│   │   ├── ReceiveScreen.tsx # Receive funds
│   │   ├── ScanScreen.tsx    # QR code scanner
│   │   ├── TransactionsScreen.tsx # Transaction history
│   │   └── SettingsScreen.tsx # App settings
│   ├── services/            # Business logic services
│   │   ├── WalletService.ts  # Wallet utilities
│   │   └── BlockchainService.ts # Blockchain operations
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # Common types
│   └── theme.ts             # UI theme configuration
└── assets/                  # Static assets
```

## Installation

1. **Prerequisites**
   - Node.js (v16 or higher)
   - npm or yarn
   - Expo CLI
   - React Native development environment

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Update `ETHEREUM_RPC_URL` in `src/services/BlockchainService.ts`
   - Add your Infura project ID or other RPC provider
   - Configure stablecoin contract addresses

4. **Run the application**
   ```bash
   # Start Expo development server
   npm start

   # Run on Android
   npm run android

   # Run on iOS
   npm run ios
   ```

## Configuration

### Blockchain Configuration
Update the contract addresses in `src/services/BlockchainService.ts`:
- USDT: Tether USD contract address
- USDC: USD Coin contract address
- AE Coin: AE Coin contract address (placeholder)

### Theme Customization
The app uses PMA's gold color scheme defined in `src/theme.ts`:
- Primary: #DAA520 (Gold)
- Accent: #B8860B (Dark Gold)
- Background: #FAFAFA (Light Gray)

## Security Features

- **Non-custodial**: Private keys never leave the device
- **Secure Storage**: Sensitive data encrypted with Expo SecureStore
- **Mnemonic Backup**: BIP39 mnemonic phrase generation
- **Address Validation**: Ethereum address validation
- **Transaction Signing**: Local transaction signing

## Usage

### Creating a Wallet
1. Launch the app
2. Complete the onboarding flow
3. Fill in the signup form with required information
4. Wallet is automatically created and blockchain ID assigned

### Sending Funds
1. Navigate to Send tab
2. Enter recipient address or scan QR code
3. Select currency (USDT/USDC/AE Coin)
4. Enter amount and confirm transaction

### Receiving Funds
1. Navigate to Receive tab
2. Share your wallet address or QR code
3. Monitor incoming transactions

### Top-up Wallet
1. Use supported bank transfer methods
2. Only stablecoins (USDT, USDC, AE Coin) are supported
3. Funds will reflect in wallet balance

## Development

### Adding New Features
1. Create new screens in `src/screens/`
2. Add navigation routes in `src/navigation/MainNavigator.tsx`
3. Update types in `src/types/index.ts`
4. Add services in `src/services/`

### Testing
- Test on both Android and iOS devices
- Verify blockchain integration on testnet first
- Test all user flows and edge cases

## Deployment

### Android
1. Build APK: `expo build:android`
2. Generate signed AAB for Play Store
3. Upload to Google Play Console

### iOS
1. Build IPA: `expo build:ios`
2. Upload to App Store Connect
3. Submit for review

## Support

For technical support or questions about the PMA Wallet:
- Email: support@pma.ps
- Phone: +970-2-240-6000
- Website: https://www.pma.ps

## License

Copyright © 2024 Palestine Monetary Authority. All rights reserved.

This software is proprietary and confidential to the Palestine Monetary Authority. 