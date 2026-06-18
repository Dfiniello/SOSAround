// Notifiche LOCALI mostrate sul dispositivo che riceve un evento Realtime.
//
// PERCHÉ ESISTE:
// Le push REMOTE di Expo (exp.host) non funzionano in Expo Go e richiedono
// una development build + projectId EAS. Il Supabase Realtime, invece, recapita
// già gli eventi cross-device via WebSocket. Quando l'evento arriva sul device B,
// mostriamo una notifica locale: per l'utente è identico a una push.
//
// LIMITE: la notifica scatta finché l'app è in foreground/background con il
// WebSocket connesso. Per notifiche con app totalmente chiusa serve la push remota.
import * as Notifications from 'expo-notifications';

let permessoChiesto = false;

async function assicuraPermesso(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  if (permessoChiesto) return false;
  permessoChiesto = true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

export async function mostraNotificaLocale(
  titolo: string,
  corpo: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  try {
    if (!(await assicuraPermesso())) return;
    await Notifications.scheduleNotificationAsync({
      content: { title: titolo, body: corpo, data, sound: true },
      trigger: null, // null = mostra subito
    });
  } catch (e) {
    console.warn('[LocalNotifications] impossibile mostrare la notifica:', e);
  }
}
