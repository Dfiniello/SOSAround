import { dbService } from '../database/DatabaseService';
import type { ISmartIdRepository } from '../../domain/repositories/ISmartIdRepository';
import { SmartId, TipoBene } from '../../domain/entities';

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

export class SQLiteSmartIdRepository implements ISmartIdRepository {
  async findById(idBene: string): Promise<SmartId | null> {
    const db = await dbService.getDb();
    const row = await db.getFirstAsync<Row>(
      'SELECT * FROM smartid WHERE id_bene = ?', [idBene]
    );
    return row ? rowToSmartId(row) : null;
  }

  async findByCodiceIdentificativo(codice: string): Promise<SmartId | null> {
    const db = await dbService.getDb();
    const row = await db.getFirstAsync<Row>(
      'SELECT * FROM smartid WHERE codice_id = ?', [codice]
    );
    return row ? rowToSmartId(row) : null;
  }

  async findByProprietario(idProprietario: string): Promise<SmartId[]> {
    const db = await dbService.getDb();
    const rows = await db.getAllAsync<Row>(
      'SELECT * FROM smartid WHERE id_proprietario = ? ORDER BY data_reg DESC',
      [idProprietario]
    );
    return rows.map(rowToSmartId);
  }

  async findByQrCode(stringQrCode: string): Promise<SmartId | null> {
    const db = await dbService.getDb();
    const row = await db.getFirstAsync<Row>(
      'SELECT * FROM smartid WHERE string_qr_code = ?', [stringQrCode]
    );
    return row ? rowToSmartId(row) : null;
  }

  async save(s: SmartId): Promise<void> {
    const db = await dbService.getDb();
    await db.runAsync(
      `INSERT INTO smartid (id_bene, id_proprietario, tipo, nome, foto_url,
         string_qr_code, codice_id, data_reg)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.idBene, s.idProprietario, s.tipo, s.nome, s.fotoUrl,
       s.stringQrCode, s.codiceIdentificativo, s.dataRegistrazione.toISOString()]
    );
  }

  async update(s: SmartId): Promise<void> {
    const db = await dbService.getDb();
    await db.runAsync(
      `UPDATE smartid SET tipo=?, nome=?, foto_url=? WHERE id_bene=?`,
      [s.tipo, s.nome, s.fotoUrl, s.idBene]
    );
  }

  async delete(idBene: string): Promise<void> {
    const db = await dbService.getDb();
    await db.runAsync('DELETE FROM smartid WHERE id_bene = ?', [idBene]);
  }
}
