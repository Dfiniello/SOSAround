import type { AppDispatch } from '../store';
import {
  aggiungi, caricaStart, caricaFailure, setAvviso, caricaSuccess, rimuovi, resetLoading,
} from '../store/slices/segnalazioneSlice';
import { AttivaAllertaUseCase, AttivaAllertaInput } from '../../application/useCases/AttivaAllertaUseCase';
import { SupabaseSmartIdRepository } from '../repositories/supabase/SupabaseSmartIdRepository';
import { SupabaseSegnalazioneRepository } from '../repositories/supabase/SupabaseSegnalazioneRepository';
import { SupabaseUtenteRepository } from '../repositories/supabase/SupabaseUtenteRepository';
import { ExpoGatewayNotifiche } from '../services/ExpoGatewayNotifiche';

const smartIdRepo      = new SupabaseSmartIdRepository();
const segnalazioneRepo = new SupabaseSegnalazioneRepository();
const utenteRepo       = new SupabaseUtenteRepository();
const gateway          = new ExpoGatewayNotifiche();

const useCase = new AttivaAllertaUseCase(smartIdRepo, segnalazioneRepo, utenteRepo, gateway);

export class AllertaController {
  constructor(private readonly dispatch: AppDispatch) {}

  async attivaAllerta(input: AttivaAllertaInput): Promise<string> {
    this.dispatch(caricaStart());
    try {
      const output = await useCase.esegui(input);
      this.dispatch(aggiungi(output.segnalazione));
      if (output.avviso) this.dispatch(setAvviso(output.avviso));
      this.dispatch(resetLoading());
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
      // L'oggetto ritrovato esce dalla bacheca delle segnalazioni attive
      this.dispatch(rimuovi(idSegnalazione));
    } catch (err) {
      this.dispatch(caricaFailure((err as Error).message));
    }
  }
}
