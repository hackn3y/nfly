module.exports = {
  root: true,
  extends: [
    '@react-native',
    'eslint:recommended',
  ],
  env: {
    'react-native/react-native': true,
    jest: true,
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'react-native/no-inline-styles': 'off',
    'react/react-in-jsx-scope': 'off',
    'prettier/prettier': 'off',
  },
};
