import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-success-order',
  standalone: true,
  templateUrl: './success-order.html'
})
export class SuccessOrder {
  readonly orderId = input.required<number>();
  readonly onReturn = output<void>();

  volver() {
    this.onReturn.emit();
  }
}