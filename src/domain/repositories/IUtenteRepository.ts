import type { Utente } from '../entities';

// Interfaccia pura — nessun import di framework esterni.
// I Use Case dipendono da questa, non dall'implementazione concreta.
export interface IUtenteRepository {
  findByEmail(email: string): Promise<Utente | null>;
  findByNome(nome: string): Promise<Utente | null>;   // RQ-29 univocità
  findById(idUtente: string): Promise<Utente | null>;
  save(utente: Utente): Promise<void>;
  update(utente: Utente): Promise<void>;
  delete(idUtente: string): Promise<void>;
  savePushToken(idUtente: string, token: string): Promise<void>;
}
