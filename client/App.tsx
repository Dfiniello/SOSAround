import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useSelector } from 'react-redux';
import { store, type RootState } from './src/infrastructure/store';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';
import { AuthService } from './src/infrastructure/services/AuthService';
import { ApiUtenteRepository } from './src/infrastructure/repositories/api/ApiUtenteRepository';
import { getSocket, connettiSocket } from './src/infrastructure/realtime/socketClient';
import { loginSuccess, logout, aggiornaPushToken } from './src/infrastructure/store/slices/authSlice';
import { mostraNotificaLocale } from './src/infrastructure/services/LocalNotifications';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const authService = new AuthService();
const utenteRepo = new ApiUtenteRepository();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AppInner() {
  useEffect(() => {
    // Bootstrap sessione: ricarica il JWT da disco e recupera l'utente.
    (async () => {
      const utente = await authService.getSessioneAttiva();
      if (utente) {
        store.dispatch(loginSuccess(utente));
        connettiSocket();
      } else {
        store.dispatch(logout());
      }
    })();

    // Registra push token (solo in development build, non in Expo Go)
    const isDevBuild = Constants.appOwnership !== 'expo';
    if (isDevBuild) {
      (async () => {
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status === 'granted') {
            const projectId =
              Constants.expoConfig?.extra?.eas?.projectId ??
              Constants.easConfig?.projectId;
            const tokenData = await Notifications.getExpoPushTokenAsync(
              projectId ? { projectId } : undefined
            );
            store.dispatch(aggiornaPushToken(tokenData.data));
            const utenteCorrente = store.getState().auth.utente;
            if (utenteCorrente?.idUtente) {
              await utenteRepo.savePushToken(utenteCorrente.idUtente, tokenData.data);
            }
          }
        } catch (e) {
          console.warn('Push token non registrato:', e);
        }
      })();
    }
  }, []);

  return <AppNavigator />;
}

// Notifiche cross-device tramite Socket.IO → notifica locale sul device che riceve.
// Funziona anche in Expo Go, dove le push remote non sono disponibili.
function NotificheRealtime() {
  const utente = useSelector((s: RootState) => s.auth.utente);

  useEffect(() => {
    if (!utente) return;
    const idUtente = utente.idUtente;
    const socket = getSocket();

    // Nuova segnalazione creata da un ALTRO utente
    const onSegnalazione = (r: { id_segnalatore: string; nome_bene: string | null }) => {
      if (r.id_segnalatore === idUtente) return; // non notificare le proprie
      mostraNotificaLocale(
        '🚨 Nuova segnalazione',
        `Qualcuno ha smarrito: ${r.nome_bene ?? 'un oggetto'}`,
      );
    };

    // Nuovo messaggio destinato a ME
    const onMessaggio = (r: { id_mittente: string; id_destinatario: string; testo: string }) => {
      if (r.id_destinatario !== idUtente || r.id_mittente === idUtente) return;
      mostraNotificaLocale('💬 Nuovo messaggio', r.testo || 'Hai ricevuto un messaggio');
    };

    socket.on('segnalazione:nuova', onSegnalazione);
    socket.on('messaggio:nuovo:global', onMessaggio);

    return () => {
      socket.off('segnalazione:nuova', onSegnalazione);
      socket.off('messaggio:nuovo:global', onMessaggio);
    };
  }, [utente?.idUtente]);

  return null;
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppInner />
        <NotificheRealtime />
      </SafeAreaProvider>
    </Provider>
  );
}
