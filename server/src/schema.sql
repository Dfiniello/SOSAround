-- ============================================================
-- SOSAround — Schema SQLite (E-R → Relazionale)
-- Conforme al diagramma E-R del progetto
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── UTENTE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS utente (
  id_utente       TEXT PRIMARY KEY,
  nome            TEXT NOT NULL UNIQUE,          -- RQ-29: univocità
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,                 -- RQ-25: mai in chiaro
  punteggio       INTEGER NOT NULL DEFAULT 0,
  data_reg        TEXT NOT NULL,
  push_token      TEXT
);

-- ── SMARTID (Bene Registrato) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS smartid (
  id_bene           TEXT PRIMARY KEY,
  id_proprietario   TEXT NOT NULL REFERENCES utente(id_utente) ON DELETE CASCADE,
  tipo              TEXT NOT NULL,
  nome              TEXT NOT NULL,
  foto_url          TEXT NOT NULL DEFAULT '',
  string_qr_code    TEXT NOT NULL UNIQUE,
  codice_id         TEXT NOT NULL UNIQUE,        -- microchip / targa
  data_reg          TEXT NOT NULL
);

-- ── SEGNALAZIONE (Allerta) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS segnalazione (
  id_segnalazione   TEXT PRIMARY KEY,
  id_bene           TEXT NOT NULL REFERENCES smartid(id_bene) ON DELETE CASCADE,
  id_segnalatore    TEXT NOT NULL REFERENCES utente(id_utente),
  data_apertura     TEXT NOT NULL,
  data_chiusura     TEXT,
  stato             TEXT NOT NULL DEFAULT 'ATTIVO',  -- ATTIVO | RITROVATO | SCADUTO
  latitudine        REAL NOT NULL,
  longitudine       REAL NOT NULL,
  descrizione       TEXT NOT NULL DEFAULT '',
  raggio_km         REAL NOT NULL DEFAULT 10,
  nome_bene         TEXT  -- denormalizzato: nome del bene visibile a tutti gli utenti
);

-- ── MESSAGGIO (Chat real-time) ────────────────────────────────
CREATE TABLE IF NOT EXISTS messaggio (
  id_messaggio      TEXT PRIMARY KEY,
  id_segnalazione   TEXT NOT NULL REFERENCES segnalazione(id_segnalazione),
  id_mittente       TEXT NOT NULL REFERENCES utente(id_utente),
  id_destinatario   TEXT NOT NULL REFERENCES utente(id_utente),
  testo             TEXT NOT NULL DEFAULT '',
  timestamp         TEXT NOT NULL,
  media_url         TEXT,
  coord_lat         REAL,
  coord_lng         REAL
);

-- ── Indici per query frequenti ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_smartid_prop ON smartid(id_proprietario);
CREATE INDEX IF NOT EXISTS idx_seg_bene     ON segnalazione(id_bene);
CREATE INDEX IF NOT EXISTS idx_seg_stato    ON segnalazione(stato);
CREATE INDEX IF NOT EXISTS idx_msg_seg      ON messaggio(id_segnalazione);
