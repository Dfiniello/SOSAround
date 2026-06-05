// Schermata scanner QR — UC-03 entry point via QR code fisico
import React from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScannerQR } from '../components/smartId/ScannerQR';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Il QR code ha formato: sosaround://bene/<idBene>
// oppure: sosaround://segnalazione/<idSegnalazione>
function parseQrCode(raw: string): { tipo: 'bene' | 'segnalazione'; id: string } | null {
  const match = raw.match(/^sosaround:\/\/(bene|segnalazione)\/(.+)$/);
  if (!match) return null;
  return { tipo: match[1] as 'bene' | 'segnalazione', id: match[2] };
}

export const ScannerScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  const handleQr = (raw: string) => {
    const parsed = parseQrCode(raw);
    if (!parsed) {
      Alert.alert('QR non riconosciuto', 'Inquadra un QR code SOSAround valido.');
      return;
    }
    if (parsed.tipo === 'segnalazione') {
      navigation.replace('Chat', { idSegnalazione: parsed.id });
    } else {
      // QR code del bene → apri dettaglio (può essere per ritrovamento)
      navigation.replace('DettaglioSmartId', { idBene: parsed.id });
    }
  };

  return (
    <ScannerQR
      onQrScansionato={handleQr}
      onAnnulla={() => navigation.goBack()}
    />
  );
};
