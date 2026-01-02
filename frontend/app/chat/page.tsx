'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  role: 'assistant' | 'user';
  content: string;
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

export default function ChatPage() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0);
  const [dimensions, setDimensions] = useState<Dimension[]>(DIMENSIONS);
  const [isComplete, setIsComplete] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStart = async () => {
    if (!address) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/api/chat/start`, {
        wallet_address: address,
      });

      setSessionId(response.data.session_id);
      setHasStarted(true);
      setMessages([
        {
          role: 'assistant',
          content: response.data.message,
        },
      ]);
      setCurrentDimensionIndex(response.data.dimension_index);
    } catch (err: any) {
      console.error('Error starting chat:', err);
      setError(err.response?.data?.detail || 'Failed to start chat session. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    if (!userInput.trim() || !sessionId || isProcessing) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/api/chat/message`, {
        wallet_address: address,
        session_id: sessionId,
        message: userMessage,
      });

      // Mark current dimension as completed
      setDimensions((prev) =>
        prev.map((dim, idx) =>
          idx === currentDimensionIndex ? { ...dim, completed: true } : dim
        )
      );

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.message,
        },
      ]);

      setCurrentDimensionIndex(response.data.dimension_index);
      setIsComplete(response.data.is_complete);

      if (response.data.is_complete) {
        // All questions answered, complete the session
        handleComplete();
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.detail || 'Failed to send message. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!sessionId || !address) return;

    try {
      const response = await axios.post(`${API_URL}/api/chat/complete`, {
        wallet_address: address,
        session_id: sessionId,
      });

      setProfileData(response.data);
      setShowConfirmation(true);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Your personality profile is ready! Here's what I learned about you:\n\n${response.data.insights}\n\nYour top intentions: ${response.data.intentions.join(', ')}\n\nWould you like to create your profile with these results?`,
        },
      ]);
    } catch (err: any) {
      console.error('Error completing profile:', err);
      setError(err.response?.data?.detail || 'Failed to create profile. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmProfile = () => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: 'Perfect! Your profile has been created. Redirecting you to your profile page...',
      },
    ]);

    setTimeout(() => {
      router.push('/profile');
    }, 2000);
  };

  const handleSkip = async () => {
    if (!sessionId || isProcessing) return;

    setUserInput('I prefer to skip this question');
    await handleSend();
  };

  const handleRestart = async () => {
    if (sessionId && address) {
      try {
        await axios.delete(`${API_URL}/api/chat/session/${sessionId}?wallet_address=${address}`);
      } catch (err) {
        console.error('Error deleting session:', err);
      }
    }

    setSessionId(null);
    setMessages([]);
    setUserInput('');
    setIsProcessing(false);
    setHasStarted(false);
    setCurrentDimensionIndex(0);
    setDimensions(DIMENSIONS);
    setIsComplete(false);
    setProfileData(null);
    setShowConfirmation(false);
    setError(null);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
        <nav className="flex justify-between items-center p-6">
          <Link href="/" className="text-2xl font-bold text-white">
            VibeConnect
          </Link>
          <ConnectButton />
        </nav>

        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md border border-white/20 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-300 mb-6">
              Please connect your wallet to create your profile
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
      <nav className="flex justify-between items-center p-6">
        <Link href="/" className="text-2xl font-bold text-white">
          VibeConnect
        </Link>
        <div className="flex items-center gap-4">
          {hasStarted && !showConfirmation && (
            <button
              onClick={handleRestart}
              className="text-sm text-gray-300 hover:text-white transition"
            >
              Restart
            </button>
          )}
          <ConnectButton />
        </div>
      </nav>

      {/* Main Container */}
      <div className="container mx-auto px-6 py-6 max-w-4xl">
        {/* Progress Bar */}
        {hasStarted && (
          <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-semibold">Your Progress</h3>
              <span className="text-purple-300 text-sm font-medium">
                {dimensions.filter((d) => d.completed).length} / {dimensions.length} completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{
                  width: `${(dimensions.filter((d) => d.completed).length / dimensions.length) * 100}%`,
                }}
              />
            </div>

            {/* Dimension Badges */}
            <div className="flex flex-wrap gap-2">
              {dimensions.map((dim, idx) => (
                <div
                  key={dim.key}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    dim.completed
                      ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
                      : idx === currentDimensionIndex
                      ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/50 animate-pulse'
                      : 'bg-white/5 text-gray-400 border border-white/10'
                  }`}
                >
                  {dim.completed && '✓ '}
                  {dim.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/50">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Chat Container */}
        <div
          className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden flex flex-col"
          style={{ height: hasStarted ? '60vh' : 'auto' }}
        >
          {/* Header */}
          <div className="bg-white/5 border-b border-white/10 p-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🧬</span>
              AI Profile Creation
            </h1>
            <p className="text-gray-300 text-sm mt-1">
              {hasStarted
                ? `Currently on: ${dimensions[currentDimensionIndex]?.label || 'Complete'}`
                : 'Create your personality profile with AI'}
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!hasStarted ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Welcome to Profile Creation!
                </h2>
                <p className="text-gray-300 mb-6 max-w-md mx-auto">
                  I'll guide you through 5 questions to understand your personality. This helps us
                  match you with compatible people at events.
                </p>
                <button
                  onClick={handleStart}
                  disabled={isProcessing}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition text-lg"
                >
                  {isProcessing ? 'Starting...' : "Let's Begin"}
                </button>
              </div>
            ) : (
              <>
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-gray-100 border border-white/10'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">🤖</span>
                          <span className="text-xs text-purple-300 font-semibold">
                            AI Assistant
                          </span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-line">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}

                {isProcessing && !showConfirmation && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-full px-6 py-3 text-gray-300 text-sm flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
                      Analyzing...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          {hasStarted && !showConfirmation && !isComplete && (
            <div className="p-6 border-t border-white/10">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your answer..."
                  disabled={isProcessing}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition disabled:opacity-50"
                  autoFocus
                />
                <button
                  onClick={handleSkip}
                  disabled={isProcessing}
                  className="bg-white/5 hover:bg-white/10 disabled:bg-gray-600/50 disabled:cursor-not-allowed border border-white/20 text-gray-300 font-medium px-6 rounded-xl transition"
                >
                  Skip
                </button>
                <button
                  onClick={handleSend}
                  disabled={!userInput.trim() || isProcessing}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold px-8 rounded-xl transition"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Buttons */}
          {showConfirmation && (
            <div className="p-6 border-t border-white/10">
              <div className="flex gap-3">
                <button
                  onClick={handleRestart}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/20 text-gray-300 font-medium py-4 rounded-xl transition"
                >
                  Start Over
                </button>
                <button
                  onClick={handleConfirmProfile}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl transition"
                >
                  Confirm & Create Profile
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-gray-300 text-sm text-center">
            Your responses are private and secure. They're only used to match you with compatible
            people at events.
          </p>
        </div>
      </div>
    </div>
  );
}
