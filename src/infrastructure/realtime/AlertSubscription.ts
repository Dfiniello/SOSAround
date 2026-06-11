// Supabase Realtime — subscriber per nuove segnalazioni nell'area dell'utente
//
// PERCHÉ ESISTE:
// Le push notification (ExpoGatewayNotifiche) funzionano solo su device fisici.
// In sviluppo (expo start, simulatori, due terminali) usi questo canale WebSocket
// per ricevere eventi cross-device in tempo reale — stessa identica UX, zero infrastruttura.
//
// FLUSSO:
//   Device A crea Segnalazione → Supabase salva nel DB
//   Supabase Realtime emette INSERT su "segnalazioni"
//   Device B (connesso al canale) riceve l'evento → aggiorna Redux store → UI reagisce

import { supabase } from '../supabase/supabaseClient';
import type { Segnalazione } from '../../domain/entities';
import { haversineKm } from '../../utils/geo';

export type AlertCallback = (segnalazione: Segnalazione) => void;

/**
 * Sottoscrive alle nuove segnalazioni nell'area dell'utente.
 *
 * @param latitudine  - posizione corrente utente
 * @param longitudine - posizione corrente utente
 * @param raggioKm    - raggio di interesse
 * @param onNuovaAllerta - callback chiamata quando arriva una segnalazione vicina
 * @returns funzione di cleanup (chiama per unsubscribe)
 */
export function sottoscriviAllerte(
  latitudine: number,
  longitudine: number,
  raggioKm: number,
  onNuovaAllerta: AlertCallback
): () => void {
  const channel = supabase
    .channel('sosaround:segnalazioni:live')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'segnalazioni',
      },
      (payload) => {
        const s = payload.new as Segnalazione;

        // Filtra lato client — Supabase Realtime non supporta filtri geografici nativi
        const distanza = haversineKm(
          latitudine, longitudine,
          s.latitudine, s.longitudine
        );

        if (distanza <= raggioKm) {
          onNuovaAllerta(s);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Connesso — ascolto segnalazioni nel raggio di ${raggioKm}km`);
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Errore connessione WebSocket Supabase');
      }
    });

  // Cleanup: chiama questa funzione quando il componente smonta
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Versione per Redux Thunk — dispatch diretto quando arriva una segnalazione.
 * Usala nei componenti che hanno accesso allo store.
 */
export function sottoscriviAllerteDispatch(
  latitudine: number,
  longitudine: number,
  raggioKm: number,
  dispatch: (action: { type: string; payload: Segnalazione }) => void
): () => void {
  return sottoscriviAllerte(latitudine, longitudine, raggioKm, (segnalazione) => {
    dispatch({ type: 'segnalazione/nuovaRicevuta', payload: segnalazione });
  });
}
