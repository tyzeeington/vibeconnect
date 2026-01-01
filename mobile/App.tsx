import '@walletconnect/react-native-compat';
import { StatusBar } from 'expo-status-bar';
import { WalletProvider } from './src/context/WalletContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <WalletProvider>
      <AppNavigator />
      <StatusBar style="light" />
    </WalletProvider>
  );
}
