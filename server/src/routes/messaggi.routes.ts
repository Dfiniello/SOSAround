import { Router } from 'express';
import { db } from '../db';
import { authGuard } from '../auth/jwt';
import { emitNuovoMessaggio } from '../realtime/io';

export const messaggiRouter = Router();

type Row = {
  id_messaggio: string; id_segnalazione: string;
  id_mittente: string; id_destinatario: string;
  testo: string; timestamp: string;
  media_url: string | null; coord_lat: number | null; coord_lng: number | null;
};

// Conversazione 1:1: messaggi della segnalazione in cui il ritrovatore è mittente o destinatario.
// (Ogni messaggio dell'app è sempre proprietario↔ritrovatore, quindi filtrare per il
//  ritrovatore isola la singola conversazione.)
const byConversazione = db.prepare(
  `SELECT * FROM messaggio
   WHERE id_segnalazione = ? AND (id_mittente = ? OR id_destinatario = ?)
   ORDER BY timestamp ASC`
);
const byId = db.prepare('SELECT * FROM messaggio WHERE id_messaggio = ?');
const segnalatoreDi = db.prepare('SELECT id_segnalatore FROM segnalazione WHERE id_segnalazione = ?');

// GET /messaggi?segnalazione=ID&ritrovatore=ID  → conversazione 1:1
messaggiRouter.get('/', authGuard, (req, res) => {
  const { segnalazione, ritrovatore } = req.query as Record<string, string>;
  if (!segnalazione || !ritrovatore) {
    return res.status(400).json({ error: 'Parametri segnalazione e ritrovatore obbligatori.' });
  }
  res.json(byConversazione.all(segnalazione, ritrovatore, ritrovatore));
});

// POST /messaggi
messaggiRouter.post('/', authGuard, (req, res) => {
  const m = req.body as Row;
  db.prepare(
    `INSERT INTO messaggio
       (id_messaggio, id_segnalazione, id_mittente, id_destinatario, testo, timestamp, media_url, coord_lat, coord_lng)
     VALUES
       (@id_messaggio, @id_segnalazione, @id_mittente, @id_destinatario, @testo, @timestamp, @media_url, @coord_lat, @coord_lng)`
  ).run({
    ...m,
    media_url: m.media_url ?? null,
    coord_lat: m.coord_lat ?? null,
    coord_lng: m.coord_lng ?? null,
  });

  const row = byId.get(m.id_messaggio) as Row;

  // Ritrovatore = il partecipante che NON è il proprietario (id_segnalatore).
  // La room della conversazione 1:1 è "id_segnalazione:id_ritrovatore".
  const seg = segnalatoreDi.get(row.id_segnalazione) as { id_segnalatore: string } | undefined;
  const proprietario = seg?.id_segnalatore;
  const ritrovatore = row.id_mittente === proprietario ? row.id_destinatario : row.id_mittente;
  emitNuovoMessaggio(`${row.id_segnalazione}:${ritrovatore}`, row);

  res.status(201).json(row);
});
