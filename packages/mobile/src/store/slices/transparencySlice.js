import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchTransparencyStats = createAsyncThunk(
  'transparency/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/transparency/stats');
      return response.data.stats;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch transparency stats');
    }
  }
);

const transparencySlice = createSlice({
  name: 'transparency',
  initialState: {
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransparencyStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransparencyStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchTransparencyStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default transparencySlice.reducer;
