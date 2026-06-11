// Queue-Based Load Leveling — Pattern architetturale
// Disaccoppia il ritmo bursty della UI dal ritmo controllato del gateway notifiche.
// Supporta fino a 50 notifiche simultanee per area (RQ-26).

import type { IGatewayNotifiche } from '../../domain/repositories/IGatewayNotifiche';

export interface NotificationJob {
  id: string;
  idSegnalazione: string;
  latitudine: number;
  longitudine: number;
  raggioKm: number;
  priorita: number;     // 0 = massima
  createdAt: Date;
}

class PriorityQueue {
  private queue: NotificationJob[] = [];
  private isProcessing = false;
  private readonly MAX_CONCURRENT = 50;  // RQ-26
  private readonly WORKER_INTERVAL_MS = 200;

  // Iniettati dopo l'init (evita circular dependency)
  private gateway: IGatewayNotifiche | null = null;
  private tokenResolver: ((lat: number, lng: number, raggioKm: number) => Promise<string[]>) | null = null;

  configure(
    gateway: IGatewayNotifiche,
    tokenResolver: (lat: number, lng: number, raggioKm: number) => Promise<string[]>
  ): void {
    this.gateway = gateway;
    this.tokenResolver = tokenResolver;
  }

  enqueue(job: NotificationJob): void {
    this.queue.push(job);
    // Ordina per priorità (0 = primo)
    this.queue.sort((a, b) => a.priorita - b.priorita);
    this.startWorkerIfIdle();
  }

  private startWorkerIfIdle(): void {
    if (!this.isProcessing) {
      this.isProcessing = true;
      this.processNext();
    }
  }

  private processNext(): void {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    // Preleva un batch di MAX_CONCURRENT job
    const batch = this.queue.splice(0, this.MAX_CONCURRENT);
    Promise.all(batch.map(job => this.processJob(job))).finally(() => {
      // Schedula il prossimo ciclo con intervallo controllato
      setTimeout(() => this.processNext(), this.WORKER_INTERVAL_MS);
    });
  }

  private async processJob(job: NotificationJob): Promise<void> {
    if (!this.gateway || !this.tokenResolver) {
      console.warn(`[Queue] Gateway o tokenResolver non configurati — job ${job.id} scartato.`);
      return;
    }
    try {
      const tokens = await this.tokenResolver(job.latitudine, job.longitudine, job.raggioKm);
      if (tokens.length > 0) {
        await this.gateway.inviaNotifiche(
          tokens,
          '🚨 SOS nelle vicinanze',
          `Segnalazione attiva nella tua area`,
          { idSegnalazione: job.idSegnalazione }
        );
      }
    } catch (e) {
      console.error(`[Queue] Errore processando job ${job.id}:`, e);
    }
  }

  get size(): number {
    return this.queue.length;
  }
}

// Singleton — una sola coda per l'app (Pattern Singleton)
export const notificationQueue = new PriorityQueue();
