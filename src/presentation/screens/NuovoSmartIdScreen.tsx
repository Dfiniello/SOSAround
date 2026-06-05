// Schermata registrazione nuovo Smart ID — UC-01
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAppDispatch, useAppSelector } from '../../infrastructure/store/hooks';
import { SmartIdController } from '../../infrastructure/controllers/SmartIdController';
import { TipoBene } from '../../domain/entities';

const TIPI = Object.values(TipoBene);
const TIPO_LABEL: Record<TipoBene, string> = {
  CANE: '🐕 Cane', GATTO: '🐈 Gatto', ANIMALE: '🦊 Animale',
  BICI: '🚲 Bici', ZAINO: '🎒 Zaino', PORTAFOGLIO: '👜 Portafoglio',
  CHIAVI: '🔑 Chiavi', ALTRO: '📦 Altro',
};

export const NuovoSmartIdScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const utente = useAppSelector(s => s.auth.utente);
  const isLoading = useAppSelector(s => s.smartId.isLoading);
  const errorRedux = useAppSelector(s => s.smartId.error);

  const [tipo, setTipo] = useState<TipoBene>(TipoBene.CANE);
  const [nome, setNome] = useState('');
  const [codice, setCodice] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [errore, setErrore] = useState<string | null>(null);

  const controller = new SmartIdController(dispatch);

  const handleRegistra = async () => {
    if (!utente) return;
    setErrore(null);
    try {
      await controller.registra({
        idProprietario: utente.idUtente,
        tipo,
        nome,
        fotoUrl: fotoUrl || 'https://via.placeholder.com/300',
        codiceIdentificativo: codice,
      });
      Alert.alert('✅ Bene registrato con successo!', `"${nome}" è ora nel tuo archivio Smart ID.`);
      navigation.goBack();
    } catch (e) {
      setErrore((e as Error).message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.titolo}>Nuovo Smart ID</Text>
          <Text style={styles.desc}>
            Registra il tuo bene per attivare un'allerta istantanea se viene smarrito.
          </Text>

          <Text style={styles.sectionLabel}>Tipo di bene</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipiRow}>
            {TIPI.map(t => (
              <Button
                key={t}
                label={TIPO_LABEL[t]}
                onPress={() => setTipo(t)}
                variante={tipo === t ? 'primario' : 'secondario'}
                style={styles.tipoBtn}
              />
            ))}
          </ScrollView>

          <Input label="Nome" value={nome} onChangeText={setNome} placeholder="es. Fido" />
          <Input
            label="Codice identificativo (microchip / targa)"
            value={codice}
            onChangeText={setCodice}
            placeholder="es. 941000023456789"
          />
          <Input
            label="URL Foto (opzionale)"
            value={fotoUrl}
            onChangeText={setFotoUrl}
            placeholder="https://..."
            keyboardType="default"
          />

          {(errore || errorRedux) && (
            <Text style={styles.errore}>{errore ?? errorRedux}</Text>
          )}
        </ScrollView>

        {/* RQ-24: CTA nella safe zone inferiore */}
        <View style={styles.footer}>
          <Button
            label="Registra Smart ID"
            onPress={handleRegistra}
            isLoading={isLoading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 8 },
  titolo: { fontSize: 26, fontWeight: '800', color: '#1d1d1f', marginBottom: 6 },
  desc: { fontSize: 14, color: '#666', marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 10 },
  tipiRow: { marginBottom: 24 },
  tipoBtn: { marginRight: 10, minWidth: 120 },
  errore: {
    color: '#E63946', fontSize: 13,
    backgroundColor: '#fef2f2', padding: 12, borderRadius: 8, marginTop: 4,
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
});
