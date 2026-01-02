import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWallet } from '../context/WalletContext';
import { getProfile, type UserProfile } from '../services/api';
import type { RootStackParamList } from '../navigation/AppNavigator';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { walletAddress } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [walletAddress]);

  // Refresh profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [walletAddress])
  );

  const loadProfile = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getProfile(walletAddress);
      setProfile(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Profile not found. Please create your profile first.');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!walletAddress) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>Please connect your wallet to view profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#9333ea" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>👤</Text>
          <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {profile.wallet_address.slice(2, 4).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.walletAddress}>{formatAddress(profile.wallet_address)}</Text>
        </View>

        {/* Personality Traits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personality Dimensions</Text>
          {profile.personality_traits && Object.keys(profile.personality_traits).length > 0 ? (
            <View style={styles.traitsContainer}>
              {Object.entries(profile.personality_traits).map(([key, value]) => (
                <View key={key} style={styles.traitCard}>
                  <Text style={styles.traitKey}>{key}</Text>
                  <Text style={styles.traitValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No personality data yet</Text>
          )}
        </View>

        {/* Social Profiles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Social Profiles</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('SocialProfiles')}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          {profile.social_profiles && Object.keys(profile.social_profiles).length > 0 ? (
            <View style={styles.socialContainer}>
              {Object.entries(profile.social_profiles).map(([platform, handle]) => (
                <View key={platform} style={styles.socialCard}>
                  <Text style={styles.socialPlatform}>{platform}</Text>
                  <Text style={styles.socialHandle}>{handle}</Text>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('SocialProfiles')}
            >
              <Text style={styles.addButtonText}>Add Social Profiles</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.visibilityText}>
            Visibility: {profile.social_visibility || 'connection_only'}
          </Text>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Info</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>
              {new Date(profile.created_at).toLocaleDateString()}
            </Text>
          </View>
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
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  walletAddress: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  editButton: {
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9333ea',
  },
  editButtonText: {
    color: '#9333ea',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9333ea',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonText: {
    color: '#9333ea',
    fontSize: 16,
    fontWeight: '600',
  },
  traitsContainer: {
    gap: 12,
  },
  traitCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  traitKey: {
    fontSize: 14,
    color: '#9333ea',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  traitValue: {
    fontSize: 16,
    color: '#fff',
  },
  socialContainer: {
    gap: 12,
    marginBottom: 12,
  },
  socialCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  socialPlatform: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  socialHandle: {
    fontSize: 16,
    color: '#fff',
  },
  visibilityText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#9333ea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
