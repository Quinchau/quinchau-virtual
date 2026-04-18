import { Component, inject, computed, signal } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { ManagerState } from '../../services/manager-state';

export interface ActividadItem {
  nombre: string;
  sku: string;
  vendedor: string;
  precio: number;
  imagen: string;
  estado: 'POR ENVIAR' | 'ENTREGADO' | 'TRÁNSITO';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, NgClass],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private managerState = inject(ManagerState);
  private router = inject(Router);

  // === MÉTRICAS LOCALES ===
  private readonly _pedidosHoy           = signal<number>(0);
  private readonly _visitantesHoy        = signal<number>(0);
  private readonly _carritosAbandonados  = signal<number>(0);
  private readonly _peticionesProductos  = signal<number>(0);
  private readonly _actividadReciente    = signal<ActividadItem[]>([]);

  // === ESTADO DERIVADO ===
  public readonly dashboardStats = computed(() => {
    const envios      = this.managerState.envios();
    const recepciones = this.managerState.recepciones();
    const user        = this.managerState.currentUser();

    return {
      porEnviar: {
        count:      envios.length,
        pendientes: envios.filter(t => t.status === 'Pendiente').length,
        recogidos:  envios.filter(t => t.status === 'Recogido').length,
        entregados: envios.filter(t => t.status === 'Entregado').length,
      },
      porRecibir: {
        count:      recepciones.length,
        pendientes: recepciones.filter(t => t.status === 'Pendiente').length,
        recogidos:  recepciones.filter(t => t.status === 'Recogido').length,
        entregados: recepciones.filter(t => t.status === 'Entregado').length,
      },
      pedidosHoy:           this._pedidosHoy(),
      visitantes:           this._visitantesHoy(),
      whatsappPendientes:   this.managerState.pendingWhatsappCount(),
      whatsappEnviadosHoy:  this.managerState.sentTodayCount(),       // 👈 nuevo
      carritosAbandonados:  this._carritosAbandonados(),
      peticionesProductos:  this._peticionesProductos(),
      actividadReciente:    this._actividadReciente(),
      usuario:              user?.realname ?? 'Usuario',
      ubicacion:            user?.defaultlocation ?? 'No definida',
    };
  });

  constructor() {
    this.managerState.loadTransfers();
  }

  // === NAVEGACIÓN ===
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
}