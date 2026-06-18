import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../infrastructure/store/hooks';
import { AllertaController } from '../../infrastructure/controllers/AllertaController';
import { SmartIdController } from '../../infrastructure/controllers/SmartIdController';
import { LocationService } from '../../infrastructure/services/LocationService';
import { TipoBene } from '../../domain/entities';
import { C } from '../theme/colors';

const locationService = new LocationService();

// Coordinate di default (Roma) usate solo se GPS non disponibile
const DEFAULT_LAT = 41.9028;
const DEFAULT_LNG = 12.4964;

export const NuovaSegnalazioneScreen: React.FC = () => {
  const dispatch  = useAppDispatch();
  const utente    = useAppSelector(s => s.auth.utente);
  const isLoading = useAppSelector(s => s.segnalazione.isLoading);

  const [cosa, setCosa]   = useState('');
  const [dove, setDove]   = useState('');
  const [errore, setErrore] = useState<string | null>(null);

  // Posizione del pin sulla mappa (null = non ancora piazzato)
  const [pinCoord, setPinCoord] = useState<{ lat: number; lng: number } | null>(null);

  // Mappa a tutto schermo
  const [mappaFullscreen, setMappaFullscreen] = useState(false);

  // Regione iniziale della mappa
  const [regione, setRegione] = useState({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const mapRef = useRef<MapView>(null);
  const fullMapRef = useRef<MapView>(null);

  // Centra la mappa a tutto schermo sulla posizione GPS attuale
  const handleCentraGpsFull = async () => {
    try {
      const pos = await locationService.getPosizione();
      const r = {
        latitude: pos.latitudine,
        longitude: pos.longitudine,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
      fullMapRef.current?.animateToRegion(r, 400);
      setPinCoord({ lat: pos.latitudine, lng: pos.longitudine });
    } catch {
      Alert.alert('GPS non disponibile', 'Tocca manualmente sulla mappa per indicare il luogo.');
    }
  };

  const allertaCtrl = new AllertaController(dispatch);
  const smartIdCtrl = new SmartIdController(dispatch);

  // Centra la mappa sulla posizione GPS attuale all'avvio
  useEffect(() => {
    locationService.getPosizione()
      .then(pos => {
        const r = {
          latitude: pos.latitudine,
          longitude: pos.longitudine,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegione(r);
        mapRef.current?.animateToRegion(r, 400);
      })
      .catch(() => {/* usa default se GPS non disponibile */});
  }, []);

  // Tap sulla mappa → piazza/sposta il pin
  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPinCoord({ lat: latitude, lng: longitude });
  };

  // Centra mappa sulla posizione GPS attuale
  const handleCentraGps = async () => {
    try {
      const pos = await locationService.getPosizione();
      const r = {
        latitude: pos.latitudine,
        longitude: pos.longitudine,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
      setRegione(r);
      mapRef.current?.animateToRegion(r, 400);
      setPinCoord({ lat: pos.latitudine, lng: pos.longitudine });
    } catch {
      Alert.alert('GPS non disponibile', 'Tocca manualmente sulla mappa per indicare il luogo.');
    }
  };

  const handleInvia = async () => {
    if (!cosa.trim()) {
      setErrore('Inserisci cosa hai smarrito.');
      return;
    }
    if (!pinCoord) {
      setErrore('Tocca sulla mappa per indicare dove hai perso l\'oggetto.');
      return;
    }
    if (!utente) return;
    setErrore(null);

    try {
      // 1. Crea un nuovo Smart ID
      const nuovoBene = await smartIdCtrl.registra({
        idProprietario: utente.idUtente,
        tipo: TipoBene.ALTRO,
        nome: cosa.trim(),
        fotoUrl: '',
        codiceIdentificativo: `QUICK-${Date.now()}`,
      });

      // 2. Attiva l'allerta con le coordinate del pin scelto dall'utente
      await allertaCtrl.attivaAllerta({
        idBene: nuovoBene.idBene,
        idSegnalatore: utente.idUtente,
        latitudine: pinCoord.lat,
        longitudine: pinCoord.lng,
        descrizioneEmergenza: dove.trim() || `Smarrito in zona ${pinCoord.lat.toFixed(4)}, ${pinCoord.lng.toFixed(4)}`,
        raggioProssimita: 10,
      });

      setCosa('');
      setDove('');
      setPinCoord(null);
      Alert.alert(
        'Segnalazione inviata!',
        'La tua allerta è ora visibile nella bacheca community.',
      );
    } catch (e) {
      setErrore((e as Error).message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Campo: cosa hai smarrito */}
          <Text style={styles.label}>Cosa hai smarrito?</Text>
          <TextInput
            style={styles.input}
            value={cosa}
            onChangeText={setCosa}
            placeholder="Es. Zaino Blu, Cane Labrador..."
            placeholderTextColor={C.text3}
          />

          {/* Campo: descrizione luogo */}
          <Text style={[styles.label, styles.labelTop]}>Dove?</Text>
          <TextInput
            style={styles.input}
            value={dove}
            onChangeText={setDove}
            placeholder="Es. Parco Centrale, Ufficio..."
            placeholderTextColor={C.text3}
          />

          {/* Sezione mappa */}
          <View style={styles.mapSection}>
            <View style={styles.mapHeader}>
              <Text style={styles.mapLabel}>Indica sulla mappa dove hai perso l'oggetto</Text>
              <TouchableOpacity onPress={handleCentraGps} style={styles.gpsBtn}>
                <Ionicons name="locate" size={16} color={C.primary} />
                <Text style={styles.gpsBtnText}>La mia posizione</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.mapHint}>
              {pinCoord
                ? `Pin: ${pinCoord.lat.toFixed(4)}, ${pinCoord.lng.toFixed(4)}`
                : 'Tocca sulla mappa per piazzare il pin'}
            </Text>

            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.mappa}
                provider={PROVIDER_GOOGLE}
                initialRegion={regione}
                onPress={handleMapPress}
                showsUserLocation
                showsMyLocationButton={false}
              >
                {pinCoord && (
                  <Marker
                    coordinate={{ latitude: pinCoord.lat, longitude: pinCoord.lng }}
                    title={cosa || 'Oggetto smarrito'}
                    pinColor={C.danger}
                  />
                )}
              </MapView>

              {/* Overlay istruzione se nessun pin */}
              {!pinCoord && (
                <View pointerEvents="none" style={styles.mapOverlay}>
                  <View style={styles.mapOverlayPill}>
                    <Ionicons name="finger-print" size={16} color={C.white} />
                    <Text style={styles.mapOverlayText}>Tocca per piazzare il pin</Text>
                  </View>
                </View>
              )}

              {/* Bottone per aprire la mappa a tutto schermo */}
              <TouchableOpacity
                style={styles.expandBtn}
                onPress={() => setMappaFullscreen(true)}
                accessibilityLabel="Apri mappa a tutto schermo"
              >
                <Ionicons name="expand" size={18} color={C.text1} />
              </TouchableOpacity>
            </View>
          </View>

          {errore ? (
            <View style={styles.erroreBox}>
              <Text style={styles.erroreText}>{errore}</Text>
            </View>
          ) : null}

        </ScrollView>

        {/* CTA — safe zone inferiore */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.btnInvia,
              (!pinCoord || isLoading) && styles.btnDisabilitato,
            ]}
            onPress={handleInvia}
            disabled={!pinCoord || isLoading}
            accessibilityLabel="Invia Segnalazione"
          >
            {isLoading
              ? <ActivityIndicator color={C.white} />
              : <Text style={styles.btnInviaText}>Invia Segnalazione</Text>
            }
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* Mappa a tutto schermo */}
      <Modal
        visible={mappaFullscreen}
        animationType="slide"
        onRequestClose={() => setMappaFullscreen(false)}
      >
        <View style={styles.fullContainer}>
          <MapView
            ref={fullMapRef}
            style={styles.flex}
            provider={PROVIDER_GOOGLE}
            initialRegion={
              pinCoord
                ? { latitude: pinCoord.lat, longitude: pinCoord.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }
                : regione
            }
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {pinCoord && (
              <Marker
                coordinate={{ latitude: pinCoord.lat, longitude: pinCoord.lng }}
                title={cosa || 'Oggetto smarrito'}
                pinColor={C.danger}
              />
            )}
          </MapView>

          {/* Header con titolo e chiusura */}
          <SafeAreaView style={styles.fullHeader} edges={['top']} pointerEvents="box-none">
            <View style={styles.fullHeaderRow}>
              <TouchableOpacity
                style={styles.fullCloseBtn}
                onPress={() => setMappaFullscreen(false)}
                accessibilityLabel="Chiudi mappa"
              >
                <Ionicons name="close" size={24} color={C.text1} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.fullGpsBtn} onPress={handleCentraGpsFull}>
                <Ionicons name="locate" size={16} color={C.primary} />
                <Text style={styles.gpsBtnText}>La mia posizione</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Hint + conferma */}
          <SafeAreaView style={styles.fullFooter} edges={['bottom']} pointerEvents="box-none">
            <Text style={styles.fullHint}>
              {pinCoord
                ? `Pin: ${pinCoord.lat.toFixed(4)}, ${pinCoord.lng.toFixed(4)}`
                : 'Tocca sulla mappa per piazzare il pin'}
            </Text>
            <TouchableOpacity
              style={[styles.btnInvia, !pinCoord && styles.btnDisabilitato]}
              onPress={() => setMappaFullscreen(false)}
              disabled={!pinCoord}
            >
              <Text style={styles.btnInviaText}>Conferma posizione</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.white },
  flex:  { flex: 1 },
  scroll: { padding: 20, paddingTop: 16, paddingBottom: 8 },

  label: { fontSize: 14, fontWeight: '600', color: C.text1, marginBottom: 8 },
  labelTop: { marginTop: 20 },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.text1, backgroundColor: C.white,
  },

  // Sezione mappa
  mapSection: { marginTop: 24 },
  mapHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  mapLabel: { fontSize: 14, fontWeight: '600', color: C.text1, flex: 1 },
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#EFF6FF', borderRadius: 20,
  },
  gpsBtnText: { fontSize: 12, fontWeight: '600', color: C.primary },

  mapHint: {
    fontSize: 12, color: C.text2, marginBottom: 8,
    fontStyle: 'italic',
  },

  mapContainer: {
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1.5, borderColor: C.border,
    height: 220,
  },
  mappa: { flex: 1 },

  mapOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 14,
  },
  mapOverlayPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(37,99,235,0.85)',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  mapOverlayText: { color: C.white, fontSize: 13, fontWeight: '600' },

  expandBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 3,
  },

  // Mappa a tutto schermo
  fullContainer: { flex: 1, backgroundColor: C.white },
  fullHeader: { position: 'absolute', top: 0, left: 0, right: 0 },
  fullHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8,
  },
  fullCloseBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 3,
  },
  fullGpsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: C.white, borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 3,
  },
  fullFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  fullHint: {
    fontSize: 13, color: C.text1, fontWeight: '600',
    textAlign: 'center', marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 6, borderRadius: 8,
    overflow: 'hidden',
  },

  erroreBox: {
    marginTop: 16, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12,
  },
  erroreText: { color: C.danger, fontSize: 13 },

  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 8 : 20,
    backgroundColor: C.white,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  btnInvia: {
    backgroundColor: C.text1, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  btnDisabilitato: { opacity: 0.4 },
  btnInviaText: { color: C.white, fontSize: 16, fontWeight: '700' },
});
