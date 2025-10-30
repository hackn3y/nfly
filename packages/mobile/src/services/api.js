import axios from 'axios';
import Constants from 'expo-constants';
import storage from '../utils/storage';

const resolveApiUrl = () => {
  const expoConfig = Constants.expoConfig ?? {};
  const manifest = Constants.manifest2;

  // Check if we're in a web production environment (Netlify)
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    // If deployed (not localhost), use production API
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://nfl-predictorbackend-production.up.railway.app/api';
    }
  }

  // For local development, allow explicit configuration
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
        url = `http://${host}:3100/api`;
      }
    }
  }

  return url || 'http://localhost:3100/api';
};

const API_URL = resolveApiUrl();
console.log('[API] Using API URL:', API_URL);
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
      const token = await storage.getItemAsync(TOKEN_KEY);
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
      await storage.deleteItemAsync(TOKEN_KEY);
      // You might want to dispatch a logout action here
    }
    return Promise.reject(error);
  }
);

export default api;
