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

  public close = output<void>();
  public registroCompleto = output<{ 
  nombre: string, 
  prefijo: string, 
  numero: string 
}>();

  public nombre = signal('');
  public apellido = signal('');
  public codigoArea = signal('414');
  public telefono = signal('');
  public codigos = signal(['414', '424', '416', '426', '412', '422']);


 public isFormValid = computed(() => {
  const soloNumeros = /^\d+$/;

  // 1. Validamos identidad
  const nombreValido = this.nombre().trim().length > 2;
  const apellidoValido = this.apellido().trim().length > 2;

  // 2. Validamos componentes del teléfono por separado
  const codigoValido = this.codigos().includes(this.codigoArea());
  const numeroCuerpoValido = this.telefono().trim().length === 7 && soloNumeros.test(this.telefono().trim());

  // 3. Resultado final: La unión de todas las verdades
  return nombreValido && apellidoValido && codigoValido && numeroCuerpoValido;
});

  
  confirmarIdentidad() {
    console.log('--- HIJO: Intentando emitir registroCompleto ---');
  if (!this.isFormValid()) {
    console.log('--- HIJO: Formulario no válido, abortando ---');
    return;
  }
    const datosVisitante = {
    nombre: `${this.nombre().trim()} ${this.apellido().trim()}`,
    prefijo: this.codigoArea(),
    numero: this.telefono()
  };

  this.registroCompleto.emit(datosVisitante);
}


  cancelar() {
    this.close.emit();
  }
}