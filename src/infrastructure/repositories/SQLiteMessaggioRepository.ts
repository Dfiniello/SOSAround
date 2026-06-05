import { dbService } from '../database/DatabaseService';
import type { IMessaggioRepository } from '../../domain/repositories/IMessaggioRepository';
import type { Messaggio } from '../../domain/entities';

type Row = {
  id_messaggio: string; id_segnalazione: string;
  id_mittente: string; id_destinatario: string;
  testo: string; timestamp: string;
  media_url: string | null; coord_lat: number | null; coord_lng: number | null;
};

function rowToMessaggio(r: Row): Messaggio {
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

export class SQLiteMessaggioRepository implements IMessaggioRepository {
  async findBySegnalazione(idSegnalazione: string): Promise<Messaggio[]> {
    const db = await dbService.getDb();
    const rows = await db.getAllAsync<Row>(
      'SELECT * FROM messaggio WHERE id_segnalazione = ? ORDER BY timestamp ASC',
      [idSegnalazione]
    );
    return rows.map(rowToMessaggio);
  }

  async save(m: Messaggio): Promise<void> {
    const db = await dbService.getDb();
    await db.runAsync(
      `INSERT INTO messaggio
         (id_messaggio, id_segnalazione, id_mittente, id_destinatario,
          testo, timestamp, media_url, coord_lat, coord_lng)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.idMessaggio, m.idSegnalazione, m.idMittente, m.idDestinatario,
       m.testo, m.timestamp.toISOString(),
       m.mediaUrl ?? null,
       m.coordinateGps?.lat ?? null,
       m.coordinateGps?.lng ?? null]
    );
  }
}
