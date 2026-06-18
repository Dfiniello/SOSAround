import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { SmartId, Segnalazione } from '../../domain/entities';

export class KitGeneratorService {
  async generaECondividi(bene: SmartId, segnalazione: Segnalazione): Promise<string> {
    const html = this.buildHtml(bene, segnalazione);
    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  }

  async condividi(uri: string): Promise<void> {
    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Volantino ${new Date().toLocaleDateString('it-IT')}`,
      });
    }
  }

  private buildHtml(bene: SmartId, segnalazione: Segnalazione): string {
    return `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8"/>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #1d1d1f; }
          h1 { color: #E63946; font-size: 28px; margin-bottom: 4px; }
          .grid { display: flex; gap: 20px; margin-top: 16px; }
          .info { flex: 1; }
          img.bene { width: 180px; height: 180px; object-fit: cover; border-radius: 12px; }
          p { margin: 6px 0; font-size: 14px; }
          .label { font-weight: bold; }
          .qr-box {
            margin-top: 20px; padding: 16px;
            border: 2px dashed #E63946; border-radius: 12px;
            text-align: center;
          }
          .qr-title { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
          .qr-code {
            font-family: monospace; font-size: 13px; color: #333;
            background: #f5f5f5; padding: 10px; border-radius: 8px;
            word-break: break-all; display: inline-block; max-width: 100%;
          }
          .qr-hint { font-size: 11px; color: #888; margin-top: 8px; }
          .footer {
            margin-top: 24px; padding: 12px; background: #E63946; color: #fff;
            border-radius: 8px; text-align: center; font-size: 13px;
          }
        </style>
      </head>
      <body>
        <h1>SMARRITO — ${bene.nome.toUpperCase()}</h1>
        <div class="grid">
          <div>
            <img class="bene" src="${bene.fotoUrl}" alt="${bene.nome}"/>
          </div>
          <div class="info">
            <p><span class="label">Tipo:</span> ${bene.tipo}</p>
            <p><span class="label">Codice ID:</span> ${bene.codiceIdentificativo}</p>
            <p><span class="label">Smarrito il:</span>
              ${segnalazione.dataApertura.toLocaleDateString('it-IT')}</p>
            <p><span class="label">Zona:</span>
              ${segnalazione.latitudine.toFixed(5)}, ${segnalazione.longitudine.toFixed(5)}</p>
            <p><span class="label">Descrizione:</span> ${segnalazione.descrizioneEmergenza}</p>
          </div>
        </div>
        <div class="qr-box">
          <div class="qr-title">Apri con SOSAround</div>
          <div class="qr-code">${bene.stringQrCode}</div>
          <div class="qr-hint">Copia il codice nell'app SOSAround per contattare il proprietario</div>
        </div>
        <div class="footer">
          Scarica SOSAround e inserisci il codice qui sopra per aiutare a ritrovare questo bene
        </div>
      </body>
      </html>
    `;
  }
}
