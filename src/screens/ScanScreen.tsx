import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  Vibration,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PMAColors } from '../theme';

interface ScanScreenProps {
  navigation: any;
  route?: {
    params?: {
      onScanResult?: (data: string) => void;
    };
  };
}

const { width, height } = Dimensions.get('window');

const ScanScreen: React.FC<ScanScreenProps> = ({ navigation, route }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [flashOn, setFlashOn] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);

  const { onScanResult } = route?.params || {};

  useEffect(() => {
    return () => {
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await requestPermission();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to scan QR codes.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => {
            // Open app settings if possible
          }},
        ]
      );
    }
  };

  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    if (scanned) return;
    
    setScanned(true);
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Vibration.vibrate();
    } else {
      Vibration.vibrate(100);
    }

    // Process the scanned data
    processScannedData(data);
  };

  const processScannedData = (data: string) => {
    try {
      // Validate if it's a valid Ethereum address or payment request
      const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(data);
      
      if (isValidAddress) {
        handleValidScan(data);
      } else {
        // Try to parse as a payment request URL
        try {
          const url = new URL(data);
          const address = url.pathname.replace('/', '') || url.hostname;
          
          if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
            handleValidScan(data);
          } else {
            throw new Error('Invalid address in URL');
          }
        } catch {
          // If not a valid URL or address, show error
          Alert.alert(
            'Invalid QR Code',
            'The scanned QR code does not contain a valid account address.',
            [
              { text: 'Try Again', onPress: resetScanning },
              { text: 'Manual Input', onPress: () => setShowManualInput(true) },
            ]
          );
        }
      }
    } catch (error) {
      Alert.alert(
        'Scan Error',
        'Failed to process the scanned QR code. Please try again.',
        [{ text: 'OK', onPress: resetScanning }]
      );
    }
  };

  const handleValidScan = (data: string) => {
    Alert.alert(
      'QR Code Scanned Successfully',
      'Account address detected. Would you like to use this address?',
      [
        { text: 'Cancel', style: 'cancel', onPress: resetScanning },
        {
          text: 'Use Address',
          onPress: () => {
            if (onScanResult) {
              onScanResult(data);
              navigation.goBack();
            } else {
              // Navigate to send screen with pre-filled address
              navigation.navigate('Send', { recipientAddress: data });
            }
          },
        },
      ]
    );
  };

  const resetScanning = () => {
    setScanned(false);
    if (scanTimeout.current) {
      clearTimeout(scanTimeout.current);
    }
    
    // Add a small delay to prevent immediate re-scanning
    scanTimeout.current = setTimeout(() => {
      setScanned(false);
    }, 2000);
  };

  const handleManualInput = () => {
    if (!manualAddress.trim()) {
      Alert.alert('Error', 'Please enter an account address');
      return;
    }

    const isValid = /^0x[a-fA-F0-9]{40}$/.test(manualAddress.trim());
    
    if (!isValid) {
      Alert.alert('Error', 'Please enter a valid account address');
      return;
    }

    if (onScanResult) {
      onScanResult(manualAddress.trim());
      navigation.goBack();
    } else {
      navigation.navigate('Send', { recipientAddress: manualAddress.trim() });
    }
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  const flipCamera = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icon name="camera" size={48} color={PMAColors.placeholder} />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Icon name="camera-alt" size={64} color={PMAColors.primary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to scan QR codes for account addresses.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
            <LinearGradient
              colors={[PMAColors.primary, PMAColors.accent]}
              style={styles.permissionButtonGradient}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.manualInputLink}
            onPress={() => setShowManualInput(true)}
          >
            <Text style={styles.manualInputLinkText}>Enter address manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showManualInput) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={PMAColors.background} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowManualInput(false)}
          >
            <Icon name="arrow-back" size={24} color={PMAColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enter Address Manually</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.manualInputContainer}>
          <Text style={styles.manualInputTitle}>Account Address</Text>
          <Text style={styles.manualInputSubtitle}>
            Enter the recipient's account address (0x...)
          </Text>
          
          <TextInput
            style={styles.manualInput}
            placeholder="Enter the recipient's account address (0x...)"
            placeholderTextColor={PMAColors.placeholder}
            value={manualAddress}
            onChangeText={setManualAddress}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
          />
          
          <TouchableOpacity style={styles.submitButton} onPress={handleManualInput}>
            <LinearGradient
              colors={[PMAColors.primary, PMAColors.accent]}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PMAColors.black} />
      
      {/* Camera View */}
      <CameraView
        style={styles.camera}
        facing={cameraType}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Header Overlay */}
        <View style={styles.headerOverlay}>
          <TouchableOpacity
            style={styles.overlayButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="close" size={24} color={PMAColors.white} />
          </TouchableOpacity>
          
          <Text style={styles.overlayTitle}>Scan QR Code</Text>
          
          <TouchableOpacity
            style={styles.overlayButton}
            onPress={() => setShowManualInput(true)}
          >
            <Icon name="keyboard" size={24} color={PMAColors.white} />
          </TouchableOpacity>
        </View>

        {/* Scanning Frame */}
        <View style={styles.scanningContainer}>
          <View style={styles.scanningFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          
          <Text style={styles.scanningText}>
            Position the QR code within the frame
          </Text>
          
          {scanned && (
            <View style={styles.scannedOverlay}>
              <Icon name="check-circle" size={48} color={PMAColors.success} />
              <Text style={styles.scannedText}>QR Code Detected</Text>
            </View>
          )}
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Icon 
              name={flashOn ? "flash-on" : "flash-off"} 
              size={24} 
              color={PMAColors.white} 
            />
            <Text style={styles.controlText}>Flash</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={flipCamera}>
            <Icon name="flip-camera-android" size={24} color={PMAColors.white} />
            <Text style={styles.controlText}>Flip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={resetScanning}>
            <Icon name="refresh" size={24} color={PMAColors.white} />
            <Text style={styles.controlText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PMAColors.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PMAColors.background,
  },
  loadingText: {
    fontSize: 16,
    color: PMAColors.text,
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: PMAColors.background,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PMAColors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: PMAColors.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  permissionButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.white,
    textAlign: 'center',
  },
  manualInputLink: {
    paddingVertical: 12,
  },
  manualInputLinkText: {
    fontSize: 16,
    color: PMAColors.primary,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: PMAColors.lightGray,
    backgroundColor: PMAColors.background,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.text,
  },
  placeholder: {
    width: 40,
  },
  manualInputContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: PMAColors.background,
  },
  manualInputTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PMAColors.text,
    marginBottom: 8,
  },
  manualInputSubtitle: {
    fontSize: 16,
    color: PMAColors.gray,
    marginBottom: 24,
  },
  manualInput: {
    backgroundColor: PMAColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PMAColors.lightGray,
    padding: 16,
    fontSize: 16,
    color: PMAColors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PMAColors.white,
  },
  camera: {
    flex: 1,
  },
  headerOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  overlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PMAColors.white,
  },
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  scanningFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: PMAColors.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanningText: {
    fontSize: 16,
    color: PMAColors.white,
    textAlign: 'center',
    marginTop: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scannedOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 20,
  },
  scannedText: {
    fontSize: 16,
    color: PMAColors.white,
    marginTop: 8,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  controlButton: {
    alignItems: 'center',
    padding: 12,
  },
  controlText: {
    fontSize: 12,
    color: PMAColors.white,
    marginTop: 4,
  },
});

export default ScanScreen; 