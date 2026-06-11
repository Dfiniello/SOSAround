import { supabase } from '../../supabase/supabaseClient';
import type { IUtenteRepository } from '../../../domain/repositories/IUtenteRepository';
import type { Utente } from '../../../domain/entities';

type Row = {
  id: string; nome: string; punteggio: number;
  push_token: string | null; data_reg: string;
  email?: string;
};

function rowToUtente(r: Row, email = ''): Utente {
  return {
    idUtente: r.id,
    nome: r.nome,
    email,
    passwordHash: '',
    punteggioReputazione: r.punteggio,
    dataRegistrazione: new Date(r.data_reg),
    pushToken: r.push_token ?? undefined,
  };
}

export class SupabaseUtenteRepository implements IUtenteRepository {
  async findByEmail(email: string): Promise<Utente | null> {
    const { data: authData } = await supabase.auth.admin
      ? await supabase.rpc('get_user_id_by_email', { p_email: email }).single<{ id: string }>()
        .then(r => ({ data: r.data }))
      : { data: null };

    // Approccio semplice: cerca nel profilo tramite sessione attiva o via email su auth
    // Poiché non abbiamo admin API dal client, usiamo la sessione corrente
    const { data: session } = await supabase.auth.getSession();
    if (session.session?.user.email?.toLowerCase() === email.toLowerCase()) {
      const userId = session.session.user.id;
      return this.findById(userId);
    }
    // Nessun altro modo client-side di cercare per email senza admin API
    return null;
  }

  async findByNome(nome: string): Promise<Utente | null> {
    const { data, error } = await supabase
      .from('profilo')
      .select('*')
      .ilike('nome', nome)
      .maybeSingle<Row>();
    if (error || !data) return null;
    return rowToUtente(data);
  }

  async findById(idUtente: string): Promise<Utente | null> {
    const { data: profile, error } = await supabase
      .from('profilo')
      .select('*')
      .eq('id', idUtente)
      .maybeSingle<Row>();
    if (error || !profile) return null;

    const { data: session } = await supabase.auth.getSession();
    const email = session.session?.user.email ?? '';
    return rowToUtente(profile, email);
  }

  async save(u: Utente): Promise<void> {
    const { error } = await supabase
      .from('profilo')
      .insert({ id: u.idUtente, nome: u.nome, punteggio: u.punteggioReputazione });
    if (error) throw new Error(error.message);
  }

  async update(u: Utente): Promise<void> {
    const { error } = await supabase
      .from('profilo')
      .update({ nome: u.nome, punteggio: u.punteggioReputazione, push_token: u.pushToken ?? null })
      .eq('id', u.idUtente);
    if (error) throw new Error(error.message);
  }

  async delete(idUtente: string): Promise<void> {
    const { error } = await supabase.from('profilo').delete().eq('id', idUtente);
    if (error) throw new Error(error.message);
  }

  async savePushToken(idUtente: string, token: string): Promise<void> {
    const { error } = await supabase
      .from('profilo')
      .update({ push_token: token })
      .eq('id', idUtente);
    if (error) throw new Error(error.message);
  }
}
