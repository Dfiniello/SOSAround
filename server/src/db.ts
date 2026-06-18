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

console.log(`[db] SQLite (node:sqlite) pronto → ${dbPath}`);
