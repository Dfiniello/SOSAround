import { api } from '../../api/apiClient';
import type { ISmartIdRepository } from '../../../domain/repositories/ISmartIdRepository';
import { SmartId, TipoBene } from '../../../domain/entities';

type Row = {
  id_bene: string; id_proprietario: string; tipo: string;
  nome: string; foto_url: string; string_qr_code: string;
  codice_id: string; data_reg: string;
};

function rowToSmartId(r: Row): SmartId {
  return {
    idBene: r.id_bene,
    idProprietario: r.id_proprietario,
    tipo: r.tipo as TipoBene,
    nome: r.nome,
    fotoUrl: r.foto_url,
    stringQrCode: r.string_qr_code,
    codiceIdentificativo: r.codice_id,
    dataRegistrazione: new Date(r.data_reg),
  };
}

function smartIdToRow(s: SmartId): Row {
  return {
    id_bene: s.idBene,
    id_proprietario: s.idProprietario,
    tipo: s.tipo,
    nome: s.nome,
    foto_url: s.fotoUrl,
    string_qr_code: s.stringQrCode,
    codice_id: s.codiceIdentificativo,
    data_reg: s.dataRegistrazione.toISOString(),
  };
}

export class ApiSmartIdRepository implements ISmartIdRepository {
  async findById(idBene: string): Promise<SmartId | null> {
    const r = await api.get<Row | null>(`/smartid/${idBene}`);
    return r ? rowToSmartId(r) : null;
  }

  async findByCodiceIdentificativo(codice: string): Promise<SmartId | null> {
    const r = await api.get<Row | null>(`/smartid?codice=${encodeURIComponent(codice)}`);
    return r ? rowToSmartId(r) : null;
  }

  async findByProprietario(idProprietario: string): Promise<SmartId[]> {
    const rows = await api.get<Row[]>(`/smartid?proprietario=${encodeURIComponent(idProprietario)}`);
    return rows.map(rowToSmartId);
  }

  async findByQrCode(stringQrCode: string): Promise<SmartId | null> {
    const r = await api.get<Row | null>(`/smartid?qr=${encodeURIComponent(stringQrCode)}`);
    return r ? rowToSmartId(r) : null;
  }

  async save(s: SmartId): Promise<void> {
    await api.post('/smartid', smartIdToRow(s));
  }

  async update(s: SmartId): Promise<void> {
    await api.patch(`/smartid/${s.idBene}`, {
      tipo: s.tipo,
      nome: s.nome,
      foto_url: s.fotoUrl,
    });
  }

  async delete(idBene: string): Promise<void> {
    await api.del(`/smartid/${idBene}`);
  }
}
