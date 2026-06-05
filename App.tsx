// App Entry Point — Composition Root
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { store } from './src/infrastructure/store';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';
import { AuthService } from './src/infrastructure/services/AuthService';
import { SQLiteUtenteRepository } from './src/infrastructure/repositories/SQLiteUtenteRepository';
import { dbService } from './src/infrastructure/database/DatabaseService';
import {
  loginSuccess,
  aggiornaPushToken,
} from './src/infrastructure/store/slices/authSlice';

const authService = new AuthService();
const utenteRepo = new SQLiteUtenteRepository();

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
    // 1. Inizializza il database SQLite (crea le tabelle se non esistono)
    dbService.getDb().catch(console.error);

    // 2. Ripristina sessione utente salvata
    (async () => {
      try {
        const sessione = await authService.recuperaSessione();
        if (sessione) {
          const utente = await utenteRepo.findById(sessione.idUtente);
          if (utente) {
            const { passwordHash: _, ...pub } = utente;
            store.dispatch(loginSuccess(pub));
          }
        }
      } catch (e) {
        console.warn('Sessione non ripristinata:', e);
      }
    })();

    // 3. Registra push token Expo per notifiche (RQ-23)
    (async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          store.dispatch(aggiornaPushToken(tokenData.data));
          const sessione = await authService.recuperaSessione();
          if (sessione) {
            await utenteRepo.savePushToken(sessione.idUtente, tokenData.data);
          }
        }
      } catch (e) {
        console.warn('Push token non registrato:', e);
      }
    })();
  }, []);

  return <AppNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppInner />
      </SafeAreaProvider>
    </Provider>
  );
}
