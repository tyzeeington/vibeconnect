'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Connection {
  id: number;
  user1_address: string;
  user2_address: string;
  event_id: number;
  compatibility_score: number;
  status: string;
  created_at: string;
  event?: {
    name: string;
    location: string;
  };
}

export default function ConnectionsPage() {
  const { address, isConnected } = useAccount();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'my' | 'pending' | 'accepted'>('all');

  useEffect(() => {
    fetchConnections();
  }, [filter, address]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/connections`;

      if (filter === 'my' && address) {
        url += `?user_address=${address}`;
      } else if (filter === 'pending' && address) {
        url += `?user_address=${address}&status=pending`;
      } else if (filter === 'accepted' && address) {
        url += `?user_address=${address}&status=accepted`;
      }

      const response = await axios.get(url);
      setConnections(response.data);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptConnection = async (connectionId: number) => {
    if (!address) return;

    try {
      await axios.post(`${API_URL}/api/connections/${connectionId}/accept`, {
        user_address: address
      });
      fetchConnections();
    } catch (error) {
      console.error('Error accepting connection:', error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <Link href="/connections" className="text-purple-400 font-semibold">
              Connections
            </Link>
          </div>
        </div>
        <ConnectButton />
      </nav>

      <main className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Connection Feed 🔗
          </h1>
          <p className="text-gray-300">
            See all the authentic connections being made on VibeConnect
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            All Connections
          </button>
          {isConnected && (
            <>
              <button
                onClick={() => setFilter('my')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'my'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                My Connections
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'pending'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('accepted')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'accepted'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Accepted
              </button>
            </>
          )}
        </div>

        {/* Connections List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="text-gray-300 mt-4">Loading connections...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No connections yet</h3>
            <p className="text-gray-300 mb-6">
              {filter === 'all'
                ? 'Be the first to make a connection!'
                : 'Attend events to start making connections'}
            </p>
            <Link
              href="/events"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Find Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => {
              const isMyConnection = address && (
                connection.user1_address.toLowerCase() === address.toLowerCase() ||
                connection.user2_address.toLowerCase() === address.toLowerCase()
              );
              const isPending = connection.status === 'pending';
              const canAccept = isMyConnection && isPending;

              return (
                <div
                  key={connection.id}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-3xl">🤝</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono">
                              {formatAddress(connection.user1_address)}
                            </span>
                            <span className="text-purple-400">↔</span>
                            <span className="text-white font-mono">
                              {formatAddress(connection.user2_address)}
                            </span>
                          </div>
                          {connection.event && (
                            <p className="text-sm text-gray-400 mt-1">
                              📍 {connection.event.name} • {connection.event.location}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-300 mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-400">⚡</span>
                          <span>Compatibility: {connection.compatibility_score}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400">📅</span>
                          <span>{formatDate(connection.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isPending ? (
                        <>
                          <span className="px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg text-sm font-semibold">
                            Pending
                          </span>
                          {canAccept && (
                            <button
                              onClick={() => acceptConnection(connection.id)}
                              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition"
                            >
                              Accept
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm font-semibold">
                          ✓ Connected
                        </span>
                      )}

                      {isMyConnection && (
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Section */}
        {connections.length > 0 && (
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <div className="text-4xl mb-2">🌐</div>
              <div className="text-3xl font-bold text-white mb-1">{connections.length}</div>
              <div className="text-gray-300">Total Connections</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <div className="text-4xl mb-2">⏳</div>
              <div className="text-3xl font-bold text-white mb-1">
                {connections.filter(c => c.status === 'pending').length}
              </div>
              <div className="text-gray-300">Pending</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-3xl font-bold text-white mb-1">
                {connections.filter(c => c.status === 'accepted').length}
              </div>
              <div className="text-gray-300">Accepted</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
