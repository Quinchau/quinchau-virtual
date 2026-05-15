// src/app/pages/home/home.ts

import { Component, inject, effect, PLATFORM_ID, signal, computed, input, output } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ManagerState } from '../../services/manager-state';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProductOrder } from '../product-order/product-order';
import { toSignal } from '@angular/core/rxjs-interop';
import { Modelo, MarcaBackend, CategoriaBackend } from '../../models/transfer.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
})
export class Home {
  // Inyección de dependencias
  public managerState = inject(ManagerState);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /**
   * Modo de operación del componente:
   * - 'catalog' (default): comportamiento normal, navega al detalle del producto.
   * - 'picker': al seleccionar un producto lo emite via `productSelected` sin navegar.
   */
  public mode = input<'catalog' | 'picker'>('catalog');

  /**
   * Emite el producto seleccionado cuando mode === 'picker'.
   * El padre (InvoicePage) escucha este evento para recibir el stkcode.
   */
  public productSelected = output<any>();

  // --- Signals de Estado de Ruta (Fuente de Verdad) ---

  // Convertimos los queryParams en una Signal para que todo el componente reaccione a la URL
  private queryParams = toSignal(this.route.queryParams);

  public selectedProductId = computed(() => 
  this.managerState.currentProductCard()?.stockid ?? null
  );

  // Estado del filtro de stock obtenido directamente de la URL
  public onlyStock = computed(() => this.queryParams()?.['stock'] === 'true');

  // UI State local
  public mostrarCopiado = signal(false);

  constructor() {
    /**
     * Sincronización Técnica:
     * Si entramos por una ruta con slug (ej: /modelo/frenos-123),
     * extraemos el ID y lo ponemos en la URL como queryParam para que el servicio cargue los datos.
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
          replaceUrl: true
        });
      }
    });
  }

  public handleProductSelection(producto: any): void {
  if (!producto?.stockid) return;

  if (this.mode() === 'picker') {
    this.productSelected.emit(producto);
    return;
  }

  this.managerState.currentProductCard.set({
    ...producto,
    qty_in_order: producto.qty_in_order ?? 1,
  });
}

  public closeProduct(): void {
  this.managerState.closeProductDetail();
}

  public filteredProducts = computed(() => {
    const list = this.managerState.products() || [];
    return this.onlyStock() ? list.filter(p => p.total_quantity > 0) : list;
  });

  /**
   * Cambia el estado del filtro de stock navegando, manteniendo la coherencia con la URL.
   */
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