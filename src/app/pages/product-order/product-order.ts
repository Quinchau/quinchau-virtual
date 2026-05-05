import { Component, inject, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ManagerState } from '../../services/manager-state';
import { ExeOrderComponent } from '../exe-order/exe-order';
import { LayerHistoryService } from '../../services/LayerHistoryService';

type PendingAction = 'cart' | 'waitlist' | null;

@Component({
  selector: 'app-product-order',
  standalone: true,
  imports: [CommonModule, FormsModule, ExeOrderComponent],
  templateUrl: './product-order.html',
})
export class ProductOrder {
  protected readonly state = inject(ManagerState);
  private router = inject(Router);
  public nav = inject(LayerHistoryService);
  public productId = input.required<string>();
  public product = this.state.currentProductCard;
  public loadingProductCard = this.state.loadingProductCard;
  public error = this.state.productCardError;
  public addStatus = this.state.addStatus;
  protected readonly inWaitlist = this.state.currentProductInWaitlist;
  protected readonly notifySuccess = signal(false);
  private pendingAction = signal<PendingAction>(null);

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
        if (err?.requiere_registro) {
          this.pendingAction.set('cart');
          this.abrirModalRegistro();
        }
      }
    });
  }

  confirmConRegistro(datos: any) {
    this.state.addCurrentProductToCart(datos).subscribe({
      next: () => this.cancel(),
      error: (err) => console.error('❌ Error:', err)
    });
  }

  notifyMe(): void {
    const stockid = this.productId();
    this.state.waitlist.update(current => [...current, stockid]);

    this.state.subscribeToWaitlist(stockid).subscribe({
      next: () => {
        this.notifySuccess.set(true);
      },
      error: (err) => {
        this.state.waitlist.update(current => current.filter(id => id !== stockid));
        if (err?.requiere_registro) {
          this.pendingAction.set('waitlist');
          this.abrirModalRegistro();
        }
      }
    });
  }

  confirmWaitlistConRegistro(datos: any): void {
  const stockid = this.productId();
  this.state.subscribeToWaitlist(stockid, datos).subscribe({
    next: () => {
      this.nav.back();
      this.notifySuccess.set(true);
    },
    error: (err) => console.error('❌ Error en waitlist con registro:', err)
  });
}

  abrirModalRegistro() {
    this.nav.push('checkout', window.location.pathname + '?registro=true');
  }

  onRegistroCompleto(datos: any) {
  if (this.pendingAction() === 'waitlist') {
    this.pendingAction.set(null);
    this.confirmWaitlistConRegistro(datos);
  } else {
    this.pendingAction.set(null);
    this.confirmConRegistro(datos);
  }
}

  cancel() {
    this.router.navigate([], {
      queryParams: { p: null },
      queryParamsHandling: 'merge'
    });
  }
}