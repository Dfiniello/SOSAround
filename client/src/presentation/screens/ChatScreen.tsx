import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../infrastructure/store/hooks';
import { ChatController } from '../../infrastructure/controllers/ChatController';
import { aggiungiMessaggio } from '../../infrastructure/store/slices/messaggioSlice';
import { SegnalazioneChiusaException } from '../../domain/entities';
import { supabase } from '../../infrastructure/supabase/supabaseClient';
import { C } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Messaggio } from '../../domain/entities';

type RouteT = RouteProp<RootStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const route      = useRoute<RouteT>();
  const navigation = useNavigation();
  const dispatch   = useAppDispatch();
  const utente     = useAppSelector(s => s.auth.utente);
  const messaggi   = useAppSelector(
    s => s.messaggio.conversazioni[route.params.idSegnalazione] ?? []
  );

  const [testo, setTesto]           = useState('');
  const [invioInCorso, setInvioInCorso] = useState(false);
  const flatRef    = useRef<FlatList>(null);
  // useRef per evitare stale closure nell'effetto Realtime:
  // l'effetto ha deps=[] ma deve sempre leggere l'utente aggiornato
  const utenteRef  = useRef(utente);
  useEffect(() => { utenteRef.current = utente; }, [utente]);
  const controller = new ChatController(dispatch);

  useEffect(() => {
    const idSegnalazione = route.params.idSegnalazione;

    (async () => {
      try {
        await controller.apriChat(idSegnalazione);
        await controller.caricaMessaggi(idSegnalazione);
      } catch (e) {
        if (e instanceof SegnalazioneChiusaException) {
          Alert.alert('Emergenza chiusa', e.message, [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
      }
    })();

    // Supabase Realtime — nuovi messaggi arrivano in push senza polling
    const channel = supabase
      .channel(`chat:${idSegnalazione}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messaggio',
          filter: `id_segnalazione=eq.${idSegnalazione}`,
        },
        (payload) => {
          const r = payload.new as {
            id_messaggio: string; id_segnalazione: string;
            id_mittente: string; id_destinatario: string;
            testo: string; timestamp: string;
            media_url: string | null; coord_lat: number | null; coord_lng: number | null;
          };
          const nuovoMsg: Messaggio = {
            idMessaggio: r.id_messaggio,
            idSegnalazione: r.id_segnalazione,
            idMittente: r.id_mittente,
            idDestinatario: r.id_destinatario,
            testo: r.testo,
            timestamp: new Date(r.timestamp),
            mediaUrl: r.media_url ?? undefined,
            coordinateGps:
              r.coord_lat != null && r.coord_lng != null
                ? { lat: r.coord_lat, lng: r.coord_lng }
                : undefined,
          };
            // Evita duplicati: il mittente ha già aggiunto il msg in handleInvia.
          // Usa utenteRef (non utente) per leggere il valore aggiornato
          // anche se l'effetto è montato con deps=[].
          if (nuovoMsg.idMittente !== utenteRef.current?.idUtente) {
            dispatch(aggiungiMessaggio(nuovoMsg));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (messaggi.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messaggi.length]);

  const handleInvia = async () => {
    if (!testo.trim() || !utente) return;
    setInvioInCorso(true);
    const testoLocale = testo.trim();
    setTesto('');
    try {
      await controller.invia({
        idSegnalazione: route.params.idSegnalazione,
        idMittente: utente.idUtente,
        testo: testoLocale,
      });
    } catch (e) {
      Alert.alert('Errore', (e as Error).message);
    } finally {
      setInvioInCorso(false);
    }
  };

  const renderMessaggio = ({ item }: { item: Messaggio }) => {
    const isMio = item.idMittente === utente?.idUtente;
    return (
      <View style={[styles.bubble, isMio ? styles.bubbleMia : styles.bubbleAltrui]}>
        {item.coordinateGps && (
          <Text style={styles.gps}>
            {item.coordinateGps.lat.toFixed(5)}, {item.coordinateGps.lng.toFixed(5)}
          </Text>
        )}
        <Text style={[styles.testoMsg, isMio ? styles.testoMio : styles.testoAltrui]}>
          {item.testo}
        </Text>
        <Text style={[styles.ora, isMio ? styles.oraMia : styles.oraAltrui]}>
          {new Date(item.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 24}
      >
        <FlatList
          ref={flatRef}
          data={messaggi}
          keyExtractor={m => m.idMessaggio}
          renderItem={renderMessaggio}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Nessun messaggio ancora.{'\n'}Invia la posizione o una descrizione dell'avvistamento!
            </Text>
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={testo}
            onChangeText={setTesto}
            placeholder="Scrivi un messaggio..."
            placeholderTextColor={C.text3}
            multiline
          />
          <TouchableOpacity
            style={[styles.btnInvia, (!testo.trim() || invioInCorso) && styles.btnDisabilitato]}
            onPress={handleInvia}
            disabled={!testo.trim() || invioInCorso}
            accessibilityLabel="Invia messaggio"
          >
            <Ionicons name="send" size={18} color={C.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.bg },
  flex:  { flex: 1 },
  lista: { padding: 16, paddingBottom: 8 },

  bubble: {
    maxWidth: '80%', marginVertical: 4, padding: 12, borderRadius: 16,
  },
  bubbleMia: {
    alignSelf: 'flex-end',
    backgroundColor: C.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAltrui: {
    alignSelf: 'flex-start',
    backgroundColor: C.white,
    borderBottomLeftRadius: 4,
    shadowColor: C.shadow, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  testoMsg:   { fontSize: 15 },
  testoMio:   { color: C.white },
  testoAltrui:{ color: C.text1 },
  gps:        { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 3 },
  ora:        { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  oraMia:     { color: 'rgba(255,255,255,0.65)' },
  oraAltrui:  { color: C.text3 },

  emptyText:  { textAlign: 'center', color: C.text3, marginTop: 80, fontSize: 14, lineHeight: 22 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 24,
    backgroundColor: C.white,
    borderTopWidth: 1, borderTopColor: C.border,
    gap: 8,
  },
  input: {
    flex: 1, backgroundColor: C.bg, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: C.text1, maxHeight: 100,
  },
  btnInvia: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  btnDisabilitato: { backgroundColor: C.border },
});
