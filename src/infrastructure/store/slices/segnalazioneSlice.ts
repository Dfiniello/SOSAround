import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Segnalazione, StatoSegnalazione } from '../../../domain/entities';

interface SegnalazioneState {
  attive: Segnalazione[];
  selezionata: Segnalazione | null;
  isLoading: boolean;
  error: string | null;
  avviso: string | null;  // es. timeout notifiche
}

const initialState: SegnalazioneState = {
  attive: [],
  selezionata: null,
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
      state.attive.push(action.payload);
    },
    seleziona(state, action: PayloadAction<Segnalazione | null>) {
      state.selezionata = action.payload;
    },
    aggiornaStato(
      state,
      action: PayloadAction<{ id: string; stato: StatoSegnalazione }>
    ) {
      const s = state.attive.find(s => s.idSegnalazione === action.payload.id);
      if (s) s.stato = action.payload.stato;
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
  seleziona,
  aggiornaStato,
  setAvviso,
  resetLoading,
} = segnalazioneSlice.actions;

export default segnalazioneSlice.reducer;
