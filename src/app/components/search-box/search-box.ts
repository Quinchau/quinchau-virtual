import { Component, inject, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router'; // Inyectamos navegación
import { ManagerState } from '../../services/manager-state';

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-box.html',
})
export class SearchBox {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public managerState = inject(ManagerState);

  // Solución: linkedSignal sincronizado con el State (que a su vez viene de la URL)
  public localQuery = linkedSignal(() => this.managerState.productSearchTerm());

  public onSearch(): void {
    const query = this.localQuery().trim();
    
    // Navegamos actualizando la URL. Esto disparará todo el flujo reactivo.
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: query || null },
      queryParamsHandling: 'merge'
    });
  }

  public clearSearch(): void {
    // Al navegar a null, Angular elimina el parámetro 'q' de la URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null },
      queryParamsHandling: 'merge'
    });
  }

  // Justificación: Eliminamos ngOnInit. El componente ahora es "declarativo":
  // describe cómo se vincula el input con el estado, no cómo se inicializa.
}