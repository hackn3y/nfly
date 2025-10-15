import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchSubscriptionTiers = createAsyncThunk(
  'user/fetchTiers',
  async () => {
    const response = await api.get('/subscriptions/tiers');
    return response.data.data;
  }
);

export const fetchCurrentSubscription = createAsyncThunk(
  'user/fetchSubscription',
  async () => {
    const response = await api.get('/subscriptions/current');
    return response.data.data;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    subscription: null,
    tiers: null,
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
      .addCase(fetchSubscriptionTiers.fulfilled, (state, action) => {
        state.tiers = action.payload;
      })
      .addCase(fetchCurrentSubscription.fulfilled, (state, action) => {
        state.subscription = action.payload;
      });
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;
