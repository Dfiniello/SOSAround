// DatabaseService — Singleton che gestisce il ciclo di vita del database SQLite
// Pattern: Singleton (unica istanza condivisa dall'intera app)
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'sosaround.db';

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS utente (
  id_utente     TEXT PRIMARY KEY,
  nome          TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  punteggio     INTEGER NOT NULL DEFAULT 0,
  data_reg      TEXT NOT NULL,
  push_token    TEXT
);

CREATE TABLE IF NOT EXISTS smartid (
  id_bene         TEXT PRIMARY KEY,
  id_proprietario TEXT NOT NULL REFERENCES utente(id_utente) ON DELETE CASCADE,
  tipo            TEXT NOT NULL,
  nome            TEXT NOT NULL,
  foto_url        TEXT NOT NULL DEFAULT '',
  string_qr_code  TEXT NOT NULL UNIQUE,
  codice_id       TEXT NOT NULL UNIQUE,
  data_reg        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS segnalazione (
  id_segnalazione TEXT PRIMARY KEY,
  id_bene         TEXT NOT NULL REFERENCES smartid(id_bene) ON DELETE CASCADE,
  id_segnalatore  TEXT NOT NULL REFERENCES utente(id_utente),
  data_apertura   TEXT NOT NULL,
  data_chiusura   TEXT,
  stato           TEXT NOT NULL DEFAULT 'ATTIVO',
  latitudine      REAL NOT NULL,
  longitudine     REAL NOT NULL,
  descrizione     TEXT NOT NULL DEFAULT '',
  raggio_km       REAL NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS evento_ricerca (
  id_evento        TEXT PRIMARY KEY,
  id_organizzatore TEXT NOT NULL REFERENCES utente(id_utente),
  id_segnalazione  TEXT NOT NULL REFERENCES segnalazione(id_segnalazione),
  latitudine       REAL NOT NULL,
  longitudine      REAL NOT NULL,
  orario           TEXT NOT NULL,
  durata_min       INTEGER NOT NULL DEFAULT 60,
  raggio_copertura REAL NOT NULL DEFAULT 5,
  stato            TEXT NOT NULL DEFAULT 'PROGRAMMATO',
  esito            TEXT NOT NULL DEFAULT 'PENDING'
);

CREATE TABLE IF NOT EXISTS partecipazione_evento (
  id_utente TEXT NOT NULL REFERENCES utente(id_utente),
  id_evento TEXT NOT NULL REFERENCES evento_ricerca(id_evento),
  check_in  TEXT,
  PRIMARY KEY (id_utente, id_evento)
);

CREATE TABLE IF NOT EXISTS zona_interesse (
  id_zona     TEXT PRIMARY KEY,
  id_utente   TEXT NOT NULL REFERENCES utente(id_utente) ON DELETE CASCADE,
  latitudine  REAL NOT NULL,
  longitudine REAL NOT NULL,
  raggio_km   REAL NOT NULL DEFAULT 5,
  etichetta   TEXT NOT NULL DEFAULT 'Casa'
);

CREATE TABLE IF NOT EXISTS messaggio (
  id_messaggio    TEXT PRIMARY KEY,
  id_segnalazione TEXT NOT NULL REFERENCES segnalazione(id_segnalazione),
  id_mittente     TEXT NOT NULL REFERENCES utente(id_utente),
  id_destinatario TEXT NOT NULL REFERENCES utente(id_utente),
  testo           TEXT NOT NULL DEFAULT '',
  timestamp       TEXT NOT NULL,
  media_url       TEXT,
  coord_lat       REAL,
  coord_lng       REAL
);

CREATE INDEX IF NOT EXISTS idx_smartid_prop ON smartid(id_proprietario);
CREATE INDEX IF NOT EXISTS idx_seg_bene     ON segnalazione(id_bene);
CREATE INDEX IF NOT EXISTS idx_seg_stato    ON segnalazione(stato);
CREATE INDEX IF NOT EXISTS idx_msg_seg      ON messaggio(id_segnalazione);
CREATE INDEX IF NOT EXISTS idx_zona_utente  ON zona_interesse(id_utente);
`;

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (this.db) return this.db;
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.db.execAsync(SCHEMA);
    return this.db;
  }
}

// Singleton — esportato come istanza condivisa
export const dbService = new DatabaseService();
