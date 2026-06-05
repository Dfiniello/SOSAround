import type { AppDispatch } from '../store';
import { aggiungi, caricaStart, caricaSuccess, caricaFailure } from '../store/slices/smartIdSlice';
import { RegistraSmartIdUseCase, RegistraSmartIdInput } from '../../application/useCases/RegistraSmartIdUseCase';
import { SQLiteSmartIdRepository } from '../repositories/SQLiteSmartIdRepository';
import type { SmartId } from '../../domain/entities';

const repo = new SQLiteSmartIdRepository();
const useCase = new RegistraSmartIdUseCase(repo);

export class SmartIdController {
  constructor(private readonly dispatch: AppDispatch) {}

  async registra(input: RegistraSmartIdInput): Promise<SmartId> {
    this.dispatch(caricaStart());
    try {
      const smartId = await useCase.esegui(input);
      this.dispatch(aggiungi(smartId));
      return smartId;
    } catch (err) {
      this.dispatch(caricaFailure((err as Error).message));
      throw err;
    }
  }

  async caricaPerProprietario(idProprietario: string): Promise<void> {
    this.dispatch(caricaStart());
    try {
      const items = await repo.findByProprietario(idProprietario);
      this.dispatch(caricaSuccess(items));
    } catch (err) {
      this.dispatch(caricaFailure((err as Error).message));
    }
  }
}
