import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  PanResponder, GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../theme/colors';

// Valori selezionabili del raggio (km), da sinistra a destra sullo slider
export const VALORI_RAGGIO = [1, 2, 3, 5, 10];

/**
 * Selettore del raggio "stile volume": una barra con tacche su cui si trascina
 * il cursore; lo snap avviene sul valore più vicino tra 1/2/3/5/10 km.
 * Riutilizzato in Nuova Segnalazione e in Attiva Allerta.
 */
export function SelettoreRaggio({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [larghezza, setLarghezza] = useState(0);
  const larghezzaRef = useRef(0);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

  const n = VALORI_RAGGIO.length;
  const indice = Math.max(0, VALORI_RAGGIO.indexOf(value));
  const frazione = indice / (n - 1);

  const aggiornaDaX = (x: number) => {
    const w = larghezzaRef.current;
    if (w <= 0) return;
    const f = Math.min(1, Math.max(0, x / w));
    const nuovo = VALORI_RAGGIO[Math.round(f * (n - 1))];
    if (nuovo !== valueRef.current) onChangeRef.current(nuovo);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => aggiornaDaX(e.nativeEvent.locationX),
      onPanResponderMove: (e: GestureResponderEvent) => aggiornaDaX(e.nativeEvent.locationX),
    })
  ).current;

  const THUMB = 26;
  const thumbLeft = frazione * Math.max(0, larghezza - THUMB);

  return (
    <View style={styles.raggioSection}>
      <View style={styles.raggioHeader}>
        <View style={styles.raggioTitoloRow}>
          <Ionicons name="radio-outline" size={16} color={C.primary} />
          <Text style={styles.raggioTitolo}>Raggio di allerta</Text>
        </View>
        <View style={styles.raggioBadge}>
          <Text style={styles.raggioBadgeText}>{value} km</Text>
        </View>
      </View>

      {/* Barra trascinabile */}
      <View
        style={styles.track}
        onLayout={(ev) => {
          const w = ev.nativeEvent.layout.width;
          larghezzaRef.current = w;
          setLarghezza(w);
        }}
        {...pan.panHandlers}
      >
        <View style={styles.trackBg} />
        <View style={[styles.trackFill, { width: thumbLeft + THUMB / 2 }]} />
        <View style={[styles.thumb, { left: thumbLeft }]}>
          <Ionicons name="ellipse" size={10} color={C.white} />
        </View>
      </View>

      {/* Etichette delle tacche */}
      <View style={styles.ticksRow}>
        {VALORI_RAGGIO.map((v) => (
          <TouchableOpacity key={v} onPress={() => onChange(v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.tickText, v === value && styles.tickTextAttivo]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raggioSection: { marginTop: 24 },
  raggioHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14,
  },
  raggioTitoloRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  raggioTitolo: { fontSize: 14, fontWeight: '600', color: C.text1 },
  raggioBadge: {
    backgroundColor: '#EFF6FF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  raggioBadgeText: { fontSize: 14, fontWeight: '800', color: C.primary },

  track: { height: 26, justifyContent: 'center' },
  trackBg: {
    position: 'absolute', left: 0, right: 0, height: 6,
    borderRadius: 3, backgroundColor: C.border,
  },
  trackFill: {
    position: 'absolute', left: 0, height: 6,
    borderRadius: 3, backgroundColor: C.primary,
  },
  thumb: {
    position: 'absolute', width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 4,
  },
  ticksRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 8,
    paddingHorizontal: 4,
  },
  tickText: { fontSize: 13, color: C.text3, fontWeight: '600' },
  tickTextAttivo: { color: C.primary, fontWeight: '800' },
});
