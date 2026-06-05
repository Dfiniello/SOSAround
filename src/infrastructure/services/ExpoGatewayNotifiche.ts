// Implementazione concreta di IGatewayNotifiche tramite Expo Notifications
// Rispetta RQ-23 (consegna push entro 5s) e RQ-26 (≤50 simultanee)
import * as Notifications from 'expo-notifications';
import type { IGatewayNotifiche } from '../../domain/repositories/IGatewayNotifiche';

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
  async inviaNotifiche(
    tokens: string[],
    titolo: string,
    corpo: string,
    datiExtra?: Record<string, unknown>
  ): Promise<void> {
    // Batch: invia a blocchi di 50 — RQ-26
    const BATCH_SIZE = 50;
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(token =>
          Notifications.scheduleNotificationAsync({
            content: {
              title: titolo,
              body: corpo,
              data: datiExtra ?? {},
              priority: Notifications.AndroidNotificationPriority.MAX,
            },
            trigger: null,  // invia subito
          })
        )
      );
    }
  }
}
