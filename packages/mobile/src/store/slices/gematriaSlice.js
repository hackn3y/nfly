import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const calculateGematria = createAsyncThunk(
  'gematria/calculate',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/gematria/calculate', data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to calculate');
    }
  }
);

export const fetchGameGematria = createAsyncThunk(
  'gematria/fetchGame',
  async (gameId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/gematria/game/${gameId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch gematria');
    }
  }
);

const gematriaSlice = createSlice({
  name: 'gematria',
  initialState: {
    calculation: null,
    gameAnalysis: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCalculation: (state) => {
      state.calculation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Calculate
      .addCase(calculateGematria.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateGematria.fulfilled, (state, action) => {
        state.loading = false;
        state.calculation = action.payload;
      })
      .addCase(calculateGematria.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch game gematria
      .addCase(fetchGameGematria.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGameGematria.fulfilled, (state, action) => {
        state.loading = false;
        state.gameAnalysis = action.payload;
      })
      .addCase(fetchGameGematria.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCalculation } = gematriaSlice.actions;
export default gematriaSlice.reducer;
