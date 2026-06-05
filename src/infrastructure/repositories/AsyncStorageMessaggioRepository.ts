import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IMessaggioRepository } from '../../domain/repositories/IMessaggioRepository';
import type { Messaggio } from '../../domain/entities';

const KEY = 'sosaround:messaggi';

export class AsyncStorageMessaggioRepository implements IMessaggioRepository {
  private async readAll(): Promise<Messaggio[]> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Messaggio[];
    return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
  }

  private async writeAll(items: Messaggio[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
  }

  async findBySegnalazione(idSegnalazione: string): Promise<Messaggio[]> {
    const all = await this.readAll();
    return all
      .filter(m => m.idSegnalazione === idSegnalazione)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async save(messaggio: Messaggio): Promise<void> {
    const all = await this.readAll();
    all.push(messaggio);
    await this.writeAll(all);
  }
}
