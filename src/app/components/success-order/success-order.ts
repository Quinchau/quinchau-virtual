import { Component, input, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-success-order',
  standalone: true,
  templateUrl: './success-order.html'
})
export class SuccessOrder {
  readonly orderId = input.required<number>();
  private router = inject(Router);

  volver() {
    this.router.navigate(['/home']);
  }
}
