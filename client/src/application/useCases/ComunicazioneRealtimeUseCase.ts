// UC-03: Comunicazione Real-time
import type { IMessaggioRepository } from '../../domain/repositories/IMessaggioRepository';
import type { ISegnalazioneRepository } from '../../domain/repositories/ISegnalazioneRepository';
import type { IGatewayNotifiche } from '../../domain/repositories/IGatewayNotifiche';
import type { IUtenteRepository } from '../../domain/repositories/IUtenteRepository';
import {
  Messaggio, StatoSegnalazione,
  SegnalazioneChiusaException, UploadFallitoException,
} from '../../domain/entities';
import { generateId } from '../../utils/uuid';

export interface InviaMessaggioInput {
  idSegnalazione: string;
  idMittente: string;
  testo: string;
  mediaUrl?: string;
  coordinateGps?: { lat: number; lng: number };
}

export class ComunicazioneRealtimeUseCase {
  constructor(
    private readonly archivioSegnalazioni: ISegnalazioneRepository,
    private readonly archivioMessaggi: IMessaggioRepository,
    private readonly archivioUtenti: IUtenteRepository,
    private readonly gatewayNotifiche: IGatewayNotifiche
  ) {}

  async apriChat(idSegnalazione: string): Promise<void> {
    const s = await this.archivioSegnalazioni.findById(idSegnalazione);
    if (!s) throw new Error('Segnalazione non trovata.');
    if (s.stato !== StatoSegnalazione.ATTIVO) throw new SegnalazioneChiusaException();
  }

  async inviaMessaggio(input: InviaMessaggioInput): Promise<Messaggio> {
    const s = await this.archivioSegnalazioni.findById(input.idSegnalazione);
    if (!s) throw new Error('Segnalazione non trovata.');
    if (s.stato !== StatoSegnalazione.ATTIVO) throw new SegnalazioneChiusaException();

    // Determina il destinatario corretto:
    // - se a scrivere è il ritrovatore → destinatario è il segnalatore (proprietario)
    // - se a scrivere è il segnalatore → destinatario è il ritrovatore, ricavato
    //   dal primo messaggio della conversazione inviato dall'altra parte.
    // Senza questo, le risposte del proprietario avrebbero destinatario = se stesso
    // e la RLS di Supabase non le consegnerebbe in realtime al ritrovatore.
    let idDestinatario: string;
    if (input.idMittente === s.idSegnalatore) {
      const msgs = await this.archivioMessaggi.findBySegnalazione(input.idSegnalazione);
      const altro = msgs.find(m => m.idMittente !== s.idSegnalatore);
      idDestinatario = altro?.idMittente ?? s.idSegnalatore;
    } else {
      idDestinatario = s.idSegnalatore;
    }

    if (input.mediaUrl) {
      const ok = await this.verificaUpload(input.mediaUrl);
      if (!ok) {
        await this.salva({ ...input, mediaUrl: undefined }, idDestinatario);
        await this.notifica(idDestinatario, input.testo);
        throw new UploadFallitoException();
      }
    }

    const msg = await this.salva(input, idDestinatario);
    await this.notifica(idDestinatario, input.testo || 'Nuovo avvistamento!');
    return msg;
  }

  private async salva(input: InviaMessaggioInput, idDestinatario: string): Promise<Messaggio> {
    const msg: Messaggio = {
      idMessaggio: generateId(),
      idSegnalazione: input.idSegnalazione,
      idMittente: input.idMittente,
      idDestinatario,
      testo: input.testo,
      timestamp: new Date(),
      mediaUrl: input.mediaUrl,
      coordinateGps: input.coordinateGps,
    };
    await this.archivioMessaggi.save(msg);
    return msg;
  }

  private async notifica(idDestinatario: string, testo: string): Promise<void> {
    const u = await this.archivioUtenti.findById(idDestinatario);
    if (u?.pushToken) {
      await this.gatewayNotifiche
        .inviaNotifiche([u.pushToken], '📍 Nuovo avvistamento!', testo)
        .catch(() => {/* non bloccante */});
    }
  }

  private async verificaUpload(_url: string): Promise<boolean> {
    return true;
  }
}
