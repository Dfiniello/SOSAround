// Singleton Socket.IO — canale WebSocket real-time verso il server SOSAround.
// Sostituisce Supabase Realtime (postgres_changes).
import { io, Socket } from 'socket.io-client';
import { API_URL, getToken } from '../api/apiClient';

let socket: Socket | null = null;

// Restituisce il socket connesso (lo crea/riconnette con il JWT corrente).
export function getSocket(): Socket {
  if (socket && socket.connected) return socket;

  if (!socket) {
    socket = io(API_URL, {
      autoConnect: false,
      transports: ['websocket'],
      auth: { token: getToken() },
    });
  }
  // Aggiorna il token (può essere cambiato dopo il login) e connette
  socket.auth = { token: getToken() };
  if (!socket.connected) socket.connect();
  return socket;
}

// Chiamare al login (dopo aver impostato il token) per (ri)stabilire la connessione.
export function connettiSocket(): void {
  getSocket();
}

// Chiamare al logout.
export function disconnettiSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
