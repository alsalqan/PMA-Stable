import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Set up global Buffer
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// Set up global process
if (typeof global.process === 'undefined') {
  global.process = require('process');
}

// Set up crypto using react-native-get-random-values
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: (arr) => {
      if (arr instanceof Uint8Array) {
        return require('react-native-get-random-values').getRandomValues(arr);
      }
      throw new Error('crypto.getRandomValues() only supports Uint8Array');
    }
  };
}

// TextEncoder/TextDecoder polyfill for React Native
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('text-encoding').TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('text-encoding').TextDecoder;
}

// Import ethers shims after setting up globals
import '@ethersproject/shims'; 