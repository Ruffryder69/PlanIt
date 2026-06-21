import { useColorScheme } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { getTheme, ThemeColors } from '../constants/themes';

export type AppTheme = ThemeColors & { isDark: boolean };

export function useAppTheme(): AppTheme {
  const isDark = useColorScheme() === 'dark';
  const { themeId } = useSettings();
  return { isDark, ...getTheme(themeId, isDark) };
}
