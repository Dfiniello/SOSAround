// Schermata scanner QR — UC-03 entry point via QR code fisico
import React from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScannerQR } from '../components/smartId/ScannerQR';
import { useAppSelector } from '../../infrastructure/store/hooks';
import { ApiSegnalazioneRepository } from '../../infrastructure/repositories/api/ApiSegnalazioneRepository';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const segnalazioneRepo = new ApiSegnalazioneRepository();

// Il QR code ha formato: sosaround://bene/<idBene>
// oppure: sosaround://segnalazione/<idSegnalazione>
function parseQrCode(raw: string): { tipo: 'bene' | 'segnalazione'; id: string } | null {
  const match = raw.match(/^sosaround:\/\/(bene|segnalazione)\/(.+)$/);
  if (!match) return null;
  return { tipo: match[1] as 'bene' | 'segnalazione', id: match[2] };
}

export const ScannerScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const utente = useAppSelector(s => s.auth.utente);

  const handleQr = async (raw: string) => {
    const parsed = parseQrCode(raw);
    if (!parsed) {
      Alert.alert('QR non riconosciuto', 'Inquadra un QR code SOSAround valido.');
      return;
    }
    if (parsed.tipo === 'segnalazione') {
      // Recupera il proprietario della segnalazione per aprire la chat 1:1 (io = ritrovatore)
      const seg = await segnalazioneRepo.findById(parsed.id);
      if (!seg || !utente) {
        Alert.alert('Segnalazione non trovata', 'Il QR non corrisponde a una segnalazione attiva.');
        return;
      }
      navigation.replace('Chat', {
        idSegnalazione: seg.idSegnalazione,
        idProprietario: seg.idSegnalatore,
        idRitrovatore: utente.idUtente,
        titolo: seg.nomeBene ?? 'Oggetto smarrito',
      });
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
