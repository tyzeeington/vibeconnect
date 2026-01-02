import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { checkIn } from '../services/api';
import { useWallet } from '../context/WalletContext';
import type { RootStackParamList } from '../navigation/AppNavigator';

type CheckInRouteProp = RouteProp<RootStackParamList, 'CheckIn'>;
type CheckInNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CheckIn'>;

export default function CheckInScreen() {
  const route = useRoute<CheckInRouteProp>();
  const navigation = useNavigation<CheckInNavigationProp>();
  const { walletAddress } = useWallet();
  const { eventId } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleCheckIn = async (scannedEventId: number) => {
    if (!walletAddress) {
      Alert.alert('Wallet Required', 'Please connect your wallet to check in');
      setScanned(false);
      return;
    }

    try {
      setProcessing(true);
      await checkIn(scannedEventId, walletAddress);
      Alert.alert(
        'Success',
        'You have successfully checked in to the event!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Check-in failed:', error);
      const errorMessage = error?.response?.data?.detail || 'Failed to check in. Please try again.';
      Alert.alert('Check-in Failed', errorMessage, [
        {
          text: 'OK',
          onPress: () => setScanned(false),
        },
      ]);
    } finally {
      setProcessing(false);
    }
  };

  const handleManualCheckIn = async () => {
    await handleCheckIn(eventId);
  };

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scanned || processing) {
      return;
    }

    setScanned(true);

    try {
      // Try to parse the QR code data as JSON first (in case it's structured)
      let scannedEventId: number | null = null;

      try {
        const parsed = JSON.parse(data);
        if (parsed.eventId) {
          scannedEventId = parseInt(parsed.eventId, 10);
        } else if (parsed.event_id) {
          scannedEventId = parseInt(parsed.event_id, 10);
        }
      } catch {
        // If not JSON, try to parse as a plain number
        const parsedNumber = parseInt(data, 10);
        if (!isNaN(parsedNumber)) {
          scannedEventId = parsedNumber;
        }
      }

      if (scannedEventId === null || isNaN(scannedEventId)) {
        Alert.alert(
          'Invalid QR Code',
          'This QR code does not contain a valid event ID. Please scan an event check-in QR code.',
          [
            {
              text: 'OK',
              onPress: () => setScanned(false),
            },
          ]
        );
        return;
      }

      // Proceed with check-in
      handleCheckIn(scannedEventId);
    } catch (error) {
      console.error('Error parsing QR code:', error);
      Alert.alert(
        'Scan Error',
        'Failed to read QR code. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#9333ea" />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>📷</Text>
          <Text style={styles.errorText}>Camera Access Required</Text>
          <Text style={styles.errorSubtext}>
            VibeConnect needs camera access to scan QR codes for event check-in
          </Text>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>

          {permission.canAskAgain === false && (
            <TouchableOpacity
              style={[styles.permissionButton, styles.settingsButton]}
              onPress={handleOpenSettings}
            >
              <Text style={styles.permissionButtonText}>Open Settings</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.manualButton, { marginTop: 24 }]}
            onPress={handleManualCheckIn}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.manualButtonText}>Manual Check-In Instead</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scan QR Code</Text>
          <Text style={styles.subtitle}>
            Scan the event QR code to check in and start connecting
          </Text>
        </View>

        {/* QR Scanner */}
        <View style={styles.scannerContainer}>
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame}>
                <View style={styles.cornerTopLeft} />
                <View style={styles.cornerTopRight} />
                <View style={styles.cornerBottomLeft} />
                <View style={styles.cornerBottomRight} />
              </View>
            </View>

            {scanned && (
              <View style={styles.scanningOverlay}>
                <ActivityIndicator size="large" color="#9333ea" />
                <Text style={styles.scanningText}>Processing QR code...</Text>
              </View>
            )}
          </View>

          <Text style={styles.instructionText}>
            {scanned ? 'Processing...' : 'Position QR code within the frame'}
          </Text>
        </View>

        {/* Manual Check-in Option */}
        <View style={styles.manualSection}>
          <Text style={styles.orText}>OR</Text>

          <TouchableOpacity
            style={styles.manualButton}
            onPress={handleManualCheckIn}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.manualButtonText}>Manual Check-In</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.manualHint}>
            Use this if you don't have access to the QR code
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  cameraContainer: {
    width: 300,
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 12,
    fontWeight: '600',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#9333ea',
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#9333ea',
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#9333ea',
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#9333ea',
    borderBottomRightRadius: 12,
  },
  permissionButton: {
    backgroundColor: '#9333ea',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 24,
    minWidth: 200,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsButton: {
    backgroundColor: '#64748b',
    marginTop: 12,
  },
  instructionText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  manualSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  orText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 16,
  },
  manualButton: {
    backgroundColor: '#9333ea',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  manualButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  manualHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
});
