import type { EventoRicerca, PartecipazioneEvento } from '../entities';

export interface IEventoRicercaRepository {
  findById(idEvento: string): Promise<EventoRicerca | null>;
  findBySegnalazione(idSegnalazione: string): Promise<EventoRicerca[]>;
  save(evento: EventoRicerca): Promise<void>;
  update(evento: EventoRicerca): Promise<void>;
  partecipa(partecipazione: PartecipazioneEvento): Promise<void>;
  checkIn(idUtente: string, idEvento: string): Promise<void>;
}
