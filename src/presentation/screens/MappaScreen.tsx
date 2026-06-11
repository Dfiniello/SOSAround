import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../infrastructure/store/hooks';
import { AllertaController } from '../../infrastructure/controllers/AllertaController';
import { LocationService } from '../../infrastructure/services/LocationService';
import { StatoSegnalazione } from '../../domain/entities';
import { C } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const locationService = new LocationService();

const TIPO_PIN: Record<string, string> = {
  ANIMALE: '🐾',
  OGGETTO: '📦',
  ALTRO: '📌',
};

export const MappaScreen: React.FC = () => {
  const dispatch     = useAppDispatch();
  const navigation   = useNavigation<Nav>();
  const segnalazioni = useAppSelector(s =>
    s.segnalazione.attive.filter(s => s.stato === StatoSegnalazione.ATTIVO)
  );
  const smartIds = useAppSelector(s => s.smartId.items);

  const mapRef = useRef<MapView>(null);
  const [regione, setRegione] = useState<{
    latitude: number; longitude: number;
    latitudeDelta: number; longitudeDelta: number;
  } | null>(null);

  const controller = new AllertaController(dispatch);

  useEffect(() => {
    controller.caricaSegnalazioniAttive();
    locationService.getPosizione().then(pos => {
      const r = {
        latitude: pos.latitudine,
        longitude: pos.longitudine,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegione(r);
    }).catch(() => {
      setRegione({ latitude: 41.9028, longitude: 12.4964, latitudeDelta: 5, longitudeDelta: 5 });
    });
  }, []);

  const getBene = (idBene: string) => smartIds.find(b => b.idBene === idBene);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header stile wireframe */}
      <View style={styles.header}>
        <Text style={styles.titolo}>SOSAround</Text>
        <View style={styles.pill}>
          <View style={styles.pillDot} />
          <Text style={styles.pillText}>{segnalazioni.length} attive</Text>
        </View>
      </View>

      {!regione && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Rilevamento posizione…</Text>
        </View>
      )}
      <MapView
        ref={mapRef}
        style={styles.mappa}
        provider={PROVIDER_GOOGLE}
        initialRegion={regione ?? undefined}
        region={regione ?? undefined}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {segnalazioni.map(s => {
          const bene = getBene(s.idBene);
          return (
            <React.Fragment key={s.idSegnalazione}>
              <Marker
                coordinate={{ latitude: s.latitudine, longitude: s.longitudine }}
                title={bene?.nome ?? 'Bene smarrito'}
                description={s.descrizioneEmergenza}
                onCalloutPress={() =>
                  navigation.navigate('Chat', { idSegnalazione: s.idSegnalazione })
                }
              >
                <View style={styles.pin}>
                  <Text style={styles.pinEmoji}>
                    {bene ? TIPO_PIN[bene.tipo] ?? '📦' : '🚨'}
                  </Text>
                </View>
              </Marker>
              <Circle
                center={{ latitude: s.latitudine, longitude: s.longitudine }}
                radius={s.raggioProssimita * 1000}
                fillColor="rgba(37,99,235,0.07)"
                strokeColor="rgba(37,99,235,0.25)"
                strokeWidth={1.5}
              />
            </React.Fragment>
          );
        })}
      </MapView>

      {/* FAB scanner QR */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Scanner')}
        accessibilityLabel="Scansiona QR code"
      >
        <Ionicons name="qr-code-outline" size={24} color={C.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.white },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  titolo: { fontSize: 22, fontWeight: '800', color: C.dark },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.attivoBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.attivoText },
  pillText: { fontSize: 12, fontWeight: '700', color: C.attivoText },

  mappa: { flex: 1 },
  loading: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  loadingText: { marginTop: 10, color: C.text2, fontSize: 14 },

  pin: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 6,
    borderWidth: 2,
    borderColor: C.primary,
    shadowColor: C.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pinEmoji: { fontSize: 20 },

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
