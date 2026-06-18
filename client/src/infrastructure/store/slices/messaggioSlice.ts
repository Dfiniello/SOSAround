import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Messaggio } from '../../../domain/entities';

interface MessaggioState {
  // Map chiaveConversazione ("idSegnalazione:idRitrovatore") → lista messaggi.
  // La chiave include il ritrovatore così ogni coppia proprietario↔ritrovatore
  // ha una conversazione 1:1 separata (non una chat di gruppo per segnalazione).
  conversazioni: Record<string, Messaggio[]>;
  isLoading: boolean;
  error: string | null;
}

// Costruisce la chiave univoca di una conversazione 1:1.
export function chiaveConversazione(idSegnalazione: string, idRitrovatore: string): string {
  return `${idSegnalazione}:${idRitrovatore}`;
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
      action: PayloadAction<{ chiave: string; messaggi: Messaggio[] }>
    ) {
      state.conversazioni[action.payload.chiave] = action.payload.messaggi;
    },
    aggiungiMessaggio(
      state,
      action: PayloadAction<{ chiave: string; messaggio: Messaggio }>
    ) {
      const { chiave, messaggio } = action.payload;
      if (!state.conversazioni[chiave]) {
        state.conversazioni[chiave] = [];
      }
      // Idempotente: evita doppioni (eco del proprio messaggio via socket)
      if (!state.conversazioni[chiave].some(m => m.idMessaggio === messaggio.idMessaggio)) {
        state.conversazioni[chiave].push(messaggio);
      }
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
