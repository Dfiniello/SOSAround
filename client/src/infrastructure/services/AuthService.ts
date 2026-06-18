import { api, setToken, caricaTokenDaDisco } from '../api/apiClient';
import { rowToUtente } from '../repositories/api/ApiUtenteRepository';
import { PasswordDeboleException, Utente } from '../../domain/entities';

type UtenteRow = {
  id_utente: string; nome: string; email: string;
  punteggio: number; data_reg: string; push_token: string | null;
};
type AuthResponse = { token: string; utente: UtenteRow };

export type UtentePubblico = Omit<Utente, 'passwordHash'>;

export class AuthService {
  validaEmail(email: string): void {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email.trim())) throw new Error('Inserisci un indirizzo email valido.');
  }

  validaPassword(password: string): void {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!regex.test(password)) throw new PasswordDeboleException();
  }

  async registra(nome: string, email: string, password: string): Promise<UtentePubblico> {
    const res = await api.post<AuthResponse>('/auth/register', { nome, email, password });
    await setToken(res.token);
    const { passwordHash, ...pub } = rowToUtente(res.utente);
    return pub;
  }

  async login(email: string, password: string): Promise<UtentePubblico> {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    await setToken(res.token);
    const { passwordHash, ...pub } = rowToUtente(res.utente);
    return pub;
  }

  async logout(): Promise<void> {
    await setToken(null);
  }

  // Ricarica il JWT dal disco e recupera l'utente corrente (bootstrap all'avvio app).
  async getSessioneAttiva(): Promise<UtentePubblico | null> {
    const token = await caricaTokenDaDisco();
    if (!token) return null;
    try {
      const res = await api.get<{ utente: UtenteRow }>('/auth/me');
      const { passwordHash, ...pub } = rowToUtente(res.utente);
      return pub;
    } catch {
      await setToken(null); // token scaduto/invalido
      return null;
    }
  }
}
