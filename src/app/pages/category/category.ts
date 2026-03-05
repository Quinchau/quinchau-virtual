import { Component, computed, inject, linkedSignal, signal } from '@angular/core';

import { CategoriaNavegacion } from '../../models/transfer.model';
import { RouterLink } from '@angular/router';
import { ManagerState } from '../../services/manager-state';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './category.html',
})


export class Category {
  private state = inject(ManagerState);

  categorias = computed(() => this.state.homeResource.value()?.categorias || []);

  categoriaSeleccionada = linkedSignal({
    source: this.categorias,
    computation: (listaActual: CategoriaNavegacion[], anterior?: { value: CategoriaNavegacion | null }) => {
      return listaActual.length > 0 ? (anterior?.value ?? listaActual[0]) : null;
    }
  });

  subcategoriasActuales = computed(() => this.categoriaSeleccionada()?.marcas || []);

  seleccionarCategoria(cat: CategoriaNavegacion) {
    this.categoriaSeleccionada.set(cat);
  }
}