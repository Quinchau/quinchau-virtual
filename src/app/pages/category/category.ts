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
  marcaSeleccionada = signal<any | null>(null);

  modelosActuales = computed(() => {
  const marca = this.marcaSeleccionada();
  return marca ? marca.modelos : [];
});

seleccionarCategoria(cat: CategoriaNavegacion) {
  this.categoriaSeleccionada.set(cat);
  this.marcaSeleccionada.set(null); // reset al cambiar categoría
}

seleccionarMarca(marca: any) {
  console.log("🟦 Marca seleccionada:", marca);
  this.marcaSeleccionada.set(marca);
}

  categorias = computed(() => {
    const cats = this.state.homeResource.value()?.categorias || [];
    console.log('📦 Categorías recibidas:', cats);
    return cats;
  });

  categoriaSeleccionada = linkedSignal({
    source: this.categorias,
    computation: (listaActual: CategoriaNavegacion[], anterior?: { value: CategoriaNavegacion | null }) => {
      const seleccionada = listaActual.length > 0 ? (anterior?.value ?? listaActual[0]) : null;
      console.log('➡️ Categoría seleccionada:', seleccionada);
      return seleccionada;
    }
  });

  subcategoriasActuales = computed(() => {
    const marcas = this.categoriaSeleccionada()?.marcas || [];
    console.log('🏷️ Marcas de la categoría actual:', marcas);
    return marcas;
  });

 limpiarUrl(url: string): string {
    console.log('🔍 URL SEO original:', url);

    if (!url) return '';

    // quitar slash inicial
    if (url.startsWith('/')) {
      url = url.slice(1);
    }

    // quitar prefijo category/
    if (url.startsWith('category/')) {
      url = url.replace('category/', '');
    }

    console.log('✨ URL SEO limpia:', url);
    return url;
  }
}
