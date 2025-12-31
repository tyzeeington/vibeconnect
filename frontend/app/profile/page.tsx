'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function ProfilePage() {
  const { isConnected, address } = useAccount();

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
      <nav className="flex justify-between items-center p-6">
        <Link href="/" className="text-2xl font-bold text-white">
          VibeConnect 💜
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/events"
            className="text-white hover:text-purple-300 transition"
          >
            Events
          </Link>
          <ConnectButton />
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{mockProfile.username}</h1>
                  <p className="text-gray-300 text-sm">{address}</p>
                </div>
              </div>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition text-sm">
              Edit Profile
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
