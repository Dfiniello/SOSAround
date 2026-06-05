import type { SmartId } from '../entities';

export interface ISmartIdRepository {
  findById(idBene: string): Promise<SmartId | null>;
  findByCodiceIdentificativo(codice: string): Promise<SmartId | null>;
  findByProprietario(idProprietario: string): Promise<SmartId[]>;
  findByQrCode(stringQrCode: string): Promise<SmartId | null>;
  save(smartId: SmartId): Promise<void>;
  update(smartId: SmartId): Promise<void>;
  delete(idBene: string): Promise<void>;
}
