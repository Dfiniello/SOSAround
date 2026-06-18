import type { Messaggio } from '../entities';

export interface IMessaggioRepository {
  // Messaggi della conversazione 1:1 tra il proprietario e uno specifico ritrovatore.
  findByConversazione(idSegnalazione: string, idRitrovatore: string): Promise<Messaggio[]>;
  save(messaggio: Messaggio): Promise<void>;
}
