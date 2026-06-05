// RQ-25: Cifratura password + sessione sicura con expo-secure-store
import * as SecureStore from 'expo-secure-store';
import * as ExpoCrypto from 'expo-crypto';
import { PasswordDeboleException } from '../../domain/entities';

const TOKEN_KEY = 'sosaround_auth_token';
const USER_KEY  = 'sosaround_user_id';

export class AuthService {
  // expo-crypto è disponibile su Hermes (a differenza di crypto.subtle)
  async hashPassword(password: string): Promise<string> {
    return ExpoCrypto.digestStringAsync(
      ExpoCrypto.CryptoDigestAlgorithm.SHA256,
      password
    );
  }

  validaPassword(password: string): void {
    // RQ-30: min 8 char, 1 maiuscola, 1 numero, 1 carattere speciale
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/;
    if (!regex.test(password)) throw new PasswordDeboleException();
  }

  async salvaSessione(idUtente: string, token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, idUtente);
  }

  async recuperaSessione(): Promise<{ idUtente: string; token: string } | null> {
    const token    = await SecureStore.getItemAsync(TOKEN_KEY);
    const idUtente = await SecureStore.getItemAsync(USER_KEY);
    if (!token || !idUtente) return null;
    return { idUtente, token };
  }

  async cancellaSessione(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }
}
