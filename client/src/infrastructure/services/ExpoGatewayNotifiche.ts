// Implementazione concreta di IGatewayNotifiche tramite Expo Push Service
// Rispetta RQ-23 (consegna push entro 5s) e RQ-26 (≤50 simultanee)
//
// ARCHITETTURA CROSS-DEVICE:
// Questo servizio chiama l'API HTTP di Expo Push Service, che a sua volta
// consegna via FCM (Android) o APNs (iOS) al device destinatario.
// Non usa scheduleNotificationAsync (locale) — quello serve solo per
// notifiche in-app sullo stesso device.
import * as Notifications from 'expo-notifications';
import type { IGatewayNotifiche } from '../../domain/repositories/IGatewayNotifiche';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

// Configura come vengono mostrate le push IN ARRIVO su questo device
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class ExpoGatewayNotifiche implements IGatewayNotifiche {
  /**
   * Invia push cross-device tramite Expo Push Service.
   * tokens: array di ExpoToken nel formato "ExponentPushToken[xxxxxx]"
   */
  async inviaNotifiche(
    tokens: string[],
    titolo: string,
    corpo: string,
    datiExtra?: Record<string, unknown>
  ): Promise<void> {
    if (tokens.length === 0) return;

    // Filtra token validi Expo (es. ExponentPushToken[...])
    // Su simulatori i token sono null/undefined — li scartiamo silenziosamente
    const validTokens = tokens.filter(t => t && t.startsWith('ExponentPushToken'));

    if (validTokens.length === 0) {
      console.warn('[ExpoGateway] Nessun token Expo valido. In simulatore le push non funzionano — usa Supabase Realtime per dev.');
      return;
    }

    // Batch: max 100 per request — RQ-26 (50 simultanee per area)
    const BATCH_SIZE = 50;
    for (let i = 0; i < validTokens.length; i += BATCH_SIZE) {
      const batch = validTokens.slice(i, i + BATCH_SIZE);
      const messages = batch.map(token => ({
        to: token,
        title: titolo,
        body: corpo,
        data: datiExtra ?? {},
        priority: 'high',          // RQ-23: consegna entro 5s
        channelId: 'sosaround-alerts',
      }));

      const response = await fetch(EXPO_PUSH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`[ExpoGateway] Push batch fallito: ${response.status} — ${err}`);
      }

      const result = await response.json();
      // Logga eventuali errori per token specifici
      result.data?.forEach((ticket: { status: string; message?: string }, idx: number) => {
        if (ticket.status === 'error') {
          console.error(`[ExpoGateway] Token ${batch[idx]}: ${ticket.message}`);
        }
      });
    }
  }
}

// ─── Utility: registra il token push di questo device ────────────────────────
// Va chiamata al login e il token salvato su Supabase (tabella utenti.push_token)
export async function registraPushToken(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[ExpoGateway] Permesso push negato dall\'utente.');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data; // "ExponentPushToken[xxxxxx]"
  } catch (e) {
    // Sui simulatori lancia eccezione — è normale
    console.warn('[ExpoGateway] Token push non disponibile (simulatore?):', e);
    return null;
  }
}
