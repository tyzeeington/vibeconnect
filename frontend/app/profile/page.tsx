'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import axios from 'axios';
import ProfilePictureUpload from '../components/ProfilePictureUpload';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SocialProfiles {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  spotify?: string;
  tiktok?: string;
  youtube?: string;
}

export default function ProfilePage() {
  const { isConnected, address } = useAccount();
  const [socialProfiles, setSocialProfiles] = useState<SocialProfiles>({});
  const [socialVisibility, setSocialVisibility] = useState<string>('connection_only');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [showPictureUpload, setShowPictureUpload] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      fetchSocialProfiles();
      fetchProfilePicture();
    }
  }, [isConnected, address]);

  const fetchSocialProfiles = async () => {
    if (!address) return;

    try {
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
        setSocialVisibility(response.data.visibility);
      }
    } catch (error) {
      console.error('Error fetching social profiles:', error);
    }
  };

  const fetchProfilePicture = async () => {
    if (!address) return;

    try {
      const response = await axios.get(
        `${API_URL}/api/profiles/picture/${address}`
      );

      if (response.data.has_picture && response.data.url) {
        setProfilePictureUrl(response.data.url);
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  };

  const handleUploadSuccess = (url: string, cid: string) => {
    setProfilePictureUrl(url);
    setShowPictureUpload(false);
  };

  const handleDeleteSuccess = () => {
    setProfilePictureUrl(null);
  };

  // Mock profile data - will connect to backend later
  const mockProfile = {
    username: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'User',
    dimensions: {
      goals: 75,
      intuition: 82,
      philosophy: 68,
      expectations: 91,
      leisure_time: 73
    },
    intentions: ['networking', 'learning', 'creative collaboration'],
    stats: {
      connections: 12,
      pesoEarned: 145,
      eventsAttended: 8
    },
    bio: 'Exploring the intersection of technology and human connection.'
  };

  const getSocialIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      instagram: '📷',
      twitter: '🐦',
      linkedin: '💼',
      spotify: '🎵',
      tiktok: '🎬',
      youtube: '▶️',
    };
    return icons[platform] || '🔗';
  };

  const getSocialLink = (platform: string, handle: string) => {
    const cleanHandle = handle.replace('@', '');
    const links: { [key: string]: string } = {
      instagram: `https://instagram.com/${cleanHandle}`,
      twitter: `https://twitter.com/${cleanHandle}`,
      linkedin: `https://linkedin.com/in/${cleanHandle}`,
      spotify: `https://open.spotify.com/user/${cleanHandle}`,
      tiktok: `https://tiktok.com/@${cleanHandle}`,
      youtube: `https://youtube.com/@${cleanHandle}`,
    };
    return links[platform] || '#';
  };

  const hasSocialProfiles = Object.keys(socialProfiles).length > 0 && Object.values(socialProfiles).some(v => v);

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
              Please connect your wallet to view your profile
            </p>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  const getDimensionColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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
            <Link href="/profile" className="text-purple-400 font-semibold">
              Profile
            </Link>
            <Link href="/connections" className="text-gray-300 hover:text-white transition">
              Connections
            </Link>
            <Link href="/profile/social" className="text-gray-300 hover:text-white transition">
              Social Profiles
            </Link>
          </div>
        </div>
        <ConnectButton />
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-white">{mockProfile.username}</h1>
                  <p className="text-gray-300 text-sm">{address}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPictureUpload(!showPictureUpload)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition text-sm"
            >
              {showPictureUpload ? 'Hide Upload' : 'Edit Picture'}
            </button>
          </div>

          {mockProfile.bio && (
            <p className="text-gray-300 mb-6">{mockProfile.bio}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">{mockProfile.stats.connections}</div>
              <div className="text-gray-400 text-sm">Connections</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">{mockProfile.stats.pesoEarned}</div>
              <div className="text-gray-400 text-sm">$PESO Earned</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">{mockProfile.stats.eventsAttended}</div>
              <div className="text-gray-400 text-sm">Events</div>
            </div>
          </div>
        </div>

        {/* Profile Picture Upload Section */}
        {showPictureUpload && address && (
          <ProfilePictureUpload
            currentPictureUrl={profilePictureUrl}
            walletAddress={address}
            onUploadSuccess={handleUploadSuccess}
            onDeleteSuccess={handleDeleteSuccess}
          />
        )}

        {/* 5 Dimensions */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span>🧬</span>
            5 Core Dimensions
          </h2>

          <div className="space-y-4">
            {Object.entries(mockProfile.dimensions).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between mb-2">
                  <span className="text-white capitalize">
                    {key.replace('_', ' ')}
                  </span>
                  <span className="text-purple-300 font-bold">{value}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${getDimensionColor(value)} transition-all duration-500`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <p className="text-gray-300 text-sm">
              These dimensions were analyzed by AI based on your onboarding responses.
              They help match you with compatible people at events.
            </p>
          </div>
        </div>

        {/* Intentions */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🎯</span>
            Intentions
          </h2>
          <div className="flex flex-wrap gap-2">
            {mockProfile.intentions.map((intention) => (
              <span
                key={intention}
                className="bg-purple-600/30 border border-purple-400 text-purple-200 px-4 py-2 rounded-full text-sm"
              >
                {intention}
              </span>
            ))}
          </div>
          <button className="mt-4 text-purple-300 hover:text-purple-200 text-sm">
            + Add more intentions
          </button>
        </div>

        {/* Social Profiles */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🔗</span>
              Social Profiles
            </h2>
            <Link
              href="/profile/social"
              className="text-purple-300 hover:text-purple-200 text-sm font-semibold transition"
            >
              {hasSocialProfiles ? 'Edit' : 'Add Social Profiles'} →
            </Link>
          </div>

          {hasSocialProfiles ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {Object.entries(socialProfiles).map(([platform, handle]) => {
                  if (!handle) return null;
                  return (
                    <a
                      key={platform}
                      href={getSocialLink(platform, handle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-lg p-3 transition group"
                    >
                      <span className="text-2xl">{getSocialIcon(platform)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-400 text-xs capitalize">{platform}</div>
                        <div className="text-white font-medium truncate group-hover:text-purple-300 transition">
                          {handle}
                        </div>
                      </div>
                      <span className="text-gray-400 group-hover:text-purple-300 transition">→</span>
                    </a>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{socialVisibility === 'public' ? '🌍' : '🔐'}</span>
                <span>
                  {socialVisibility === 'public'
                    ? 'Public - Visible to everyone'
                    : 'Connection-Only - Only visible to your connections'}
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔗</div>
              <p className="text-gray-300 mb-4">
                Add your social media profiles to share with connections
              </p>
              <Link
                href="/profile/social"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Add Social Profiles
              </Link>
            </div>
          )}
        </div>

        {/* Recent Connections */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span>🔗</span>
            Recent Connections
          </h2>

          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎭</div>
            <p className="text-gray-300 mb-4">No connections yet</p>
            <Link
              href="/events"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Attend an Event
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
