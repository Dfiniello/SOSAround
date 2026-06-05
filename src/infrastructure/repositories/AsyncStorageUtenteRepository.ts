import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IUtenteRepository } from '../../domain/repositories/IUtenteRepository';
import type { Utente } from '../../domain/entities';

const KEY = 'sosaround:utenti';

export class AsyncStorageUtenteRepository implements IUtenteRepository {
  private async readAll(): Promise<Utente[]> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Utente[];
    return parsed.map(u => ({ ...u, dataRegistrazione: new Date(u.dataRegistrazione) }));
  }

  private async writeAll(items: Utente[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
  }

  async findByEmail(email: string): Promise<Utente | null> {
    const all = await this.readAll();
    return all.find(u => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async findByNome(nome: string): Promise<Utente | null> {
    const all = await this.readAll();
    return all.find(u => u.nome.toLowerCase() === nome.toLowerCase()) ?? null;
  }

  async findById(idUtente: string): Promise<Utente | null> {
    const all = await this.readAll();
    return all.find(u => u.idUtente === idUtente) ?? null;
  }

  async save(utente: Utente): Promise<void> {
    const all = await this.readAll();
    all.push(utente);
    await this.writeAll(all);
  }

  async update(utente: Utente): Promise<void> {
    const all = await this.readAll();
    const idx = all.findIndex(u => u.idUtente === utente.idUtente);
    if (idx !== -1) all[idx] = utente;
    await this.writeAll(all);
  }

  async delete(idUtente: string): Promise<void> {
    const all = await this.readAll();
    await this.writeAll(all.filter(u => u.idUtente !== idUtente));
  }

  async savePushToken(idUtente: string, token: string): Promise<void> {
    const all = await this.readAll();
    const u = all.find(x => x.idUtente === idUtente);
    if (u) u.pushToken = token;
    await this.writeAll(all);
  }
}
