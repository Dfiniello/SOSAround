import { api } from '../../api/apiClient';
import type { ISegnalazioneRepository } from '../../../domain/repositories/ISegnalazioneRepository';
import { Segnalazione, StatoSegnalazione } from '../../../domain/entities';

type Row = {
  id_segnalazione: string; id_bene: string; id_segnalatore: string;
  data_apertura: string; data_chiusura: string | null; stato: string;
  latitudine: number; longitudine: number; descrizione: string; raggio_km: number;
  nome_bene: string | null;
};

function rowToSegnalazione(r: Row): Segnalazione {
  return {
    idSegnalazione: r.id_segnalazione,
    idBene: r.id_bene,
    idSegnalatore: r.id_segnalatore,
    dataApertura: new Date(r.data_apertura),
    dataChiusura: r.data_chiusura ? new Date(r.data_chiusura) : undefined,
    stato: r.stato as StatoSegnalazione,
    latitudine: r.latitudine,
    longitudine: r.longitudine,
    descrizioneEmergenza: r.descrizione,
    raggioProssimita: r.raggio_km,
    nomeBene: r.nome_bene ?? undefined,
  };
}

function segnalazioneToRow(s: Segnalazione): Row {
  return {
    id_segnalazione: s.idSegnalazione,
    id_bene: s.idBene,
    id_segnalatore: s.idSegnalatore,
    data_apertura: s.dataApertura.toISOString(),
    data_chiusura: s.dataChiusura?.toISOString() ?? null,
    stato: s.stato,
    latitudine: s.latitudine,
    longitudine: s.longitudine,
    descrizione: s.descrizioneEmergenza,
    raggio_km: s.raggioProssimita,
    nome_bene: s.nomeBene ?? null,
  };
}

export class ApiSegnalazioneRepository implements ISegnalazioneRepository {
  async findById(id: string): Promise<Segnalazione | null> {
    const r = await api.get<Row | null>(`/segnalazioni/${id}`);
    return r ? rowToSegnalazione(r) : null;
  }

  async findByBene(idBene: string): Promise<Segnalazione[]> {
    const rows = await api.get<Row[]>(`/segnalazioni?bene=${encodeURIComponent(idBene)}`);
    return rows.map(rowToSegnalazione);
  }

  async findAttive(): Promise<Segnalazione[]> {
    const rows = await api.get<Row[]>('/segnalazioni');
    return rows.map(rowToSegnalazione);
  }

  async findInRaggio(lat: number, lng: number, raggioKm: number): Promise<Segnalazione[]> {
    const rows = await api.get<Row[]>(`/segnalazioni?lat=${lat}&lng=${lng}&raggio=${raggioKm}`);
    return rows.map(rowToSegnalazione);
  }

  async save(s: Segnalazione): Promise<void> {
    await api.post('/segnalazioni', segnalazioneToRow(s));
  }

  async updateStato(id: string, stato: StatoSegnalazione): Promise<void> {
    await api.patch(`/segnalazioni/${id}/stato`, { stato });
  }

  async chiudi(id: string): Promise<void> {
    await api.post(`/segnalazioni/${id}/chiudi`);
  }
}
