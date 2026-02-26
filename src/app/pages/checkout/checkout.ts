import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ManagerState } from '../../services/manager-state';
import { ExeOrderComponent } from '../exe-order/exe-order';


@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ExeOrderComponent],
  templateUrl: './checkout.html'
})


export class CartComponent {
  protected state = inject(ManagerState);

  
  public isModalOpen = signal(false);

  abrirFinalizacion() {
  this.isModalOpen.set(true);
  history.pushState({ modal: true }, '', '');
  window.onpopstate = () => {
    this.isModalOpen.set(false);
    window.onpopstate = null; 
  };
}

  cerrarModal() {
    this.isModalOpen.set(false);
    // Limpiamos el hash si el usuario cierra manualmente
    if (window.location.hash === '#confirmar') {
      window.history.back();
    }
  }
}