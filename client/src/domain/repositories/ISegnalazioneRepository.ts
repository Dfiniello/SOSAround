import type { Segnalazione, StatoSegnalazione } from '../entities';

export interface ISegnalazioneRepository {
  findById(idSegnalazione: string): Promise<Segnalazione | null>;
  findByBene(idBene: string): Promise<Segnalazione[]>;
  findAttive(): Promise<Segnalazione[]>;
  findInRaggio(lat: number, lng: number, raggioKm: number): Promise<Segnalazione[]>;
  save(segnalazione: Segnalazione): Promise<void>;
  updateStato(idSegnalazione: string, stato: StatoSegnalazione): Promise<void>;
  chiudi(idSegnalazione: string): Promise<void>;
}
