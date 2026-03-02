import { Component, inject } from '@angular/core';
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
  public nav = inject(LayerHistoryService);

  public product = this.state.currentProductCard;
  public loadingProductCard = this.state.loadingProductCard;
  public error = this.state.productCardError;
  public addStatus = this.state.addStatus;

  // --- Cantidad ---
  get quantity(): number { return this.product()?.qty_in_order || 1; }

  set quantity(value: number) {
    const p = this.product();
    if (!p) return;
    const v = Math.max(1, Math.min(Number(value), p.total_quantity));
    this.state.updateProductQuantity(v);
  }

  increment() { this.quantity = this.quantity + 1; }
  decrement() { this.quantity = this.quantity - 1; }

  // --- Add to cart normal ---
  confirm() {
    if (!this.product() || this.quantity < 1) return;

    this.state.addCurrentProductToCart().subscribe({
      next: (res) => {
        console.log('🟢 Añadido al carrito:', res);
      },
      error: (err) => {
        if (err?.requiere_registro) {
          this.abrirModalRegistro();
        } else {
          console.error('❌ Error:', err);
        }
      }
    });
  }

  // --- Add to cart con datos del modal ---
  confirmConRegistro(datos: any) {
  this.state.addCurrentProductToCart(datos).subscribe({
    next: (res) => {
      console.log('🟢 Añadido al carrito con registro:', res);
      this.nav.back(); // ← Cierra producto y volvemos a home
    },
    error: (err) => {
      console.error('❌ Error tras registro:', err);
      // Nos quedamos en producto, correcto
    }
  });
}


  // --- Capas ---
  abrirModalRegistro() {
    this.nav.push('checkout', window.location.pathname + '?registro=true');
  }

  onRegistroCompleto(datos: any) {
    this.nav.back();            // cierra la capa
    this.confirmConRegistro(datos); // reintenta add-to-cart
  }

  cancel() {
    this.state.closeProductDetail();
    this.nav.back();
  }
}
