import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWallet } from '../context/WalletContext';
import { updateSocialProfiles, getProfile, type UserProfile } from '../services/api';
import type { RootStackParamList } from '../navigation/AppNavigator';

type SocialProfilesNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SocialProfiles'>;

interface SocialProfiles {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  spotify?: string;
  tiktok?: string;
  youtube?: string;
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram' as keyof SocialProfiles, label: 'Instagram', icon: '📷', placeholder: '@username' },
  { key: 'twitter' as keyof SocialProfiles, label: 'Twitter/X', icon: '🐦', placeholder: '@username' },
  { key: 'linkedin' as keyof SocialProfiles, label: 'LinkedIn', icon: '💼', placeholder: '@username' },
  { key: 'spotify' as keyof SocialProfiles, label: 'Spotify', icon: '🎵', placeholder: '@username' },
  { key: 'tiktok' as keyof SocialProfiles, label: 'TikTok', icon: '🎬', placeholder: '@username' },
  { key: 'youtube' as keyof SocialProfiles, label: 'YouTube', icon: '▶️', placeholder: '@username' },
];

export default function SocialProfilesScreen() {
  const navigation = useNavigation<SocialProfilesNavigationProp>();
  const { walletAddress } = useWallet();

  const [socialProfiles, setSocialProfiles] = useState<SocialProfiles>({});
  const [visibility, setVisibility] = useState<'public' | 'connection_only'>('connection_only');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSocialProfiles();
  }, [walletAddress]);

  const loadSocialProfiles = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profile = await getProfile(walletAddress);

      if (profile.social_profiles) {
        setSocialProfiles(profile.social_profiles as SocialProfiles);
      }

      if (profile.social_visibility) {
        setVisibility(profile.social_visibility as 'public' | 'connection_only');
      }
    } catch (error) {
      console.error('Error loading social profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (platform: keyof SocialProfiles, value: string) => {
    setSocialProfiles(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const validateHandle = (platform: keyof SocialProfiles, handle: string): boolean => {
    if (!handle) return true; // Empty is valid

    // Remove @ if present for validation
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;

    // Basic validation - alphanumeric, underscores, dots, hyphens
    const handleRegex = /^[a-zA-Z0-9._-]+$/;
    return handleRegex.test(cleanHandle);
  };

  const formatHandle = (handle: string): string => {
    if (!handle) return '';
    // Ensure handle starts with @
    return handle.startsWith('@') ? handle : `@${handle}`;
  };

  const handleSave = async () => {
    if (!walletAddress) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    // Validate all handles
    for (const [platform, handle] of Object.entries(socialProfiles)) {
      if (handle && !validateHandle(platform as keyof SocialProfiles, handle)) {
        Alert.alert(
          'Invalid Handle',
          `Invalid ${platform} handle format. Use only letters, numbers, dots, underscores, and hyphens.`
        );
        return;
      }
    }

    try {
      setSaving(true);

      // Format all handles to include @
      const formattedProfiles: Record<string, string> = {};
      for (const [platform, handle] of Object.entries(socialProfiles)) {
        if (handle) {
          formattedProfiles[platform] = formatHandle(handle);
        }
      }

      await updateSocialProfiles(walletAddress, formattedProfiles, visibility);

      Alert.alert(
        'Success',
        'Social profiles saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving social profiles:', error);
      Alert.alert('Error', 'Failed to save social profiles. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!walletAddress) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Please connect your wallet to manage social profiles</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#9333ea" />
          <Text style={styles.loadingText}>Loading social profiles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Social Profiles</Text>
            <Text style={styles.headerSubtitle}>
              Add your social media handles to share with connections
            </Text>
          </View>

          {/* Privacy Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy Settings</Text>

            <TouchableOpacity
              style={[
                styles.privacyOption,
                visibility === 'public' && styles.privacyOptionActive
              ]}
              onPress={() => setVisibility('public')}
            >
              <View style={styles.radioButton}>
                {visibility === 'public' && <View style={styles.radioButtonInner} />}
              </View>
              <View style={styles.privacyOptionContent}>
                <Text style={[
                  styles.privacyOptionTitle,
                  visibility === 'public' && styles.privacyOptionTitleActive
                ]}>
                  Public
                </Text>
                <Text style={styles.privacyOptionDescription}>
                  Anyone can see your social profiles
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.privacyOption,
                visibility === 'connection_only' && styles.privacyOptionActive
              ]}
              onPress={() => setVisibility('connection_only')}
            >
              <View style={styles.radioButton}>
                {visibility === 'connection_only' && <View style={styles.radioButtonInner} />}
              </View>
              <View style={styles.privacyOptionContent}>
                <Text style={[
                  styles.privacyOptionTitle,
                  visibility === 'connection_only' && styles.privacyOptionTitleActive
                ]}>
                  Connection-Only (Recommended)
                </Text>
                <Text style={styles.privacyOptionDescription}>
                  Only people you've connected with at events can see your profiles
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Social Media Handles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Media Handles</Text>

            {SOCIAL_PLATFORMS.map((platform) => (
              <View key={platform.key} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {platform.icon} {platform.label}
                </Text>
                <TextInput
                  style={styles.input}
                  value={socialProfiles[platform.key] || ''}
                  onChangeText={(value) => handleInputChange(platform.key, value)}
                  placeholder={platform.placeholder}
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            ))}
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>How it works</Text>
            <View style={styles.infoBoxItem}>
              <Text style={styles.infoBoxBullet}>•</Text>
              <Text style={styles.infoBoxText}>
                Add your social media handles to make it easy for connections to find you
              </Text>
            </View>
            <View style={styles.infoBoxItem}>
              <Text style={styles.infoBoxBullet}>•</Text>
              <Text style={styles.infoBoxText}>
                When you accept a connection at an event, they'll be able to see your profiles
              </Text>
            </View>
            <View style={styles.infoBoxItem}>
              <Text style={styles.infoBoxBullet}>•</Text>
              <Text style={styles.infoBoxText}>
                Your privacy is protected - only accepted connections can see your handles
              </Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Social Profiles</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  privacyOptionActive: {
    borderColor: '#9333ea',
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9333ea',
  },
  privacyOptionContent: {
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  privacyOptionTitleActive: {
    color: '#c084fc',
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  infoBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  infoBoxItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoBoxBullet: {
    fontSize: 16,
    color: '#9333ea',
    marginRight: 8,
    lineHeight: 20,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#9333ea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
