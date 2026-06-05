import type { ZonaInteresse } from '../entities';

export interface IZonaInteresseRepository {
  findByUtente(idUtente: string): Promise<ZonaInteresse[]>;
  save(zona: ZonaInteresse): Promise<void>;
  delete(idZona: string): Promise<void>;
}
