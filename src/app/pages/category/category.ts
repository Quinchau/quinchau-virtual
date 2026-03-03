import { Component, signal, linkedSignal } from '@angular/core';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [],
  templateUrl: './category.html',
  styles: ``
})
export class Category {
  // Lista de categorías (en un escenario real vendría de un servicio)
  categorias = signal(['Electrónica', 'Hogar', 'Moda', 'Deportes']);
  
  // Signal para la categoría seleccionada
  categoriaSeleccionada = signal<string>(this.categorias()[0]);

  // LinkedSignal: Si la lista de categorías cambia, reseteamos la selección a la primera
  subcategoriasActuales = linkedSignal({
    source: this.categoriaSeleccionada,
    computation: (cat) => {
      // Lógica de ejemplo: simula obtener subcategorías basadas en la selección
      return [`Sub 1 de ${cat}`, `Sub 2 de ${cat}`, `Sub 3 de ${cat}`, `Sub 4 de ${cat}`, `Sub 5 de ${cat}`, `Sub 6 de ${cat}`, `Sub 7 de ${cat}`, `Sub 8 de ${cat}`, `Sub 9 de ${cat}`, `Sub 10 de ${cat}`, `Sub 11 de ${cat}`, `Sub 12 de ${cat}`];
    }
  });

  seleccionarCategoria(cat: string) {
    this.categoriaSeleccionada.set(cat);
  }
}