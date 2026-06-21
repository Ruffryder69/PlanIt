export type ThemeId = 'classic' | 'ocean' | 'amethyst';

export type ThemeColors = {
  accent: string;
  onAccent: string;
  bg: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
};

export type ThemeConfig = {
  id: ThemeId;
  name: string;
  light: ThemeColors;
  dark: ThemeColors;
  swatch: string;
};

export const THEMES: ThemeConfig[] = [
  {
    id: 'classic',
    name: 'Klassisch',
    swatch: '#1a1a1a',
    light: {
      accent: '#1a1a1a', onAccent: '#ffffff',
      bg: '#ffffff', surface: '#fafafa', surfaceElevated: '#f5f5f5',
      textPrimary: '#1a1a1a', textSecondary: '#888888', textTertiary: '#bbbbbb',
      border: '#e5e5e5',
    },
    dark: {
      accent: '#ffffff', onAccent: '#1a1a1a',
      bg: '#1a1a1a', surface: '#242424', surfaceElevated: '#2a2a2a',
      textPrimary: '#ffffff', textSecondary: '#666666', textTertiary: '#555555',
      border: '#333333',
    },
  },
  {
    id: 'ocean',
    name: 'Ozean',
    swatch: '#1565C0',
    light: {
      accent: '#1565C0', onAccent: '#ffffff',
      bg: '#EBF4FE', surface: '#D4E9FD', surfaceElevated: '#BFDCFC',
      textPrimary: '#0A2540', textSecondary: '#4A7BA7', textTertiary: '#84A9C8',
      border: '#A8D3F5',
    },
    dark: {
      accent: '#42A5F5', onAccent: '#071729',
      bg: '#071729', surface: '#0E2845', surfaceElevated: '#163558',
      textPrimary: '#E2F1FF', textSecondary: '#7AB8E8', textTertiary: '#4A7EA8',
      border: '#1C4A72',
    },
  },
  {
    id: 'amethyst',
    name: 'Amethyst',
    swatch: '#6A1B9A',
    light: {
      accent: '#6A1B9A', onAccent: '#ffffff',
      bg: '#F5EEFF', surface: '#EBD9FF', surfaceElevated: '#DFC7FF',
      textPrimary: '#1E0038', textSecondary: '#7040A0', textTertiary: '#9E78C0',
      border: '#CAAAF0',
    },
    dark: {
      accent: '#CE93D8', onAccent: '#1E0038',
      bg: '#160A26', surface: '#251447', surfaceElevated: '#341D5E',
      textPrimary: '#F3EAFF', textSecondary: '#C088DD', textTertiary: '#8055A8',
      border: '#4A2880',
    },
  },
];

export function getTheme(id: ThemeId, isDark: boolean): ThemeColors {
  const t = THEMES.find(t => t.id === id) ?? THEMES[0];
  return isDark ? t.dark : t.light;
}
