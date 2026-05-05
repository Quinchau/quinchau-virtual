// src/app/components/on-demand-detail/on-demand-detail.ts
import { Component, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ManagerApis } from '../../services/manager-apis';
import { OnDemandSubscription, OnDemandDisplayStatus } from '../../models/on-demand-model';

@Component({
  selector: 'app-on-demand-detail',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './on-demand-detail.html',
})
export class OnDemandDetail {
  private apis = inject(ManagerApis);

  // ── Inputs / Outputs ─────────────────────────────────────────────────────
  public readonly subscription = input.required<OnDemandSubscription>();

  public readonly close         = output<void>();
  public readonly statusChanged = output<{ id: number; status: 'closed' | 'pending' }>();
  public readonly notified      = output<number>();

  // ── Estado de acciones ───────────────────────────────────────────────────
  public readonly isNotifying      = signal(false);
  public readonly isChangingStatus = signal(false);
  public readonly actionError      = signal<string | null>(null);

  // ── Acciones ─────────────────────────────────────────────────────────────

  public notify(): void {
    this.actionError.set(null);
    this.isNotifying.set(true);

    this.apis.notifyOnDemand(this.subscription().id).subscribe({
      next: () => {
        this.isNotifying.set(false);
        this.notified.emit(this.subscription().id);
      },
      error: (err) => {
        console.error('❌ Error al notificar:', err);
        this.actionError.set('No se pudo enviar la notificación.');
        this.isNotifying.set(false);
      },
    });
  }

  public changeStatus(status: 'closed' | 'pending'): void {
    this.actionError.set(null);
    this.isChangingStatus.set(true);

    this.apis.updateOnDemandStatus(this.subscription().id, status).subscribe({
      next: () => {
        this.isChangingStatus.set(false);
        this.statusChanged.emit({ id: this.subscription().id, status });
      },
      error: (err) => {
        console.error('❌ Error al cambiar estado:', err);
        this.actionError.set('No se pudo actualizar el estado.');
        this.isChangingStatus.set(false);
      },
    });
  }

  // ── Helpers de presentación ──────────────────────────────────────────────

  public badgeClass(status: OnDemandDisplayStatus): string {
    const map: Record<OnDemandDisplayStatus, string> = {
      pending:               'bg-yellow-100 text-yellow-700',
      available:             'bg-green-100 text-green-700',
      replacement_available: 'bg-blue-100 text-blue-700',
      notified:              'bg-teal-100 text-teal-700',
      closed:                'bg-slate-100 text-slate-400',
    };
    return map[status] ?? 'bg-slate-100 text-slate-600';
  }

  public badgeLabel(status: OnDemandDisplayStatus): string {
    const map: Record<OnDemandDisplayStatus, string> = {
      pending:               '🟡 Pendiente',
      available:             '🟢 Disponible',
      replacement_available: '🔵 Reemplazo disponible',
      notified:              '✅ Notificado',
      closed:                '⛔ Cerrada',
    };
    return map[status] ?? status;
  }
}