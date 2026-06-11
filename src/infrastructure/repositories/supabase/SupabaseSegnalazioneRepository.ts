import { supabase } from '../../supabase/supabaseClient';
import type { ISegnalazioneRepository } from '../../../domain/repositories/ISegnalazioneRepository';
import { Segnalazione, StatoSegnalazione } from '../../../domain/entities';

type Row = {
  id_segnalazione: string; id_bene: string; id_segnalatore: string;
  data_apertura: string; data_chiusura: string | null; stato: string;
  latitudine: number; longitudine: number; descrizione: string; raggio_km: number;
  // Nome del bene salvato direttamente sulla riga (denormalizzato): così è
  // leggibile da TUTTI gli utenti senza dipendere dai permessi sulla tabella smartid.
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

export class SupabaseSegnalazioneRepository implements ISegnalazioneRepository {
  async findById(id: string): Promise<Segnalazione | null> {
    const { data, error } = await supabase
      .from('segnalazione').select('*').eq('id_segnalazione', id).maybeSingle<Row>();
    if (error || !data) return null;
    return rowToSegnalazione(data);
  }

  async findByBene(idBene: string): Promise<Segnalazione[]> {
    const { data, error } = await supabase
      .from('segnalazione').select('*')
      .eq('id_bene', idBene)
      .order('data_apertura', { ascending: false });
    if (error || !data) return [];
    return (data as Row[]).map(rowToSegnalazione);
  }

  async findAttive(): Promise<Segnalazione[]> {
    const { data, error } = await supabase
      .from('segnalazione').select('*')
      .eq('stato', 'ATTIVO')
      .order('data_apertura', { ascending: false });
    if (error || !data) return [];
    return (data as Row[]).map(rowToSegnalazione);
  }

  // Usa PostGIS ST_DWithin — calcolo geo fatto interamente dal database
  async findInRaggio(lat: number, lng: number, raggioKm: number): Promise<Segnalazione[]> {
    const raggioMetri = raggioKm * 1000;
    const { data, error } = await supabase.rpc('segnalazioni_in_raggio', {
      p_lat: lat,
      p_lng: lng,
      p_raggio_m: raggioMetri,
    });
    if (error || !data) return [];
    return (data as Row[]).map(rowToSegnalazione);
  }

  async save(s: Segnalazione): Promise<void> {
    const { error } = await supabase.from('segnalazione').insert({
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
    });
    if (error) throw new Error(error.message);
  }

  async updateStato(id: string, stato: StatoSegnalazione): Promise<void> {
    const { error } = await supabase
      .from('segnalazione').update({ stato }).eq('id_segnalazione', id);
    if (error) throw new Error(error.message);
  }

  async chiudi(id: string): Promise<void> {
    const { error } = await supabase
      .from('segnalazione')
      .update({ stato: 'RITROVATO', data_chiusura: new Date().toISOString() })
      .eq('id_segnalazione', id);
    if (error) throw new Error(error.message);
  }
}
