import { Component, inject, signal, computed, output } from '@angular/core';
import { ManagerState } from '../../services/manager-state';

@Component({
  selector: 'app-exe-order',
  standalone: true,
  imports: [],
  templateUrl: './exe-order.html',
})


export class ExeOrderComponent {
  protected state = inject(ManagerState);
  isPending = signal(false);

  close = output<void>();

  nombre = signal('');
  apellido = signal('');
  codigoArea = signal('414');
  telefono = signal('');

  codigos = signal(['414', '424', '416', '426', '412', '422']);

  // Validación reactiva
  isFormValid = computed(() => {
    const soloNumeros = /^\d+$/;
    return (
      this.nombre().trim().length > 2 &&
      this.apellido().trim().length > 2 &&
      this.telefono().length === 7 &&
      soloNumeros.test(this.telefono())
    );
  });


procesarCompra() {
  if (!this.isFormValid() || this.isPending()) return;

  const idActual = this.state.cartResource.value()?.cotizacion_id;
  if (!idActual) return; // Seguridad extra

  this.isPending.set(true); // Bloqueamos el botón

  const datosFinales = {
    cotizacion_id: idActual,
    nombre: `${this.nombre()} ${this.apellido()}`,
    telefono: `${this.codigoArea()}${this.telefono()}`
  };

  this.state.executeOrder(datosFinales).subscribe({
    next: (res) => {
      if (res.exito) {
        alert('¡Pedido realizado con éxito!');
        this.close.emit();
      }
      this.isPending.set(false);
    },
    error: (err) => {
      console.error('Error en checkout', err);
      this.isPending.set(false);
    }
  });
}
}