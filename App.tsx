import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/infrastructure/store';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';
import { supabase } from './src/infrastructure/supabase/supabaseClient';
import { SupabaseUtenteRepository } from './src/infrastructure/repositories/supabase/SupabaseUtenteRepository';
import { loginSuccess, logout, aggiornaPushToken } from './src/infrastructure/store/slices/authSlice';
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
            const tokenData = await Notifications.getExpoPushTokenAsync();
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
