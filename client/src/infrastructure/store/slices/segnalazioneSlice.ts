import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Segnalazione } from '../../../domain/entities';

interface SegnalazioneState {
  attive: Segnalazione[];
  isLoading: boolean;
  error: string | null;
  avviso: string | null;  // es. timeout notifiche
}

const initialState: SegnalazioneState = {
  attive: [],
  isLoading: false,
  error: null,
  avviso: null,
};

const segnalazioneSlice = createSlice({
  name: 'segnalazione',
  initialState,
  reducers: {
    caricaStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    caricaSuccess(state, action: PayloadAction<Segnalazione[]>) {
      state.isLoading = false;
      state.attive = action.payload;
    },
    caricaFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    aggiungi(state, action: PayloadAction<Segnalazione>) {
      // Idempotente: evita doppioni quando l'inserimento locale e l'evento
      // realtime 'segnalazione:nuova' (sullo stesso device del creatore)
      // tentano entrambi di aggiungere la stessa segnalazione.
      const esiste = state.attive.some(
        s => s.idSegnalazione === action.payload.idSegnalazione
      );
      if (!esiste) state.attive.push(action.payload);
    },
    rimuovi(state, action: PayloadAction<string>) {
      state.attive = state.attive.filter(s => s.idSegnalazione !== action.payload);
    },
    setAvviso(state, action: PayloadAction<string | null>) {
      state.avviso = action.payload;
    },
    resetLoading(state) {
      state.isLoading = false;
    },
  },
});

export const {
  caricaStart,
  caricaSuccess,
  caricaFailure,
  aggiungi,
  rimuovi,
  setAvviso,
  resetLoading,
} = segnalazioneSlice.actions;

export default segnalazioneSlice.reducer;
