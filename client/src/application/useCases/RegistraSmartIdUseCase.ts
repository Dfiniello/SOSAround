// UC-01: Registrazione Smart ID
import type { ISmartIdRepository } from '../../domain/repositories/ISmartIdRepository';
import { SmartId, TipoBene, DuplicatoException } from '../../domain/entities';
import { generateId } from '../../utils/uuid';

export interface RegistraSmartIdInput {
  idProprietario: string;
  tipo: TipoBene;
  nome: string;
  fotoUrl: string;
  codiceIdentificativo: string;
}

export class RegistraSmartIdUseCase {
  constructor(private readonly archivioSmartId: ISmartIdRepository) {}

  async esegui(input: RegistraSmartIdInput): Promise<SmartId> {
    if (!input.nome.trim()) throw new Error('Inserire un nome valido.');
    if (!input.codiceIdentificativo.trim())
      throw new Error('Il codice identificativo (microchip/targa) è obbligatorio.');

    const esistente = await this.archivioSmartId.findByCodiceIdentificativo(
      input.codiceIdentificativo
    );
    if (esistente) {
      throw new DuplicatoException(
        `Il codice "${input.codiceIdentificativo}" è già registrato nel sistema.`
      );
    }

    const idBene = generateId();
    const stringQrCode = `sosaround://bene/${idBene}`;

    const nuovoSmartId: SmartId = {
      idBene,
      idProprietario: input.idProprietario,
      tipo: input.tipo,
      nome: input.nome.trim(),
      fotoUrl: input.fotoUrl,
      stringQrCode,
      codiceIdentificativo: input.codiceIdentificativo.trim(),
      dataRegistrazione: new Date(),
    };

    await this.archivioSmartId.save(nuovoSmartId);
    return nuovoSmartId;
  }
}
