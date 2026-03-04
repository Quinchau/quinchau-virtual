// src/app/components/whatsapp-button/whatsapp-button.ts

import { Component, computed, inject, input } from '@angular/core';
import { ManagerState } from '../../services/manager-state';

@Component({
  selector: 'app-whatsapp-button',
  standalone: true,
  templateUrl: './whatsapp-button.html',
})
export class WhatsappButton {
  private state = inject(ManagerState);

  // CORRECTO: Es una referencia a la Signal del Estado, NO un input.
  protected phoneNumber = this.state.whatsappNumber;


  // CORRECTO: Es un input opcional con valor por defecto.
  public message = input<string>('¡Hola! Me gustaría recibir más información.');

  public whatsappUrl = computed(() => {
    const baseUrl = 'https://wa.me/';
    const phone = this.phoneNumber();
    if (!phone) return '';
    
    return `${baseUrl}${phone}?text=${encodeURIComponent(this.message())}`;
  });

  public openWhatsapp(): void {
    const url = this.whatsappUrl();
    if (url) {
      window.open(url, '_blank');
    }
  }
}