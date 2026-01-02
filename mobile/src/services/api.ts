import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface UserProfile {
  wallet_address: string;
  personality_traits: any;
  social_profiles: Record<string, string>;
  social_visibility: string;
  created_at: string;
}

export interface Event {
  id: number;
  name: string;
  location: string;
  start_time: string;
  end_time: string;
  max_attendees?: number;
}

export interface Connection {
  id: number;
  user1_address: string;
  user2_address: string;
  event_id: number;
  compatibility_score: number;
  status: string;
  created_at: string;
}

// Chat endpoints for profile creation
export interface ChatStartResponse {
  session_id: string;
  message: string;
  current_dimension: string;
  dimension_index: number;
  total_dimensions: number;
  is_complete: boolean;
  progress_percentage: number;
}

export interface ChatMessageResponse {
  session_id: string;
  message: string;
  current_dimension: string | null;
  dimension_index: number;
  total_dimensions: number;
  is_complete: boolean;
  progress_percentage: number;
}

export interface ProfileCreatedResponse {
  success: boolean;
  profile_id: number;
  dimensions: Record<string, number>;
  intentions: string[];
  insights: string;
}

export const startChatSession = async (walletAddress: string): Promise<ChatStartResponse> => {
  const response = await api.post('/api/chat/start', {
    wallet_address: walletAddress,
  });
  return response.data;
};

export const sendChatMessage = async (
  walletAddress: string,
  sessionId: string,
  message: string
): Promise<ChatMessageResponse> => {
  const response = await api.post('/api/chat/message', {
    wallet_address: walletAddress,
    session_id: sessionId,
    message: message,
  });
  return response.data;
};

export const completeChatSession = async (
  walletAddress: string,
  sessionId: string
): Promise<ProfileCreatedResponse> => {
  const response = await api.post('/api/chat/complete', {
    wallet_address: walletAddress,
    session_id: sessionId,
  });
  return response.data;
};

export const deleteChatSession = async (walletAddress: string, sessionId: string) => {
  const response = await api.delete(`/api/chat/session/${sessionId}?wallet_address=${walletAddress}`);
  return response.data;
};

// Profile endpoints
export const createProfile = async (walletAddress: string, personalityTraits: any) => {
  const response = await api.post('/profiles/', {
    wallet_address: walletAddress,
    personality_traits: personalityTraits,
  });
  return response.data;
};

export const getProfile = async (walletAddress: string): Promise<UserProfile> => {
  const response = await api.get(`/profiles/${walletAddress}`);
  return response.data;
};

export const updateSocialProfiles = async (
  walletAddress: string,
  socialProfiles: Record<string, string>,
  socialVisibility: string = 'connection_only'
) => {
  const response = await api.put(`/profiles/socials?wallet_address=${walletAddress}`, {
    social_profiles: socialProfiles,
    social_visibility: socialVisibility,
  });
  return response.data;
};

export const getSocialProfiles = async (
  walletAddress: string,
  requesterAddress: string
): Promise<{ social_profiles: Record<string, string>; can_view: boolean }> => {
  const response = await api.get(
    `/profiles/socials/${walletAddress}?requester_address=${requesterAddress}`
  );
  return response.data;
};

// Event endpoints
export const getEvents = async (): Promise<Event[]> => {
  const response = await api.get('/events/');
  return response.data;
};

export const checkIn = async (eventId: number, walletAddress: string) => {
  const response = await api.post('/events/check-in', {
    event_id: eventId,
    wallet_address: walletAddress,
  });
  return response.data;
};

export const checkOut = async (eventId: number, walletAddress: string) => {
  const response = await api.post('/events/check-out', {
    event_id: eventId,
    wallet_address: walletAddress,
  });
  return response.data;
};

// Connection endpoints
export const getConnections = async (walletAddress: string): Promise<Connection[]> => {
  const response = await api.get(`/matches/user/${walletAddress}`);
  return response.data;
};

export const acceptConnection = async (connectionId: number) => {
  const response = await api.post(`/matches/${connectionId}/accept`);
  return response.data;
};

export const getAllConnections = async (): Promise<Connection[]> => {
  const response = await api.get('/matches/');
  return response.data;
};

// Notification endpoints
export const updateDeviceToken = async (deviceToken: string) => {
  const response = await api.put('/profiles/device-token', {
    device_token: deviceToken,
  });
  return response.data;
};

export default api;
