import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const resolveApiUrl = () => {
  const expoConfig = Constants.expoConfig ?? {};
  const manifest = Constants.manifest2;

  // Allow explicit configuration to win first
  let url = expoConfig.extra?.apiUrl;

  const looksLocal = (candidate) =>
    typeof candidate === 'string' && candidate.includes('localhost');

  if (!url || looksLocal(url)) {
    const developerOrigin =
      manifest?.extra?.expoGo?.developerServerOrigin ||
      manifest?.hostUri ||
      manifest?.debuggerHost ||
      expoConfig.hostUri;

    if (developerOrigin) {
      const withoutProtocol = developerOrigin.replace(/^(exp|http|https|ws|wss):\/\//, '');
      const host = withoutProtocol.split(':')[0];
      if (host) {
        url = `http://${host}:4100/api`;
      }
    }
  }

  return url || 'http://localhost:4100/api';
};

const API_URL = resolveApiUrl();
const TOKEN_KEY = 'auth_token';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[API] Error getting token:', error);
    }
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear and redirect to login
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      // You might want to dispatch a logout action here
    }
    return Promise.reject(error);
  }
);

export default api;
