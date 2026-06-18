// Wrapper per UUID che funziona su Hermes (React Native)
// crypto.randomUUID() non è disponibile su tutte le versioni di Hermes.
import * as ExpoCrypto from 'expo-crypto';

export function generateId(): string {
  return ExpoCrypto.randomUUID();
}
