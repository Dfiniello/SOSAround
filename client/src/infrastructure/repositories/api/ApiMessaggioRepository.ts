import { api } from '../../api/apiClient';
import type { IMessaggioRepository } from '../../../domain/repositories/IMessaggioRepository';
import type { Messaggio } from '../../../domain/entities';

type Row = {
  id_messaggio: string; id_segnalazione: string;
  id_mittente: string; id_destinatario: string;
  testo: string; timestamp: string;
  media_url: string | null; coord_lat: number | null; coord_lng: number | null;
};

export function rowToMessaggio(r: Row): Messaggio {
  return {
    idMessaggio: r.id_messaggio,
    idSegnalazione: r.id_segnalazione,
    idMittente: r.id_mittente,
    idDestinatario: r.id_destinatario,
    testo: r.testo,
    timestamp: new Date(r.timestamp),
    mediaUrl: r.media_url ?? undefined,
    coordinateGps:
      r.coord_lat != null && r.coord_lng != null
        ? { lat: r.coord_lat, lng: r.coord_lng }
        : undefined,
  };
}

export class ApiMessaggioRepository implements IMessaggioRepository {
  async findByConversazione(idSegnalazione: string, idRitrovatore: string): Promise<Messaggio[]> {
    const rows = await api.get<Row[]>(
      `/messaggi?segnalazione=${encodeURIComponent(idSegnalazione)}&ritrovatore=${encodeURIComponent(idRitrovatore)}`
    );
    return rows.map(rowToMessaggio);
  }

  async save(m: Messaggio): Promise<void> {
    await api.post('/messaggi', {
      id_messaggio: m.idMessaggio,
      id_segnalazione: m.idSegnalazione,
      id_mittente: m.idMittente,
      id_destinatario: m.idDestinatario,
      testo: m.testo,
      timestamp: m.timestamp.toISOString(),
      media_url: m.mediaUrl ?? null,
      coord_lat: m.coordinateGps?.lat ?? null,
      coord_lng: m.coordinateGps?.lng ?? null,
    });
  }
}
