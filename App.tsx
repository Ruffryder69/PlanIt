import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EventProvider } from './context/EventContext';
import { SettingsProvider } from './context/SettingsContext';
import { MainNavigator } from './components/MainNavigator';
import { useNotifications } from './hooks/useNotifications';

function AppInner() {
  useNotifications();
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <MainNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <EventProvider>
          <AppInner />
        </EventProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}