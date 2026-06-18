import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Utente } from '../../../domain/entities';

interface AuthState {
  utente: Omit<Utente, 'passwordHash'> | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  utente: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<Omit<Utente, 'passwordHash'>>) {
      state.isLoading = false;
      state.utente = action.payload;
      state.error = null;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.utente = null;
      state.error = null;
    },
    aggiornaPushToken(state, action: PayloadAction<string>) {
      if (state.utente) {
        state.utente.pushToken = action.payload;
      }
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  aggiornaPushToken,
} = authSlice.actions;

export default authSlice.reducer;
