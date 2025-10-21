import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import storage from '../../utils/storage';
import api from '../../services/api';

const TOKEN_KEY = 'auth_token';

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data.data;
      await storage.setItemAsync(TOKEN_KEY, token);
      return { token, user };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Registration failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('[authSlice] login thunk called with:', credentials.email);
      console.log('[authSlice] API URL:', api.defaults.baseURL);

      const response = await api.post('/auth/login', credentials);
      console.log('[authSlice] Login response:', response.data);

      const { token, user } = response.data.data;
      await storage.setItemAsync(TOKEN_KEY, token);
      return { token, user };
    } catch (error) {
      console.error('[authSlice] Login error:', error);
      console.error('[authSlice] Error response:', error.response?.data);
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      await storage.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      // Still logout locally even if API call fails
      await storage.deleteItemAsync(TOKEN_KEY);
    }
  }
);

export const loadToken = createAsyncThunk(
  'auth/loadToken',
  async () => {
    const token = await storage.getItemAsync(TOKEN_KEY);
    if (token) {
      const response = await api.get('/auth/me');
      return { token, user: response.data.data };
    }
    return null;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      // Load token
      .addCase(loadToken.fulfilled, (state, action) => {
        if (action.payload) {
          state.isAuthenticated = true;
          state.token = action.payload.token;
          state.user = action.payload.user;
        }
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
