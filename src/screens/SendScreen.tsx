import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PMAColors } from '../theme';

const SendScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send Funds</Text>
      <Text style={styles.subtitle}>Send USDT, USDC, or AE Coin</Text>
      <Text style={styles.placeholder}>Send screen implementation coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PMAColors.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PMAColors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: PMAColors.gray,
    marginBottom: 20,
  },
  placeholder: {
    fontSize: 14,
    color: PMAColors.placeholder,
    textAlign: 'center',
  },
});

export default SendScreen; 