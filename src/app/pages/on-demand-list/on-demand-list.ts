// src/app/pages/on-demand-list/on-demand-list.ts
import { Component, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ManagerApis } from '../../services/manager-apis';
import { OnDemandSubscription, OnDemandDisplayStatus } from '../../models/on-demand-model';
import { OnDemandDetail } from '../../pages/on-demand-detail/on-demand-detail';

type FilterValue = 'all' | OnDemandDisplayStatus;

interface Filter {
  value: FilterValue;
  label: string;
  activeClass: string;
}

@Component({
  selector: 'app-on-demand-list',
  standalone: true,
  imports: [DatePipe, OnDemandDetail],
  templateUrl: './on-demand-list.html',
})
export class OnDemandList {
  private apis = inject(ManagerApis);

  public readonly isLoading = signal(true);
  public readonly hasError  = signal(false);
  private readonly _data    = signal<OnDemandSubscription[]>([]);
  public readonly activeFilter = signal<FilterValue>('all');
  public readonly selected  = signal<OnDemandSubscription | null>(null);

  public readonly total = computed(() => this._data().length);

  public readonly filters: Filter[] = [
    { value: 'all',                   label: 'Todas',              activeClass: 'border-slate-700 text-slate-700 bg-slate-50' },
    { value: 'pending',               label: '🟡 Pendiente',       activeClass: 'border-yellow-400 text-yellow-700 bg-yellow-50' },
    { value: 'available',             label: '🟢 Disponible',      activeClass: 'border-green-500 text-green-700 bg-green-50' },
    { value: 'replacement_available', label: '🔵 Reemplazo',       activeClass: 'border-blue-400 text-blue-700 bg-blue-50' },
    { value: 'notified',              label: '✅ Notificado',      activeClass: 'border-teal-400 text-teal-700 bg-teal-50' },
    { value: 'closed',                label: '⛔ Cerrada',         activeClass: 'border-slate-400 text-slate-500 bg-slate-100' },
  ];

  private readonly STATUS_ORDER: Record<OnDemandDisplayStatus, number> = {
    available:             0,
    replacement_available: 1,
    pending:               2,
    notified:              3,
    closed:                4,
  };

  public readonly filtered = computed(() => {
    const f = this.activeFilter();
    const data = this._data();
    const list = f === 'all' ? data : data.filter(s => s.display_status === f);
    return [...list].sort((a, b) =>
      this.STATUS_ORDER[a.display_status] - this.STATUS_ORDER[b.display_status]
    );
  });

  public countByStatus(filter: FilterValue): number {
    if (filter === 'all') return this._data().length;
    return this._data().filter(s => s.display_status === filter).length;
  }

  constructor() {
    this.load();
  }

  public reload(): void {
    this.load();
  }

  public setFilter(value: FilterValue): void {
    this.activeFilter.set(value);
    this.selected.set(null);
  }

  public selectSubscription(sub: OnDemandSubscription): void {
    this.selected.set(sub);
  }

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

  // ── Eventos emitidos por OnDemandDetail ──────────────────────────────────

  public onStatusChanged(event: { id: number; status: 'closed' | 'pending' }): void {
    this._data.update(list =>
      list.map(s => {
        if (s.id !== event.id) return s;
        const newDisplayStatus: OnDemandDisplayStatus = event.status === 'closed'
          ? 'closed'
          : s.display_status === 'closed' ? 'pending' : s.display_status;
        return { ...s, status: event.status, display_status: newDisplayStatus };
      })
    );
    this.selected.update(s =>
      s && s.id === event.id
        ? { ...s, status: event.status, display_status: event.status === 'closed' ? 'closed' : 'pending' }
        : s
    );
  }

  public onNotified(id: number): void {
    this._data.update(list =>
      list.map(s => {
        if (s.id !== id) return s;
        return {
          ...s,
          status: 'notified',
          display_status: 'notified',
          notificacion: {
            ...s.notificacion,
            notificado: true,
            total_notificaciones: s.notificacion.total_notificaciones + 1,
            ultima_notificacion: new Date().toISOString(),
          },
        };
      })
    );
    this.selected.update(s =>
      s
        ? {
            ...s,
            status: 'notified',
            display_status: 'notified',
            notificacion: {
              ...s.notificacion,
              notificado: true,
              total_notificaciones: s.notificacion.total_notificaciones + 1,
              ultima_notificacion: new Date().toISOString(),
            },
          }
        : s
    );
  }

  // ── Carga ────────────────────────────────────────────────────────────────

  private load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.apis.getOnDemandSubscriptions().subscribe({
      next: (res) => {
        this._data.set(res.data ?? []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Error cargando suscripciones on-demand:', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }
}