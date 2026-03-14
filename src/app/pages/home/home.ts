import { Component, inject, effect, PLATFORM_ID, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SearchBox } from '../../components/search-box/search-box';
import { ManagerState } from '../../services/manager-state';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProductOrder } from '../product-order/product-order';
import { toSignal } from '@angular/core/rxjs-interop';
import { Modelo, MarcaBackend, CategoriaBackend } from '../../models/transfer.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SearchBox, RouterLink, ProductOrder],
  templateUrl: './home.html',
})
export class Home {
  // Inyección de dependencias
  public managerState = inject(ManagerState);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // --- Signals de Estado de Ruta ---
  
  // Fuente de verdad: Los parámetros de la URL convertidos a Signal reactiva
  private queryParams = toSignal(this.route.queryParams);
  
  // Detecta el producto seleccionado (parámetro 'p') para activar el @if en el HTML
  public selectedProductId = computed(() => this.queryParams()?.['p']);
  
  // Detecta el filtro de stock (parámetro 'stock')
  public onlyStock = computed(() => this.queryParams()?.['stock'] === 'true');

  // UI State
  public mostrarCopiado = signal(false);

  constructor() {
    /**
     * Lógica de Sincronización:
     * Si la URL amigable trae un slug de modelo, extraemos el ID y lo 
     * inyectamos en los queryParams para que el ManagerState sepa qué cargar.
     */
    effect(() => {
      const modeloSlug = this.route.snapshot.paramMap.get('modelo');
      if (!modeloSlug) return;

      const idFromSlug = modeloSlug.split('-').pop();
      const currentIdParam = this.queryParams()?.['idmodelo'];

      if (idFromSlug && currentIdParam !== idFromSlug) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { idmodelo: idFromSlug },
          queryParamsHandling: 'merge',
          replaceUrl: true // Evitamos ensuciar el historial en esta sincronización técnica
        });
      }
    });
  }

  // --- Gestión de Navegación de Productos ---

  /**
   * Al seleccionar un producto, "empujamos" el ID a la URL.
   * Esto dispara el @if en el HTML y abre el ProductOrder.
   */
  public handleProductSelection(producto: any): void {
    if (!producto?.stockid) return;
    
    // Guardamos en el estado global para disponibilidad inmediata en el modal
    this.managerState.currentProductCard.set(producto);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { p: producto.stockid },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Limpia el parámetro 'p'. Al ser null, el @if del HTML se destruye
   * y el componente ProductOrder se remueve de la memoria.
   */
  public closeProduct(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { p: null },
      queryParamsHandling: 'merge'
    });
  }

  // --- Lógica de Filtros ---

  /**
   * Filtra los productos de la lista basándose en la Signal 'onlyStock'.
   * Es computada, por lo que se recalcula sola si cambia el parámetro en la URL.
   */
  public filteredProducts = computed(() => {
    const list = this.managerState.products() || [];
    return this.onlyStock() ? list.filter(p => p.total_quantity > 0) : list;
  });

  public toggleOnlyStock(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { stock: this.onlyStock() ? null : 'true' },
      queryParamsHandling: 'merge'
    });
  }

  // --- Helpers y Utilidades ---

  public getCategoriaDeModelo(modelo: Modelo): CategoriaBackend | null {
    const categorias = this.managerState.homeResource.value()?.categorias as CategoriaBackend[];
    if (!categorias) return null;
    const marcaSlug = this.slugify(modelo.marcadescrip);
    return categorias.find(cat => cat.marcas?.some((m: MarcaBackend) => m.slug === marcaSlug)) || null;
  }

  public getMarcaDeModelo(modelo: Modelo): MarcaBackend | null {
    const categoria = this.getCategoriaDeModelo(modelo);
    if (!categoria) return null;
    const marcaSlug = this.slugify(modelo.marcadescrip);
    return categoria.marcas.find((m: MarcaBackend) => m.slug === marcaSlug) || null;
  }

  public slugify(text: string): string {
    return text.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  public copiarUrl(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.mostrarCopiado.set(true);
      setTimeout(() => this.mostrarCopiado.set(false), 1500);
    });
  }
}