import { supabase } from '../../supabase/supabaseClient';
import type { IMessaggioRepository } from '../../../domain/repositories/IMessaggioRepository';
import type { Messaggio } from '../../../domain/entities';

type Row = {
  id_messaggio: string; id_segnalazione: string;
  id_mittente: string; id_destinatario: string;
  testo: string; timestamp: string;
  media_url: string | null; coord_lat: number | null; coord_lng: number | null;
};

function rowToMessaggio(r: Row): Messaggio {
  return {
    idMessaggio: r.id_messaggio,
    idSegnalazione: r.id_segnalazione,
    idMittente: r.id_mittente,
    idDestinatario: r.id_destinatario,
    testo: r.testo,
    timestamp: new Date(r.timestamp),
    mediaUrl: r.media_url ?? undefined,
    coordinateGps:
      r.coord_lat != null && r.coord_lng != null
        ? { lat: r.coord_lat, lng: r.coord_lng }
        : undefined,
  };
}

export class SupabaseMessaggioRepository implements IMessaggioRepository {
  async findBySegnalazione(idSegnalazione: string): Promise<Messaggio[]> {
    const { data, error } = await supabase
      .from('messaggio').select('*')
      .eq('id_segnalazione', idSegnalazione)
      .order('timestamp', { ascending: true });
    if (error || !data) return [];
    return (data as Row[]).map(rowToMessaggio);
  }

  async save(m: Messaggio): Promise<void> {
    const { error } = await supabase.from('messaggio').insert({
      id_messaggio: m.idMessaggio,
      id_segnalazione: m.idSegnalazione,
      id_mittente: m.idMittente,
      id_destinatario: m.idDestinatario,
      testo: m.testo,
      timestamp: m.timestamp.toISOString(),
      media_url: m.mediaUrl ?? null,
      coord_lat: m.coordinateGps?.lat ?? null,
      coord_lng: m.coordinateGps?.lng ?? null,
    });
    if (error) throw new Error(error.message);
  }
}
