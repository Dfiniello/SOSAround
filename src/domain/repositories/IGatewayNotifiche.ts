// Interfaccia del gateway esterno per push notification (RQ-23, RQ-26)
// Definita nel domain così il Use Case dipende dall'astrazione, non dal SDK Expo.
export interface IGatewayNotifiche {
  // Invia notifica push a una lista di push token — timeout 5s (RQ-23)
  inviaNotifiche(
    tokens: string[],
    titolo: string,
    corpo: string,
    datiExtra?: Record<string, unknown>
  ): Promise<void>;
}
