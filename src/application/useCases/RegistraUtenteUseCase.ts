import type { IUtenteRepository } from '../../domain/repositories/IUtenteRepository';
import { Utente, DuplicatoException, PasswordDeboleException } from '../../domain/entities';
import { generateId } from '../../utils/uuid';

function validaPassword(password: string): void {
  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/;
  if (!regex.test(password)) throw new PasswordDeboleException();
}

export interface RegistraUtenteInput {
  nome: string;
  email: string;
  password: string;
  passwordHash: string;
}

export class RegistraUtenteUseCase {
  constructor(private readonly utenteRepository: IUtenteRepository) {}

  async esegui(input: RegistraUtenteInput): Promise<Utente> {
    validaPassword(input.password);

    const esisteNome = await this.utenteRepository.findByNome(input.nome);
    if (esisteNome) throw new DuplicatoException(`Il nome utente "${input.nome}" è già in uso.`);

    const esisteEmail = await this.utenteRepository.findByEmail(input.email);
    if (esisteEmail) throw new DuplicatoException(`L'email "${input.email}" è già registrata.`);

    const nuovoUtente: Utente = {
      idUtente: generateId(),
      nome: input.nome,
      email: input.email,
      passwordHash: input.passwordHash,
      punteggioReputazione: 0,
      dataRegistrazione: new Date(),
    };

    await this.utenteRepository.save(nuovoUtente);
    return nuovoUtente;
  }
}
