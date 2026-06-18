import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../infrastructure/api/apiClient';
import { getSocket } from '../../infrastructure/realtime/socketClient';
import { C } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Forma restituita da GET /conversazioni
interface Conversazione {
  id_segnalazione: string;
  id_proprietario: string;
  id_ritrovatore: string;
  altro_id: string;
  altro_nome: string;
  nome_bene: string | null;
  ultimo_testo: string;
  ultimo_ts: string;
}

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
  const navigation = useNavigation<Nav>();
  const [conversazioni, setConversazioni] = useState<Conversazione[]>([]);

  // Ricarica la lista al focus della tab e ad ogni nuovo messaggio (realtime)
  useFocusEffect(
    useCallback(() => {
      let attivo = true;
      const carica = () => {
        api.get<Conversazione[]>('/conversazioni')
          .then(c => { if (attivo) setConversazioni(c); })
          .catch(() => { if (attivo) setConversazioni([]); });
      };
      carica();

      const socket = getSocket();
      socket.on('messaggio:nuovo:global', carica);
      return () => {
        attivo = false;
        socket.off('messaggio:nuovo:global', carica);
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={conversazioni}
        keyExtractor={c => `${c.id_segnalazione}:${c.id_ritrovatore}`}
        renderItem={({ item }) => {
          const ora = item.ultimo_ts
            ? new Date(item.ultimo_ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
            : '';
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('Chat', {
                idSegnalazione: item.id_segnalazione,
                idProprietario: item.id_proprietario,
                idRitrovatore: item.id_ritrovatore,
                titolo: item.altro_nome,
              })}
              activeOpacity={0.7}
            >
              {/* Avatar */}
              <View style={[styles.avatar, { backgroundColor: avatarColor(item.altro_id) }]}>
                <Text style={styles.avatarText}>{initials(item.altro_nome)}</Text>
              </View>

              {/* Testo */}
              <View style={styles.content}>
                <Text style={styles.nome}>
                  {item.altro_nome}
                  {item.nome_bene ? <Text style={styles.bene}>  · {item.nome_bene}</Text> : null}
                </Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.ultimo_testo || 'Nessun messaggio'}
                </Text>
              </View>

              {/* Orario + freccia */}
              <View style={styles.right}>
                {ora ? <Text style={styles.ora}>{ora}</Text> : null}
                <Ionicons name="chevron-forward" size={16} color={C.text3} style={{ marginTop: 2 }} />
              </View>
            </TouchableOpacity>
          );
        }}
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
  bene:    { fontSize: 13, fontWeight: '500', color: C.text3 },
  preview: { fontSize: 13, color: C.text2, marginTop: 2 },

  right: { alignItems: 'flex-end' },
  ora:   { fontSize: 11, color: C.text3, marginBottom: 2 },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text1, marginTop: 16 },
  emptyDesc:  { fontSize: 14, color: C.text2, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
