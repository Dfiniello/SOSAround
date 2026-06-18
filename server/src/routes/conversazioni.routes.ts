import { Router } from 'express';
import { db } from '../db';
import { authGuard, AuthRequest } from '../auth/jwt';

export const conversazioniRouter = Router();

type MsgJoin = {
  id_messaggio: string; id_segnalazione: string;
  id_mittente: string; id_destinatario: string;
  testo: string; timestamp: string;
  id_segnalatore: string; nome_bene: string | null;
};

// Tutti i messaggi che coinvolgono l'utente (mittente o destinatario), con info segnalazione.
const messaggiUtente = db.prepare(
  `SELECT m.*, s.id_segnalatore, s.nome_bene
   FROM messaggio m
   JOIN segnalazione s ON s.id_segnalazione = m.id_segnalazione
   WHERE m.id_mittente = ? OR m.id_destinatario = ?
   ORDER BY m.timestamp ASC`
);
const nomeUtente = db.prepare('SELECT nome FROM utente WHERE id_utente = ?');

// GET /conversazioni  → conversazioni 1:1 dell'utente autenticato
conversazioniRouter.get('/', authGuard, (req: AuthRequest, res) => {
  const me = req.idUtente!;
  const righe = messaggiUtente.all(me, me) as MsgJoin[];

  // Raggruppa per (segnalazione, ritrovatore). Il ritrovatore è il partecipante
  // diverso dal proprietario (id_segnalatore).
  const mappa = new Map<string, {
    id_segnalazione: string; id_proprietario: string; id_ritrovatore: string;
    altro_id: string; nome_bene: string | null;
    ultimo_testo: string; ultimo_ts: string;
  }>();

  for (const r of righe) {
    const proprietario = r.id_segnalatore;
    const ritrovatore = r.id_mittente === proprietario ? r.id_destinatario : r.id_mittente;
    const chiave = `${r.id_segnalazione}:${ritrovatore}`;
    // L'altro interlocutore rispetto a me
    const altro = me === proprietario ? ritrovatore : proprietario;
    // Sovrascrivendo in ordine cronologico, l'ultimo resta l'ultimo messaggio
    mappa.set(chiave, {
      id_segnalazione: r.id_segnalazione,
      id_proprietario: proprietario,
      id_ritrovatore: ritrovatore,
      altro_id: altro,
      nome_bene: r.nome_bene,
      ultimo_testo: r.testo,
      ultimo_ts: r.timestamp,
    });
  }

  const lista = Array.from(mappa.values()).map((c) => {
    const u = nomeUtente.get(c.altro_id) as { nome: string } | undefined;
    return { ...c, altro_nome: u?.nome ?? 'Utente' };
  });
  // Più recenti in cima
  lista.sort((a, b) => (a.ultimo_ts < b.ultimo_ts ? 1 : -1));

  res.json(lista);
});
