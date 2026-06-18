import type { Messaggio } from '../entities';

export interface IMessaggioRepository {
  findBySegnalazione(idSegnalazione: string): Promise<Messaggio[]>;
  save(messaggio: Messaggio): Promise<void>;
}
