# Frontend Integration Guide - Enhanced Matches API

Quick reference guide for integrating the new matches/connections endpoints.

## Quick Start

### 1. Get Filtered Matches

```typescript
// Get pending matches sorted by expiration (urgency view)
const response = await fetch(
  `/api/matches/?wallet_address=${userWallet}&status=pending&sort=expiring_soon`
);
const pendingMatches = await response.json();

// Get accepted matches sorted by compatibility
const response = await fetch(
  `/api/matches/?wallet_address=${userWallet}&status=accepted&sort=compatibility`
);
const acceptedMatches = await response.json();

// Get all matches for a specific event
const response = await fetch(
  `/api/matches/?wallet_address=${userWallet}&event_id=${eventId}`
);
const eventMatches = await response.json();
```

### 2. Display Expiration Timer

```typescript
interface Match {
  match_id: number;
  time_remaining_hours: number | null;
  is_expired: boolean;
  expires_at: string | null;
  // ... other fields
}

function ExpirationTimer({ match }: { match: Match }) {
  if (match.is_expired) {
    return <Badge variant="danger">EXPIRED</Badge>;
  }

  if (match.time_remaining_hours) {
    const days = Math.floor(match.time_remaining_hours / 24);
    const hours = Math.floor(match.time_remaining_hours % 24);
    const minutes = Math.floor((match.time_remaining_hours % 1) * 60);

    if (days > 0) {
      return <span>{days}d {hours}h remaining</span>;
    } else if (hours > 0) {
      return <span className="text-warning">{hours}h {minutes}m remaining</span>;
    } else {
      return <span className="text-danger">{minutes}m remaining - Act fast!</span>;
    }
  }

  return null;
}
```

### 3. Show Mutual Connections

```typescript
async function loadMutualConnections(otherUserWallet: string) {
  const response = await fetch(
    `/api/matches/mutual-connections?user_a_wallet=${myWallet}&user_b_wallet=${otherUserWallet}`
  );
  const data = await response.json();

  return {
    count: data.mutual_connections_count,
    wallets: data.mutual_connections
  };
}

// In your component
function MutualConnectionsBadge({ otherUserWallet }: Props) {
  const [mutualCount, setMutualCount] = useState(0);

  useEffect(() => {
    loadMutualConnections(otherUserWallet).then(data => {
      setMutualCount(data.count);
    });
  }, [otherUserWallet]);

  if (mutualCount === 0) return null;

  return (
    <Badge variant="info">
      {mutualCount} mutual connection{mutualCount !== 1 ? 's' : ''}
    </Badge>
  );
}
```

### 4. Implement "Follow All" Button

```typescript
async function handleFollowAll(matchId: number) {
  try {
    const response = await fetch(
      `/api/matches/${matchId}/follow-all?requester_wallet=${myWallet}`
    );
    const data = await response.json();

    if (!data.can_access) {
      toast.error(data.message || "Cannot access social profiles");
      return;
    }

    // Open all social links
    const platforms = {
      instagram: (handle: string) => `https://instagram.com/${handle.replace('@', '')}`,
      twitter: (handle: string) => `https://twitter.com/${handle.replace('@', '')}`,
      linkedin: (handle: string) => `https://linkedin.com/in/${handle}`,
      spotify: (handle: string) => `https://open.spotify.com/user/${handle}`,
      tiktok: (handle: string) => `https://tiktok.com/@${handle.replace('@', '')}`,
      youtube: (handle: string) => `https://youtube.com/@${handle.replace('@', '')}`
    };

    Object.entries(data.social_profiles).forEach(([platform, handle]) => {
      if (platforms[platform]) {
        window.open(platforms[platform](handle), '_blank');
      }
    });

    toast.success(`Opened ${Object.keys(data.social_profiles).length} social profiles!`);
  } catch (error) {
    toast.error("Failed to load social profiles");
  }
}

