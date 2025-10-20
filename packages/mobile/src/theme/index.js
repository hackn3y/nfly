// Create themes from scratch to avoid undefined spread issues
export const darkTheme = {
  dark: true,
  roundness: 4,
  version: 3,
  colors: {
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
    onSurface: '#ffffff',
    disabled: '#555555',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#00D9FF',
    onPrimary: '#000000',
    onSecondary: '#ffffff',
    onBackground: '#ffffff',
    outline: '#0F3460',
    inverseSurface: '#ffffff',
    inverseOnSurface: '#1a1a2e',
    inversePrimary: '#0096c7',
    elevation: {
      level0: 'transparent',
      level1: '#1f2937',
      level2: '#242d3c',
      level3: '#2a3442',
      level4: '#2f3a47',
      level5: '#34404d',
    },
  },
};

// Light theme
export const lightTheme = {
  dark: false,
  roundness: 4,
  version: 3,
  colors: {
    primary: '#0096c7',
    secondary: '#00b4d8',
    background: '#f8f9fa',
    surface: '#ffffff',
    text: '#212529',
    placeholder: '#6c757d',
    error: '#dc3545',
    success: '#28a745',
    warning: '#ffc107',
    accent: '#0096c7',
    card: '#ffffff',
    border: '#dee2e6',
    onSurface: '#212529',
    disabled: '#cccccc',
    backdrop: 'rgba(0, 0, 0, 0.3)',
    notification: '#0096c7',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: '#212529',
    outline: '#dee2e6',
    inverseSurface: '#212529',
    inverseOnSurface: '#f8f9fa',
    inversePrimary: '#00D9FF',
    elevation: {
      level0: 'transparent',
      level1: '#f1f3f5',
      level2: '#e9ecef',
      level3: '#dee2e6',
      level4: '#ced4da',
      level5: '#adb5bd',
    },
  },
};

export const theme = darkTheme;
export const colors = darkTheme.colors;

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
    color: darkTheme.colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: darkTheme.colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: darkTheme.colors.text,
  },
  body: {
    fontSize: 16,
    color: darkTheme.colors.text,
  },
  caption: {
    fontSize: 12,
    color: darkTheme.colors.placeholder,
  },
};
