module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      // Add support for crypto operations with ethers v6
      [
        'module-resolver',
        {
          alias: {
            crypto: 'react-native-crypto',
            buffer: 'buffer',
            stream: 'readable-stream',
            vm: 'vm-browserify',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
}; 