// In your component
function FollowAllButton({ match }: { match: Match }) {
  if (match.status !== 'accepted') {
    return null; // Only show for accepted matches
  }

  return (
    <button
      onClick={() => handleFollowAll(match.match_id)}
      className="btn btn-primary"
    >
      Follow All 🔗
    </button>
  );
}
```

### 5. Build Connections Feed with Tabs

```typescript
function ConnectionsFeed() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'expired'>('all');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMatches();
  }, [activeTab]);

  async function loadMatches() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        wallet_address: myWallet,
        sort: activeTab === 'pending' ? 'expiring_soon' : 'newest',
        limit: '50'
      });

      if (activeTab !== 'all') {
        params.set('status', activeTab);
      }

      const response = await fetch(`/api/matches/?${params}`);
      const data = await response.json();
      setMatches(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <Spinner />
          ) : (
            <MatchList matches={matches} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 6. Implement Infinite Scroll with Pagination

```typescript
function InfiniteConnectionsFeed() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const limit = 20;

  async function loadMore() {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/matches/?wallet_address=${myWallet}&limit=${limit}&offset=${offset}&sort=newest`
      );
      const newMatches = await response.json();

      if (newMatches.length < limit) {
        setHasMore(false);
      }

      setMatches(prev => [...prev, ...newMatches]);
      setOffset(prev => prev + limit);
    } finally {
      setLoading(false);
    }
  }

  // Load initial data
  useEffect(() => {
    loadMore();
  }, []);

  return (
    <InfiniteScroll
      dataLength={matches.length}
      next={loadMore}
      hasMore={hasMore}
      loader={<Spinner />}
      endMessage={<p>No more matches</p>}
    >
      {matches.map(match => (
        <MatchCard key={match.match_id} match={match} />
      ))}
    </InfiniteScroll>
  );
}
```

### 7. Display Compatibility Breakdown

```typescript
function CompatibilityBreakdown({ match }: { match: Match }) {
  const dimensions = [
    { key: 'goals', label: 'Goals', icon: '🎯' },
    { key: 'intuition', label: 'Intuition', icon: '🧠' },
    { key: 'philosophy', label: 'Philosophy', icon: '💭' },
    { key: 'expectations', label: 'Expectations', icon: '🤝' },
    { key: 'leisure_time', label: 'Leisure', icon: '🎮' }
  ];

  return (
    <div className="compatibility-breakdown">
      <h3>Compatibility: {match.compatibility_score}%</h3>
      <div className="dimensions">
        {dimensions.map(dim => {
          const score = match.dimension_alignment[dim.key] || 0;
          return (
            <div key={dim.key} className="dimension">
              <span>{dim.icon} {dim.label}</span>
              <ProgressBar value={score} max={100} />
              <span>{score.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 8. Event Context Display

```typescript
function EventContext({ match }: { match: Match }) {
  return (
    <div className="event-context">
      <MapPin size={16} />
      <span>
        Met at <strong>{match.event_name || match.event_id}</strong>
      </span>
      <span className="text-muted">
        {new Date(match.created_at).toLocaleDateString()}
      </span>
      {match.proximity_overlap_minutes > 0 && (
        <Badge variant="secondary">
          {Math.floor(match.proximity_overlap_minutes / 60)}h together
        </Badge>
      )}
    </div>
  );
}
```

### 9. Advanced Filtering Example

```typescript
function AdvancedConnectionsFilter() {
  const [filters, setFilters] = useState({
    status: 'all',
    eventId: '',
    sort: 'newest'
  });

  async function applyFilters() {
    const params = new URLSearchParams({
      wallet_address: myWallet,
      sort: filters.sort
    });

    if (filters.status !== 'all') {
      params.set('status', filters.status);
    }

    if (filters.eventId) {
      params.set('event_id', filters.eventId);
    }

    const response = await fetch(`/api/matches/?${params}`);
    const matches = await response.json();
    return matches;
  }

  return (
    <div className="filters">
      <select
        value={filters.status}
        onChange={e => setFilters({...filters, status: e.target.value})}
      >
        <option value="all">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="accepted">Accepted</option>
        <option value="expired">Expired</option>
      </select>

      <select
        value={filters.sort}
        onChange={e => setFilters({...filters, sort: e.target.value})}
      >
        <option value="newest">Newest First</option>
        <option value="compatibility">Best Match</option>
        <option value="expiring_soon">Expiring Soon</option>
      </select>

      <input
        type="text"
        placeholder="Event ID (optional)"
        value={filters.eventId}
        onChange={e => setFilters({...filters, eventId: e.target.value})}
      />

      <button onClick={applyFilters}>Apply Filters</button>
    </div>
  );
}
```

### 10. Real-time Countdown Component

```typescript
function LiveCountdown({ match }: { match: Match }) {
  const [timeRemaining, setTimeRemaining] = useState(match.time_remaining_hours || 0);

  useEffect(() => {
    if (!match.expires_at) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiresAt = new Date(match.expires_at!);
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(0);
        clearInterval(interval);
      } else {
        setTimeRemaining(diff / (1000 * 60 * 60)); // Convert to hours
      }
    }, 1000 * 60); // Update every minute

    return () => clearInterval(interval);
  }, [match.expires_at]);

  if (timeRemaining <= 0) {
    return <Badge variant="danger">EXPIRED</Badge>;
  }

  const days = Math.floor(timeRemaining / 24);
  const hours = Math.floor(timeRemaining % 24);
  const urgency = timeRemaining < 24 ? 'danger' : timeRemaining < 48 ? 'warning' : 'info';

  return (
    <Badge variant={urgency}>
      ⏰ {days}d {hours}h remaining
    </Badge>
  );
}
```

## Mobile App Integration (React Native)

### Deep Links for Social Platforms

```typescript
// mobile/src/utils/socialDeepLinks.ts
import { Linking, Platform } from 'react-native';

const SOCIAL_DEEP_LINKS = {
  instagram: {
    ios: (handle: string) => `instagram://user?username=${handle.replace('@', '')}`,
    android: (handle: string) => `instagram://user?username=${handle.replace('@', '')}`,
    web: (handle: string) => `https://instagram.com/${handle.replace('@', '')}`
  },
  twitter: {
    ios: (handle: string) => `twitter://user?screen_name=${handle.replace('@', '')}`,
    android: (handle: string) => `twitter://user?screen_name=${handle.replace('@', '')}`,
    web: (handle: string) => `https://twitter.com/${handle.replace('@', '')}`
  },
  spotify: {
    ios: (handle: string) => `spotify://user/${handle}`,
    android: (handle: string) => `spotify://user/${handle}`,
    web: (handle: string) => `https://open.spotify.com/user/${handle}`
  }
};

export async function openSocialProfile(platform: string, handle: string) {
  const links = SOCIAL_DEEP_LINKS[platform];
  if (!links) return;

  const deepLink = Platform.OS === 'ios' ? links.ios(handle) : links.android(handle);

  try {
    const supported = await Linking.canOpenURL(deepLink);
    if (supported) {
      await Linking.openURL(deepLink);
    } else {
      // Fallback to web
      await Linking.openURL(links.web(handle));
    }
  } catch (error) {
    console.error('Failed to open social profile:', error);
  }
}

export async function openAllSocialProfiles(profiles: Record<string, string>) {
  for (const [platform, handle] of Object.entries(profiles)) {
    await openSocialProfile(platform, handle);
    // Add small delay to prevent overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
```

### Pull-to-Refresh Example

```typescript
// mobile/src/screens/ConnectionsScreen.tsx
import { RefreshControl, FlatList } from 'react-native';

function ConnectionsScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    try {
      const response = await fetch(
        `/api/matches/?wallet_address=${wallet}&status=pending&sort=expiring_soon`
      );
      const data = await response.json();
      setMatches(data);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <FlatList
      data={matches}
      renderItem={({ item }) => <MatchCard match={item} />}
      keyExtractor={item => item.match_id.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}
```

## Error Handling

```typescript
async function safeApiCall<T>(
  apiCall: () => Promise<Response>
): Promise<{ data?: T; error?: string }> {
  try {
    const response = await apiCall();

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'An error occurred' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
}

// Usage
const { data, error } = await safeApiCall<Match[]>(() =>
  fetch(`/api/matches/?wallet_address=${wallet}`)
);

if (error) {
  toast.error(error);
} else if (data) {
  setMatches(data);
}
```

## TypeScript Types

```typescript
// types/matches.ts
export enum MatchStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export interface Match {
  match_id: number;
  user_id: number;
  username: string | null;
  wallet_address: string;
  compatibility_score: number;
  dimension_alignment: Record<string, number>;
  proximity_overlap_minutes: number;
  event_id: string;
  event_name: string | null;
  status: MatchStatus;
  created_at: string;
  expires_at: string | null;
  is_expired: boolean;
  time_remaining_hours: number | null;
}

export interface MutualConnectionsResponse {
  user_a_wallet: string;
  user_b_wallet: string;
  mutual_connections_count: number;
  mutual_connections: string[];
}

export interface SocialLinksResponse {
  match_id: number;
  connection_id: number | null;
  other_user_wallet: string;
  other_user_username: string | null;
  social_profiles: Record<string, string>;
  can_access: boolean;
  message: string | null;
}
```

## Common Patterns

### 1. Loading States
```typescript
const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
```

### 2. Optimistic Updates
```typescript
function optimisticallyAcceptMatch(matchId: number) {
  // Update UI immediately
  setMatches(prev =>
    prev.map(m => m.match_id === matchId ? {...m, status: 'accepted'} : m)
  );

  // Then sync with backend
  fetch(`/api/matches/respond`, {
    method: 'POST',
    body: JSON.stringify({ match_id: matchId, accept: true })
  }).catch(() => {
    // Revert on failure
    loadMatches();
  });
}
```

### 3. Debounced Filtering
```typescript
import { debounce } from 'lodash';

const debouncedFilter = debounce((filters) => {
  loadMatches(filters);
}, 300);
```

## Summary

Use the new unified `/api/matches/` endpoint with query parameters for all match-related operations. The API provides:
- Flexible filtering (status, event)
- Multiple sorting options (newest, compatibility, expiring soon)
- Pagination (limit/offset)
- Expiration tracking
- Mutual connections
- Social profile access

For questions or issues, refer to `/backend/ENHANCED_MATCHES_API.md` for detailed documentation.
