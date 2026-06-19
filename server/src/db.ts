import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

const DB_FILE = process.env.DB_FILE || 'sosaround.db';
const dbPath = path.isAbsolute(DB_FILE) ? DB_FILE : path.join(process.cwd(), DB_FILE);

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Esegue lo schema (idempotente grazie a IF NOT EXISTS)
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// Migrazione: rimuove tabelle legacy non più usate (modello E-R ridotto).
// L'ordine rispetta i vincoli FK: prima la tabella dipendente.
db.exec(`
  DROP TABLE IF EXISTS partecipazione_evento;
  DROP TABLE IF EXISTS evento_ricerca;
  DROP TABLE IF EXISTS zona_interesse;
`);

console.log(`[db] SQLite (node:sqlite) pronto → ${dbPath}`);
