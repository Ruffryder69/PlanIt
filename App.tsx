import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EventProvider } from './context/EventContext';
import { SettingsProvider } from './context/SettingsContext';
import { PurchaseProvider } from './context/PurchaseContext';
import { BirthdayProvider } from './context/BirthdayContext';
import { MainNavigator } from './components/MainNavigator';
import { ProPaywallModal } from './components/ProPaywallModal';
import { useNotifications } from './hooks/useNotifications';

function AppInner() {
  useNotifications();
  return (
    <>
      <StatusBar style="auto" />
      <MainNavigator />
      <ProPaywallModal />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <PurchaseProvider>
          <EventProvider>
            <BirthdayProvider>
              <AppInner />
            </BirthdayProvider>
          </EventProvider>
        </PurchaseProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
