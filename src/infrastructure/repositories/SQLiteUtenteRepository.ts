import { dbService } from '../database/DatabaseService';
import type { IUtenteRepository } from '../../domain/repositories/IUtenteRepository';
import type { Utente } from '../../domain/entities';

type Row = {
  id_utente: string; nome: string; email: string;
  password_hash: string; punteggio: number;
  data_reg: string; push_token: string | null;
};

function rowToUtente(r: Row): Utente {
  return {
    idUtente: r.id_utente,
    nome: r.nome,
    email: r.email,
    passwordHash: r.password_hash,
    punteggioReputazione: r.punteggio,
    dataRegistrazione: new Date(r.data_reg),
    pushToken: r.push_token ?? undefined,
  };
}

export class SQLiteUtenteRepository implements IUtenteRepository {
  async findByEmail(email: string): Promise<Utente | null> {
    const db = await dbService.getDb();
    const row = await db.getFirstAsync<Row>(
      'SELECT * FROM utente WHERE LOWER(email) = LOWER(?)', [email]
    );
    return row ? rowToUtente(row) : null;
  }

  async findByNome(nome: string): Promise<Utente | null> {
    const db = await dbService.getDb();
    const row = await db.getFirstAsync<Row>(
      'SELECT * FROM utente WHERE LOWER(nome) = LOWER(?)', [nome]
    );
    return row ? rowToUtente(row) : null;
  }

  async findById(idUtente: string): Promise<Utente | null> {
    const db = await dbService.getDb();
    const row = await db.getFirstAsync<Row>(
      'SELECT * FROM utente WHERE id_utente = ?', [idUtente]
    );
    return row ? rowToUtente(row) : null;
  }

  async save(u: Utente): Promise<void> {
    const db = await dbService.getDb();
    await db.runAsync(
      `INSERT INTO utente (id_utente, nome, email, password_hash, punteggio, data_reg, push_token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [u.idUtente, u.nome, u.email, u.passwordHash, u.punteggioReputazione,
       u.dataRegistrazione.toISOString(), u.pushToken ?? null]
    );
  }

  async update(u: Utente): Promise<void> {
    const db = await dbService.getDb();
    await db.runAsync(
      `UPDATE utente SET nome=?, email=?, password_hash=?, punteggio=?, push_token=?
       WHERE id_utente=?`,
      [u.nome, u.email, u.passwordHash, u.punteggioReputazione,
       u.pushToken ?? null, u.idUtente]
    );
  }

  async delete(idUtente: string): Promise<void> {
    const db = await dbService.getDb();
    await db.runAsync('DELETE FROM utente WHERE id_utente = ?', [idUtente]);
  }

  async savePushToken(idUtente: string, token: string): Promise<void> {
    const db = await dbService.getDb();
    await db.runAsync(
      'UPDATE utente SET push_token = ? WHERE id_utente = ?', [token, idUtente]
    );
  }
}
