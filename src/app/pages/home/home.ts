// src/app/pages/home/home.ts

import { Component, inject, effect, PLATFORM_ID, signal, computed, input, output } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ManagerState } from '../../services/manager-state';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
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

  public mode = input<'catalog' | 'picker'>('catalog');
  public productSelected = output<any>();
  private queryParams = toSignal(this.route.queryParams);

  public onlyStock = computed(() => this.queryParams()?.['stock'] === 'true');

  public mostrarCopiado = signal(false);

  public handleProductSelection(producto: any): void {
  if (!producto?.stockid) return;

  if (this.mode() === 'picker') {
    this.productSelected.emit(producto);
    return;
  }

  this.router.navigate(['/producto', producto.stockid, this.slugify(producto.description)]);
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