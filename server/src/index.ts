import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import './db'; // inizializza SQLite + schema
import { initIo } from './realtime/io';
import { authRouter } from './routes/auth.routes';
import { usersRouter } from './routes/users.routes';
import { smartIdRouter } from './routes/smartid.routes';
import { segnalazioniRouter } from './routes/segnalazioni.routes';
import { messaggiRouter } from './routes/messaggi.routes';
import { conversazioniRouter } from './routes/conversazioni.routes';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/smartid', smartIdRouter);
app.use('/segnalazioni', segnalazioniRouter);
app.use('/messaggi', messaggiRouter);
app.use('/conversazioni', conversazioniRouter);

// Error handler centralizzato → risposta JSON (l'apiClient lato client fa JSON.parse)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] errore:', err.message);
  res.status(500).json({ error: err.message || 'Errore interno del server.' });
});

const server = http.createServer(app);
initIo(server);

const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, () => {
  console.log(`[server] SOSAround API + Socket.IO in ascolto su :${PORT}`);
});
