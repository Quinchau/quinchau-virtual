import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerApis } from '../../services/manager-apis';

@Component({
  selector: 'app-product-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-picker.html',
})
export class ProductPicker {
  private apis = inject(ManagerApis);

  // Output: emite el producto seleccionado
  public productSelected = output<any>();

  // Estado
  readonly searchTerm = signal('');
  readonly searchResults = signal<any[]>([]);
  readonly isLoading = signal(false);
  readonly searchError = signal('');
  readonly onlyStock = signal(true);

  // Computed: productos filtrados por stock
  readonly filteredResults = computed(() => {
    const results = this.searchResults();
    if (this.onlyStock()) {
      return results.filter(p => p.total_quantity > 0);
    }
    return results;
  });

  /**
   * Realiza la búsqueda de productos usando getProducts()
   * Sin modificar la URL, sin navegación
   */
  onSearch(): void {
    const term = this.searchTerm().trim();
    if (term.length < 2) {
      this.searchError.set('Ingrese al menos 2 caracteres para buscar.');
      return;
    }

    this.isLoading.set(true);
    this.searchError.set('');
    this.searchResults.set([]);

    this.apis.getProducts(term, this.onlyStock(), '').subscribe({
      next: (res) => {
        this.isLoading.set(false);
        
        if (!res.productos || res.productos.length === 0) {
          this.searchError.set(`No se encontraron productos para "${term}".`);
          return;
        }
        
        this.searchResults.set(res.productos);
      },
      error: () => {
        this.isLoading.set(false);
        this.searchError.set('Error al buscar productos. Intente de nuevo.');
      }
    });
  }

  /**
   * Busca al presionar Enter
   */
  onSearchEnter(event: Event): void {
    event.preventDefault();
    this.onSearch();
  }

  /**
   * Limpia la búsqueda
   */
  clearSearch(): void {
    this.searchTerm.set('');
    this.searchResults.set([]);
    this.searchError.set('');
  }

  /**
   * Selecciona un producto y lo emite al padre
   */
  selectProduct(product: any): void {
    this.productSelected.emit(product);
  }

  /**
   * Alterna el filtro de solo stock disponible
   */
  toggleOnlyStock(): void {
    this.onlyStock.update(v => !v);
    // Si ya hay resultados, volver a buscar con el nuevo filtro
    if (this.searchResults().length > 0) {
      this.onSearch();
    }
  }
}