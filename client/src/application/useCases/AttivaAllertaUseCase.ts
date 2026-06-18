// UC-02: Attivazione Allerta e Generazione Kit
import type { ISmartIdRepository } from '../../domain/repositories/ISmartIdRepository';
import type { ISegnalazioneRepository } from '../../domain/repositories/ISegnalazioneRepository';
import type { IUtenteRepository } from '../../domain/repositories/IUtenteRepository';
import type { IGatewayNotifiche } from '../../domain/repositories/IGatewayNotifiche';
import {
  Segnalazione, StatoSegnalazione,
  PosizioneMancante, GatewayTimeoutException,
} from '../../domain/entities';
import { generateId } from '../../utils/uuid';

export interface AttivaAllertaInput {
  idBene: string;
  idSegnalatore: string;
  latitudine?: number;
  longitudine?: number;
  descrizioneEmergenza: string;
  raggioProssimita: number;
}

export interface AttivaAllertaOutput {
  segnalazione: Segnalazione;
  kitUrl: string;
  notificheInviate: boolean;
  avviso?: string;
}

const GATEWAY_TIMEOUT_MS = 5000;

export class AttivaAllertaUseCase {
  constructor(
    private readonly archivioSmartId: ISmartIdRepository,
    private readonly archivioSegnalazioni: ISegnalazioneRepository,
    private readonly archivioUtenti: IUtenteRepository,
    private readonly gatewayNotifiche: IGatewayNotifiche
  ) {}

  async esegui(input: AttivaAllertaInput): Promise<AttivaAllertaOutput> {
    if (input.latitudine === undefined || input.longitudine === undefined) {
      throw new PosizioneMancante();
    }

    const bene = await this.archivioSmartId.findById(input.idBene);
    if (!bene) throw new Error(`Bene con ID "${input.idBene}" non trovato.`);

    const segnalazione: Segnalazione = {
      idSegnalazione: generateId(),
      idBene: input.idBene,
      idSegnalatore: input.idSegnalatore,
      dataApertura: new Date(),
      stato: StatoSegnalazione.ATTIVO,
      latitudine: input.latitudine,
      longitudine: input.longitudine,
      descrizioneEmergenza: input.descrizioneEmergenza,
      raggioProssimita: input.raggioProssimita,
      nomeBene: bene.nome,
    };

    await this.archivioSegnalazioni.save(segnalazione);
    const kitUrl = `sosaround://kit/${segnalazione.idSegnalazione}`;

    // Recupera token push degli utenti vicini
    const vicini = await this.archivioSegnalazioni.findInRaggio(
      input.latitudine, input.longitudine, input.raggioProssimita
    );
    const idUtenti = [...new Set(vicini.map(s => s.idSegnalatore))];
    const utenti = await Promise.all(idUtenti.map(id => this.archivioUtenti.findById(id)));
    const tokens = utenti
      .filter(Boolean)
      .map(u => u!.pushToken)
      .filter((t): t is string => Boolean(t));

    let notificheInviate = false;
    let avviso: string | undefined;

    try {
      await Promise.race([
        this.gatewayNotifiche.inviaNotifiche(
          tokens,
          `🚨 Emergenza: ${bene.nome} smarrito!`,
          input.descrizioneEmergenza,
          { idSegnalazione: segnalazione.idSegnalazione }
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new GatewayTimeoutException()), GATEWAY_TIMEOUT_MS)
        ),
      ]);
      notificheInviate = true;
    } catch (err) {
      avviso = err instanceof GatewayTimeoutException
        ? err.message
        : 'Errore invio notifiche. L\'allerta è comunque attiva.';
    }

    return { segnalazione, kitUrl, notificheInviate, avviso };
  }
}
