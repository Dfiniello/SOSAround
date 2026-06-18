import { api } from '../../api/apiClient';
import type { IUtenteRepository } from '../../../domain/repositories/IUtenteRepository';
import type { Utente } from '../../../domain/entities';

type Row = {
  id_utente: string; nome: string; email: string;
  punteggio: number; data_reg: string; push_token: string | null;
};

export function rowToUtente(r: Row): Utente {
  return {
    idUtente: r.id_utente,
    nome: r.nome,
    email: r.email,
    passwordHash: '',
    punteggioReputazione: r.punteggio,
    dataRegistrazione: new Date(r.data_reg),
    pushToken: r.push_token ?? undefined,
  };
}

export class ApiUtenteRepository implements IUtenteRepository {
  async findById(idUtente: string): Promise<Utente | null> {
    try {
      const r = await api.get<Row>(`/users/${idUtente}`);
      return rowToUtente(r);
    } catch {
      return null;
    }
  }

  async savePushToken(idUtente: string, token: string): Promise<void> {
    await api.patch(`/users/${idUtente}/push-token`, { pushToken: token });
  }
}
