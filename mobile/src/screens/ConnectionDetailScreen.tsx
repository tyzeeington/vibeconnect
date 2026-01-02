import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getConnections, acceptConnection, type Connection } from '../services/api';
import { useWallet } from '../context/WalletContext';
import type { RootStackParamList } from '../navigation/AppNavigator';

type ConnectionDetailRouteProp = RouteProp<RootStackParamList, 'ConnectionDetail'>;
type ConnectionDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ConnectionDetail'>;

export default function ConnectionDetailScreen() {
  const route = useRoute<ConnectionDetailRouteProp>();
  const navigation = useNavigation<ConnectionDetailNavigationProp>();
  const { walletAddress } = useWallet();
  const { connectionId } = route.params;

  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadConnection();
  }, [connectionId, walletAddress]);

  const loadConnection = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const connections = await getConnections(walletAddress);
      const found = connections.find((c) => c.id === connectionId);
      setConnection(found || null);
    } catch (error) {
      console.error('Failed to load connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setProcessing(true);
      await acceptConnection(connectionId);
      Alert.alert(
        'Connection Accepted!',
        'You can now see their social profiles and unlock rewards.',
        [
          {
            text: 'OK',
            onPress: () => {
              loadConnection();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to accept connection:', error);
      Alert.alert('Error', 'Failed to accept connection. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getOtherAddress = (connection: Connection) => {
    return connection.user1_address === walletAddress
      ? connection.user2_address
      : connection.user1_address;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'accepted':
        return '#16a34a';
      default:
        return '#64748b';
    }
  };

  if (!walletAddress) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>Please connect your wallet</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#9333ea" />
          <Text style={styles.loadingText}>Loading connection...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!connection) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Connection not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const otherAddress = getOtherAddress(connection);
  const statusColor = getStatusColor(connection.status);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {otherAddress.slice(2, 4).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.addressText}>{formatAddress(otherAddress)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Compatibility Score */}
        <View style={styles.scoreSection}>
          <Text style={styles.sectionTitle}>Compatibility Score</Text>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreValue}>{Math.round(connection.compatibility_score)}%</Text>
            <Text style={styles.scoreLabel}>Match</Text>
          </View>

          {connection.compatibility_score >= 70 && (
            <View style={styles.highMatchBanner}>
              <Text style={styles.highMatchText}>This is a high compatibility match!</Text>
            </View>
          )}
        </View>

        {/* Connection Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Details</Text>

          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Event ID</Text>
            <Text style={styles.detailValue}>#{connection.event_id}</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Connected On</Text>
            <Text style={styles.detailValue}>
              {new Date(connection.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {connection.status === 'pending' && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.acceptButtonText}>Accept Connection</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.actionHint}>
              Accept to unlock social profiles and earn rewards
            </Text>
          </View>
        )}

        {connection.status === 'accepted' && (
          <View style={styles.acceptedSection}>
            <Text style={styles.acceptedIcon}>✓</Text>
            <Text style={styles.acceptedText}>Connection Accepted</Text>
            <Text style={styles.acceptedSubtext}>
              You can now view their social profiles and have earned connection rewards!
            </Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            This connection was made based on your personality compatibility at an event.
            Accepting the connection will unlock social profiles and reward both participants.
          </Text>
        </View>
      </ScrollView>
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
  },
  scrollContent: {
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
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  errorText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#9333ea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  addressText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    padding: 32,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#16a34a',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
  highMatchBanner: {
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  highMatchText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  actionsSection: {
    marginBottom: 24,
  },
  acceptButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionHint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  acceptedSection: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#16a34a',
    alignItems: 'center',
    marginBottom: 24,
  },
  acceptedIcon: {
    fontSize: 48,
    color: '#16a34a',
    marginBottom: 12,
  },
  acceptedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  acceptedSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
});
