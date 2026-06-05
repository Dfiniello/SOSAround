// Redux Store — Singleton (Design Pattern: Creazionale)
// Vive nel layer Interface Adapters (Clean Architecture)
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import smartIdReducer from './slices/smartIdSlice';
import segnalazioneReducer from './slices/segnalazioneSlice';
import messaggioReducer from './slices/messaggioSlice';
import { notificationMiddleware } from './middleware/notificationMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    smartId: smartIdReducer,
    segnalazione: segnalazioneReducer,
    messaggio: messaggioReducer,
  },
  middleware: getDefault =>
    getDefault({
      // Gli oggetti Date non sono serializzabili JSON ma sono accettabili
      // in questa app offline-first; disabilitiamo il check per evitare
      // i falsi warning su dataRegistrazione, dataApertura, timestamp.
      serializableCheck: false,
    }).concat(notificationMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
