import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class LayerHistoryService {
  private platformId = inject(PLATFORM_ID);

  // Justificación: Usamos una Signal para el Array completo. 
  // Esto permite que los componentes observen toda la "torre" de navegación.
  private layerStack = signal<string[]>(['home']);

  // Justificación: Un Computed derivado para saber siempre cuál es la punta.
  public currentLayer = computed(() => {
    const stack = this.layerStack();
    return stack[stack.length - 1] || 'home';
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('popstate', (event) => {
        // Justificación: El historial del navegador manda. 
        // Si el usuario da atrás, sincronizamos nuestra pila con el estado guardado.
        const restoredStack = event.state?.stack || ['home'];
        this.layerStack.set(restoredStack);
        
        console.log('📦 Popstate: Pila sincronizada', restoredStack);
      });
    }
  }

  push(name: string, url?: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    this.layerStack.update(stack => {
      const newStack = [...stack, name];
      
      // Justificación: Guardamos la "foto" de la pila completa en el history.state.
      // Así, al volver, el navegador nos devuelve el array exacto que había.
      window.history.pushState(
        { stack: newStack }, 
        '', 
        url || window.location.href
      );
      
      return newStack;
    });
  }

  back() {
    if (isPlatformBrowser(this.platformId)) {
      window.history.back();
    }
  }

  // Justificación: Utilidad para que el Home sepa si debe mantener vivo un componente.
  public isLayerPresent(name: string): boolean {
    return this.layerStack().includes(name);
  }
}