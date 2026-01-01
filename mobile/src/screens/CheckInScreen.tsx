import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // In a real implementation, we would request camera permissions here
    // For now, we'll simulate the permission grant
    setHasPermission(true);
  }, []);

  const handleManualCheckIn = async () => {
    if (!walletAddress) {
      Alert.alert('Wallet Required', 'Please connect your wallet to check in');
      return;
    }

    try {
      setProcessing(true);
      await checkIn(eventId, walletAddress);
      Alert.alert(
        'Success',
        'You have successfully checked in!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Check-in failed:', error);
      Alert.alert('Error', 'Failed to check in. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#9333ea" />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>📷</Text>
          <Text style={styles.errorText}>Camera permission denied</Text>
          <Text style={styles.errorSubtext}>
            Please enable camera access in your device settings to scan QR codes
          </Text>
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

        {/* QR Scanner Placeholder */}
        <View style={styles.scannerContainer}>
          <View style={styles.scannerFrame}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />

            <Text style={styles.scannerText}>
              Position QR code within frame
            </Text>
          </View>

          <Text style={styles.instructionText}>
            QR scanner will be available when camera is ready
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
  scannerFrame: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
  scannerText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 20,
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
