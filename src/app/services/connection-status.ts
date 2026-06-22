// src/app/services/connection-status.ts
import { Injectable, signal } from '@angular/core';

export type ConnStatus = 'idle' | 'loading' | 'waiting' | 'offline';

@Injectable({ providedIn: 'root' })
export class ConnectionStatus {
  private activeCount = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  readonly progress = signal(0);
  readonly visible = signal(false);
  readonly status = signal<ConnStatus>('idle'); // idle | loading | waiting | offline

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());

      if (!navigator.onLine) this.handleOffline();
    }
  }

  startRequest(): void {
    console.log('startRequest llamado');
    this.activeCount++;
    if (this.status() === 'offline') return; // ya sabemos que no hay red, no animar ciclo normal

    if (this.activeCount === 1) {
      this.beginCycle();
    }
  }

  endRequest(failedNoNetwork = false): void {
    this.activeCount = Math.max(0, this.activeCount - 1);

    if (failedNoNetwork) {
      this.handleOffline();
      return;
    }

    if (this.activeCount === 0 && this.status() !== 'offline') {
      this.finishCycle();
    }
  }

  private beginCycle(): void {
    this.clearStepTimers();
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }

    this.visible.set(true);
    this.status.set('loading');
    this.progress.set(5);

    this.timers.push(setTimeout(() => this.progress.set(10), 1000));
    this.timers.push(setTimeout(() => {
      this.progress.set(30);
      this.status.set('waiting');
    }, 2000));
  }

  private finishCycle(): void {
    console.log('🔴 finishCycle, ocultando');
    this.clearStepTimers();
    this.status.set('loading'); // por si estaba en waiting, vuelve a estado "normal" un instante
    this.progress.set(100);

    this.hideTimer = setTimeout(() => {
      this.visible.set(false);
      this.progress.set(0);
      this.status.set('idle');
    }, 300);
  }

  private handleOffline(): void {
    this.clearStepTimers();
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }

    this.visible.set(true);
    this.status.set('offline');
    this.progress.set(100); // barra llena en rojo, fija
  }

  private handleOnline(): void {
    if (this.status() === 'offline') {
      // si no hay requests activas, ocultar; si hay, retomar el ciclo normal
      if (this.activeCount > 0) {
        this.beginCycle();
      } else {
        this.visible.set(false);
        this.status.set('idle');
        this.progress.set(0);
      }
    }
  }

  private clearStepTimers(): void {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
  }
}