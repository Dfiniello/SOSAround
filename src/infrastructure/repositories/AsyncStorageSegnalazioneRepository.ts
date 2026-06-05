import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ISegnalazioneRepository } from '../../domain/repositories/ISegnalazioneRepository';
import { Segnalazione, StatoSegnalazione } from '../../domain/entities';
import { LocationService } from '../services/LocationService';

const KEY = 'sosaround:segnalazioni';
const locationService = new LocationService();

export class AsyncStorageSegnalazioneRepository implements ISegnalazioneRepository {
  private async readAll(): Promise<Segnalazione[]> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Segnalazione[];
    return parsed.map(s => ({
      ...s,
      dataApertura: new Date(s.dataApertura),
      dataChiusura: s.dataChiusura ? new Date(s.dataChiusura) : undefined,
    }));
  }

  private async writeAll(items: Segnalazione[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
  }

  async findById(id: string): Promise<Segnalazione | null> {
    const all = await this.readAll();
    return all.find(s => s.idSegnalazione === id) ?? null;
  }

  async findByBene(idBene: string): Promise<Segnalazione[]> {
    const all = await this.readAll();
    return all.filter(s => s.idBene === idBene);
  }

  async findAttive(): Promise<Segnalazione[]> {
    const all = await this.readAll();
    return all.filter(s => s.stato === StatoSegnalazione.ATTIVO);
  }

  async findInRaggio(lat: number, lng: number, raggioKm: number): Promise<Segnalazione[]> {
    const attive = await this.findAttive();
    return attive.filter(s => {
      const dist = locationService.calcolaDistanzaKm(lat, lng, s.latitudine, s.longitudine);
      return dist <= raggioKm;
    });
  }

  async save(segnalazione: Segnalazione): Promise<void> {
    const all = await this.readAll();
    all.push(segnalazione);
    await this.writeAll(all);
  }

  async updateStato(idSegnalazione: string, stato: StatoSegnalazione): Promise<void> {
    const all = await this.readAll();
    const s = all.find(x => x.idSegnalazione === idSegnalazione);
    if (s) s.stato = stato;
    await this.writeAll(all);
  }

  async chiudi(idSegnalazione: string): Promise<void> {
    const all = await this.readAll();
    const s = all.find(x => x.idSegnalazione === idSegnalazione);
    if (s) {
      s.stato = StatoSegnalazione.RITROVATO;
      s.dataChiusura = new Date();
    }
    await this.writeAll(all);
  }
}
