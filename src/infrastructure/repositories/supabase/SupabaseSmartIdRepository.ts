import { supabase } from '../../supabase/supabaseClient';
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

function smartIdToRow(s: SmartId) {
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

export class SupabaseSmartIdRepository implements ISmartIdRepository {
  async findById(idBene: string): Promise<SmartId | null> {
    const { data, error } = await supabase
      .from('smartid').select('*').eq('id_bene', idBene).maybeSingle<Row>();
    if (error || !data) return null;
    return rowToSmartId(data);
  }

  async findByCodiceIdentificativo(codice: string): Promise<SmartId | null> {
    const { data, error } = await supabase
      .from('smartid').select('*').eq('codice_id', codice).maybeSingle<Row>();
    if (error || !data) return null;
    return rowToSmartId(data);
  }

  async findByProprietario(idProprietario: string): Promise<SmartId[]> {
    const { data, error } = await supabase
      .from('smartid').select('*')
      .eq('id_proprietario', idProprietario)
      .order('data_reg', { ascending: false });
    if (error || !data) return [];
    return (data as Row[]).map(rowToSmartId);
  }

  async findByQrCode(stringQrCode: string): Promise<SmartId | null> {
    const { data, error } = await supabase
      .from('smartid').select('*').eq('string_qr_code', stringQrCode).maybeSingle<Row>();
    if (error || !data) return null;
    return rowToSmartId(data);
  }

  async save(s: SmartId): Promise<void> {
    const { error } = await supabase.from('smartid').insert(smartIdToRow(s));
    if (error) throw new Error(error.message);
  }

  async update(s: SmartId): Promise<void> {
    const { error } = await supabase
      .from('smartid')
      .update({ tipo: s.tipo, nome: s.nome, foto_url: s.fotoUrl })
      .eq('id_bene', s.idBene);
    if (error) throw new Error(error.message);
  }

  async delete(idBene: string): Promise<void> {
    const { error } = await supabase.from('smartid').delete().eq('id_bene', idBene);
    if (error) throw new Error(error.message);
  }
}
