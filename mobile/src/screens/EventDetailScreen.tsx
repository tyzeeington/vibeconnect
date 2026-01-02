import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getEvents, checkIn, checkOut, type Event } from '../services/api';
import { useWallet } from '../context/WalletContext';
import type { RootStackParamList } from '../navigation/AppNavigator';

type EventDetailRouteProp = RouteProp<RootStackParamList, 'EventDetail'>;
type EventDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EventDetail'>;

export default function EventDetailScreen() {
  const route = useRoute<EventDetailRouteProp>();
  const navigation = useNavigation<EventDetailNavigationProp>();
  const { walletAddress } = useWallet();
  const { eventId } = route.params;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [processingCheckIn, setProcessingCheckIn] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const events = await getEvents();
      const foundEvent = events.find((e) => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
      }
    } catch (error) {
      console.error('Failed to load event:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!walletAddress) {
      Alert.alert('Wallet Required', 'Please connect your wallet to check in');
      return;
    }

    try {
      setProcessingCheckIn(true);
      await checkIn(eventId, walletAddress);
      setIsCheckedIn(true);
      Alert.alert('Success', 'You have checked in to the event!');
    } catch (error) {
      console.error('Check-in failed:', error);
      Alert.alert('Error', 'Failed to check in. Please try again.');
    } finally {
      setProcessingCheckIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!walletAddress) return;

    try {
      setProcessingCheckIn(true);
      await checkOut(eventId, walletAddress);
      setIsCheckedIn(false);
      Alert.alert('Success', 'You have checked out of the event!');
    } catch (error) {
      console.error('Check-out failed:', error);
      Alert.alert('Error', 'Failed to check out. Please try again.');
    } finally {
      setProcessingCheckIn(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#9333ea" />
          <Text style={styles.loadingText}>Loading event details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Event not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Event Header */}
        <View style={styles.header}>
          <Text style={styles.eventName}>{event.name}</Text>
          <Text style={styles.eventLocation}>📍 {event.location}</Text>
        </View>

        {/* Event Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Details</Text>

          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(event.start_time)}</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>
              {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </Text>
          </View>

          {event.max_attendees && (
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Max Attendees</Text>
              <Text style={styles.detailValue}>{event.max_attendees}</Text>
            </View>
          )}
        </View>

        {/* Check-in Status */}
        {isCheckedIn ? (
          <View style={styles.checkedInBanner}>
            <Text style={styles.checkedInText}>✓ You are checked in!</Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actionsSection}>
          {!isCheckedIn ? (
            <>
              <TouchableOpacity
                style={styles.checkInButton}
                onPress={handleCheckIn}
                disabled={processingCheckIn}
              >
                {processingCheckIn ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.checkInButtonText}>Check In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.qrButton}
                onPress={() => navigation.navigate('CheckIn', { eventId: event.id })}
              >
                <Text style={styles.qrButtonText}>Scan QR Code</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.checkOutButton}
              onPress={handleCheckOut}
              disabled={processingCheckIn}
            >
              {processingCheckIn ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.checkOutButtonText}>Check Out</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Check in to start connecting with other attendees. Your personality will be matched
            with others at this event to create authentic connections.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
  errorText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#9333ea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 32,
  },
  eventName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  eventLocation: {
    fontSize: 18,
    color: '#9333ea',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  checkedInBanner: {
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16a34a',
    marginBottom: 24,
  },
  checkedInText: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionsSection: {
    gap: 12,
    marginBottom: 24,
  },
  checkInButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  qrButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkOutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkOutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
});
