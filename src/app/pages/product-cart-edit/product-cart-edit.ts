import { Component, inject, linkedSignal, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerApis } from '../../services/manager-apis';
import { ManagerState } from '../../services/manager-state';

@Component({
  selector: 'app-product-cart-edit',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-cart-edit.html'
})
export class ProductCartEditComponent {
  private manager = inject(ManagerState);
  private managerApis = inject(ManagerApis);

  // 1. Definimos el input para recibir el producto del padre
  product = input.required<any>();
  
  // 2. Definimos el output para avisar al padre que cierre el modal
  closed = output<void>();

  isPending = signal(false);

  // 3. Sincronizamos la cantidad con el producto recibido
  quantity = linkedSignal({
    source: () => this.product()?.quantity ?? 1,
    computation: (newQty) => newQty
  });

  // Cálculo dinámico de subtotal para la vista previa
  tempSubtotal = computed(() => {
    const p = this.product();
    return p ? p.price * this.quantity() : 0;
  });

  async onUpdate(): Promise<void> {
    const p = this.product();
    if (!p) return;

    this.isPending.set(true);
    try {
      // CORRECCIÓN: Usamos 'updateCartItem' que es el nombre real en tu servicio
      await this.managerApis.updateCartItem({
        item_id: p.item_id,
        cotizacion_id: p.cotizacion_id,
        quantity: this.quantity()
      }).toPromise();
      
      this.manager.reloadCart(); 
      this.backToCart();
    } catch (error) {
      console.error('Error al actualizar:', error);
    } finally {
      this.isPending.set(false);
    }
  }

  async onDelete(): Promise<void> {
    const p = this.product();
    // CORRECCIÓN: Usamos 'description' o el campo que tengas para el nombre
    if (!p || !confirm(`¿Quitar ${p.description || 'este producto'} del carrito?`)) return;

    this.isPending.set(true);
    try {
      // CORRECCIÓN: Usamos 'deleteCartItem' que es el nombre real en tu servicio
      await this.managerApis.deleteCartItem({
        item_id: p.item_id,
        cotizacion_id: p.cotizacion_id
      }).toPromise();
      
      this.manager.reloadCart();
      this.backToCart();
    } catch (error) {
      console.error('Error al eliminar:', error);
    } finally {
      this.isPending.set(false);
    }
  }

  backToCart(): void {
    // Emitimos el cierre para que el padre limpie la URL (?edit=null)
    this.closed.emit();
  }
}