import type { AppDispatch } from '../store';
import {
  aggiungiMessaggio, caricaMessaggiSuccess, setLoading, setError,
} from '../store/slices/messaggioSlice';
import { ComunicazioneRealtimeUseCase, InviaMessaggioInput } from '../../application/useCases/ComunicazioneRealtimeUseCase';
import { SQLiteSegnalazioneRepository } from '../repositories/SQLiteSegnalazioneRepository';
import { SQLiteMessaggioRepository } from '../repositories/SQLiteMessaggioRepository';
import { SQLiteUtenteRepository } from '../repositories/SQLiteUtenteRepository';
import { ExpoGatewayNotifiche } from '../services/ExpoGatewayNotifiche';
import type { Messaggio } from '../../domain/entities';

const segnalazioneRepo = new SQLiteSegnalazioneRepository();
const messaggioRepo = new SQLiteMessaggioRepository();
const utenteRepo = new SQLiteUtenteRepository();
const gateway = new ExpoGatewayNotifiche();

const useCase = new ComunicazioneRealtimeUseCase(
  segnalazioneRepo, messaggioRepo, utenteRepo, gateway
);

export class ChatController {
  constructor(private readonly dispatch: AppDispatch) {}

  async apriChat(idSegnalazione: string): Promise<void> {
    await useCase.apriChat(idSegnalazione);
  }

  async caricaMessaggi(idSegnalazione: string): Promise<void> {
    this.dispatch(setLoading(true));
    try {
      const messaggi = await messaggioRepo.findBySegnalazione(idSegnalazione);
      this.dispatch(caricaMessaggiSuccess({ idSegnalazione, messaggi }));
    } finally {
      this.dispatch(setLoading(false));
    }
  }

  async invia(input: InviaMessaggioInput): Promise<Messaggio> {
    try {
      const messaggio = await useCase.inviaMessaggio(input);
      this.dispatch(aggiungiMessaggio(messaggio));
      return messaggio;
    } catch (err) {
      this.dispatch(setError((err as Error).message));
      throw err;
    }
  }
}
