import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAppDispatch, useAppSelector } from '../../infrastructure/store/hooks';
import { AllertaController } from '../../infrastructure/controllers/AllertaController';
import { LocationService } from '../../infrastructure/services/LocationService';
import { PosizioneMancante } from '../../domain/entities';
import { C } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type RouteT = RouteProp<RootStackParamList, 'AttivaAllerta'>;
const locationService = new LocationService();

export const AttivaAllertaScreen: React.FC = () => {
  const route    = useRoute<RouteT>();
  const navigation = useNavigation();
  const dispatch   = useAppDispatch();
  const utente     = useAppSelector(s => s.auth.utente);
  const avviso     = useAppSelector(s => s.segnalazione.avviso);
  const isLoading  = useAppSelector(s => s.segnalazione.isLoading);

  const [descrizione, setDescrizione] = useState('');
  const [latManuale, setLatManuale]   = useState('');
  const [lngManuale, setLngManuale]   = useState('');
  const [raggio, setRaggio]           = useState('10');
  const [usaGps, setUsaGps]           = useState(true);
  const [errore, setErrore]           = useState<string | null>(null);

  const controller = new AllertaController(dispatch);

  const handleAttiva = async () => {
    if (!utente) return;
    setErrore(null);

    let lat: number | undefined;
    let lng: number | undefined;

    if (usaGps) {
      try {
        const pos = await locationService.getPosizione();
        lat = pos.latitudine;
        lng = pos.longitudine;
      } catch (e) {
        if (e instanceof PosizioneMancante) {
          setUsaGps(false);
          setErrore(e.message);
          return;
        }
        lat = 40.8518; lng = 14.2681;
      }
    } else {
      lat = parseFloat(latManuale);
      lng = parseFloat(lngManuale);
      if (isNaN(lat) || isNaN(lng)) {
        setErrore('Inserisci coordinate valide (es. 40.8518, 14.2681).');
        return;
      }
    }

    try {
      await controller.attivaAllerta({
        idBene: route.params.idBene,
        idSegnalatore: utente.idUtente,
        latitudine: lat!,
        longitudine: lng!,
        descrizioneEmergenza: descrizione,
        raggioProssimita: parseFloat(raggio) || 10,
      });

      Alert.alert(
        'Allerta diffusa!',
        avviso ?? 'La segnalazione è ora visibile nella bacheca community.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
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
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.desc}>
            Descrivi lo smarrimento. Invieremo notifiche agli utenti nel raggio scelto.
          </Text>

          <Input
            label="Descrizione emergenza"
            value={descrizione}
            onChangeText={setDescrizione}
            placeholder="es. Smarrito al parco dopo le 15:00..."
            multiline
            numberOfLines={3}
          />

          <Input
            label="Raggio notifiche (km)"
            value={raggio}
            onChangeText={setRaggio}
            keyboardType="numeric"
            placeholder="10"
          />

          {!usaGps && (
            <>
              <Input label="Latitudine" value={latManuale} onChangeText={setLatManuale}
                keyboardType="numeric" placeholder="es. 40.8518" />
              <Input label="Longitudine" value={lngManuale} onChangeText={setLngManuale}
                keyboardType="numeric" placeholder="es. 14.2681" />
            </>
          )}

          <Button
            label={usaGps ? 'Usa posizione GPS' : 'Inserisci manualmente'}
            onPress={() => setUsaGps(v => !v)}
            variante="secondario"
          />

          {errore ? (
            <View style={styles.erroreBox}>
              <Text style={styles.erroreText}>{errore}</Text>
            </View>
          ) : null}
          {avviso ? (
            <View style={styles.avvisoBox}>
              <Text style={styles.avvisoText}>{avviso}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Attiva Allerta"
            onPress={handleAttiva}
            isLoading={isLoading}
            variante="pericolo"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.white },
  flex:  { flex: 1 },
  scroll: { padding: 20, paddingBottom: 8 },
  desc:  { fontSize: 14, color: C.text2, marginBottom: 20 },

  erroreBox: {
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
  },
  erroreText: { color: C.danger, fontSize: 13 },

  avvisoBox: {
    marginTop: 8,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
  },
  avvisoText: { color: '#92400E', fontSize: 13 },

  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.white,
  },
});
