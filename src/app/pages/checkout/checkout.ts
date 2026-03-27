import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerState } from '../../services/manager-state';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop'; // <--- Importante
import { ProductCartEditComponent } from '../product-cart-edit/product-cart-edit';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ProductCartEditComponent],
  templateUrl: './checkout.html'
})
export class CartComponent {
  protected state = inject(ManagerState);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // 1. Convertimos el Observable de la URL a una Signal
  private queryParams = toSignal(this.route.queryParamMap);

  // 2. Ahora editingId lee de la señal queryParams() de forma reactiva
  protected editingId = computed(() => 
    this.queryParams()?.get('edit')
  );

  protected productToEdit = computed(() => {
  const idStr = this.editingId();
  if (!idStr) return null;

  const id = Number(idStr);
  const found = this.state.cartItems().find((item: any) => item.item_id === id);
  
  console.log('ID buscado:', id);
  console.log('Items disponibles:', this.state.cartItems().length);
  console.log('Producto encontrado:', found);
  
  return found;
});

  abrirFinalizacion() {
    this.state.finishOrder()?.subscribe({
      next: (res) => {
        if (res.exito) {
          this.router.navigate(['/success', res.orden_id]);
        }
      }
    });
  }

  // 3. Abrimos el modal simplemente actualizando la URL
  public goToEdit(item: any): void {
    this.router.navigate([], {
      queryParams: { edit: item.item_id },
      queryParamsHandling: 'merge'
    });
  }

  // 4. Cerramos el modal limpiando el parámetro (vuelve a /checkout)
  public closeModal(): void {
    this.router.navigate([], {
      queryParams: { edit: null },
      queryParamsHandling: 'merge'
    });
  }
}