import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeId } from '../constants/themes';

type SettingsContextType = {
  bundesland: string;
  setBundesland: (bl: string) => Promise<void>;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => Promise<void>;
  isFirstLaunch: boolean;
  completeOnboarding: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [bundesland, setBundeslandState] = useState('BW');
  const [themeId, setThemeIdState] = useState<ThemeId>('classic');
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const bl = await AsyncStorage.getItem('planit_bundesland');
      const onboarded = await AsyncStorage.getItem('planit_onboarded');
      const theme = await AsyncStorage.getItem('planit_theme');
      if (bl) setBundeslandState(bl);
      if (!onboarded) setIsFirstLaunch(true);
      if (theme) setThemeIdState(theme as ThemeId);
    } catch (e) {
      console.error('Fehler beim Laden der Einstellungen:', e);
    }
  };

  const setBundesland = async (bl: string) => {
    await AsyncStorage.setItem('planit_bundesland', bl);
    setBundeslandState(bl);
  };

  const setThemeId = async (id: ThemeId) => {
    await AsyncStorage.setItem('planit_theme', id);
    setThemeIdState(id);
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('planit_onboarded', 'true');
    setIsFirstLaunch(false);
  };

  return (
    <SettingsContext.Provider value={{ bundesland, setBundesland, themeId, setThemeId, isFirstLaunch, completeOnboarding }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
