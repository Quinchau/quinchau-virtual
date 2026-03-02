import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ManagerState } from '../../services/manager-state';
import { LayerHistoryService } from '../../services/LayerHistoryService';
import { SuccessOrder } from '../../components/success-order/success-order';


@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, SuccessOrder],
  templateUrl: './checkout.html'
})
export class CartComponent {
  protected orderFinished = signal(false);
  protected lastOrderId = signal<number | null>(null);

  protected state = inject(ManagerState);
  protected nav = inject(LayerHistoryService);

  abrirFinalizacion() {
    this.state.finishOrder()?.subscribe({
      next: (res) => {
        if (res.exito) {
          this.lastOrderId.set(res.orden_id);
          this.orderFinished.set(true); 
        }
      }
    });
  }
}