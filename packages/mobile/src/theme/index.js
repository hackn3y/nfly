import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#00D9FF',
    secondary: '#0F3460',
    background: '#1a1a2e',
    surface: '#16213e',
    text: '#ffffff',
    placeholder: '#a0a0a0',
    error: '#ff4757',
    success: '#2ed573',
    warning: '#ffa502',
    accent: '#00D9FF',
    card: '#16213e',
    border: '#0F3460',
  },
  dark: true,
};

export const colors = theme.colors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    fontSize: 16,
    color: colors.text,
  },
  caption: {
    fontSize: 12,
    color: colors.placeholder,
  },
};
