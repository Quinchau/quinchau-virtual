// src/app/pages/dashboard/dashboard.ts
import { Component, inject, signal, computed } from '@angular/core';

import { Router } from '@angular/router';
import { ManagerState } from '../../services/manager-state';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private managerState = inject(ManagerState);
  private router = inject(Router);

  // === ESTADO DERIVADO PARA EL DASHBOARD ===
  public readonly dashboardStats = computed(() => {
    const envios = this.managerState.envios();
    const recepciones = this.managerState.recepciones();
    
    return {
      porEnviar: {
        count: envios.length,
        pendientes: envios.filter(t => t.status === 'Pendiente').length,
        recogidos: envios.filter(t => t.status === 'Recogido').length,
        entregados: envios.filter(t => t.status === 'Entregado').length
      },
      porRecibir: {
        count: recepciones.length,
        pendientes: recepciones.filter(t => t.status === 'Pendiente').length,
        recogidos: recepciones.filter(t => t.status === 'Recogido').length,
        entregados: recepciones.filter(t => t.status === 'Entregado').length
      },
      usuario: this.managerState.currentUser()?.realname || 'Usuario',
      ubicacion: this.managerState.currentUser()?.defaultlocation || 'No definida'
    };
  });

  constructor() {
    this.managerState.loadTransfers();
  }

  // === MÉTODOS DE NAVEGACIÓN ===
  public navigateToEnviar(): void {
    this.managerState.setNewTransferType('ship');
    this.router.navigate(['/transfers']);
  }

  public navigateToRecibir(): void {
    this.managerState.setNewTransferType('rec');
    this.router.navigate(['/transfers']);
  }

  }