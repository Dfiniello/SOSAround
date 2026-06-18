import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../../infrastructure/store/hooks';
import { C } from '../theme/colors';

import { AuthScreen }               from '../screens/AuthScreen';
import { MappaScreen }              from '../screens/MappaScreen';
import { BachecaScreen }            from '../screens/BachecaScreen';
import { MessaggiListScreen }       from '../screens/MessaggiListScreen';
import { NuovaSegnalazioneScreen }  from '../screens/NuovaSegnalazioneScreen';
import { VaultScreen }              from '../screens/VaultScreen';
import { NuovoSmartIdScreen }       from '../screens/NuovoSmartIdScreen';
import { DettaglioSmartIdScreen }   from '../screens/DettaglioSmartIdScreen';
import { AttivaAllertaScreen }      from '../screens/AttivaAllertaScreen';
import { ChatScreen }               from '../screens/ChatScreen';
import { ScannerScreen }            from '../screens/ScannerScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  NuovoSmartId: undefined;
  DettaglioSmartId: { idBene: string };
  AttivaAllerta: { idBene: string };
  Chat: {
    idSegnalazione: string;
    idProprietario: string;   // chi ha aperto la segnalazione
    idRitrovatore: string;    // l'altro interlocutore della conversazione 1:1
    titolo?: string;          // nome bene / interlocutore, mostrato nell'header
  };
  Scanner: undefined;
};

export type TabParamList = {
  Mappa: undefined;
  Bacheca: undefined;
  Messaggi: undefined;
  Segnala: undefined;
  Vault: undefined;
};

type TabIcon = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { active: TabIcon; inactive: TabIcon }> = {
  Mappa:    { active: 'map',             inactive: 'map-outline' },
  Bacheca:  { active: 'newspaper',       inactive: 'newspaper-outline' },
  Messaggi: { active: 'chatbubbles',     inactive: 'chatbubbles-outline' },
  Segnala:  { active: 'megaphone',       inactive: 'megaphone-outline' },
  Vault:    { active: 'shield-checkmark',inactive: 'shield-checkmark-outline' },
};

// Etichette brevi per la tab bar (evitano il troncamento)
const TAB_LABELS: Record<string, string> = {
  Mappa:    'Mappa',
  Bacheca:  'Bacheca',
  Messaggi: 'Messaggi',
  Segnala:  'Segnala',
  Vault:    'Vault',
};

const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  // useSafeAreaInsets garantisce il padding corretto sopra i tasti Android
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom > 0 ? insets.bottom : 10;

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: keyof TabParamList } }) => ({
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          const icons = TAB_ICONS[route.name];
          const name  = focused ? icons.active : icons.inactive;
          return <Ionicons name={name} size={size} color={color} />;
        },
        tabBarLabel: TAB_LABELS[route.name],
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.text3,
        tabBarStyle: {
          backgroundColor: C.white,
          borderTopColor: C.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          // Altezza dinamica: area icona/label + safe area
          paddingBottom: bottomPad,
          paddingTop: 8,
          height: 54 + bottomPad,
          // Ombra per dare profondità alla tab bar
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.07,
          shadowRadius: 10,
          elevation: 16,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
        // Header comune a tutti i tab
        headerStyle:      { backgroundColor: C.white, elevation: 0, shadowColor: 'transparent' },
        headerTitleStyle: { fontSize: 20, fontWeight: '800', fontStyle: 'italic', color: C.dark },
        headerTitleAlign: 'left' as const,
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Mappa"    component={MappaScreen}
        options={{ headerShown: false }} />
      <Tab.Screen name="Bacheca"  component={BachecaScreen}
        options={{ title: 'Bacheca Community' }} />
      <Tab.Screen name="Messaggi" component={MessaggiListScreen}
        options={{ title: 'Messaggi' }} />
      <Tab.Screen name="Segnala"  component={NuovaSegnalazioneScreen}
        options={{ title: 'Nuova Segnalazione' }} />
      <Tab.Screen name="Vault"    component={VaultScreen}
        options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const utente = useAppSelector(s => s.auth.utente);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!utente ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="NuovoSmartId"
              component={NuovoSmartIdScreen}
              options={{
                headerShown: true, title: 'Nuovo Smart ID',
                headerStyle: { backgroundColor: C.white },
                headerTintColor: C.primary, headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="DettaglioSmartId"
              component={DettaglioSmartIdScreen}
              options={{
                headerShown: true, title: 'Dettaglio',
                headerStyle: { backgroundColor: C.white },
                headerTintColor: C.primary, headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="AttivaAllerta"
              component={AttivaAllertaScreen}
              options={{
                headerShown: true, title: 'Attiva Allerta',
                headerStyle: { backgroundColor: C.white },
                headerTintColor: C.danger, headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                headerShown: true, title: 'Chat',
                headerStyle: { backgroundColor: C.white },
                headerTintColor: C.primary, headerShadowVisible: false,
              }}
            />
            <Stack.Screen name="Scanner" component={ScannerScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
