'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SocialProfiles {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  spotify?: string;
  tiktok?: string;
  youtube?: string;
}

export default function SocialProfilesPage() {
  const { isConnected, address } = useAccount();
  const [socialProfiles, setSocialProfiles] = useState<SocialProfiles>({});
  const [visibility, setVisibility] = useState<'public' | 'connection_only'>('connection_only');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isConnected && address) {
      fetchSocialProfiles();
    }
  }, [isConnected, address]);

  const fetchSocialProfiles = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/profiles/socials/${address}`,
        {
          params: { requester_address: address }
        }
      );

      if (response.data.social_profiles) {
        setSocialProfiles(response.data.social_profiles);
      }

      if (response.data.visibility) {
        setVisibility(response.data.visibility);
      }
    } catch (error) {
      console.error('Error fetching social profiles:', error);
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

    // Remove @ if present
    const cleanHandle = handle.startsWith('@') ? handle : handle;

    // Basic validation - alphanumeric, underscores, dots
    const handleRegex = /^@?[a-zA-Z0-9._-]+$/;
    return handleRegex.test(cleanHandle);
  };

  const formatHandle = (handle: string): string => {
    if (!handle) return '';
    // Ensure handle starts with @
    return handle.startsWith('@') ? handle : `@${handle}`;
  };

  const handleSave = async () => {
    if (!address) return;

    // Validate all handles
    for (const [platform, handle] of Object.entries(socialProfiles)) {
      if (handle && !validateHandle(platform as keyof SocialProfiles, handle)) {
        setErrorMessage(`Invalid ${platform} handle format. Use only letters, numbers, dots, underscores, and hyphens.`);
        return;
      }
    }

    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      // Format all handles to include @
      const formattedProfiles: SocialProfiles = {};
      for (const [platform, handle] of Object.entries(socialProfiles)) {
        if (handle) {
          formattedProfiles[platform as keyof SocialProfiles] = formatHandle(handle);
        }
      }

      await axios.put(
        `${API_URL}/api/profiles/socials`,
        {
          social_profiles: formattedProfiles,
          social_visibility: visibility
        },
        {
          params: { wallet_address: address }
        }
      );

      setSuccessMessage('Social profiles saved successfully!');
      setSocialProfiles(formattedProfiles);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving social profiles:', error);
      setErrorMessage('Failed to save social profiles. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
        <nav className="flex justify-between items-center p-6">
          <Link href="/" className="text-2xl font-bold text-white">
            VibeConnect 💜
          </Link>
          <ConnectButton />
        </nav>

        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md border border-white/20 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-300 mb-6">
              Please connect your wallet to manage your social profiles
            </p>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  const socialPlatforms = [
    { key: 'instagram' as keyof SocialProfiles, label: 'Instagram', icon: '📷', placeholder: '@username' },
    { key: 'twitter' as keyof SocialProfiles, label: 'Twitter/X', icon: '🐦', placeholder: '@username' },
    { key: 'linkedin' as keyof SocialProfiles, label: 'LinkedIn', icon: '💼', placeholder: '@username' },
    { key: 'spotify' as keyof SocialProfiles, label: 'Spotify', icon: '🎵', placeholder: '@username' },
    { key: 'tiktok' as keyof SocialProfiles, label: 'TikTok', icon: '🎬', placeholder: '@username' },
    { key: 'youtube' as keyof SocialProfiles, label: 'YouTube', icon: '▶️', placeholder: '@username' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 border-b border-white/10">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-2xl font-bold text-white">
            VibeConnect 💜
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link href="/events" className="text-gray-300 hover:text-white transition">
              Events
            </Link>
            <Link href="/profile" className="text-gray-300 hover:text-white transition">
              Profile
            </Link>
            <Link href="/connections" className="text-gray-300 hover:text-white transition">
              Connections
            </Link>
            <Link href="/profile/social" className="text-purple-400 font-semibold">
              Social Profiles
            </Link>
          </div>
        </div>
        <ConnectButton />
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-4 transition"
          >
            ← Back to Profile
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <span>🔗</span>
            Social Profiles
          </h1>
          <p className="text-gray-300">
            Add your social media handles to share with connections
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-500/20 border border-green-500 text-green-300 rounded-lg p-4">
            ✓ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-500/20 border border-red-500 text-red-300 rounded-lg p-4">
            ⚠ {errorMessage}
          </div>
        )}

        {/* Privacy Toggle */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>👁️</span>
            Privacy Settings
          </h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={visibility === 'public'}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'connection_only')}
                className="w-5 h-5 text-purple-600 focus:ring-purple-500 focus:ring-2"
              />
              <div className="flex-1">
                <div className="text-white font-semibold group-hover:text-purple-300 transition">
                  🌍 Public
                </div>
                <div className="text-gray-400 text-sm">
                  Anyone can see your social profiles
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="visibility"
                value="connection_only"
                checked={visibility === 'connection_only'}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'connection_only')}
                className="w-5 h-5 text-purple-600 focus:ring-purple-500 focus:ring-2"
              />
              <div className="flex-1">
                <div className="text-white font-semibold group-hover:text-purple-300 transition">
                  🔐 Connection-Only (Recommended)
                </div>
                <div className="text-gray-400 text-sm">
                  Only people you've connected with at events can see your profiles
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Social Profiles Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Social Media Handles
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <p className="text-gray-300 mt-2">Loading...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {socialPlatforms.map((platform) => (
                <div key={platform.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <span className="mr-2">{platform.icon}</span>
                    {platform.label}
                  </label>
                  <input
                    type="text"
                    value={socialProfiles[platform.key] || ''}
                    onChange={(e) => handleInputChange(platform.key, e.target.value)}
                    placeholder={platform.placeholder}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <span>💡</span>
            How it works
          </h3>
          <ul className="text-gray-300 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Add your social media handles to make it easy for connections to find you</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>When you accept a connection at an event, they'll be able to see your profiles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Use the "Follow All" button to quickly follow all social accounts at once</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Your privacy is protected - only accepted connections can see your handles</span>
            </li>
          </ul>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-lg transition text-lg"
        >
          {saving ? 'Saving...' : 'Save Social Profiles'}
        </button>
      </div>
    </div>
  );
}
