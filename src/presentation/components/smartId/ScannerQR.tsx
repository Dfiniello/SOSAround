// Scanner QR — UC-03: apertura chat tramite QR code su volantino fisico
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface Props {
  onQrScansionato: (dati: string) => void;
  onAnnulla: () => void;
}

export const ScannerQR: React.FC<Props> = ({ onQrScansionato, onAnnulla }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scansionato, setScansionato] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleScan = ({ data }: { data: string }) => {
    if (scansionato) return;
    if (data.startsWith('sosaround://')) {
      setScansionato(true);
      onQrScansionato(data);
    } else {
      Alert.alert('QR non valido', 'Inquadra un QR code SOSAround.');
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.testo}>Permesso fotocamera necessario.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btn}>
          <Text style={styles.btnTesto}>Concedi permesso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <View style={styles.overlay}>
        <View style={styles.finestra} />
        <Text style={styles.istruzione}>Inquadra il QR code del volantino</Text>
      </View>
      {/* RQ-24: pulsante annulla nella safe zone inferiore */}
      <TouchableOpacity style={styles.btnAnnulla} onPress={onAnnulla}>
        <Text style={styles.btnAnnullaTesto}>Annulla</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  testo: { fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 16 },
  btn: {
    backgroundColor: '#E63946', padding: 14, borderRadius: 12,
  },
  btnTesto: { color: '#fff', fontWeight: '700' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finestra: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: '#E63946',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  istruzione: {
    color: '#fff',
    marginTop: 20,
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnAnnulla: {
    position: 'absolute',
    bottom: 48,         // RQ-24: safe zone inferiore
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 50,
  },
  btnAnnullaTesto: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
