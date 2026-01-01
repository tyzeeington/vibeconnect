import { Core } from '@walletconnect/core';
import { Web3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WALLET_CONNECT_PROJECT_ID = 'a3daa77487c8eb6cc5f861ef4d01f6fa';

class WalletConnectService {
  private web3wallet: Web3Wallet | null = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      const core = new Core({
        projectId: WALLET_CONNECT_PROJECT_ID,
      });

      this.web3wallet = await Web3Wallet.init({
        core,
        metadata: {
          name: 'VibeConnect',
          description: 'Make connection organic again',
          url: 'https://vibeconnect.app',
          icons: ['https://vibeconnect-plum.vercel.app/icon-192.png'],
        },
      });

      this.setupEventListeners();
      this.initialized = true;
      console.log('WalletConnect initialized');
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      throw error;
    }
  }

  private setupEventListeners() {
    if (!this.web3wallet) return;

    this.web3wallet.on('session_proposal', async (proposal) => {
      console.log('Session proposal:', proposal);
      // Auto-approve for VibeConnect dApp
      await this.approveSession(proposal);
    });

    this.web3wallet.on('session_request', async (requestEvent) => {
      console.log('Session request:', requestEvent);
      // Handle signing requests
    });

    this.web3wallet.on('session_delete', () => {
      console.log('Session deleted');
    });
  }

  async approveSession(proposal: Web3WalletTypes.SessionProposal) {
    if (!this.web3wallet) throw new Error('WalletConnect not initialized');

    try {
      const approvedNamespaces = buildApprovedNamespaces({
        proposal: proposal.params,
        supportedNamespaces: {
          eip155: {
            chains: ['eip155:84532'], // Base Sepolia
            methods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData'],
            events: ['chainChanged', 'accountsChanged'],
            accounts: [], // Will be populated with actual wallet address
          },
        },
      });

      await this.web3wallet.approveSession({
        id: proposal.id,
        namespaces: approvedNamespaces,
      });

      console.log('Session approved');
    } catch (error) {
      console.error('Failed to approve session:', error);
      await this.web3wallet.rejectSession({
        id: proposal.id,
        reason: getSdkError('USER_REJECTED'),
      });
    }
  }

  async connect(uri: string): Promise<string | null> {
    await this.initialize();

    try {
      // Pair with the dApp using WalletConnect URI
      await this.web3wallet!.core.pairing.pair({ uri });

      // For demo purposes, we'll simulate wallet connection
      // In production, you'd integrate with actual wallet providers
      const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f04E89';

      // Store session
      await AsyncStorage.setItem('wallet_address', mockAddress);

      return mockAddress;
    } catch (error) {
      console.error('Connection failed:', error);
      return null;
    }
  }

  async disconnect() {
    if (!this.web3wallet) return;

    try {
      const sessions = this.web3wallet.getActiveSessions();
      const sessionKeys = Object.keys(sessions);

      for (const key of sessionKeys) {
        await this.web3wallet.disconnectSession({
          topic: key,
          reason: getSdkError('USER_DISCONNECTED'),
        });
      }

      await AsyncStorage.removeItem('wallet_address');
      console.log('Disconnected');
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }

  async getStoredAddress(): Promise<string | null> {
    return await AsyncStorage.getItem('wallet_address');
  }

  async signMessage(message: string): Promise<string | null> {
    // Implement message signing
    // This would integrate with the actual wallet provider
    console.log('Sign message:', message);
    return null;
  }
}

export const walletConnectService = new WalletConnectService();
