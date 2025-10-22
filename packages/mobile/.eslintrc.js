module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
  ],
  env: {
    browser: true,
    node: true,
    jest: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^React$' }],
    'no-undef': 'off', // Turn off for React Native globals
  },
};
