// Client HTTP verso il server SOSAround (Express).
// Sostituisce il client Supabase: gestisce base URL, JWT e (de)serializzazione JSON.
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Porta del server backend
const SERVER_PORT = 4000;

// Determina la base URL del server.
// 1) Se EXPO_PUBLIC_API_URL è impostata nel .env, usa quella (override manuale).
// 2) Altrimenti ricava l'IP della macchina di sviluppo dallo stesso host che Expo
//    usa per servire il bundle (hostUri = "192.168.x.x:8081"): così l'indirizzo
//    coincide SEMPRE con quello con cui il telefono ha caricato l'app → raggiungibile.
function risolviApiUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (override) return override.replace(/\/$/, '');

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.hostUri ??
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoGo?.developer?.host;

  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : null;
  if (host) return `http://${host}:${SERVER_PORT}`;

  return `http://localhost:${SERVER_PORT}`;
}

export const API_URL = risolviApiUrl();
console.log('[apiClient] server →', API_URL);

const TOKEN_KEY = 'sosaround_jwt';

// Token tenuto in memoria per accesso sincrono (handshake socket, header)
let tokenInMemoria: string | null = null;

export async function setToken(token: string | null): Promise<void> {
  tokenInMemoria = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function caricaTokenDaDisco(): Promise<string | null> {
  tokenInMemoria = await SecureStore.getItemAsync(TOKEN_KEY);
  return tokenInMemoria;
}

export function getToken(): string | null {
  return tokenInMemoria;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(tokenInMemoria ? { Authorization: `Bearer ${tokenInMemoria}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const testo = await res.text();
  const dati = testo ? JSON.parse(testo) : null;

  if (!res.ok) {
    throw new Error(dati?.error || `Errore server (${res.status})`);
  }
  return dati as T;
}

export const api = {
  get:   <T>(path: string) => request<T>('GET', path),
  post:  <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del:   <T>(path: string) => request<T>('DELETE', path),
};
