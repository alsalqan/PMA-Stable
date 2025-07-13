const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add Buffer polyfill support
config.resolver.alias = {
  ...config.resolver.alias,
  buffer: require.resolve('buffer'),
};

config.resolver.fallback = {
  ...config.resolver.fallback,
  buffer: require.resolve('buffer'),
};

module.exports = config; 