import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchUpcomingPredictions = createAsyncThunk(
  'predictions/fetchUpcoming',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/predictions/upcoming');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch predictions');
    }
  }
);

export const fetchGamePrediction = createAsyncThunk(
  'predictions/fetchGame',
  async (gameId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/predictions/game/${gameId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch prediction');
    }
  }
);

export const optimizeParlay = createAsyncThunk(
  'predictions/optimizeParlay',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/predictions/parlay', data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to optimize parlay');
    }
  }
);

const predictionsSlice = createSlice({
  name: 'predictions',
  initialState: {
    upcoming: [],
    currentGame: null,
    parlay: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearParlay: (state) => {
      state.parlay = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch upcoming
      .addCase(fetchUpcomingPredictions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingPredictions.fulfilled, (state, action) => {
        state.loading = false;
        state.upcoming = action.payload;
      })
      .addCase(fetchUpcomingPredictions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch game
      .addCase(fetchGamePrediction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGamePrediction.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGame = action.payload;
      })
      .addCase(fetchGamePrediction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Optimize parlay
      .addCase(optimizeParlay.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(optimizeParlay.fulfilled, (state, action) => {
        state.loading = false;
        state.parlay = action.payload;
      })
      .addCase(optimizeParlay.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearParlay } = predictionsSlice.actions;
export default predictionsSlice.reducer;
