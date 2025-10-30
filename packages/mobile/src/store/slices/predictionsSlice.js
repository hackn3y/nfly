import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchUpcomingPredictions = createAsyncThunk(
  'predictions/fetchUpcoming',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/predictions/upcoming');
      console.log('[predictionsSlice] Upcoming predictions response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('[predictionsSlice] Failed to fetch upcoming predictions:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch predictions');
    }
  }
);

export const fetchWeeklyPredictions = createAsyncThunk(
  'predictions/fetchWeekly',
  async ({ week, season }, { rejectWithValue }) => {
    try {
      const response = await api.get('/predictions/weekly', {
        params: { week, season }
      });
      // Handle both formats: response.data.data or response.data directly
      const predictions = response.data.data || response.data;

      // Debug: Check ALL predictions
      if (predictions && predictions.length > 0) {
        console.log(`✅ Fetched ${predictions.length} predictions for Week ${week}`);
        predictions.forEach((p, idx) => {
          console.log(`  ${idx + 1}. Game ${p.game_id}: ${p.away_team} @ ${p.home_team}, Winner: ${p.predicted_winner}`);
        });
      }

      return predictions;
    } catch (error) {
      console.error(`[predictionsSlice] Failed to fetch Week ${week} Season ${season}:`, error.response?.data);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch weekly predictions');
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
    weekly: [],
    currentWeek: null,
    currentSeason: null,
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
    setCurrentWeek: (state, action) => {
      state.currentWeek = action.payload.week;
      state.currentSeason = action.payload.season;
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
      // Fetch weekly
      .addCase(fetchWeeklyPredictions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeeklyPredictions.fulfilled, (state, action) => {
        state.loading = false;
        state.weekly = action.payload;
      })
      .addCase(fetchWeeklyPredictions.rejected, (state, action) => {
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

export const { clearError, clearParlay, setCurrentWeek } = predictionsSlice.actions;
export default predictionsSlice.reducer;
