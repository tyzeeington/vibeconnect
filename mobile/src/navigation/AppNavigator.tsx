import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EventsScreen from '../screens/EventsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import CheckInScreen from '../screens/CheckInScreen';
import ConnectionsScreen from '../screens/ConnectionsScreen';
import ConnectionDetailScreen from '../screens/ConnectionDetailScreen';
import CreateProfileScreen from '../screens/CreateProfileScreen';
import SocialProfilesScreen from '../screens/SocialProfilesScreen';

// Define navigation types
export type RootStackParamList = {
  Home: undefined;
  MainTabs: { screen?: string } | undefined;
  Events: undefined;
  EventDetail: { eventId: number };
  CheckIn: { eventId: number };
  ConnectionDetail: { connectionId: number };
  CreateProfile: undefined;
  SocialProfiles: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Events: undefined;
  Connections: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

// Tab Bar Icon Component
function TabBarIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Events: '📅',
    Connections: '🔗',
    Profile: '👤',
  };

  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>
      {icons[label] || '•'}
    </Text>
  );
}

// Bottom Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#9333ea',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused }) => (
          <TabBarIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'VibeConnect',
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          title: 'Events',
        }}
      />
      <Tab.Screen
        name="Connections"
        component={ConnectionsScreen}
        options={{
          title: 'Connections',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  // Deep linking configuration
  const linking = {
    prefixes: ['vibeconnect://', 'https://vibeconnect.app'],
    config: {
      screens: {
        Home: '',
        MainTabs: {
          path: 'app',
          screens: {
            Home: 'home',
            Events: 'events',
            Connections: 'connections',
            Profile: 'profile',
          },
        },
        EventDetail: {
          path: 'event/:eventId',
          parse: {
            eventId: (eventId: string) => Number(eventId),
          },
        },
        CheckIn: {
          path: 'checkin/:eventId',
          parse: {
            eventId: (eventId: string) => Number(eventId),
          },
        },
        ConnectionDetail: {
          path: 'connection/:connectionId',
          parse: {
            connectionId: (connectionId: string) => Number(connectionId),
          },
        },
        CreateProfile: 'create-profile',
        SocialProfiles: 'social-profiles',
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#0f172a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitle: 'Back',
          contentStyle: {
            backgroundColor: '#0f172a',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Events"
          component={EventsScreen}
          options={{
            title: 'Events',
          }}
        />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{
            title: 'Event Details',
          }}
        />
        <Stack.Screen
          name="CheckIn"
          component={CheckInScreen}
          options={{
            title: 'Check In',
          }}
        />
        <Stack.Screen
          name="ConnectionDetail"
          component={ConnectionDetailScreen}
          options={{
            title: 'Connection',
          }}
        />
        <Stack.Screen
          name="CreateProfile"
          component={CreateProfileScreen}
          options={{
            title: 'Create Profile',
            headerBackVisible: true,
          }}
        />
        <Stack.Screen
          name="SocialProfiles"
          component={SocialProfilesScreen}
          options={{
            title: 'Social Profiles',
            headerBackVisible: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
