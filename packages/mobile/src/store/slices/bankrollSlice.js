import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fetch bankroll stats and history
export const fetchBankroll = createAsyncThunk(
  'bankroll/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/bankroll');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch bankroll');
    }
  }
);

// Initialize or update bankroll
export const initializeBankroll = createAsyncThunk(
  'bankroll/initialize',
  async (amount, { rejectWithValue }) => {
    try {
      const response = await api.post('/bankroll/initialize', { amount });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to initialize bankroll');
    }
  }
);

// Place a new bet
export const placeBet = createAsyncThunk(
  'bankroll/placeBet',
  async (betData, { rejectWithValue }) => {
    try {
      const response = await api.post('/bankroll/bet', betData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to place bet');
    }
  }
);

// Fetch all bets
export const fetchBets = createAsyncThunk(
  'bankroll/fetchBets',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/bankroll/bets?${queryString}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch bets');
    }
  }
);

// Fetch single bet
export const fetchBet = createAsyncThunk(
  'bankroll/fetchBet',
  async (betId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/bankroll/bets/${betId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch bet');
    }
  }
);

// Settle bet
export const settleBet = createAsyncThunk(
  'bankroll/settleBet',
  async ({ betId, status, result }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/bankroll/bets/${betId}/settle`, { status, result });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to settle bet');
    }
  }
);

// Cancel bet
export const cancelBet = createAsyncThunk(
  'bankroll/cancelBet',
  async (betId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/bankroll/bets/${betId}`);
      return { betId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to cancel bet');
    }
  }
);

// Adjust bankroll
export const adjustBankroll = createAsyncThunk(
  'bankroll/adjust',
  async ({ amount, type, notes }, { rejectWithValue }) => {
    try {
      const response = await api.post('/bankroll/adjust', { amount, type, notes });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to adjust bankroll');
    }
  }
);

// Fetch analytics
export const fetchAnalytics = createAsyncThunk(
  'bankroll/fetchAnalytics',
  async (period = 30, { rejectWithValue }) => {
    try {
      const response = await api.get(`/bankroll/analytics?period=${period}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch analytics');
    }
  }
);

// Fetch bankroll history
export const fetchBankrollHistory = createAsyncThunk(
  'bankroll/fetchHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/bankroll/history?${queryString}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch history');
    }
  }
);

const bankrollSlice = createSlice({
  name: 'bankroll',
  initialState: {
    stats: null,
    history: [],
    bets: [],
    currentBet: null,
    analytics: null,
    loading: false,
    error: null,
    initialized: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentBet: (state) => {
      state.currentBet = null;
    },
    resetBankroll: (state) => {
      state.stats = null;
      state.history = [];
      state.bets = [];
      state.currentBet = null;
      state.analytics = null;
      state.initialized = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch bankroll
      .addCase(fetchBankroll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBankroll.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.history = action.payload.history || [];
        state.initialized = true;
      })
      .addCase(fetchBankroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Initialize bankroll
      .addCase(initializeBankroll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeBankroll.fulfilled, (state, action) => {
        state.loading = false;
        if (!state.stats) {
          state.stats = {
            currentBalance: action.payload.bankroll,
            totalBets: 0,
            totalWagered: 0,
            totalWon: 0,
            totalLost: 0,
            totalPending: 0,
            winRate: 0,
            profitLoss: 0,
            roi: 0,
          };
        } else {
          state.stats.currentBalance = action.payload.bankroll;
        }
        state.initialized = true;
      })
      .addCase(initializeBankroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Place bet
      .addCase(placeBet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeBet.fulfilled, (state, action) => {
        state.loading = false;
        state.bets.unshift(action.payload);
      })
      .addCase(placeBet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch bets
      .addCase(fetchBets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBets.fulfilled, (state, action) => {
        state.loading = false;
        state.bets = action.payload;
      })
      .addCase(fetchBets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch bet
      .addCase(fetchBet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBet.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBet = action.payload;
      })
      .addCase(fetchBet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Settle bet
      .addCase(settleBet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(settleBet.fulfilled, (state, action) => {
        state.loading = false;
        // Update bet in list
        const index = state.bets.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.bets[index] = action.payload;
        }
        if (state.currentBet?.id === action.payload.id) {
          state.currentBet = action.payload;
        }
      })
      .addCase(settleBet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Cancel bet
      .addCase(cancelBet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelBet.fulfilled, (state, action) => {
        state.loading = false;
        // Remove bet from list
        state.bets = state.bets.filter(b => b.id !== action.payload.betId);
        if (state.currentBet?.id === action.payload.betId) {
          state.currentBet = null;
        }
      })
      .addCase(cancelBet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Adjust bankroll
      .addCase(adjustBankroll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adjustBankroll.fulfilled, (state, action) => {
        state.loading = false;
        if (state.stats) {
          state.stats.currentBalance = action.payload.newBalance;
        }
      })
      .addCase(adjustBankroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch history
      .addCase(fetchBankrollHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBankrollHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchBankrollHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentBet, resetBankroll } = bankrollSlice.actions;
export default bankrollSlice.reducer;
