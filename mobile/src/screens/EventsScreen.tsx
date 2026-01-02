import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getEvents, type Event } from '../services/api';
import type { RootStackParamList } from '../navigation/AppNavigator';

type EventsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Events'>;

export default function EventsScreen() {
  const navigation = useNavigation<EventsScreenNavigationProp>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
    >
      <View style={styles.eventHeader}>
        <Text style={styles.eventName}>{item.name}</Text>
        <Text style={styles.eventDate}>{formatDate(item.start_time)}</Text>
      </View>

      <View style={styles.eventInfo}>
        <Text style={styles.eventLocation}>📍 {item.location}</Text>
        <Text style={styles.eventTime}>
          🕐 {formatTime(item.start_time)} - {formatTime(item.end_time)}
        </Text>
        {item.max_attendees && (
          <Text style={styles.eventAttendees}>
            👥 Max {item.max_attendees} attendees
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.checkInButton}
        onPress={() => navigation.navigate('CheckIn', { eventId: item.id })}
      >
        <Text style={styles.checkInButtonText}>Check In</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#9333ea" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Events</Text>
        <Text style={styles.subtitle}>Find events near you and connect with others</Text>
      </View>

      {events.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>No events available</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#9333ea"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#9333ea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  eventDate: {
    fontSize: 12,
    color: '#9333ea',
    fontWeight: '600',
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventInfo: {
    gap: 8,
    marginBottom: 16,
  },
  eventLocation: {
    fontSize: 14,
    color: '#94a3b8',
  },
  eventTime: {
    fontSize: 14,
    color: '#94a3b8',
  },
  eventAttendees: {
    fontSize: 14,
    color: '#94a3b8',
  },
  checkInButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
