import { Router } from 'express';
import { db } from '../db';
import { authGuard } from '../auth/jwt';
import { haversineKm } from '../geo';
import { emitNuovaSegnalazione, emitSegnalazioneAggiornata } from '../realtime/io';

export const segnalazioniRouter = Router();

type Row = {
  id_segnalazione: string; id_bene: string; id_segnalatore: string;
  data_apertura: string; data_chiusura: string | null; stato: string;
  latitudine: number; longitudine: number; descrizione: string;
  raggio_km: number; nome_bene: string | null;
};

const byId = db.prepare('SELECT * FROM segnalazione WHERE id_segnalazione = ?');
const byBene = db.prepare('SELECT * FROM segnalazione WHERE id_bene = ? ORDER BY data_apertura DESC');
const attive = db.prepare("SELECT * FROM segnalazione WHERE stato = 'ATTIVO' ORDER BY data_apertura DESC");

// GET /segnalazioni                → attive
// GET /segnalazioni?bene=ID        → per bene
// GET /segnalazioni?lat=&lng=&raggio=  → attive entro il raggio (km)
segnalazioniRouter.get('/', authGuard, (req, res) => {
  const { bene, lat, lng, raggio } = req.query as Record<string, string>;

  if (bene) return res.json(byBene.all(bene));

  if (lat && lng && raggio) {
    const pLat = parseFloat(lat);
    const pLng = parseFloat(lng);
    const pRaggio = parseFloat(raggio);
    const tutte = attive.all() as Row[];
    return res.json(
      tutte.filter((s) => haversineKm(pLat, pLng, s.latitudine, s.longitudine) <= pRaggio)
    );
  }

  res.json(attive.all());
});

// GET /segnalazioni/:id
segnalazioniRouter.get('/:id', authGuard, (req, res) => {
  res.json((byId.get(req.params.id) as Row) ?? null);
});

// POST /segnalazioni
segnalazioniRouter.post('/', authGuard, (req, res) => {
  const s = req.body as Row;
  db.prepare(
    `INSERT INTO segnalazione
       (id_segnalazione, id_bene, id_segnalatore, data_apertura, data_chiusura,
        stato, latitudine, longitudine, descrizione, raggio_km, nome_bene)
     VALUES
       (@id_segnalazione, @id_bene, @id_segnalatore, @data_apertura, @data_chiusura,
        @stato, @latitudine, @longitudine, @descrizione, @raggio_km, @nome_bene)`
  ).run({
    ...s,
    data_chiusura: s.data_chiusura ?? null,
    nome_bene: s.nome_bene ?? null,
  });

  const row = byId.get(s.id_segnalazione) as Row;
  emitNuovaSegnalazione(row); // realtime: avvisa tutti i client
  res.status(201).json(row);
});

// PATCH /segnalazioni/:id/stato
segnalazioniRouter.patch('/:id/stato', authGuard, (req, res) => {
  const { stato } = req.body ?? {};
  db.prepare('UPDATE segnalazione SET stato = ? WHERE id_segnalazione = ?').run(stato, req.params.id);
  emitSegnalazioneAggiornata(req.params.id);
  res.json({ ok: true });
});

// POST /segnalazioni/:id/chiudi
segnalazioniRouter.post('/:id/chiudi', authGuard, (req, res) => {
  db.prepare(
    "UPDATE segnalazione SET stato = 'RITROVATO', data_chiusura = ? WHERE id_segnalazione = ?"
  ).run(new Date().toISOString(), req.params.id);
  emitSegnalazioneAggiornata(req.params.id);
  res.json({ ok: true });
});
