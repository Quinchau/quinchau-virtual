import { Component, inject, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  private router = inject(Router);
  public nav = inject(LayerHistoryService); // Lo mantenemos para que el HTML no falle

  // 🟢 SOLUCIÓN AL ERROR NG8002: Declaramos el input
  public productId = input.required<string>();

  public product = this.state.currentProductCard;
  public loadingProductCard = this.state.loadingProductCard;
  public error = this.state.productCardError;
  public addStatus = this.state.addStatus;

  // 🟢 SOLUCIÓN A LOS ERRORES DE 'quantity':
  // Creamos un getter/setter para que el (ngModel) del HTML funcione
  get quantity(): number { 
    return this.product()?.qty_in_order || 1; 
  }

  set quantity(value: number) {
    const p = this.product();
    if (!p) return;
    const v = Math.max(1, Math.min(Number(value), p.total_quantity));
    this.state.updateProductQuantity(v);
  }

  increment() { this.quantity = this.quantity + 1; }
  decrement() { this.quantity = this.quantity - 1; }

  confirm() {
    if (!this.product() || this.quantity < 1) return;
    this.state.addCurrentProductToCart().subscribe({
      next: (res) => console.log('🟢 Añadido:', res),
      error: (err) => {
        if (err?.requiere_registro) this.abrirModalRegistro();
      }
    });
  }

  // 🟢 SOLUCIÓN A 'onRegistroCompleto':
  confirmConRegistro(datos: any) {
    this.state.addCurrentProductToCart(datos).subscribe({
      next: (res) => {
        this.cancel(); // Cierra el producto usando la URL
      },
      error: (err) => console.error('❌ Error:', err)
    });
  }

  abrirModalRegistro() {
    this.nav.push('checkout', window.location.pathname + '?registro=true');
  }

  onRegistroCompleto(datos: any) {
    this.nav.back(); // Cierra el mini-modal de registro
    this.confirmConRegistro(datos);
  }

  cancel() {
    // Cerramos el producto quitando 'p' de la URL
    this.router.navigate([], {
      queryParams: { p: null },
      queryParamsHandling: 'merge'
    });
  }
}