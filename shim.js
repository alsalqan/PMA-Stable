// Import polyfills in the correct order for ethers v6 and modern React Native
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import { TextEncoder, TextDecoder } from 'text-encoding';

// Set up global Buffer with proper error handling
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// Set up global process with proper fallback
if (typeof global.process === 'undefined') {
  global.process = require('process');
}

// Set up global process.env if not defined
if (typeof global.process.env === 'undefined') {
  global.process.env = {};
}

// Enhanced crypto polyfill with better error handling for ethers v6
if (typeof global.crypto === 'undefined') {
  const { getRandomValues } = require('react-native-get-random-values');
  
  global.crypto = {
    getRandomValues: (arr) => {
      if (!arr || typeof arr.length !== 'number') {
        throw new Error('crypto.getRandomValues() requires an array-like object');
      }
      
      if (arr instanceof Uint8Array || arr instanceof Uint16Array || arr instanceof Uint32Array) {
        return getRandomValues(arr);
      }
      
      // Fallback for other typed arrays
      const uint8Array = new Uint8Array(arr.length);
      getRandomValues(uint8Array);
      for (let i = 0; i < arr.length; i++) {
        arr[i] = uint8Array[i];
      }
      return arr;
    },
    // Add support for subtle crypto operations
    subtle: {
      digest: async (algorithm, data) => {
        // Basic implementation - not cryptographically secure
        return new ArrayBuffer(32);
      }
    }
  };
}

// Set up TextEncoder/TextDecoder with proper error handling
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Set up global URL if not defined (required for ethers v6)
if (typeof global.URL === 'undefined') {
  global.URL = require('react-native-url-polyfill/auto');
}

// Set up global location if not defined
if (typeof global.location === 'undefined') {
  global.location = {
    protocol: 'https:',
    host: 'localhost',
    port: '443',
    hostname: 'localhost',
    hash: '',
    search: '',
    pathname: '/'
  };
}

// Modern web APIs that ethers v6 might use
if (typeof global.fetch === 'undefined') {
  global.fetch = require('react-native/Libraries/Network/fetch').fetch;
}

// Import ethers shims after setting up all necessary globals
// Note: ethers v6 may require fewer shims than v5
try {
  require('@ethersproject/shims');
} catch (error) {
  console.warn('Failed to load @ethersproject/shims:', error);
} 