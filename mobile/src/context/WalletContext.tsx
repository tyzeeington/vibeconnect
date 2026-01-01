import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { walletConnectService } from '../services/walletConnect';

interface WalletContextType {
  walletAddress: string | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signMessage: (message: string) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Restore session on app launch
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const storedAddress = await walletConnectService.getStoredAddress();
      if (storedAddress) {
        setWalletAddress(storedAddress);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      // For development, we'll use a simulated connection
      // In production, you'd scan QR code or use deep linking
      const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f04E89';
      setWalletAddress(mockAddress);

      // Initialize WalletConnect in background
      await walletConnectService.initialize();

      console.log('Wallet connected:', mockAddress);
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await walletConnectService.disconnect();
      setWalletAddress(null);
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const signMessage = async (message: string): Promise<string | null> => {
    if (!walletAddress) {
      console.error('No wallet connected');
      return null;
    }

    try {
      return await walletConnectService.signMessage(message);
    } catch (error) {
      console.error('Signing failed:', error);
      return null;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        isConnecting,
        connectWallet,
        disconnectWallet,
        signMessage,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
