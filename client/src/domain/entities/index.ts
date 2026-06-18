// ============================================================
// DOMAIN ENTITIES — Clean Architecture (Bob Martin)
// Regole di business pure. Zero import React/Expo.
// ============================================================

// ── Enums ──────────────────────────────────────────────────

export enum TipoBene {
  ANIMALE = 'ANIMALE',
  OGGETTO = 'OGGETTO',
  ALTRO = 'ALTRO',
}

export enum StatoSegnalazione {
  ATTIVO = 'ATTIVO',
  RITROVATO = 'RITROVATO',
  SCADUTO = 'SCADUTO',
}

export enum StatoEvento {
  PROGRAMMATO = 'PROGRAMMATO',
  IN_CORSO = 'IN_CORSO',
  CONCLUSO = 'CONCLUSO',
}

export enum EsitoEvento {
  RITROVATO = 'RITROVATO',
  NON_RITROVATO = 'NON_RITROVATO',
  PENDING = 'PENDING',
}

// ── Entity: Utente ─────────────────────────────────────────

export interface Utente {
  idUtente: string;
  nome: string;
  email: string;
  passwordHash: string;       // RQ-25: cifrata — mai in chiaro
  punteggioReputazione: number;
  dataRegistrazione: Date;
  pushToken?: string;          // token Expo per notifiche push
}

// ── Entity: SmartID ────────────────────────────────────────

export interface SmartId {
  idBene: string;
  idProprietario: string;      // FK → Utente.idUtente
  tipo: TipoBene;
  nome: string;
  fotoUrl: string;
  stringQrCode: string;        // URL/payload del QR code
  codiceIdentificativo: string; // microchip o targa
  dataRegistrazione: Date;
}

// ── Entity: Segnalazione (Allerta) ─────────────────────────

export interface Segnalazione {
  idSegnalazione: string;
  idBene: string;              // FK → SmartId.idBene
  idSegnalatore: string;       // FK → Utente.idUtente
  dataApertura: Date;
  dataChiusura?: Date;
  stato: StatoSegnalazione;
  latitudine: number;
  longitudine: number;
  descrizioneEmergenza: string;
  raggioProssimita: number;    // km — configurato da chi perde
  nomeBene?: string;           // denormalizzato via join smartid — visibile a tutti gli utenti
}

// ── Entity: EventoRicerca (Mobilitazione) ──────────────────

export interface EventoRicerca {
  idEvento: string;
  idOrganizzatore: string;     // FK → Utente.idUtente
  idSegnalazione: string;      // evento legato a una segnalazione
  latitudine: number;
  longitudine: number;
  orario: Date;
  durata: number;              // minuti
  raggioCopertura: number;     // km
  stato: StatoEvento;
  esito: EsitoEvento;
}

// ── Entity: PartecipazioneEvento (chiave composta) ─────────

export interface PartecipazioneEvento {
  idUtente: string;            // FK
  idEvento: string;            // FK
  checkIn?: Date;
}

// ── Entity: ZonaInteresse (Geofencing) ─────────────────────

export interface ZonaInteresse {
  idZona: string;
  idUtente: string;            // FK → Utente.idUtente
  latitudine: number;
  longitudine: number;
  raggio: number;              // km
  etichetta: string;           // es. "Casa", "Ufficio"
}

// ── Entity: Messaggio (Chat real-time) ─────────────────────

export interface Messaggio {
  idMessaggio: string;
  idSegnalazione: string;      // FK → Segnalazione.idSegnalazione
  idMittente: string;          // FK → Utente.idUtente
  idDestinatario: string;      // FK → Utente.idUtente
  testo: string;
  timestamp: Date;
  mediaUrl?: string;           // foto/video allegato
  coordinateGps?: { lat: number; lng: number };
}

// ── Domain Exceptions ──────────────────────────────────────

export class DuplicatoException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicatoException';
  }
}

export class PosizioneMancante extends Error {
  constructor() {
    super('Posizione GPS non disponibile. Inserirla manualmente.');
    this.name = 'PosizioneMancante';
  }
}

export class SegnalazioneChiusaException extends Error {
  constructor() {
    super("Questa emergenza è già stata risolta. Grazie comunque per il supporto!");
    this.name = 'SegnalazioneChiusaException';
  }
}

export class UploadFallitoException extends Error {
  constructor() {
    super('Testo inviato. Riprova l\'invio dell\'immagine quando la connessione migliora.');
    this.name = 'UploadFallitoException';
  }
}

export class GatewayTimeoutException extends Error {
  constructor() {
    super('Allerta registrata, ma ritardo nell\'invio delle notifiche push.');
    this.name = 'GatewayTimeoutException';
  }
}

export class PasswordDeboleException extends Error {
  constructor() {
    super('La password deve avere min. 8 caratteri, una maiuscola, un numero e un carattere speciale.');
    this.name = 'PasswordDeboleException';
  }
}
