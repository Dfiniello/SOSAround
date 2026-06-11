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
import { SmartIdController } from '../../infrastructure/controllers/SmartIdController';
import { AuthService } from '../../infrastructure/services/AuthService';
import { C } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { SmartId } from '../../domain/entities';
import { TipoBene } from '../../domain/entities';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const authService = new AuthService();

const THUMB_COLOR: Record<TipoBene, string> = {
  [TipoBene.ANIMALE]: C.thumbAnimale,
  [TipoBene.OGGETTO]: C.thumbZaino,
  [TipoBene.ALTRO]:   C.thumbAltro,
};

const TIPO_EMOJI: Record<TipoBene, string> = {
  [TipoBene.ANIMALE]: '🐾',
  [TipoBene.OGGETTO]: '📦',
  [TipoBene.ALTRO]:   '📌',
};

function VaultItem({ item, onPress }: { item: SmartId; onPress: () => void }) {
  const thumbColor = THUMB_COLOR[item.tipo as TipoBene] ?? C.thumbAltro;
  const emoji = TIPO_EMOJI[item.tipo as TipoBene] ?? '📦';
  const dataStr = new Date(item.dataRegistrazione).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Thumbnail */}
      <View style={[styles.thumb, { backgroundColor: thumbColor }]}>
        <Text style={styles.thumbEmoji}>{emoji}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.nome}>{item.nome}</Text>
        <Text style={styles.data}>Aggiunto il {dataStr}</Text>
        <View style={styles.badges}>
          <View style={styles.badgeQr}>
            <Text style={styles.badgeQrText}>QR</Text>
          </View>
          <View style={styles.badgeAttivo}>
            <View style={styles.dotVerde} />
            <Text style={styles.badgeAttivoText}>Attivo</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={C.text3} />
    </TouchableOpacity>
  );
}

export const VaultScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch   = useAppDispatch();
  const utente     = useAppSelector(s => s.auth.utente);
  const { items, isLoading } = useAppSelector(s => s.smartId);

  const controller = new SmartIdController(dispatch);

  useEffect(() => {
    if (utente) controller.caricaPerProprietario(utente.idUtente);
  }, [utente?.idUtente]);

  const handleProfilo = () => {
    Alert.alert(
      utente?.nome ?? 'Profilo',
      `Email: ${utente?.email ?? '—'}\n\nCosa vuoi fare?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Disconnetti', style: 'destructive',
          onPress: () => authService.logout(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header personalizzato con logout */}
      <View style={styles.header}>
        <Text style={styles.titolo}>Smart ID Vault</Text>
        <TouchableOpacity onPress={handleProfilo} style={styles.logoutBtn}>
          <Ionicons name="person-circle-outline" size={30} color={C.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={b => b.idBene}
        renderItem={({ item }) =>
          <VaultItem
            item={item}
            onPress={() => navigation.navigate('DettaglioSmartId', { idBene: item.idBene })}
          />
        }
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="shield-outline" size={64} color={C.border} />
              <Text style={styles.emptyTitle}>Nessun bene registrato</Text>
              <Text style={styles.emptyDesc}>
                Aggiungi il tuo primo Smart ID{'\n'}per proteggere i tuoi oggetti.
              </Text>
            </View>
          ) : null
        }
      />

      {/* FAB — Nuovo Smart ID */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NuovoSmartId')}
        accessibilityLabel="Aggiungi nuovo Smart ID"
      >
        <Ionicons name="add" size={28} color={C.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  titolo: { fontSize: 22, fontWeight: '800', fontStyle: 'italic', color: C.dark },
  logoutBtn: { padding: 4 },

  lista: { padding: 16, paddingBottom: 100 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 14,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: { fontSize: 28 },

  info: { flex: 1 },
  nome: { fontSize: 16, fontWeight: '700', color: C.text1 },
  data: { fontSize: 12, color: C.text2, marginTop: 2 },

  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },

  badgeQr: {
    backgroundColor: C.qrBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeQrText: { fontSize: 11, fontWeight: '700', color: C.qrText },

  badgeAttivo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dotVerde: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.verdeText },
  badgeAttivoText: { fontSize: 12, fontWeight: '600', color: C.verdeText },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text1, marginTop: 16 },
  emptyDesc: { fontSize: 14, color: C.text2, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
