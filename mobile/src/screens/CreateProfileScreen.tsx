import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWallet } from '../context/WalletContext';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  startChatSession,
  sendChatMessage,
  completeChatSession,
  deleteChatSession,
  ProfileCreatedResponse,
} from '../services/api';

type CreateProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateProfile'>;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Dimension {
  key: string;
  label: string;
  completed: boolean;
}

const DIMENSIONS: Dimension[] = [
  { key: 'goals', label: 'Goals', completed: false },
  { key: 'intuition', label: 'Intuition', completed: false },
  { key: 'philosophy', label: 'Philosophy', completed: false },
  { key: 'expectations', label: 'Expectations', completed: false },
  { key: 'leisure_time', label: 'Leisure', completed: false },
];

const CHAT_STORAGE_KEY = 'vibeconnect_chat_history';

export default function CreateProfileScreen() {
  const navigation = useNavigation<CreateProfileNavigationProp>();
  const { walletAddress } = useWallet();
  const scrollViewRef = useRef<ScrollView>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0);
  const [dimensions, setDimensions] = useState<Dimension[]>(DIMENSIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [profileData, setProfileData] = useState<ProfileCreatedResponse | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    saveChatHistory();
  }, [messages, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(`${CHAT_STORAGE_KEY}_${walletAddress}`);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.sessionId && data.messages && data.messages.length > 0) {
          setSessionId(data.sessionId);
          setMessages(data.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
          setHasStarted(true);
          setDimensions(data.dimensions || DIMENSIONS);
          setCurrentDimensionIndex(data.currentDimensionIndex || 0);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveChatHistory = async () => {
    if (!sessionId || messages.length === 0) return;

    try {
      await AsyncStorage.setItem(
        `${CHAT_STORAGE_KEY}_${walletAddress}`,
        JSON.stringify({
          sessionId,
          messages,
          dimensions,
          currentDimensionIndex,
        })
      );
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const clearChatHistory = async () => {
    try {
      await AsyncStorage.removeItem(`${CHAT_STORAGE_KEY}_${walletAddress}`);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const addMessage = (text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      text,
      isUser,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleStart = async () => {
    if (!walletAddress) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await startChatSession(walletAddress);
      setSessionId(response.session_id);
      setHasStarted(true);
      addMessage(response.message, false);
      setCurrentDimensionIndex(response.dimension_index);
    } catch (err: any) {
      console.error('Error starting chat:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to start chat. Please try again.';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    if (!currentInput.trim() || !sessionId || !walletAddress || isProcessing) return;

    const userMessage = currentInput.trim();
    setCurrentInput('');
    addMessage(userMessage, true);
    setIsProcessing(true);
    setIsTyping(true);
    setError(null);

    try {
      const response = await sendChatMessage(walletAddress, sessionId, userMessage);

      // Mark current dimension as completed
      setDimensions((prev) =>
        prev.map((dim, idx) =>
          idx === currentDimensionIndex ? { ...dim, completed: true } : dim
        )
      );

      // Simulate typing delay
      setTimeout(() => {
        setIsTyping(false);
        addMessage(response.message, false);
        setCurrentDimensionIndex(response.dimension_index);
        setIsComplete(response.is_complete);

        if (response.is_complete) {
          // All questions answered, complete the session
          handleComplete();
        } else {
          setIsProcessing(false);
        }
      }, 1000);
    } catch (err: any) {
      console.error('Error sending message:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to send message. Please try again.';
      setError(errorMsg);
      setIsTyping(false);
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!sessionId || !walletAddress) return;

    try {
      const response = await completeChatSession(walletAddress, sessionId);
      setProfileData(response);
      setShowConfirmation(true);

      const insightsText = `Your personality profile is ready!\n\n${response.insights}\n\nYour top intentions: ${response.intentions.join(', ')}\n\nWould you like to create your profile?`;
      addMessage(insightsText, false);
    } catch (err: any) {
      console.error('Error completing profile:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to create profile. Please try again.';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmProfile = async () => {
    addMessage('Perfect! Your profile has been created successfully.', false);
    await clearChatHistory();

    setTimeout(() => {
      Alert.alert(
        'Profile Created!',
        'Your personality profile is ready. Start attending events to make connections!',
        [
          {
            text: 'Go to Profile',
            onPress: () => navigation.navigate('MainTabs', { screen: 'Profile' }),
          },
        ]
      );
    }, 1000);
  };

  const handleSkip = async () => {
    if (!sessionId || isProcessing) return;

    const skipMessage = 'I prefer to skip this question';
    setCurrentInput('');
    addMessage(skipMessage, true);
    setIsProcessing(true);
    setIsTyping(true);
    setError(null);

    try {
      if (!walletAddress) return;

      const response = await sendChatMessage(walletAddress, sessionId, skipMessage);

      setDimensions((prev) =>
        prev.map((dim, idx) =>
          idx === currentDimensionIndex ? { ...dim, completed: true } : dim
        )
      );

      setTimeout(() => {
        setIsTyping(false);
        addMessage(response.message, false);
        setCurrentDimensionIndex(response.dimension_index);
        setIsComplete(response.is_complete);

        if (response.is_complete) {
          handleComplete();
        } else {
          setIsProcessing(false);
        }
      }, 1000);
    } catch (err: any) {
      console.error('Error skipping:', err);
      setIsTyping(false);
      setIsProcessing(false);
    }
  };

  const handleRestart = async () => {
    Alert.alert(
      'Restart Profile Creation?',
      'This will delete your current progress. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          style: 'destructive',
          onPress: async () => {
            if (sessionId && walletAddress) {
              try {
                await deleteChatSession(walletAddress, sessionId);
              } catch (err) {
                console.error('Error deleting session:', err);
              }
            }

            await clearChatHistory();
            setSessionId(null);
            setMessages([]);
            setCurrentInput('');
            setIsProcessing(false);
            setIsTyping(false);
            setHasStarted(false);
            setCurrentDimensionIndex(0);
            setDimensions(DIMENSIONS);
            setIsComplete(false);
            setProfileData(null);
            setShowConfirmation(false);
            setError(null);
          },
        },
      ]
    );
  };

  if (!walletAddress) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Please connect your wallet to create a profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Header with Restart Button */}
        {hasStarted && !showConfirmation && (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Profile Creation</Text>
            <TouchableOpacity onPress={handleRestart}>
              <Text style={styles.restartButton}>Restart</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progress Indicator */}
        {hasStarted && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Your Progress</Text>
              <Text style={styles.progressCount}>
                {dimensions.filter((d) => d.completed).length} / {dimensions.length}
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(dimensions.filter((d) => d.completed).length / dimensions.length) * 100}%`,
                  },
                ]}
              />
            </View>

            {/* Dimension Badges */}
            <View style={styles.dimensionBadges}>
              {dimensions.map((dim, idx) => (
                <View
                  key={dim.key}
                  style={[
                    styles.dimensionBadge,
                    dim.completed && styles.dimensionBadgeCompleted,
                    idx === currentDimensionIndex &&
                      !dim.completed &&
                      styles.dimensionBadgeCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.dimensionBadgeText,
                      dim.completed && styles.dimensionBadgeTextCompleted,
                      idx === currentDimensionIndex &&
                        !dim.completed &&
                        styles.dimensionBadgeTextCurrent,
                    ]}
                  >
                    {dim.completed ? '✓ ' : ''}
                    {dim.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={scrollToBottom}
        >
          {!hasStarted ? (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeEmoji}>💬</Text>
              <Text style={styles.welcomeTitle}>Welcome to Profile Creation!</Text>
              <Text style={styles.welcomeText}>
                I'll guide you through 5 questions to understand your personality. This helps us
                match you with compatible people at events.
              </Text>
            </View>
          ) : (
            <>
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  {!message.isUser && (
                    <View style={styles.aiHeader}>
                      <Text style={styles.aiEmoji}>🤖</Text>
                      <Text style={styles.aiLabel}>AI Assistant</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      message.isUser ? styles.userText : styles.aiText,
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
              ))}

              {isTyping && (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator color="#9333ea" size="small" />
                  <Text style={styles.typingText}>AI is typing...</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Input Area */}
        {!hasStarted ? (
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStart}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.startButtonText}>Let's Begin</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : showConfirmation ? (
          <View style={styles.inputContainer}>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleRestart}>
                <Text style={styles.secondaryButtonText}>Start Over</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleConfirmProfile}>
                <Text style={styles.primaryButtonText}>Confirm & Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : !isComplete ? (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={currentInput}
              onChangeText={setCurrentInput}
              placeholder="Type your answer..."
              placeholderTextColor="#64748b"
              multiline
              maxLength={500}
              editable={!isProcessing}
            />
            <View style={styles.inputActions}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                disabled={isProcessing}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!currentInput.trim() || isProcessing) && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!currentInput.trim() || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.sendButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  restartButton: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  errorMessage: {
    color: '#fca5a5',
    fontSize: 13,
  },
  errorText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  progressCount: {
    fontSize: 12,
    color: '#a78bfa',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9333ea',
  },
  dimensionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dimensionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dimensionBadgeCompleted: {
    backgroundColor: 'rgba(147, 51, 234, 0.3)',
    borderColor: 'rgba(147, 51, 234, 0.5)',
  },
  dimensionBadgeCurrent: {
    backgroundColor: 'rgba(250, 204, 21, 0.3)',
    borderColor: 'rgba(250, 204, 21, 0.5)',
  },
  dimensionBadgeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  dimensionBadgeTextCompleted: {
    color: '#c4b5fd',
  },
  dimensionBadgeTextCurrent: {
    color: '#fde047',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#9333ea',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  aiEmoji: {
    fontSize: 16,
  },
  aiLabel: {
    fontSize: 11,
    color: '#a78bfa',
    fontWeight: '600',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#e2e8f0',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  typingText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  startButton: {
    backgroundColor: '#9333ea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    marginBottom: 12,
  },
  inputActions: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    flex: 2,
    backgroundColor: '#9333ea',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#9333ea',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
