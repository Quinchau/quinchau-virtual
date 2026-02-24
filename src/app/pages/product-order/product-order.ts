// product-order.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerState } from '../../services/manager-state';

@Component({
  selector: 'app-product-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-order.html',
})
export class ProductOrder {
  private state = inject(ManagerState);
  

  product = this.state.currentProductCard;
  loadingProductCard = this.state.loadingProductCard;
  error = this.state.productCardError;

  get quantity(): number {
    return this.product()?.qty_in_order || 1;
  }

  set quantity(value: number) {
    const currentProduct = this.product();
    if (!currentProduct) return;
    
 
    const numValue = Number(value);
    if (isNaN(numValue)) return;
    

    const clampedValue = Math.max(1, Math.min(numValue, currentProduct.total_quantity));
    

    this.state.updateProductQuantity(clampedValue);
  }

  increment() {
    const currentProduct = this.product();
    if (currentProduct) {
      this.quantity = currentProduct.qty_in_order + 1;
    }
  }

  decrement() {
    const currentProduct = this.product();
    if (currentProduct) {
      this.quantity = currentProduct.qty_in_order - 1;
    }
  }

  confirm() {
  // Solo disparamos si no estamos ya cargando
  if (this.state.addStatus() !== 'loading') {
    this.state.addCurrentProductToCart();
  }
}

  cancel() {
    console.log('❌ Operación cancelada');
    
  }
}