// Schermata registrazione nuovo Smart ID — UC-01
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
  TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAppDispatch, useAppSelector } from '../../infrastructure/store/hooks';
import { SmartIdController } from '../../infrastructure/controllers/SmartIdController';
import { TipoBene } from '../../domain/entities';

const TIPI = Object.values(TipoBene);
const TIPO_LABEL: Record<TipoBene, string> = {
  ANIMALE: 'Animale',
  OGGETTO: 'Oggetto',
  ALTRO: 'Altro',
};

export const NuovoSmartIdScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const utente = useAppSelector(s => s.auth.utente);
  const isLoading = useAppSelector(s => s.smartId.isLoading);
  const errorRedux = useAppSelector(s => s.smartId.error);

  const [tipo, setTipo] = useState<TipoBene>(TipoBene.ANIMALE);
  const [nome, setNome] = useState('');
  const [codice, setCodice] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [errore, setErrore] = useState<string | null>(null);

  const controller = new SmartIdController(dispatch);

  // Scatta una foto con la fotocamera
  const handleScattaFoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permesso negato', 'Consenti l\'accesso alla fotocamera per scattare una foto.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) setFotoUrl(res.assets[0].uri);
  };

  // Scegli una foto dalla galleria
  const handleScegliGalleria = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permesso negato', 'Consenti l\'accesso alla galleria per scegliere una foto.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) setFotoUrl(res.assets[0].uri);
  };

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
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
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
          <Text style={styles.sectionLabel}>Foto del bene (opzionale)</Text>
          {fotoUrl ? (
            <View style={styles.fotoPreviewWrap}>
              <Image source={{ uri: fotoUrl }} style={styles.fotoPreview} />
              <TouchableOpacity style={styles.fotoRemove} onPress={() => setFotoUrl('')}>
                <Ionicons name="close-circle" size={26} color="#E63946" />
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.fotoBtnRow}>
            <TouchableOpacity style={styles.fotoBtn} onPress={handleScattaFoto}>
              <Ionicons name="camera" size={20} color="#1d1d1f" />
              <Text style={styles.fotoBtnText}>Scatta foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fotoBtn} onPress={handleScegliGalleria}>
              <Ionicons name="images" size={20} color="#1d1d1f" />
              <Text style={styles.fotoBtnText}>Galleria</Text>
            </TouchableOpacity>
          </View>

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
  fotoBtnRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  fotoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#e0e0e0', backgroundColor: '#fafafa',
  },
  fotoBtnText: { fontSize: 14, fontWeight: '600', color: '#1d1d1f' },
  fotoPreviewWrap: { marginBottom: 12, alignSelf: 'flex-start' },
  fotoPreview: { width: 140, height: 140, borderRadius: 12, backgroundColor: '#f0f0f0' },
  fotoRemove: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 13 },
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
