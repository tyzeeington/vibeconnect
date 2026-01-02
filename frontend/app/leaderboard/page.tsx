'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface LeaderboardEntry {
  rank: number;
  wallet_address: string;
  username: string | null;
  total_connections: number;
  total_pesobytes: number;
  latest_connection_date: string | null;
  profile_exists: boolean;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  total_users: number;
  time_period: string;
  updated_at: string;
}

interface UserRank {
  found: boolean;
  rank?: number;
  wallet_address?: string;
  username?: string;
  total_connections?: number;
  total_pesobytes?: number;
  latest_connection_date?: string | null;
  total_users?: number;
  message?: string;
}

export default function LeaderboardPage() {
  const { address, isConnected } = useAccount();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'connections' | 'pesobytes'>('connections');
  const [timePeriod, setTimePeriod] = useState<'all_time' | 'monthly' | 'weekly'>('all_time');

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy, timePeriod]);

  useEffect(() => {
    if (address) {
      fetchUserRank();
    }
  }, [address, sortBy, timePeriod]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/leaderboard/`, {
        params: {
          sort_by: sortBy,
          time_period: timePeriod,
          limit: 100
        }
      });
      setLeaderboardData(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async () => {
    if (!address) return;

    try {
      const response = await axios.get(`${API_URL}/api/leaderboard/user/${address}`, {
        params: {
          sort_by: sortBy,
          time_period: timePeriod
        }
      });
      setUserRank(response.data);
    } catch (error) {
      console.error('Error fetching user rank:', error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getTimePeriodLabel = (period: string) => {
    const labels: { [key: string]: string } = {
      all_time: 'All Time',
      monthly: 'Last 30 Days',
      weekly: 'Last 7 Days'
    };
    return labels[period] || period;
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
            <Link href="/profile" className="text-gray-300 hover:text-white transition">
              Profile
            </Link>
            <Link href="/connections" className="text-gray-300 hover:text-white transition">
              Connections
            </Link>
            <Link href="/leaderboard" className="text-purple-400 font-semibold">
              Leaderboard
            </Link>
          </div>
        </div>
        <ConnectButton />
      </nav>

      <main className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            🏆 Top Connectors
          </h1>
          <p className="text-gray-300 text-lg">
            See who's making the most authentic connections on VibeConnect
          </p>
        </div>

        {/* User's Rank Card (if connected) */}
        {isConnected && userRank?.found && (
          <div className="mb-8 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl">
                  {userRank.rank && userRank.rank <= 3 ? getRankEmoji(userRank.rank) : '📊'}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Your Rank</h3>
                  <p className="text-gray-300">
                    {userRank.username || formatAddress(userRank.wallet_address || '')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-purple-400">
                    {userRank.rank ? getRankEmoji(userRank.rank) : '-'}
                  </div>
                  <div className="text-sm text-gray-400">Rank</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-400">{userRank.total_connections}</div>
                  <div className="text-sm text-gray-400">Connections</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-400">{userRank.total_pesobytes}</div>
                  <div className="text-sm text-gray-400">$PESO</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          {/* Time Period Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setTimePeriod('all_time')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                timePeriod === 'all_time'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimePeriod('monthly')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                timePeriod === 'monthly'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimePeriod('weekly')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                timePeriod === 'weekly'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Weekly
            </button>
          </div>

          {/* Sort By Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('connections')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                sortBy === 'connections'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              By Connections
            </button>
            <button
              onClick={() => setSortBy('pesobytes')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                sortBy === 'pesobytes'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              By $PESO
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="text-gray-300 mt-4">Loading leaderboard...</p>
          </div>
        ) : leaderboardData && leaderboardData.leaderboard.length > 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-white/5 border-b border-white/10 font-semibold text-gray-300 text-sm">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-4">User</div>
              <div className="col-span-2 text-center">Connections</div>
              <div className="col-span-2 text-center">$PESO</div>
              <div className="col-span-3 text-center">Latest Connection</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-white/5">
              {leaderboardData.leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`grid grid-cols-12 gap-4 p-4 hover:bg-white/5 transition ${
                    entry.wallet_address === address ? 'bg-purple-500/10' : ''
                  }`}
                >
                  <div className="col-span-1 text-center">
                    <span className="text-2xl">{getRankEmoji(entry.rank)}</span>
                  </div>
                  <div className="col-span-4 flex items-center gap-2">
                    <div>
                      <div className="text-white font-semibold">
                        {entry.username || formatAddress(entry.wallet_address)}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {formatAddress(entry.wallet_address)}
                      </div>
                    </div>
                    {entry.profile_exists && (
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-2xl font-bold text-blue-400">{entry.total_connections}</div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-2xl font-bold text-green-400">{entry.total_pesobytes}</div>
                  </div>
                  <div className="col-span-3 text-center text-gray-400 text-sm">
                    {formatDate(entry.latest_connection_date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Data Yet</h3>
            <p className="text-gray-300 mb-6">
              Be the first to make connections and climb the leaderboard!
            </p>
            <Link
              href="/events"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Find Events
            </Link>
          </div>
        )}

        {/* Stats Footer */}
        {leaderboardData && (
          <div className="mt-8 text-center text-gray-400 text-sm">
            <p>
              Showing top {leaderboardData.leaderboard.length} of {leaderboardData.total_users} active users
            </p>
            <p className="mt-2">
              Time Period: <span className="text-white font-semibold">{getTimePeriodLabel(leaderboardData.time_period)}</span>
            </p>
            <p className="mt-1">
              Last Updated: {new Date(leaderboardData.updated_at).toLocaleString()}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
