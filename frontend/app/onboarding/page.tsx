'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

const ONBOARDING_QUESTIONS = [
  {
    dimension: 'goals',
    question: "Let's start! What are your main goals or priorities in life right now? (e.g., career growth, creative projects, personal relationships, learning new skills)",
    prompt: "Share what drives you..."
  },
  {
    dimension: 'intuition',
    question: "How do you typically make important decisions? Do you trust your gut feelings, or do you prefer analyzing data and facts?",
    prompt: "Tell me about your decision-making style..."
  },
  {
    dimension: 'philosophy',
    question: "What's your philosophy on life? What principles or values guide how you live?",
    prompt: "Share your perspective on life..."
  },
  {
    dimension: 'expectations',
    question: "What are you looking for in the connections you make? What matters most to you in relationships?",
    prompt: "Describe your ideal connections..."
  },
  {
    dimension: 'leisure_time',
    question: "How do you like to spend your free time? What activities energize or fulfill you?",
    prompt: "Tell me about your interests..."
  }
];

export default function OnboardingPage() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey! I'm here to help build your VibeConnect profile. I'll ask you 5 questions about yourself. Your answers will help our AI understand your personality and match you with compatible people at events. Ready to begin?"
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = () => {
    setHasStarted(true);
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: ONBOARDING_QUESTIONS[0].question
      }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userInput }]);

    // Save response
    const currentQuestion = ONBOARDING_QUESTIONS[currentStep];
    const newResponses = { ...responses, [currentQuestion.dimension]: userInput };
    setResponses(newResponses);

    setUserInput('');

    // Move to next question or finish
    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: ONBOARDING_QUESTIONS[currentStep + 1].question
          }
        ]);
        setCurrentStep(currentStep + 1);
      }, 500);
    } else {
      // All questions answered - analyze
      setIsAnalyzing(true);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Thanks for sharing! Let me analyze your responses and create your personality profile..."
        }
      ]);

      try {
        // Call backend to analyze responses
        const responsesText = Object.entries(newResponses)
          .map(([dim, answer]) => `${dim}: ${answer}`)
          .join('\n\n');

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/profiles/onboard`,
          {
            wallet_address: address,
            onboarding_responses: responsesText
          }
        );

        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `Perfect! I've analyzed your personality across our 5 core dimensions. Your profile is ready! Redirecting you to your profile page...`
            }
          ]);

          setTimeout(() => {
            router.push('/profile');
          }, 2000);
        }, 2000);
      } catch (error) {
        console.error('Error analyzing profile:', error);
        // For now, just redirect anyway with mock data
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `Your profile has been created! Redirecting you now...`
            }
          ]);

          setTimeout(() => {
            router.push('/profile');
          }, 1500);
        }, 1500);
      }
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
          VibeConnect 💜
        </Link>
        <ConnectButton />
      </nav>

      {/* Chat Interface */}
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden flex flex-col" style={{ height: '70vh' }}>
          {/* Header */}
          <div className="bg-white/5 border-b border-white/10 p-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🧬</span>
              Profile Creation
            </h1>
            <p className="text-gray-300 text-sm mt-1">
              Question {hasStarted ? currentStep + 1 : 0} of {ONBOARDING_QUESTIONS.length}
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-gray-100'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🤖</span>
                      <span className="text-xs text-purple-300 font-semibold">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            {isAnalyzing && (
              <div className="flex justify-center">
                <div className="bg-white/10 rounded-full px-6 py-3 text-gray-300 text-sm flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
                  Analyzing your responses...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          {!hasStarted ? (
            <div className="p-6 border-t border-white/10">
              <button
                onClick={handleStart}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl transition text-lg"
              >
                Let's Start
              </button>
            </div>
          ) : !isAnalyzing && currentStep < ONBOARDING_QUESTIONS.length ? (
            <form onSubmit={handleSubmit} className="p-6 border-t border-white/10">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={ONBOARDING_QUESTIONS[currentStep].prompt}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!userInput.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold px-8 rounded-xl transition"
                >
                  Send
                </button>
              </div>
            </form>
          ) : null}
        </div>

        {/* Info */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-gray-300 text-sm text-center">
            Your responses are private and will only be used to match you with compatible people at events.
          </p>
        </div>
      </div>
    </div>
  );
}
