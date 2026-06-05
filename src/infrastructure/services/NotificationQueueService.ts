// Queue-Based Load Leveling — Pattern architetturale
// Disaccoppia il ritmo bursty della UI dal ritmo controllato del gateway notifiche.
// Supporta fino a 50 notifiche simultanee per area (RQ-26).

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
    // Il worker chiama il gateway a ritmo controllato.
    // L'implementazione reale passa per il GatewayNotifiche (infrastruttura).
    console.log(`[Queue] Processing job ${job.id} for segnalazione ${job.idSegnalazione}`);
  }

  get size(): number {
    return this.queue.length;
  }
}

// Singleton — una sola coda per l'app (Pattern Singleton)
export const notificationQueue = new PriorityQueue();
