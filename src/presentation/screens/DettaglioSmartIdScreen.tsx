import React from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { useAppSelector } from '../../infrastructure/store/hooks';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import type { RootStackParamList } from '../navigation/AppNavigator';

type RouteT = RouteProp<RootStackParamList, 'DettaglioSmartId'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export const DettaglioSmartIdScreen: React.FC = () => {
  const route = useRoute<RouteT>();
  const navigation = useNavigation<Nav>();
  const bene = useAppSelector(s =>
    s.smartId.items.find(b => b.idBene === route.params.idBene)
  );

  if (!bene) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errore}>Bene non trovato.</Text>
      </SafeAreaView>
    );
  }

  const handleCondividiQr = async () => {
    await Share.share({
      message: `Scansiona il QR code per ritrovare "${bene.nome}": ${bene.stringQrCode}`,
      url: bene.stringQrCode,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image
          source={{ uri: bene.fotoUrl || 'https://via.placeholder.com/400' }}
          style={styles.foto}
        />
        <View style={styles.body}>
          <Text style={styles.nome}>{bene.nome}</Text>
          <Text style={styles.tipo}>{bene.tipo}</Text>

          <Card style={styles.card}>
            <Text style={styles.cardLabel}>Codice ID</Text>
            <Text style={styles.cardValue}>{bene.codiceIdentificativo}</Text>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardLabel}>QR Code</Text>
            <View style={styles.qrWrapper}>
              <QRCode
                value={bene.stringQrCode}
                size={160}
                color="#1d1d1f"
                backgroundColor="#fff"
              />
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardLabel}>Registrato il</Text>
            <Text style={styles.cardValue}>
              {bene.dataRegistrazione.toLocaleDateString('it-IT')}
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* RQ-24: CTA nella safe zone inferiore */}
      <View style={styles.footer}>
        <Button
          label="🚨 Attiva Allerta"
          onPress={() => navigation.navigate('AttivaAllerta', { idBene: bene.idBene })}
          variante="pericolo"
          style={styles.btnAllerta}
        />
        <Button
          label="📤 Condividi QR"
          onPress={handleCondividiQr}
          variante="secondario"
          style={styles.btnQr}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f8fa' },
  scroll: { paddingBottom: 120 },
  foto: {
    width: '100%', height: 280, backgroundColor: '#e0e0e0',
  },
  body: { padding: 20 },
  nome: { fontSize: 28, fontWeight: '800', color: '#1d1d1f' },
  tipo: { fontSize: 14, color: '#888', marginTop: 4, marginBottom: 20 },
  card: { marginBottom: 12 },
  cardLabel: { fontSize: 12, color: '#888', marginBottom: 6, fontWeight: '600' },
  cardValue: { fontSize: 16, color: '#1d1d1f', fontWeight: '600' },
  qrWrapper: { alignItems: 'center', paddingVertical: 8 },
  errore: { padding: 24, fontSize: 16, color: '#E63946' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: 36,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
    flexDirection: 'row', gap: 12,
  },
  btnAllerta: { flex: 1 },
  btnQr: { flex: 1 },
});
