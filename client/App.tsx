import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useSelector } from 'react-redux';
import { store, type RootState } from './src/infrastructure/store';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';
import { supabase } from './src/infrastructure/supabase/supabaseClient';
import { SupabaseUtenteRepository } from './src/infrastructure/repositories/supabase/SupabaseUtenteRepository';
import { loginSuccess, logout, aggiornaPushToken } from './src/infrastructure/store/slices/authSlice';
import { mostraNotificaLocale } from './src/infrastructure/services/LocalNotifications';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const utenteRepo = new SupabaseUtenteRepository();

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
    // Gestione sessione Supabase — si aggiorna automaticamente al login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const utente = await utenteRepo.findById(session.user.id);
          if (utente) {
            const { passwordHash: _, ...pub } = utente;
            store.dispatch(loginSuccess({ ...pub, email: session.user.email ?? '' }));
          }
        } else {
          store.dispatch(logout());
        }
      }
    );

    // Registra push token (solo in development build, non in Expo Go)
    const isDevBuild = Constants.appOwnership !== 'expo';
    if (isDevBuild) {
      (async () => {
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status === 'granted') {
            // projectId richiesto dalle versioni recenti di Expo per le push remote
            const projectId =
              Constants.expoConfig?.extra?.eas?.projectId ??
              Constants.easConfig?.projectId;
            const tokenData = await Notifications.getExpoPushTokenAsync(
              projectId ? { projectId } : undefined
            );
            store.dispatch(aggiornaPushToken(tokenData.data));
            const { data: session } = await supabase.auth.getSession();
            if (session.session?.user.id) {
              await utenteRepo.savePushToken(session.session.user.id, tokenData.data);
            }
          }
        } catch (e) {
          console.warn('Push token non registrato:', e);
        }
      })();
    }

    return () => subscription.unsubscribe();
  }, []);

  return <AppNavigator />;
}

// Notifiche cross-device tramite Supabase Realtime → notifica locale sul device che riceve.
// Funziona anche in Expo Go, dove le push remote non sono disponibili.
function NotificheRealtime() {
  const utente = useSelector((s: RootState) => s.auth.utente);

  useEffect(() => {
    if (!utente) return;
    const idUtente = utente.idUtente;

    const channel = supabase
      .channel('notifiche:globali')
      // Nuova segnalazione creata da un ALTRO utente
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'segnalazione' },
        (payload) => {
          const r = payload.new as { id_segnalatore: string; nome_bene: string | null };
          if (r.id_segnalatore === idUtente) return; // non notificare le proprie
          mostraNotificaLocale(
            '🚨 Nuova segnalazione',
            `Qualcuno ha smarrito: ${r.nome_bene ?? 'un oggetto'}`,
          );
        }
      )
      // Nuovo messaggio destinato a ME
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messaggio' },
        (payload) => {
          const r = payload.new as { id_mittente: string; id_destinatario: string; testo: string };
          if (r.id_destinatario !== idUtente || r.id_mittente === idUtente) return;
          mostraNotificaLocale('💬 Nuovo messaggio', r.testo || 'Hai ricevuto un messaggio');
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
