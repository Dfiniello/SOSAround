// Middleware Redux: intercetta le azioni di segnalazione appena create
// e attiva il worker della priority queue (Queue-Based Load Leveling).
// Pattern: Pipes & Filters applicato al ciclo Redux.
import type { Middleware } from '@reduxjs/toolkit';
import { aggiungi as aggiungiSegnalazione } from '../slices/segnalazioneSlice';
import { notificationQueue } from '../../services/NotificationQueueService';

export const notificationMiddleware: Middleware = () => next => action => {
  const result = next(action);

  // Pubblica un job nella coda ogni volta che una nuova segnalazione viene creata
  if (aggiungiSegnalazione.match(action)) {
    notificationQueue.enqueue({
      id: crypto.randomUUID(),
      idSegnalazione: action.payload.idSegnalazione,
      latitudine: action.payload.latitudine,
      longitudine: action.payload.longitudine,
      raggioKm: action.payload.raggioProssimita,
      priorita: 0,  // massima priorità
      createdAt: new Date(),
    });
  }

  return result;
};
