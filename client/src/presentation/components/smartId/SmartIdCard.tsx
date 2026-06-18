// Componente Presentazionale — mostra un bene registrato
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import type { SmartId } from '../../../domain/entities';
import { Card } from '../common/Card';

interface Props {
  smartId: SmartId;
  onPress?: () => void;
  onAllerta?: () => void;
}

const TIPO_EMOJI: Record<string, string> = {
  CANE: '🐕', GATTO: '🐈', ANIMALE: '🦊',
  BICI: '🚲', ZAINO: '🎒', PORTAFOGLIO: '👜',
  CHIAVI: '🔑', ALTRO: '📦',
};

export const SmartIdCard: React.FC<Props> = ({ smartId, onPress, onAllerta }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
    <Card>
      <View style={styles.row}>
        <Image
          source={{ uri: smartId.fotoUrl || 'https://via.placeholder.com/80' }}
          style={styles.foto}
        />
        <View style={styles.info}>
          <Text style={styles.emoji}>
            {TIPO_EMOJI[smartId.tipo] ?? '📦'}
          </Text>
          <Text style={styles.nome} numberOfLines={1}>{smartId.nome}</Text>
          <Text style={styles.codice} numberOfLines={1}>
            ID: {smartId.codiceIdentificativo}
          </Text>
          <Text style={styles.data}>
            {smartId.dataRegistrazione.toLocaleDateString('it-IT')}
          </Text>
        </View>
        {onAllerta && (
          <TouchableOpacity
            style={styles.btnAllerta}
            onPress={onAllerta}
            accessibilityLabel={`Attiva allerta per ${smartId.nome}`}
          >
            <Text style={styles.btnAllertaTesto}>🚨</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  foto: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  info: { flex: 1 },
  emoji: { fontSize: 20 },
  nome: { fontSize: 17, fontWeight: '700', color: '#1d1d1f', marginTop: 2 },
  codice: { fontSize: 12, color: '#888', marginTop: 2 },
  data: { fontSize: 11, color: '#bbb', marginTop: 4 },
  btnAllerta: {
    backgroundColor: '#E63946',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAllertaTesto: { fontSize: 20 },
});
