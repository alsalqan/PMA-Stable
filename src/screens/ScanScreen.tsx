import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PMAColors } from '../theme';

const ScanScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan QR Code</Text>
      <Text style={styles.subtitle}>Scan QR code to send payments</Text>
      <Text style={styles.placeholder}>QR scanner implementation coming soon...</Text>
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

export default ScanScreen; 