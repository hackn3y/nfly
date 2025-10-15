import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import predictionsReducer from './slices/predictionsSlice';
import gematriaReducer from './slices/gematriaSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    predictions: predictionsReducer,
    gematria: gematriaReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
