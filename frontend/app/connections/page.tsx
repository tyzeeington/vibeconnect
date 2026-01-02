'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import axios from 'axios';
import { CountdownTimer } from '../components/CountdownTimer';
import { CompatibilityBreakdown } from '../components/CompatibilityBreakdown';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Updated interface to match new Match API response
interface Match {
  match_id: number;
  user_id: number;
  username: string | null;
  wallet_address: string;
  compatibility_score: number;
  dimension_alignment: Record<string, number>;
  proximity_overlap_minutes: number;
  event_id: string;
  event_name: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  expires_at: string | null;
  is_expired: boolean;
  time_remaining_hours: number | null;
}

interface SocialProfiles {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  spotify?: string;
  tiktok?: string;
  youtube?: string;
}

interface MatchWithSocials extends Match {
  socialProfiles?: SocialProfiles;
  socialUnlocked?: boolean;
}

export default function ConnectionsPage() {
  const { address, isConnected } = useAccount();
  const [matches, setMatches] = useState<MatchWithSocials[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'compatibility' | 'expiring_soon'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 20;

  // Reset pagination when filter or sort changes
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    setMatches([]);
    fetchMatches(true);
  }, [filter, sortBy, address]);

  const fetchMatches = async (reset = false) => {
    if (!address) return;

    try {
      const currentOffset = reset ? 0 : offset;
      reset ? setLoading(true) : setLoadingMore(true);

      // Build query parameters for new /api/matches/ endpoint
      const params = new URLSearchParams({
        wallet_address: address,
        sort: sortBy,
        limit: limit.toString(),
        offset: currentOffset.toString()
      });

      // Add status filter if not "all"
      if (filter !== 'all') {
        params.set('status', filter);
      }

      const response = await axios.get(`${API_URL}/api/matches/?${params}`);
      const matchesData: Match[] = response.data;

      // Check if we have more data
      if (matchesData.length < limit) {
        setHasMore(false);
      }

      // Fetch social profiles for accepted matches
      const matchesWithSocials = await Promise.all(
        matchesData.map(async (match) => {
          if (match.status === 'accepted' && address) {
            try {
              const socialResponse = await axios.get(
                `${API_URL}/api/profiles/socials/${match.wallet_address}`,
                {
                  params: { requester_address: address }
                }
              );

              return {
                ...match,
                socialProfiles: socialResponse.data.social_profiles || {},
                socialUnlocked: socialResponse.data.unlocked || false
              };
            } catch (error) {
              console.error('Error fetching social profiles:', error);
              return { ...match, socialProfiles: {}, socialUnlocked: false };
            }
          }
          return match;
        })
      );

      if (reset) {
        setMatches(matchesWithSocials);
        setOffset(limit);
      } else {
        setMatches(prev => [...prev, ...matchesWithSocials]);
        setOffset(prev => prev + limit);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchMatches(false);
    }
  };

  const acceptMatch = async (matchId: number) => {
    if (!address) return;

    try {
      await axios.post(`${API_URL}/api/matches/respond`, {
        match_id: matchId,
        accept: true,
        wallet_address: address
      });
      // Refresh matches after accepting
      fetchMatches(true);
    } catch (error) {
      console.error('Error accepting match:', error);
    }
  };

  // Filter matches based on search query
  const filteredMatches = matches.filter(match => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const usernameMatch = match.username?.toLowerCase().includes(query);
    const walletMatch = match.wallet_address.toLowerCase().includes(query);
    const eventMatch = match.event_name?.toLowerCase().includes(query);
    const scoreMatch = match.compatibility_score.toString().includes(query);

    return usernameMatch || walletMatch || eventMatch || scoreMatch;
  });

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

  const handleFollowAll = (socialProfiles: SocialProfiles) => {
    // Open all social links in new tabs
    Object.entries(socialProfiles).forEach(([platform, handle]) => {
      if (handle) {
        window.open(getSocialLink(platform, handle), '_blank');
      }
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
            <Link href="/profile/social" className="text-gray-300 hover:text-white transition">
              Social Profiles
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

        {/* Filters and Controls */}
        {isConnected && (
          <div className="space-y-4 mb-8">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('accepted')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'accepted'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Accepted
              </button>
              <button
                onClick={() => setFilter('expired')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'expired'
                    ? 'bg-red-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Expired
              </button>
            </div>

            {/* Search and Sort */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, wallet, event, or score..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="md:w-64">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'compatibility' | 'expiring_soon')}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition cursor-pointer"
                >
                  <option value="newest" className="bg-gray-900">Newest First</option>
                  <option value="compatibility" className="bg-gray-900">Best Match</option>
                  <option value="expiring_soon" className="bg-gray-900">Expiring Soon</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Matches List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="text-gray-300 mt-4">Loading matches...</p>
          </div>
        ) : !isConnected ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="text-6xl mb-4">👛</div>
            <h3 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-gray-300 mb-6">
              Please connect your wallet to see your matches
            </p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {searchQuery ? 'No matches found' : 'No matches yet'}
            </h3>
            <p className="text-gray-300 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Attend events to start making connections'}
            </p>
            {!searchQuery && (
              <Link
                href="/events"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition"
              >
                Find Events
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredMatches.map((match) => {
              const isPending = match.status === 'pending';
              const isAccepted = match.status === 'accepted';
              const isExpired = match.status === 'expired';
              const hasSocials = match.socialProfiles && Object.values(match.socialProfiles).some(v => v);

              return (
                <div
                  key={match.match_id}
                  className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border transition ${
                    isExpired
                      ? 'border-red-500/30 hover:border-red-500/50'
                      : isPending
                      ? 'border-yellow-500/30 hover:border-yellow-500/50'
                      : 'border-white/10 hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex flex-col gap-6">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-3xl">
                            {isExpired ? '⏱️' : isPending ? '⏳' : isAccepted ? '✅' : '🤝'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-semibold text-lg">
                                {match.username || formatAddress(match.wallet_address)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-400 font-mono">
                              {formatAddress(match.wallet_address)}
                            </div>
                          </div>
                        </div>

                        {/* Event Context */}
                        {match.event_name && (
                          <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                            <span className="text-purple-400">📍</span>
                            <span>Met at <strong>{match.event_name}</strong></span>
                            <span className="text-gray-500">•</span>
                            <span>{formatDate(match.created_at)}</span>
                          </div>
                        )}

                        {/* Compatibility Score */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-purple-400">⚡</span>
                            <span className="text-white font-semibold">
                              {match.compatibility_score}% Compatible
                            </span>
                          </div>
                          {match.proximity_overlap_minutes > 0 && (
                            <>
                              <span className="text-gray-500">•</span>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-400">⏱️</span>
                                <span className="text-gray-300">
                                  {Math.floor(match.proximity_overlap_minutes / 60)}h {Math.floor(match.proximity_overlap_minutes % 60)}m together
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex flex-col items-end gap-3">
                        {isPending && (
                          <>
                            <CountdownTimer
                              expiresAt={match.expires_at}
                              isExpired={match.is_expired}
                              timeRemainingHours={match.time_remaining_hours}
                            />
                            <button
                              onClick={() => acceptMatch(match.match_id)}
                              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-purple-500/50"
                            >
                              Accept Match
                            </button>
                          </>
                        )}
                        {isAccepted && (
                          <span className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm font-semibold">
                            ✓ Connected
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm font-semibold">
                            ❌ Expired
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Compatibility Breakdown */}
                    {match.dimension_alignment && Object.keys(match.dimension_alignment).length > 0 && (
                      <div className="border-t border-white/10 pt-6">
                        <CompatibilityBreakdown
                          compatibilityScore={match.compatibility_score}
                          dimensionAlignment={match.dimension_alignment}
                        />
                      </div>
                    )}

                    {/* Social Profiles Section - Only for accepted connections */}
                    {isAccepted && (
                      <div className="border-t border-white/10 pt-6">
                        {match.socialUnlocked && hasSocials ? (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-white font-semibold flex items-center gap-2">
                                <span>🔗</span>
                                Social Profiles
                              </h3>
                              <button
                                onClick={() => handleFollowAll(match.socialProfiles!)}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-lg hover:shadow-purple-500/50"
                              >
                                Follow All →
                              </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {Object.entries(match.socialProfiles!).map(([platform, handle]) => {
                                if (!handle) return null;
                                return (
                                  <a
                                    key={platform}
                                    href={getSocialLink(platform, handle)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-lg p-2 transition group text-sm"
                                  >
                                    <span className="text-lg">{getSocialIcon(platform)}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-gray-400 text-xs capitalize">{platform}</div>
                                      <div className="text-white text-xs truncate group-hover:text-purple-300 transition">
                                        {handle}
                                      </div>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-gray-400 text-sm">
                              🔒 Social profiles not available
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {hasMore && !searchQuery && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-purple-500 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading more...
                    </span>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats Section */}
        {matches.length > 0 && isConnected && (
          <div className="mt-12 grid md:grid-cols-4 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <div className="text-4xl mb-2">🌐</div>
              <div className="text-3xl font-bold text-white mb-1">{matches.length}</div>
              <div className="text-gray-300">Total Matches</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <div className="text-4xl mb-2">⏳</div>
              <div className="text-3xl font-bold text-white mb-1">
                {matches.filter(m => m.status === 'pending').length}
              </div>
              <div className="text-gray-300">Pending</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-3xl font-bold text-white mb-1">
                {matches.filter(m => m.status === 'accepted').length}
              </div>
              <div className="text-gray-300">Accepted</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <div className="text-4xl mb-2">⏱️</div>
              <div className="text-3xl font-bold text-white mb-1">
                {matches.filter(m => m.status === 'expired').length}
              </div>
              <div className="text-gray-300">Expired</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
