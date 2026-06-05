import { dbService } from '../database/DatabaseService';
import type { ISegnalazioneRepository } from '../../domain/repositories/ISegnalazioneRepository';
import { Segnalazione, StatoSegnalazione } from '../../domain/entities';

type Row = {
  id_segnalazione: string; id_bene: string; id_segnalatore: string;
  data_apertura: string; data_chiusura: string | null; stato: string;
  latitudine: number; longitudine: number; descrizione: string; raggio_km: number;
};

function rowToSegnalazione(r: Row): Segnalazione {
  return {
    idSegnalazione: r.id_segnalazione,
    idBene: r.id_bene,
    idSegnalatore: r.id_segnalatore,
    dataApertura: new Date(r.data_apertura),
    dataChiusura: r.data_chiusura ? new Date(r.data_chiusura) : undefined,
    stato: r.stato as StatoSegnalazione,
    latitudine: r.latitudine,
    longitudine: r.longitudine,
    descrizioneEmergenza: r.descrizione,
    raggioProssimita: r.raggio_km,
  };
}

// Haversine inline — evita import circolare con utils/geo
function distKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class SQLiteSegnalazioneRepository implements ISegnalazioneRepository {
  async findById(id: string): Promise<Segnalazione | null> {
    const db = await dbService.getDb();
    const row = await db.getFirstAsync<Row>(
      'SELECT * FROM segnalazione WHERE id_segnalazione = ?', [id]
    );
    return row ? rowToSegnalazione(row) : null;
  }

  async findByBene(idBene: string): Promise<Segnalazione[]> {
    const db = await dbService.getDb();
    const rows = await db.getAllAsync<Row>(
      'SELECT * FROM segnalazione WHERE id_bene = ? ORDER BY data_apertura DESC',
      [idBene]
    );
    return rows.map(rowToSegnalazione);
  }

  async findAttive(): Promise<Segnalazione[]> {
    const db = await dbService.getDb();
    const rows = await db.getAllAsync<Row>(
      "SELECT * FROM segnalazione WHERE stato = 'ATTIVO' ORDER BY data_apertura DESC"
    );
    return rows.map(rowToSegnalazione);
  }

  // SQLite non supporta funzioni geo native — filtriamo in JS dopo fetch bounded box
  async findInRaggio(lat: number, lng: number, raggioKm: number): Promise<Segnalazione[]> {
    const db = await dbService.getDb();
    // Approssimazione bounding box per pre-filtrare in SQL, poi Haversine esatta in JS
    const delta = raggioKm / 111;
    const rows = await db.getAllAsync<Row>(
      `SELECT * FROM segnalazione
       WHERE stato = 'ATTIVO'
         AND latitudine  BETWEEN ? AND ?
         AND longitudine BETWEEN ? AND ?`,
      [lat - delta, lat + delta, lng - delta, lng + delta]
    );
    return rows
      .map(rowToSegnalazione)
      .filter(s => distKm(lat, lng, s.latitudine, s.longitudine) <= raggioKm);
  }

  async save(s: Segnalazione): Promise<void> {
    const db = await dbService.getDb();
    await db.runAsync(
      `INSERT INTO segnalazione
         (id_segnalazione, id_bene, id_segnalatore, data_apertura, data_chiusura,
          stato, latitudine, longitudine, descrizione, raggio_km)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.idSegnalazione, s.idBene, s.idSegnalatore,
       s.dataApertura.toISOString(), s.dataChiusura?.toISOString() ?? null,
       s.stato, s.latitudine, s.longitudine, s.descrizioneEmergenza, s.raggioProssimita]
    );
  }

  async updateStato(id: string, stato: StatoSegnalazione): Promise<void> {
    const db = await dbService.getDb();
    await db.runAsync(
      'UPDATE segnalazione SET stato = ? WHERE id_segnalazione = ?', [stato, id]
    );
  }

  async chiudi(id: string): Promise<void> {
    const db = await dbService.getDb();
    await db.runAsync(
      `UPDATE segnalazione SET stato = 'RITROVATO', data_chiusura = ?
       WHERE id_segnalazione = ?`,
      [new Date().toISOString(), id]
    );
  }
}
