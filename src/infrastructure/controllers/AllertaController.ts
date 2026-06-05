import type { AppDispatch } from '../store';
import {
  aggiungi, caricaStart, caricaFailure, setAvviso, caricaSuccess, aggiornaStato,
} from '../store/slices/segnalazioneSlice';
import { AttivaAllertaUseCase, AttivaAllertaInput } from '../../application/useCases/AttivaAllertaUseCase';
import { SQLiteSmartIdRepository } from '../repositories/SQLiteSmartIdRepository';
import { SQLiteSegnalazioneRepository } from '../repositories/SQLiteSegnalazioneRepository';
import { SQLiteUtenteRepository } from '../repositories/SQLiteUtenteRepository';
import { ExpoGatewayNotifiche } from '../services/ExpoGatewayNotifiche';
import { StatoSegnalazione } from '../../domain/entities';

const smartIdRepo = new SQLiteSmartIdRepository();
const segnalazioneRepo = new SQLiteSegnalazioneRepository();
const utenteRepo = new SQLiteUtenteRepository();
const gateway = new ExpoGatewayNotifiche();

const useCase = new AttivaAllertaUseCase(smartIdRepo, segnalazioneRepo, utenteRepo, gateway);

export class AllertaController {
  constructor(private readonly dispatch: AppDispatch) {}

  async attivaAllerta(input: AttivaAllertaInput): Promise<string> {
    this.dispatch(caricaStart());
    try {
      const output = await useCase.esegui(input);
      this.dispatch(aggiungi(output.segnalazione));
      if (output.avviso) this.dispatch(setAvviso(output.avviso));
      return output.kitUrl;
    } catch (err) {
      this.dispatch(caricaFailure((err as Error).message));
      throw err;
    }
  }

  async caricaSegnalazioniAttive(): Promise<void> {
    this.dispatch(caricaStart());
    try {
      const attive = await segnalazioneRepo.findAttive();
      this.dispatch(caricaSuccess(attive));
    } catch (err) {
      this.dispatch(caricaFailure((err as Error).message));
    }
  }

  async chiudiSegnalazione(idSegnalazione: string): Promise<void> {
    try {
      await segnalazioneRepo.chiudi(idSegnalazione);
      this.dispatch(aggiornaStato({ id: idSegnalazione, stato: StatoSegnalazione.RITROVATO }));
    } catch (err) {
      this.dispatch(caricaFailure((err as Error).message));
    }
  }
}
