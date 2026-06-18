# SOSAround 

## Descrizione
SOSAround è una piattaforma dedicata alla gestione tempestiva degli smarrimenti. 
Connettiamo istantaneamente chi subisce una perdita con una rete di utenti attivi sul territorio, trasformando la ricerca passiva in un'azione collettiva e tempestiva.

##  Macro-funzionalità
 -Notifiche push immediate basate sul raggio d'azione.
 -Monitoraggio avvistamenti e segnalazioni.
 -Coordinamento sicuro tra utenti.

## Architettura (client / server)
Il progetto è un monorepo con due parti:

- **`client/`** — app mobile Expo / React Native (Clean Architecture).
- **`server/`** — backend Node: **Express** (REST) + **Socket.IO** (real-time) + **SQLite** (`node:sqlite`), auth **JWT + bcrypt**.

Il real-time (nuove segnalazioni, chat, notifiche cross-device) passa via WebSocket Socket.IO; in precedenza era gestito da Supabase, ora rimosso.

### Avvio
```bash
# 1. Server (porta 4000, crea sosaround.db al primo avvio)
cd server && npm install && npm run dev

# 2. Client — imposta EXPO_PUBLIC_API_URL in client/.env
#    (su device fisico usa l'IP LAN della macchina, non localhost)
cd client && npm install && npx expo start
```
Dalla root sono disponibili anche: `npm run server`, `npm run client`, `npm run install:all`.

### Variabili d'ambiente
- `server/.env`: `PORT`, `JWT_SECRET`, `DB_FILE`
- `client/.env`: `EXPO_PUBLIC_API_URL`

## Documentazione Completa
https://drive.google.com/drive/folders/1L7mRPpF2TGwIhqthapyT95a94OkzYClW?usp=sharing
