import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-whatsapp-button',
  // No necesitamos imports aquí si solo usamos HTML estándar y signals
  templateUrl: './whatsapp-button.html',
})
export class WhatsappButton {
  // Inputs requeridos siguiendo tu flujo de aprendizaje
  phoneNumber = input.required<string>();
  message = input<string>('Hola! Me gustaría realizar una consulta.');

  // Signal computada para la URL
  whatsappUrl = computed(() => {
    const url = 'https://wa.me/';
    return `${url}${this.phoneNumber()}?text=${encodeURIComponent(this.message())}`;
  });
}