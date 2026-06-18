import { Router } from 'express';
import { db } from '../db';
import { authGuard } from '../auth/jwt';

export const usersRouter = Router();

type UtenteRow = {
  id_utente: string; nome: string; email: string; password_hash: string;
  punteggio: number; data_reg: string; push_token: string | null;
};

function toPublic(r: UtenteRow | undefined) {
  if (!r) return null;
  const { password_hash, ...pub } = r;
  return pub;
}

// GET /users/by-nome/:nome
usersRouter.get('/by-nome/:nome', authGuard, (req, res) => {
  const r = db
    .prepare('SELECT * FROM utente WHERE lower(nome) = lower(?)')
    .get(req.params.nome) as UtenteRow | undefined;
  const pub = toPublic(r);
  if (!pub) return res.status(404).json({ error: 'Utente non trovato.' });
  res.json(pub);
});

// GET /users/:id
usersRouter.get('/:id', authGuard, (req, res) => {
  const r = db.prepare('SELECT * FROM utente WHERE id_utente = ?').get(req.params.id) as UtenteRow | undefined;
  const pub = toPublic(r);
  if (!pub) return res.status(404).json({ error: 'Utente non trovato.' });
  res.json(pub);
});

// PATCH /users/:id/push-token
usersRouter.patch('/:id/push-token', authGuard, (req, res) => {
  const { pushToken } = req.body ?? {};
  db.prepare('UPDATE utente SET push_token = ? WHERE id_utente = ?').run(pushToken ?? null, req.params.id);
  res.json({ ok: true });
});
