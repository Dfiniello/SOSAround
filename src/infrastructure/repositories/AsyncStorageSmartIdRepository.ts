// ArchivioSmartID — implementazione concreta con AsyncStorage
// Outer layer: conosce AsyncStorage, implementa ISmartIdRepository (inner)
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ISmartIdRepository } from '../../domain/repositories/ISmartIdRepository';
import type { SmartId } from '../../domain/entities';

const KEY = 'sosaround:smartids';

export class AsyncStorageSmartIdRepository implements ISmartIdRepository {
  private async readAll(): Promise<SmartId[]> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SmartId[];
    return parsed.map(s => ({
      ...s,
      dataRegistrazione: new Date(s.dataRegistrazione),
    }));
  }

  private async writeAll(items: SmartId[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
  }

  async findById(idBene: string): Promise<SmartId | null> {
    const all = await this.readAll();
    return all.find(s => s.idBene === idBene) ?? null;
  }

  async findByCodiceIdentificativo(codice: string): Promise<SmartId | null> {
    const all = await this.readAll();
    return all.find(s => s.codiceIdentificativo === codice) ?? null;
  }

  async findByProprietario(idProprietario: string): Promise<SmartId[]> {
    const all = await this.readAll();
    return all.filter(s => s.idProprietario === idProprietario);
  }

  async findByQrCode(stringQrCode: string): Promise<SmartId | null> {
    const all = await this.readAll();
    return all.find(s => s.stringQrCode === stringQrCode) ?? null;
  }

  async save(smartId: SmartId): Promise<void> {
    const all = await this.readAll();
    all.push(smartId);
    await this.writeAll(all);
  }

  async update(smartId: SmartId): Promise<void> {
    const all = await this.readAll();
    const idx = all.findIndex(s => s.idBene === smartId.idBene);
    if (idx !== -1) all[idx] = smartId;
    await this.writeAll(all);
  }

  async delete(idBene: string): Promise<void> {
    const all = await this.readAll();
    await this.writeAll(all.filter(s => s.idBene !== idBene));
  }
}
