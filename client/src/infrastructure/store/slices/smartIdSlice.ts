import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SmartId } from '../../../domain/entities';

interface SmartIdState {
  items: SmartId[];
  selezionato: SmartId | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SmartIdState = {
  items: [],
  selezionato: null,
  isLoading: false,
  error: null,
};

const smartIdSlice = createSlice({
  name: 'smartId',
  initialState,
  reducers: {
    caricaStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    caricaSuccess(state, action: PayloadAction<SmartId[]>) {
      state.isLoading = false;
      state.items = action.payload;
    },
    caricaFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    aggiungi(state, action: PayloadAction<SmartId>) {
      state.items.push(action.payload);
    },
    seleziona(state, action: PayloadAction<SmartId | null>) {
      state.selezionato = action.payload;
    },
    rimuovi(state, action: PayloadAction<string>) {
      state.items = state.items.filter(b => b.idBene !== action.payload);
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
  rimuovi,
  resetLoading,
} = smartIdSlice.actions;

export default smartIdSlice.reducer;
