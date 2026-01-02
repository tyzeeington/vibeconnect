'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface Event {
  id: number;
  event_id: string;
  venue_name: string;
  event_type?: string;
  start_time: string;
  end_time?: string;
  latitude: number;
  longitude: number;
  attendee_count?: number;
}

export default function EventsPage() {
  const { isConnected, address } = useAccount();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/events/active`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      // Mock data for now
      setEvents([
        {
          id: 1,
          event_id: 'event-001',
          venue_name: 'Brooklyn Warehouse Party',
          event_type: 'Music',
          start_time: '2025-01-15T20:00:00',
          end_time: '2025-01-16T02:00:00',
          latitude: 40.7128,
          longitude: -74.0060,
          attendee_count: 24
        },
        {
          id: 2,
          event_id: 'event-002',
          venue_name: 'Manhattan Tech Mixer',
          event_type: 'Networking',
          start_time: '2025-01-16T18:00:00',
          end_time: '2025-01-16T21:00:00',
          latitude: 40.7589,
          longitude: -73.9851,
          attendee_count: 42
        },
        {
          id: 3,
          event_id: 'event-003',
          venue_name: 'Queens Art Gallery Opening',
          event_type: 'Art',
          start_time: '2025-01-17T19:00:00',
          end_time: '2025-01-17T23:00:00',
          latitude: 40.7282,
          longitude: -73.7949,
          attendee_count: 18
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getEventTypeEmoji = (type?: string) => {
    switch(type?.toLowerCase()) {
      case 'music': return '🎵';
      case 'networking': return '🤝';
      case 'art': return '🎨';
      case 'sports': return '⚽';
      case 'food': return '🍽️';
      default: return '🎉';
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
              Please connect your wallet to view and check into events
            </p>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 border-b border-white/10">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-2xl font-bold text-white">
            VibeConnect 💜
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link href="/events" className="text-purple-400 font-semibold">
              Events
            </Link>
            <Link href="/profile" className="text-gray-300 hover:text-white transition">
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

      {/* Header */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Discover Events
          </h1>
          <p className="text-xl text-gray-300">
            Check in to events and make authentic connections
          </p>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-white text-xl">Loading events...</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-purple-400 transition cursor-pointer group"
              >
                {/* Event Type Badge */}
                <div className="flex justify-between items-start mb-4">
                  <div className="text-4xl">
                    {getEventTypeEmoji(event.event_type)}
                  </div>
                  {event.attendee_count && (
                    <div className="bg-purple-600/50 px-3 py-1 rounded-full text-sm text-white">
                      {event.attendee_count} attending
                    </div>
                  )}
                </div>

                {/* Event Info */}
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition">
                  {event.venue_name}
                </h3>

                {event.event_type && (
                  <p className="text-purple-300 text-sm mb-3">
                    {event.event_type}
                  </p>
                )}

                <div className="space-y-2 text-gray-300 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{formatDate(event.start_time)}</span>
                  </div>
                  {event.end_time && (
                    <div className="flex items-center gap-2">
                      <span>⏰</span>
                      <span>Until {formatDate(event.end_time)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>New York City</span>
                  </div>
                </div>

                {/* Check In Button */}
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition group-hover:shadow-lg group-hover:shadow-purple-500/50">
                  Check In
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && events.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Events Yet</h2>
            <p className="text-gray-300 mb-6">
              Check back soon for upcoming events in your area
            </p>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-4">How it works</h3>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-2xl">1️⃣</span>
              <p><strong className="text-white">Check In:</strong> Tap "Check In" when you arrive at the event</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">2️⃣</span>
              <p><strong className="text-white">Be Present:</strong> Put your phone away and enjoy the experience</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">3️⃣</span>
              <p><strong className="text-white">Discover Matches:</strong> After the event, see your top compatible connections</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">4️⃣</span>
              <p><strong className="text-white">Connect:</strong> Accept mutual matches and mint your Connection NFT</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
