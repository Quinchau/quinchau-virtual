import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerState } from '../../services/manager-state';
import { Router } from '@angular/router';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout.html'
})
export class CartComponent {
  protected state = inject(ManagerState);
  private router = inject(Router);

  abrirFinalizacion() {
    this.state.finishOrder()?.subscribe({
      next: (res) => {
        if (res.exito) {
          this.router.navigate(['/success', res.orden_id]);
        }
      }
    });
  }
}
