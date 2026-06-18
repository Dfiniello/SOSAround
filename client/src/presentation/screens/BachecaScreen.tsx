import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../infrastructure/store/hooks';
import { AllertaController } from '../../infrastructure/controllers/AllertaController';
import { StatoSegnalazione } from '../../domain/entities';
import type { Segnalazione } from '../../domain/entities';
import { getSocket } from '../../infrastructure/realtime/socketClient';
import { C } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Formatta la descrizione rimuovendo le coordinate grezze se possibile */
function formatDesc(desc: string): string {
  if (!desc) return 'Nessuna descrizione';
  // Se la descrizione è solo coordinate grezze, mostra testo più amichevole
  if (/^Smarrito in zona [-\d.,\s]+$/.test(desc)) return 'Posizione indicata sulla mappa';
  return desc;
}

function BachecaCard({
  segnalazione,
  nomeBene,
  isProprietario,
  onContatta,
  onRitrovato,
}: {
  segnalazione: Segnalazione;
  nomeBene: string;
  isProprietario: boolean;
  onContatta: () => void;
  onRitrovato: () => void;
}) {
  const isAttivo = segnalazione.stato === StatoSegnalazione.ATTIVO;
  const desc = formatDesc(segnalazione.descrizioneEmergenza);

  return (
    <View style={[styles.card, !isAttivo && styles.cardChiusa]}>
      {/* Accento laterale colorato */}
      <View style={[styles.accent, isAttivo ? styles.accentAttivo : styles.accentChiuso]} />

      <View style={styles.cardBody}>
        {/* Riga titolo + badge */}
        <View style={styles.topRow}>
          <Text style={[styles.nomeBene, !isAttivo && styles.textFaded]} numberOfLines={1}>
            {nomeBene}
          </Text>
          <View style={[styles.badge, isAttivo ? styles.badgeAttivo : styles.badgeChiuso]}>
            <Text style={[styles.badgeText, isAttivo ? styles.badgeAttivoText : styles.badgeChiusoText]}>
              {isAttivo ? 'Attivo' : 'Chiuso'}
            </Text>
          </View>
        </View>

        {/* Descrizione con icona */}
        <View style={styles.descRow}>
          <Ionicons
            name="location-outline"
            size={13}
            color={isAttivo ? C.text2 : C.text3}
            style={{ marginTop: 1 }}
          />
          <Text style={[styles.desc, !isAttivo && styles.textFaded]} numberOfLines={1}>
            {desc}
          </Text>
        </View>

        {/* Azioni */}
        <View style={styles.actions}>
          {/* "Contatta" è per chi NON è il proprietario (il potenziale ritrovatore).
              Il proprietario gestisce le conversazioni dalla tab Messaggi. */}
          {!isProprietario && (
            <TouchableOpacity
              style={[styles.btn, isAttivo ? styles.btnContatta : styles.btnDisabled]}
              onPress={onContatta}
              disabled={!isAttivo}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-outline" size={14} color={isAttivo ? C.white : C.text3} />
              <Text style={[styles.btnText, isAttivo ? styles.btnContattaText : styles.btnDisabledText]}>
                Contatta
              </Text>
            </TouchableOpacity>
          )}

          {/* "Ritrovato" è riservato al proprietario della segnalazione */}
          {isProprietario && (
            <TouchableOpacity
              style={[styles.btn, styles.btnRitrovato, !isAttivo && styles.btnDisabled]}
              onPress={onRitrovato}
              disabled={!isAttivo}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={14}
                color={isAttivo ? C.primary : C.text3} />
              <Text style={[styles.btnText, styles.btnRitrovatoText, !isAttivo && styles.btnDisabledText]}>
                Ritrovato
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export const BachecaScreen: React.FC = () => {
  const navigation   = useNavigation<Nav>();
  const dispatch     = useAppDispatch();
  const segnalazioni = useAppSelector(s => s.segnalazione.attive);
  const smartIds     = useAppSelector(s => s.smartId.items);
  const utente       = useAppSelector(s => s.auth.utente);
  const isLoading    = useAppSelector(s => s.segnalazione.isLoading);
  const controller   = new AllertaController(dispatch);

  useEffect(() => {
    // Fetch iniziale
    controller.caricaSegnalazioniAttive();

    // Socket.IO — nuove segnalazioni / aggiornamenti di stato senza refresh manuale
    const socket = getSocket();
    const refresh = () => controller.caricaSegnalazioniAttive();
    socket.on('segnalazione:nuova', refresh);
    socket.on('segnalazione:aggiornata', refresh);

    return () => {
      socket.off('segnalazione:nuova', refresh);
      socket.off('segnalazione:aggiornata', refresh);
    };
  }, []);

  const getNomeBene = (s: Segnalazione) =>
    s.nomeBene
    ?? smartIds.find(b => b.idBene === s.idBene)?.nome
    ?? 'Oggetto smarrito';

  const handleRitrovato = (idSegnalazione: string, nome: string) => {
    Alert.alert(
      'Segna come ritrovato',
      `"${nome}" è stato ritrovato?`,
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Sì, ritrovato!', onPress: () => controller.chiudiSegnalazione(idSegnalazione) },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={segnalazioni}
        keyExtractor={s => s.idSegnalazione}
        renderItem={({ item }) => {
          const nome = getNomeBene(item);
          return (
            <BachecaCard
              segnalazione={item}
              nomeBene={nome}
              isProprietario={item.idSegnalatore === utente?.idUtente}
              onContatta={() => navigation.navigate('Chat', {
                idSegnalazione: item.idSegnalazione,
                idProprietario: item.idSegnalatore,
                idRitrovatore: utente!.idUtente, // il ritrovatore sono io
                titolo: nome,
              })}
              onRitrovato={() => handleRitrovato(item.idSegnalazione, nome)}
            />
          );
        }}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="newspaper-outline" size={40} color={C.primary} />
              </View>
              <Text style={styles.emptyTitle}>Bacheca vuota</Text>
              <Text style={styles.emptyDesc}>
                Non ci sono segnalazioni attive.{'\n'}
                Usa "Segnala" per creare una nuova allerta.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  lista: { padding: 16, paddingBottom: 24 },

  card: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardChiusa: { opacity: 0.65 },

  // Bordo laterale colorato
  accent: { width: 4 },
  accentAttivo: { backgroundColor: C.primary },
  accentChiuso: { backgroundColor: C.text3 },

  cardBody: { flex: 1, padding: 14 },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nomeBene: { fontSize: 16, fontWeight: '700', color: C.text1, flex: 1, marginRight: 8 },
  textFaded: { color: C.text2 },

  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeAttivo:     { backgroundColor: C.attivoBg },
  badgeChiuso:     { backgroundColor: C.chiusoBg },
  badgeText:       { fontSize: 11, fontWeight: '700' },
  badgeAttivoText: { color: C.attivoText },
  badgeChiusoText: { color: C.chiusoText },

  descRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 12 },
  desc:    { fontSize: 13, color: C.text2, flex: 1 },

  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 10, gap: 5,
  },
  btnContatta:      { backgroundColor: C.primary },
  btnRitrovato:     { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.primary },
  btnDisabled:      { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  btnText:          { fontSize: 13, fontWeight: '700' },
  btnContattaText:  { color: C.white },
  btnRitrovatoText: { color: C.primary },
  btnDisabledText:  { color: C.text3 },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text1 },
  emptyDesc:  {
    fontSize: 14, color: C.text2, textAlign: 'center',
    marginTop: 8, lineHeight: 21,
  },
});
