const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enhanced polyfill support for crypto operations with ethers v6
config.resolver.alias = {
  ...config.resolver.alias,
  'buffer': require.resolve('buffer'),
  'crypto': require.resolve('react-native-crypto'),
  'stream': require.resolve('readable-stream'),
  'vm': require.resolve('vm-browserify'),
};

// Support for new architecture and modern React Native features
config.resolver.fallback = {
  ...config.resolver.fallback,
  'buffer': require.resolve('buffer'),
  'crypto': require.resolve('react-native-crypto'),
  'stream': require.resolve('readable-stream'),
  'vm': require.resolve('vm-browserify'),
  'events': false,
  'fs': false,
  'net': false,
  'tls': false,
  'child_process': false,
  'path': false,
  'os': false,
  'util': false,
};

// Add support for more file extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs',
  'mjs',
];

// Enable fast refresh and performance optimizations
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure transformer for better performance
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer.minifierConfig,
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Enable experimental features for better performance
config.resolver.unstable_enablePackageExports = true;

module.exports = config; 