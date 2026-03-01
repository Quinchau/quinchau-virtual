import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerState } from '../../services/manager-state';
import { ExeOrderComponent } from '../exe-order/exe-order';
import { LayerHistoryService } from '../../services/LayerHistoryService';


@Component({
  selector: 'app-product-order',
  standalone: true,
  imports: [CommonModule, FormsModule, ExeOrderComponent],
  templateUrl: './product-order.html',
})
export class ProductOrder {
  private state = inject(ManagerState);
  public navService = inject(LayerHistoryService);

  public isModalOpen = signal(false);
  public product = this.state.currentProductCard;
  public loadingProductCard = this.state.loadingProductCard;
  public error = this.state.productCardError;
  public addStatus = this.state.addStatus;

constructor() {
  effect(() => {
  const capa = this.navService.currentLayer();
  const modalAbierto = this.isModalOpen();
  
  // Justificación: Esta doble comprobación evita bucles infinitos 
  // y asegura que el componente reaccione tanto al botón "atrás" 
  // del navegador como a las llamadas manuales de back().
  if (capa === 'checkout' && !modalAbierto) this.isModalOpen.set(true);
  if (capa !== 'checkout' && modalAbierto) this.isModalOpen.set(false);
});
}

  // --- Lógica de Cantidad ---

  get quantity(): number { return this.product()?.qty_in_order || 1; }

  set quantity(value: number) {
    const currentProduct = this.product();
    if (!currentProduct) return;
    const numValue = Number(value);
    if (isNaN(numValue)) return;
    const clampedValue = Math.max(1, Math.min(numValue, currentProduct.total_quantity));
    this.state.updateProductQuantity(clampedValue);
  }

  increment() { if (this.product()) this.quantity = this.quantity + 1; }
  decrement() { if (this.product()) this.quantity = this.quantity - 1; }

  // --- Acciones de Negocio ---

  confirm(datosRegistro?: any) {
    if (!this.product() || this.quantity < 1) return;

    this.state.addCurrentProductToCart(datosRegistro).subscribe({
      next: (res) => {
        console.log('✅ Éxito:', res);
        // El servicio de estado ya maneja el cierre total si es necesario
      },
      error: (err) => {
        if (err?.requiere_registro) {
          this.abrirModalRegistro();
        } else {
          console.error('❌ Error:', err.mensaje || err);
        }
      }
    });
  }

  // --- Gestión de Capas de UI ---
  
abrirModalRegistro() {
  console.log('📦 Abriendo modal registro');
  const currentUrl = window.location.pathname;
  // Dejamos que el effect sincronice, solo cambiamos la capa
  this.navService.push('checkout');
}

cerrarModal() {
  console.log('📦 Cerrando modal registro manualmente');
  if (this.navService.currentLayer() === 'checkout') {
    this.navService.back(); // El effect cerrará el modal
  }
}

onRegistroCompleto(datosDelFormulario: any) {
  console.log('📦 Registro completo, confirmando pedido');
  // Primero volvemos a la capa anterior (producto)
  this.navService.back(); // El effect cerrará el modal
  // Luego confirmamos con los datos
  this.confirm(datosDelFormulario);
}

  cancel() {
    // Justificación: Limpia el producto en el estado global. 
    // Esto provocará que el Home (vía effect) cierre este componente.
    this.state.closeProductDetail();
    this.navService.back();
  }
}