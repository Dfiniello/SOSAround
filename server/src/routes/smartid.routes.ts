import { Router } from 'express';
import { db } from '../db';
import { authGuard } from '../auth/jwt';

export const smartIdRouter = Router();

type Row = {
  id_bene: string; id_proprietario: string; tipo: string; nome: string;
  foto_url: string; string_qr_code: string; codice_id: string; data_reg: string;
};

const byId = db.prepare('SELECT * FROM smartid WHERE id_bene = ?');
const byCodice = db.prepare('SELECT * FROM smartid WHERE codice_id = ?');
const byQr = db.prepare('SELECT * FROM smartid WHERE string_qr_code = ?');
const byProp = db.prepare('SELECT * FROM smartid WHERE id_proprietario = ? ORDER BY data_reg DESC');

// GET /smartid?proprietario= | ?codice= | ?qr=
smartIdRouter.get('/', authGuard, (req, res) => {
  const { proprietario, codice, qr } = req.query as Record<string, string>;
  if (proprietario) return res.json(byProp.all(proprietario));
  if (codice) return res.json((byCodice.get(codice) as Row) ?? null);
  if (qr) return res.json((byQr.get(qr) as Row) ?? null);
  res.status(400).json({ error: 'Parametro di ricerca mancante.' });
});

// GET /smartid/:id
smartIdRouter.get('/:id', authGuard, (req, res) => {
  res.json((byId.get(req.params.id) as Row) ?? null);
});

// POST /smartid
smartIdRouter.post('/', authGuard, (req, res) => {
  const s = req.body as Row;
  try {
    db.prepare(
      `INSERT INTO smartid (id_bene, id_proprietario, tipo, nome, foto_url, string_qr_code, codice_id, data_reg)
       VALUES (@id_bene, @id_proprietario, @tipo, @nome, @foto_url, @string_qr_code, @codice_id, @data_reg)`
    ).run(s);
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(409).json({ error: (e as Error).message });
  }
});

// PATCH /smartid/:id  (aggiorna tipo, nome, foto)
smartIdRouter.patch('/:id', authGuard, (req, res) => {
  const { tipo, nome, foto_url } = req.body ?? {};
  db.prepare('UPDATE smartid SET tipo = ?, nome = ?, foto_url = ? WHERE id_bene = ?')
    .run(tipo, nome, foto_url, req.params.id);
  res.json({ ok: true });
});

// DELETE /smartid/:id
smartIdRouter.delete('/:id', authGuard, (req, res) => {
  db.prepare('DELETE FROM smartid WHERE id_bene = ?').run(req.params.id);
  res.json({ ok: true });
});
