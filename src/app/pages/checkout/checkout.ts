import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ManagerState } from '../../services/manager-state';


@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './checkout.html'
})
export class CartComponent {
  // Acceso directo al estado centralizado
  protected state = inject(ManagerState);
}