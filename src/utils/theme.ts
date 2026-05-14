import { useAppSelector } from '../store/hooks';

export interface AppTheme {
  bg: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  accent: string;
  accentLight: string;
  header: string;
  inputBg: string;
  danger: string;
  tabBar: string;
  placeholder: string;
  shadow: string;
  success: string;
}

export const LIGHT: AppTheme = {
  bg: '#F0F2F5',
  card: '#FFFFFF',
  text: '#0F172A',
  subtext: '#64748B',
  border: '#E2E8F0',
  accent: '#6366F1',
  accentLight: '#EEF2FF',
  header: '#FFFFFF',
  inputBg: '#F8FAFC',
  danger: '#EF4444',
  tabBar: '#FFFFFF',
  placeholder: '#94A3B8',
  shadow: '#000000',
  success: '#22C55E',
};

export const DARK: AppTheme = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  subtext: '#94A3B8',
  border: '#334155',
  accent: '#818CF8',
  accentLight: '#1E1B4B',
  header: '#1E293B',
  inputBg: '#0F172A',
  danger: '#F87171',
  tabBar: '#1E293B',
  placeholder: '#475569',
  shadow: '#000000',
  success: '#4ADE80',
};

export const useTheme = (): AppTheme & { isDark: boolean } => {
  const isDark = useAppSelector(state => state.settings.isDarkMode);
  return { ...(isDark ? DARK : LIGHT), isDark };
};
