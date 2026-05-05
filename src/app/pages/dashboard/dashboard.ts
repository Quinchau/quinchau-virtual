import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ManagerState } from '../../services/manager-state';
import { ManagerApis } from '../../services/manager-apis';
import { DashboardMetrics } from '../../models/transfer.model';
 
const EMPTY_METRICS: DashboardMetrics = {
  transferencias: {
    porEnviar:  { pendientes: 0, recogidos: 0, entregados: 0 },
    porRecibir: { pendientes: 0, recogidos: 0, entregados: 0 },
  },
  pedidosHoy:          0,
  visitantesHoy:       0,
  carritosAbandonados: 0,
  peticionesProductos: { hoy: 0, ayer: 0, semana: 0, todas: 0 },
  whatsapp: { pendientes: 0, enviadosHoy: 0 },
};
 
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private managerState = inject(ManagerState);
  private managerApis  = inject(ManagerApis);
  private router       = inject(Router);
 
  private readonly _metrics = signal<DashboardMetrics>(EMPTY_METRICS);
  public readonly isLoading = signal<boolean>(true);
  public readonly hasError  = signal<boolean>(false);
 
  public readonly m = computed(() => this._metrics());
 
  constructor() {
    this.managerApis.getDashboardMetrics().subscribe({
      next: (data) => {
        this._metrics.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Error cargando métricas del dashboard:', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }
 
  public navigateToEnviar(): void {
    this.managerState.setNewTransferType('ship');
    this.router.navigate(['/transfers']);
  }
 
  public navigateToRecibir(): void {
    this.managerState.setNewTransferType('rec');
    this.router.navigate(['/transfers']);
  }
 
  public navigateToWhatsapp(): void {
    this.router.navigate(['/whatsapp-manual']);
  }

  public navigateToOnDemand(): void {
    this.router.navigate(['/on-demand']);
  }
}