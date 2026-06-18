import type { AppDispatch } from '../store';
import {
  aggiungiMessaggio, caricaMessaggiSuccess, setLoading, setError, chiaveConversazione,
} from '../store/slices/messaggioSlice';
import { ComunicazioneRealtimeUseCase, InviaMessaggioInput } from '../../application/useCases/ComunicazioneRealtimeUseCase';
import { ApiSegnalazioneRepository } from '../repositories/api/ApiSegnalazioneRepository';
import { ApiMessaggioRepository } from '../repositories/api/ApiMessaggioRepository';
import { ApiUtenteRepository } from '../repositories/api/ApiUtenteRepository';
import { ExpoGatewayNotifiche } from '../services/ExpoGatewayNotifiche';
import type { Messaggio } from '../../domain/entities';

const segnalazioneRepo = new ApiSegnalazioneRepository();
const messaggioRepo    = new ApiMessaggioRepository();
const utenteRepo       = new ApiUtenteRepository();
const gateway          = new ExpoGatewayNotifiche();

const useCase = new ComunicazioneRealtimeUseCase(
  segnalazioneRepo, messaggioRepo, utenteRepo, gateway
);

export class ChatController {
  constructor(private readonly dispatch: AppDispatch) {}

  async apriChat(idSegnalazione: string): Promise<void> {
    await useCase.apriChat(idSegnalazione);
  }

  async caricaMessaggi(idSegnalazione: string, idRitrovatore: string): Promise<void> {
    this.dispatch(setLoading(true));
    try {
      const messaggi = await messaggioRepo.findByConversazione(idSegnalazione, idRitrovatore);
      const chiave = chiaveConversazione(idSegnalazione, idRitrovatore);
      this.dispatch(caricaMessaggiSuccess({ chiave, messaggi }));
    } finally {
      this.dispatch(setLoading(false));
    }
  }

  async invia(input: InviaMessaggioInput): Promise<Messaggio> {
    try {
      const messaggio = await useCase.inviaMessaggio(input);
      const chiave = chiaveConversazione(input.idSegnalazione, input.idRitrovatore);
      this.dispatch(aggiungiMessaggio({ chiave, messaggio }));
      return messaggio;
    } catch (err) {
      this.dispatch(setError((err as Error).message));
      throw err;
    }
  }
}
