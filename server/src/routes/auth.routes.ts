import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db';
import { firmaToken, authGuard, AuthRequest } from '../auth/jwt';

export const authRouter = Router();

type UtenteRow = {
  id_utente: string; nome: string; email: string; password_hash: string;
  punteggio: number; data_reg: string; push_token: string | null;
};

// Rimuove l'hash prima di inviare al client
function toPublic(r: UtenteRow) {
  const { password_hash, ...pub } = r;
  return pub;
}

function getById(id: string): UtenteRow | undefined {
  return db.prepare('SELECT * FROM utente WHERE id_utente = ?').get(id) as UtenteRow | undefined;
}

// POST /auth/register
authRouter.post('/register', async (req, res) => {
  const { nome, email, password } = req.body ?? {};
  if (!nome || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e password sono obbligatori.' });
  }

  // Univocità nome (RQ-29) ed email
  const nomeEsiste = db.prepare('SELECT 1 FROM utente WHERE lower(nome) = lower(?)').get(nome);
  if (nomeEsiste) return res.status(409).json({ error: `Il nome utente "${nome}" è già in uso.` });
  const emailEsiste = db.prepare('SELECT 1 FROM utente WHERE lower(email) = lower(?)').get(email);
  if (emailEsiste) return res.status(409).json({ error: "L'email è già registrata." });

  const id = crypto.randomUUID();
  const hash = await bcrypt.hash(password, 10);
  db.prepare(
    `INSERT INTO utente (id_utente, nome, email, password_hash, punteggio, data_reg)
     VALUES (?, ?, ?, ?, 0, ?)`
  ).run(id, nome, email, hash, new Date().toISOString());

  const utente = getById(id)!;
  res.status(201).json({ token: firmaToken({ idUtente: id }), utente: toPublic(utente) });
});

// POST /auth/login
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'Email e password obbligatorie.' });

  const utente = db
    .prepare('SELECT * FROM utente WHERE lower(email) = lower(?)')
    .get(email) as UtenteRow | undefined;
  if (!utente) return res.status(401).json({ error: 'Email o password errata.' });

  const ok = await bcrypt.compare(password, utente.password_hash);
  if (!ok) return res.status(401).json({ error: 'Email o password errata.' });

  res.json({ token: firmaToken({ idUtente: utente.id_utente }), utente: toPublic(utente) });
});

// GET /auth/me
authRouter.get('/me', authGuard, (req: AuthRequest, res) => {
  const utente = getById(req.idUtente!);
  if (!utente) return res.status(404).json({ error: 'Utente non trovato.' });
  res.json({ utente: toPublic(utente) });
});
