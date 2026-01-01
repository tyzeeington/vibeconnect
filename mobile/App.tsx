import '@walletconnect/react-native-compat';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useState } from 'react';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';

export default function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    // WalletConnect integration will go here
    // For now, simulating connection
    setWalletAddress('0x742d...4E89');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>VibeConnect 💜</Text>
          {walletAddress && (
            <View style={styles.walletBadge}>
              <Text style={styles.walletText}>{walletAddress}</Text>
            </View>
          )}
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.title}>
            Make Connection{'\n'}
            <Text style={styles.titleHighlight}>Organic</Text> Again
          </Text>
          <Text style={styles.subtitle}>
            Walk into an event, be fully present, and let the platform capture authentic vibes.
          </Text>

          {!walletAddress ? (
            <TouchableOpacity style={styles.connectButton} onPress={connectWallet}>
              <Text style={styles.connectButtonText}>Connect Wallet</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Create Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
                <Text style={styles.actionButtonText}>Find Events</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.actionButtonGreen]}>
                <Text style={styles.actionButtonText}>Connections 🔗</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🧬</Text>
            <Text style={styles.featureTitle}>5 Core Dimensions</Text>
            <Text style={styles.featureText}>
              AI analyzes your Goals, Intuition, Philosophy, Expectations, and Leisure Time
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔗</Text>
            <Text style={styles.featureTitle}>Connection NFTs</Text>
            <Text style={styles.featureText}>
              Mint co-owned memories when you mutually connect with someone
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>💰</Text>
            <Text style={styles.featureTitle}>Earn $PESO</Text>
            <Text style={styles.featureText}>
              Get rewarded for making authentic connections at events
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built with 💜 for authentic human connection
          </Text>
          <Text style={styles.footerSubtext}>Powered by Base • OpenAI • Web3</Text>
        </View>
      </ScrollView>
      <StatusBar style="light" />
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  walletBadge: {
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#9333ea',
  },
  walletText: {
    color: '#9333ea',
    fontSize: 12,
    fontWeight: '600',
  },
  hero: {
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  titleHighlight: {
    color: '#9333ea',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 32,
    lineHeight: 24,
  },
  connectButton: {
    backgroundColor: '#9333ea',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#9333ea',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: '#3b82f6',
  },
  actionButtonGreen: {
    backgroundColor: '#16a34a',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  features: {
    gap: 16,
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 40,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  footerSubtext: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
  },
});
