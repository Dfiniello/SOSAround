import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { verificaToken } from '../auth/jwt';

let io: Server | null = null;

export function initIo(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  // Autenticazione handshake via JWT (token passato in socket.handshake.auth.token)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    const payload = token ? verificaToken(token) : null;
    if (!payload) return next(new Error('Non autorizzato'));
    socket.data.idUtente = payload.idUtente;
    next();
  });

  io.on('connection', (socket) => {
    // Il client entra nella room di una chat specifica per ricevere i messaggi live
    socket.on('join', (idSegnalazione: string) => {
      socket.join(`chat:${idSegnalazione}`);
    });
    socket.on('leave', (idSegnalazione: string) => {
      socket.leave(`chat:${idSegnalazione}`);
    });
  });

  return io;
}

function get(): Server {
  if (!io) throw new Error('Socket.IO non inizializzato');
  return io;
}

// ── Emit espliciti (sostituiscono i postgres_changes di Supabase) ──

export function emitNuovaSegnalazione(row: unknown): void {
  get().emit('segnalazione:nuova', row);
}

export function emitSegnalazioneAggiornata(idSegnalazione: string): void {
  get().emit('segnalazione:aggiornata', { id_segnalazione: idSegnalazione });
}

// chiaveConversazione = "idSegnalazione:idRitrovatore" → identifica la chat 1:1
export function emitNuovoMessaggio(chiaveConversazione: string, row: unknown): void {
  // Solo ai due partecipanti della conversazione 1:1 (room mirata)…
  get().to(`chat:${chiaveConversazione}`).emit('messaggio:nuovo', row);
  // …e a tutti (per le notifiche globali, filtrate lato client per destinatario)
  get().emit('messaggio:nuovo:global', row);
}
