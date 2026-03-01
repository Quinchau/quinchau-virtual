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

  // Eventos de salida (API del componente)
  public close = output<void>();
  public registroCompleto = output<{ nombre: string, telefono: string }>();

  // Signals de estado interno (Formulario)
  public nombre = signal('');
  public apellido = signal('');
  public codigoArea = signal('414');
  public telefono = signal('');
  public codigos = signal(['414', '424', '416', '426', '412', '422']);

  /**
   * Justificación: Validamos el formulario de forma reactiva.
   * Al usar computed, Angular solo recalcula si cambian los signals.
   */
  public isFormValid = computed(() => {
    const soloNumeros = /^\d+$/;
    const nombreValido = this.nombre().trim().length > 2;
    const apellidoValido = this.apellido().trim().length > 2;
    const telefonoValido = this.telefono().length === 7 && soloNumeros.test(this.telefono());
    
    return nombreValido && apellidoValido && telefonoValido;
  });

  /**
   * Justificación: Centralizamos la emisión de datos.
   * El componente no sabe qué pasará después, solo cumple su contrato.
   */
  confirmarIdentidad() {
    if (!this.isFormValid()) return;

    const datosVisitante = {
      nombre: `${this.nombre().trim()} ${this.apellido().trim()}`,
      telefono: `${this.codigoArea()}${this.telefono()}`
    };

    this.registroCompleto.emit(datosVisitante);
  }

  /**
   * Justificación: Proporcionamos un método explícito para el cierre
   * que puede ser llamado desde el HTML (clic en fondo o botón cancelar).
   */
  cancelar() {
    this.close.emit();
  }
}