import { supabase } from '../supabase/supabaseClient';
import { PasswordDeboleException } from '../../domain/entities';

export class AuthService {
  validaEmail(email: string): void {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email.trim())) throw new Error('Inserisci un indirizzo email valido.');
  }

  validaPassword(password: string): void {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!regex.test(password)) throw new PasswordDeboleException();
  }

  async registra(nome: string, email: string, password: string): Promise<string> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      if (error.message.includes('already registered'))
        throw new Error("L'email è già registrata.");
      throw new Error(error.message);
    }
    const userId = data.user!.id;

    // Controlla unicità nome utente
    const { data: existing } = await supabase
      .from('profilo')
      .select('id')
      .eq('nome', nome)
      .maybeSingle();
    if (existing) throw new Error(`Il nome utente "${nome}" è già in uso.`);

    const { error: profileError } = await supabase
      .from('profilo')
      .insert({ id: userId, nome, punteggio: 0 });
    if (profileError) throw new Error(profileError.message);

    return userId;
  }

  async login(email: string, password: string): Promise<string> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Email o password errata.');
    return data.user.id;
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getSessioneAttiva(): Promise<{ idUtente: string } | null> {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    return { idUtente: data.session.user.id };
  }
}
