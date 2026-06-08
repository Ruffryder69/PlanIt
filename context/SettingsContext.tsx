import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsContextType = {
  bundesland: string;
  setBundesland: (bl: string) => Promise<void>;
  isFirstLaunch: boolean;
  completeOnboarding: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [bundesland, setBundeslandState] = useState('BW');
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const bl = await AsyncStorage.getItem('planit_bundesland');
      const onboarded = await AsyncStorage.getItem('planit_onboarded');
      if (bl) setBundeslandState(bl);
      if (!onboarded) setIsFirstLaunch(true);
    } catch (e) {
      console.error('Fehler beim Laden der Einstellungen:', e);
    }
  };

  const setBundesland = async (bl: string) => {
    await AsyncStorage.setItem('planit_bundesland', bl);
    setBundeslandState(bl);
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('planit_onboarded', 'true');
    setIsFirstLaunch(false);
  };

  return (
    <SettingsContext.Provider value={{ bundesland, setBundesland, isFirstLaunch, completeOnboarding }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}