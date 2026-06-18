import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Messaggio } from '../../../domain/entities';

interface MessaggioState {
  // Map idSegnalazione → lista messaggi
  conversazioni: Record<string, Messaggio[]>;
  isLoading: boolean;
  error: string | null;
}

const initialState: MessaggioState = {
  conversazioni: {},
  isLoading: false,
  error: null,
};

const messaggioSlice = createSlice({
  name: 'messaggio',
  initialState,
  reducers: {
    caricaMessaggiSuccess(
      state,
      action: PayloadAction<{ idSegnalazione: string; messaggi: Messaggio[] }>
    ) {
      state.conversazioni[action.payload.idSegnalazione] = action.payload.messaggi;
    },
    aggiungiMessaggio(state, action: PayloadAction<Messaggio>) {
      const id = action.payload.idSegnalazione;
      if (!state.conversazioni[id]) {
        state.conversazioni[id] = [];
      }
      state.conversazioni[id].push(action.payload);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  caricaMessaggiSuccess,
  aggiungiMessaggio,
  setLoading,
  setError,
} = messaggioSlice.actions;

export default messaggioSlice.reducer;
