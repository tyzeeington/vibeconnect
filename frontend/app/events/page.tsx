'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import Map components to avoid SSR issues
// NOTE: Mapbox requires a client-side only rendering
const Map = dynamic(() => import('react-map-gl').then(mod => mod.default), { ssr: false });
const Marker = dynamic(() => import('react-map-gl').then(mod => mod.Marker), { ssr: false });
const NavigationControl = dynamic(() => import('react-map-gl').then(mod => mod.NavigationControl), { ssr: false });
const GeolocateControl = dynamic(() => import('react-map-gl').then(mod => mod.GeolocateControl), { ssr: false });

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
  description?: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

export default function EventsPage() {
  const { isConnected, address } = useAccount();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'split'>('split');

  // Filter states
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'nearest' | 'soonest' | 'popular'>('soonest');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Map states
  const [mapError, setMapError] = useState<string>('');
  const mapRef = useRef<any>(null);

  // IMPORTANT: Check if Mapbox token is available
  // To use the map feature, you need to:
  // 1. Sign up for a free Mapbox account at https://www.mapbox.com/
  // 2. Get your access token from https://account.mapbox.com/
  // 3. Create a .env.local file in the frontend directory
  // 4. Add: NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const hasMapboxToken = Boolean(MAPBOX_TOKEN);

  useEffect(() => {
    requestUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchEvents();
    }
  }, [userLocation, radiusKm]);

  useEffect(() => {
    filterAndSortEvents();
  }, [events, radiusKm, eventTypeFilter, sortBy, searchQuery, userLocation]);

  const requestUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationError('');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Location access denied. Using default location.');
          // Default to New York City if location is denied
          setUserLocation({
            latitude: 40.7128,
            longitude: -74.0060,
          });
        }
      );
    } else {
      setLocationError('Geolocation not supported by browser.');
      setUserLocation({
        latitude: 40.7128,
        longitude: -74.0060,
      });
    }
  };

  const fetchEvents = async () => {
    try {
      // Wait for user location before fetching events
      if (!userLocation) {
        return;
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/events/active`, {
        params: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius_km: radiusKm
        }
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      // Mock data for development/demo
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
          attendee_count: 24,
          description: 'Underground house music party with local DJs'
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
          attendee_count: 42,
          description: 'Connect with tech professionals and entrepreneurs'
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
          attendee_count: 18,
          description: 'Contemporary art exhibition opening night'
        },
        {
          id: 4,
          event_id: 'event-004',
          venue_name: 'Central Park Running Club',
          event_type: 'Sports',
          start_time: '2025-01-18T07:00:00',
          end_time: '2025-01-18T08:30:00',
          latitude: 40.7829,
          longitude: -73.9654,
          attendee_count: 35,
          description: 'Morning run through Central Park, all levels welcome'
        },
        {
          id: 5,
          event_id: 'event-005',
          venue_name: 'SoHo Food Festival',
          event_type: 'Food',
          start_time: '2025-01-19T12:00:00',
          end_time: '2025-01-19T18:00:00',
          latitude: 40.7233,
          longitude: -74.0030,
          attendee_count: 156,
          description: 'Taste the best street food and local cuisine'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filterAndSortEvents = () => {
    let filtered = [...events];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.venue_name.toLowerCase().includes(query) ||
        event.event_type?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query)
      );
    }

    // Filter by event type
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(event => event.event_type?.toLowerCase() === eventTypeFilter.toLowerCase());
    }

    // Filter by radius (if user location is available)
    if (userLocation) {
      filtered = filtered.filter(event => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          event.latitude,
          event.longitude
        );
        return distance <= radiusKm;
      });
    }

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'nearest':
          if (!userLocation) return 0;
          const distA = calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
          const distB = calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
          return distA - distB;
        case 'soonest':
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        case 'popular':
          return (b.attendee_count || 0) - (a.attendee_count || 0);
        default:
          return 0;
      }
    });

    setFilteredEvents(filtered);
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

  const getEventDistance = (event: Event): string => {
    if (!userLocation) return '';
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      event.latitude,
      event.longitude
    );
    return distance < 1
      ? `${Math.round(distance * 1000)}m away`
      : `${distance.toFixed(1)}km away`;
  };

  const handleMarkerClick = (event: Event) => {
    setSelectedEvent(event);
    // Scroll to event in list view on mobile
    const element = document.getElementById(`event-${event.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleCheckIn = async (eventId: string) => {
    if (!isConnected || !address) {
      alert('Please connect your wallet to check in');
      return;
    }

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/events/checkin`, {
        wallet_address: address,
        event_id: eventId,
      });
      alert('Successfully checked in!');
      fetchEvents(); // Refresh to update attendee count
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in. Please try again.');
    }
  };

  const uniqueEventTypes = Array.from(new Set(events.map(e => e.event_type).filter(Boolean)));

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
      <div className="border-b border-white/10 bg-black/20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Discover Events 🗺️
              </h1>
              <p className="text-gray-300">
                Find events near you and make authentic connections
              </p>
            </div>

            {/* View Mode Toggle (Mobile) */}
            <div className="flex gap-2 md:hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  viewMode === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  viewMode === 'map'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300'
                }`}
              >
                Map
              </button>
            </div>
          </div>

          {/* Mapbox Token Warning */}
          {!hasMapboxToken && (
            <div className="mt-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="text-yellow-300 font-semibold mb-1">Map Feature Unavailable</h3>
                  <p className="text-yellow-200 text-sm mb-2">
                    To enable the interactive map, you need to add a Mapbox API token.
                  </p>
                  <details className="text-yellow-200 text-sm">
                    <summary className="cursor-pointer hover:text-yellow-100 mb-2">
                      Click to see setup instructions
                    </summary>
                    <ol className="list-decimal list-inside space-y-1 ml-2 text-xs">
                      <li>Sign up for a free account at <a href="https://www.mapbox.com/" target="_blank" rel="noopener noreferrer" className="underline">mapbox.com</a></li>
                      <li>Get your access token from your Mapbox account dashboard</li>
                      <li>Create a <code className="bg-black/30 px-1 py-0.5 rounded">.env.local</code> file in the frontend directory</li>
                      <li>Add: <code className="bg-black/30 px-1 py-0.5 rounded">NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here</code></li>
                      <li>Restart the development server</li>
                    </ol>
                  </details>
                </div>
              </div>
            </div>
          )}

          {/* Location Error */}
          {locationError && (
            <div className="mt-4 bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 flex items-center gap-2">
              <span className="text-blue-300 text-sm">📍 {locationError}</span>
            </div>
          )}

          {/* Filters */}
          <div className="mt-6 space-y-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search events by name, type, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Radius Slider */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Radius: {radiusKm}km
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #9333ea 0%, #9333ea ${(radiusKm / 50) * 100}%, rgba(255,255,255,0.2) ${(radiusKm / 50) * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>

              {/* Event Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Event Type
                </label>
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition cursor-pointer"
                >
                  <option value="all" className="bg-gray-900">All Types</option>
                  {uniqueEventTypes.map(type => (
                    <option key={type} value={type?.toLowerCase()} className="bg-gray-900">
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'nearest' | 'soonest' | 'popular')}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition cursor-pointer"
                >
                  <option value="soonest" className="bg-gray-900">Soonest</option>
                  <option value="nearest" className="bg-gray-900">Nearest</option>
                  <option value="popular" className="bg-gray-900">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-400">
              Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              {userLocation && ` within ${radiusKm}km`}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <div className="text-white text-xl mt-4">Loading events...</div>
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Events Found</h2>
            <p className="text-gray-300 mb-6">
              Try adjusting your filters or increasing the search radius
            </p>
            <button
              onClick={() => {
                setRadiusKm(50);
                setEventTypeFilter('all');
                setSearchQuery('');
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Events List */}
            <div className={`${viewMode === 'map' ? 'hidden md:block' : ''} space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2`}>
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  id={`event-${event.id}`}
                  onClick={() => handleMarkerClick(event)}
                  className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border transition cursor-pointer ${
                    selectedEvent?.id === event.id
                      ? 'border-purple-400 shadow-lg shadow-purple-500/30'
                      : 'border-white/20 hover:border-purple-400/50'
                  }`}
                >
                  {/* Event Type Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-4xl">
                      {getEventTypeEmoji(event.event_type)}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {event.attendee_count && (
                        <div className="bg-purple-600/50 px-3 py-1 rounded-full text-sm text-white">
                          {event.attendee_count} attending
                        </div>
                      )}
                      {userLocation && (
                        <div className="bg-blue-600/50 px-3 py-1 rounded-full text-sm text-white">
                          {getEventDistance(event)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Event Info */}
                  <h3 className="text-xl font-bold text-white mb-2">
                    {event.venue_name}
                  </h3>

                  {event.event_type && (
                    <p className="text-purple-300 text-sm mb-3">
                      {event.event_type}
                    </p>
                  )}

                  {event.description && (
                    <p className="text-gray-300 text-sm mb-4">
                      {event.description}
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
                  </div>

                  {/* Check In Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckIn(event.event_id);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg hover:shadow-purple-500/50"
                  >
                    Check In
                  </button>
                </div>
              ))}
            </div>

            {/* Map View */}
            <div className={`${viewMode === 'list' ? 'hidden md:block' : ''} sticky top-6`}>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden h-[calc(100vh-400px)] min-h-[500px]">
                {hasMapboxToken && userLocation ? (
                  <Map
                    ref={mapRef}
                    mapboxAccessToken={MAPBOX_TOKEN}
                    initialViewState={{
                      longitude: userLocation.longitude,
                      latitude: userLocation.latitude,
                      zoom: 11
                    }}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                  >
                    {/* User Location Marker */}
                    <Marker
                      longitude={userLocation.longitude}
                      latitude={userLocation.latitude}
                    >
                      <div className="relative">
                        <div className="absolute -inset-2 bg-blue-500 rounded-full opacity-50 animate-ping"></div>
                        <div className="relative text-2xl">📍</div>
                      </div>
                    </Marker>

                    {/* Event Markers */}
                    {filteredEvents.map((event) => (
                      <Marker
                        key={event.id}
                        longitude={event.longitude}
                        latitude={event.latitude}
                      >
                        <div
                          onClick={() => handleMarkerClick(event)}
                          className={`cursor-pointer transform transition-transform hover:scale-125 ${
                            selectedEvent?.id === event.id ? 'scale-125 animate-bounce' : ''
                          }`}
                        >
                          <div className="relative">
                            {selectedEvent?.id === event.id && (
                              <div className="absolute -inset-3 bg-purple-500 rounded-full opacity-50 animate-ping"></div>
                            )}
                            <div className="relative text-3xl filter drop-shadow-lg">
                              {getEventTypeEmoji(event.event_type)}
                            </div>
                          </div>
                        </div>
                      </Marker>
                    ))}

                    {/* Map Controls */}
                    <NavigationControl position="top-right" />
                    <GeolocateControl
                      position="top-right"
                      trackUserLocation
                      onGeolocate={(e: any) => {
                        setUserLocation({
                          latitude: e.coords.latitude,
                          longitude: e.coords.longitude
                        });
                      }}
                    />
                  </Map>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">🗺️</div>
                      <h3 className="text-xl font-bold text-white mb-2">Map Unavailable</h3>
                      <p className="text-gray-300 text-sm mb-4">
                        {!hasMapboxToken
                          ? 'Add a Mapbox API token to enable the interactive map'
                          : 'Waiting for location access...'}
                      </p>
                      {!hasMapboxToken && (
                        <a
                          href="https://www.mapbox.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition text-sm"
                        >
                          Get Mapbox Token
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Event Info */}
              {selectedEvent && (
                <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-purple-400">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-bold">{selectedEvent.venue_name}</h4>
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="text-gray-400 hover:text-white transition"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {selectedEvent.event_type} • {formatDate(selectedEvent.start_time)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-4">How it works</h3>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-2xl">1️⃣</span>
              <p><strong className="text-white">Find Events:</strong> Browse events on the map or in list view</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">2️⃣</span>
              <p><strong className="text-white">Check In:</strong> Tap "Check In" when you arrive at the event</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">3️⃣</span>
              <p><strong className="text-white">Be Present:</strong> Enjoy the experience and make real connections</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">4️⃣</span>
              <p><strong className="text-white">Discover Matches:</strong> After the event, see your compatible connections</p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles for Range Slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #9333ea;
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid white;
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #9333ea;
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid white;
        }
      `}</style>
    </div>
  );
}
