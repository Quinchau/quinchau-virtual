// product-order.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ManagerState } from '../../services/manager-state';

@Component({
  selector: 'app-product-order',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-order.html',
})
export class ProductOrder {
  private state = inject(ManagerState);
  private route = inject(ActivatedRoute);
  
  // ✅ Signals del estado - DEFINIDAS CORRECTAMENTE
  product = this.state.currentProductCard;
  loadingProductCard = this.state.loadingProductCard;  // ← DEBE EXISTIR EN EL ESTADO
  error = this.state.productCardError;                 // ← DEBE EXISTIR EN EL ESTADO
  
  // Estado local
  quantity = signal<number>(1);

  constructor() {}

  increment() {
    this.quantity.update(q => q + 1);
  }

  decrement() {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  confirm() {
    console.log('Producto a añadir:', this.product());
    console.log('Cantidad:', this.quantity());
  }

  cancel() {
    console.log('Operación cancelada');
  }
}