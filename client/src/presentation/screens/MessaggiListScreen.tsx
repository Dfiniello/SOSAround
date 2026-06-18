import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../infrastructure/store/hooks';
import { AllertaController } from '../../infrastructure/controllers/AllertaController';
import { C } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const AVATAR_COLORS = [
  '#DBEAFE', '#D1FAE5', '#FEF3C7', '#FCE7F3', '#EDE9FE', '#FED7AA',
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(nome: string): string {
  return nome.slice(0, 2).toUpperCase();
}

export const MessaggiListScreen: React.FC = () => {
  const navigation    = useNavigation<Nav>();
  const dispatch      = useAppDispatch();
  const conversazioni = useAppSelector(s => s.messaggio.conversazioni);
  const segnalazioni  = useAppSelector(s => s.segnalazione.attive);
  const smartIds      = useAppSelector(s => s.smartId.items);

  const controller = new AllertaController(dispatch);

  useEffect(() => {
    controller.caricaSegnalazioniAttive();
  }, []);

  // Costruisce lista conversazioni da segnalazioni attive con messaggi
  const items = segnalazioni.map(s => {
    const msgs = conversazioni[s.idSegnalazione] ?? [];
    const ultimo = msgs[msgs.length - 1];
    // nomeBene è salvato sulla segnalazione → visibile a tutti, non solo al proprietario
    const nome = s.nomeBene
      ?? smartIds.find(b => b.idBene === s.idBene)?.nome
      ?? 'Oggetto smarrito';
    return {
      idSegnalazione: s.idSegnalazione,
      nome,
      ultimoMsg: ultimo?.testo ?? 'Nessun messaggio',
      ora: ultimo
        ? new Date(ultimo.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        : '',
    };
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={i => i.idSegnalazione}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Chat', { idSegnalazione: item.idSegnalazione })}
            activeOpacity={0.7}
          >
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: avatarColor(item.idSegnalazione) }]}>
              <Text style={styles.avatarText}>{initials(item.nome)}</Text>
            </View>

            {/* Testo */}
            <View style={styles.content}>
              <Text style={styles.nome}>{item.nome}</Text>
              <Text style={styles.preview} numberOfLines={1}>{item.ultimoMsg}</Text>
            </View>

            {/* Orario + freccia */}
            <View style={styles.right}>
              {item.ora ? <Text style={styles.ora}>{item.ora}</Text> : null}
              <Ionicons name="chevron-forward" size={16} color={C.text3} style={{ marginTop: 2 }} />
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={64} color={C.border} />
            <Text style={styles.emptyTitle}>Nessuna conversazione</Text>
            <Text style={styles.emptyDesc}>
              Usa "Contatta" dalla Bacheca{'\n'}per iniziare a chattare.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.white },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.white,
    gap: 12,
  },
  separator: { height: 1, backgroundColor: C.border, marginLeft: 78 },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: C.dark },

  content: { flex: 1 },
  nome:    { fontSize: 15, fontWeight: '700', color: C.text1 },
  preview: { fontSize: 13, color: C.text2, marginTop: 2 },

  right: { alignItems: 'flex-end' },
  ora:   { fontSize: 11, color: C.text3, marginBottom: 2 },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text1, marginTop: 16 },
  emptyDesc:  { fontSize: 14, color: C.text2, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
