'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6">
        <div className="text-2xl font-bold text-white">
          VibeConnect 💜
        </div>
        <ConnectButton />
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-white mb-6">
            Make Connection <span className="text-purple-400">Organic</span> Again
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Walk into an event, be fully present, and let the platform capture authentic vibes.
            After the event, discover people you aligned with based on proximity, intentions, and your 5 core dimensions.
          </p>

          {isConnected ? (
            <div className="space-x-4">
              <Link
                href="/onboarding"
                className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition"
              >
                Create Profile
              </Link>
              <Link
                href="/profile"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition"
              >
                View Profile
              </Link>
              <Link
                href="/events"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition"
              >
                Find Events
              </Link>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto border border-white/20">
              <p className="text-white mb-4">Connect your wallet to get started</p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-4xl mb-4">🧬</div>
            <h3 className="text-xl font-bold text-white mb-2">5 Core Dimensions</h3>
            <p className="text-gray-300">
              AI analyzes your Goals, Intuition, Philosophy, Expectations, and Leisure Time
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-bold text-white mb-2">Connection NFTs</h3>
            <p className="text-gray-300">
              Mint co-owned memories when you mutually connect with someone
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-white mb-2">Earn $PESO</h3>
            <p className="text-gray-300">
              Get rewarded for making authentic connections at events
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-400 py-8">
        <p>Built with 💜 for authentic human connection in a digital world</p>
        <p className="text-sm mt-2">Powered by Base • OpenAI • Web3</p>
      </footer>
    </div>
  );
}
