import type { Utente } from '../entities';

// Interfaccia pura — nessun import di framework esterni.
// I Use Case dipendono da questa, non dall'implementazione concreta.
export interface IUtenteRepository {
  findById(idUtente: string): Promise<Utente | null>;
  savePushToken(idUtente: string, token: string): Promise<void>;
}
