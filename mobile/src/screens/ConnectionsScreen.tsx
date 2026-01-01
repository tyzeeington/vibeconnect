import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getConnections, type Connection } from '../services/api';
import { useWallet } from '../context/WalletContext';
import type { RootStackParamList } from '../navigation/AppNavigator';

type ConnectionsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FilterType = 'all' | 'pending' | 'accepted';

export default function ConnectionsScreen() {
  const navigation = useNavigation<ConnectionsScreenNavigationProp>();
  const { walletAddress } = useWallet();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadConnections();
  }, [walletAddress]);

  const loadConnections = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getConnections(walletAddress);
      setConnections(data);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConnections();
    setRefreshing(false);
  };

  const getFilteredConnections = () => {
    if (filter === 'all') return connections;
    return connections.filter((conn) => conn.status === filter);
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

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderConnectionCard = ({ item }: { item: Connection }) => {
    const otherAddress = getOtherAddress(item);
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.connectionCard}
        onPress={() => navigation.navigate('ConnectionDetail', { connectionId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {otherAddress.slice(2, 4).toUpperCase()}
            </Text>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.addressText}>{formatAddress(otherAddress)}</Text>
            <Text style={styles.eventText}>Event #{item.event_id}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Compatibility</Text>
            <Text style={styles.scoreValue}>{Math.round(item.compatibility_score)}%</Text>
          </View>

          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        {item.compatibility_score >= 70 && (
          <View style={styles.highMatchBadge}>
            <Text style={styles.highMatchText}>High Match!</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (filterType: FilterType, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterType && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (!walletAddress) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>Please connect your wallet to view connections</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#9333ea" />
          <Text style={styles.loadingText}>Loading connections...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredConnections = getFilteredConnections();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connections</Text>
        <Text style={styles.subtitle}>
          {connections.length} connection{connections.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('pending', 'Pending')}
        {renderFilterButton('accepted', 'Accepted')}
      </View>

      {filteredConnections.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyIcon}>🔗</Text>
          <Text style={styles.emptyText}>
            {filter === 'all'
              ? 'No connections yet'
              : `No ${filter} connections`}
          </Text>
          <Text style={styles.emptySubtext}>
            Check in to events to start making connections
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConnections}
          renderItem={renderConnectionCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#9333ea"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    borderColor: '#9333ea',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#9333ea',
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  connectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  eventText: {
    fontSize: 12,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  highMatchBadge: {
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  highMatchText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
  },
});
