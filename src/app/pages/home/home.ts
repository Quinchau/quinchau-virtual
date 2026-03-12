import { Component, inject, effect, PLATFORM_ID, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SearchBox } from '../../components/search-box/search-box';
import { ManagerState } from '../../services/manager-state';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProductOrder } from '../product-order/product-order';
import { LayerHistoryService } from '../../services/LayerHistoryService';
import { Modelo, MarcaBackend, CategoriaBackend} from '../../models/transfer.model';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SearchBox, RouterLink, ProductOrder],
  templateUrl: './home.html',
})
export class Home {
  // Inyecciones
  public managerState = inject(ManagerState);
  public navService = inject(LayerHistoryService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private currentPath = signal('');
  public mostrarCopiado = signal(false);

constructor() {
  effect(() => {
  const modeloSlug = this.route.snapshot.paramMap.get('modelo');
  if (!modeloSlug) return;

  const home = this.managerState.homeResource.value();
  if (!home) return;

  const modelos = home.modelos;
  if (!modelos) return;

  // Extraer idmodelo desde el slug: "bws100-8" → "8"
  const idmodelo = modeloSlug.split('-').pop();
  if (!idmodelo) return;

  const modelo = modelos.find(m => m.idmodelo === idmodelo);
  if (!modelo) return;

  // 🔥 Aquí está la magia:
  // Activamos el filtro de productos usando query params
  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: { idmodelo },
    queryParamsHandling: 'merge'
  });
});

}

onlyStock = signal(false);

toggleOnlyStock() {
  const newValue = !this.onlyStock();
  this.onlyStock.set(newValue);

  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: { stock: newValue ? 'true' : null },
    queryParamsHandling: 'merge'
  });
}

filteredProducts = computed(() => {
  const list = this.managerState.products() || [];
  return this.onlyStock()
    ? list.filter(p => p.total_quantity > 0)
    : list;
});

public handleProductSelection(producto: any, event: Event): void {
  event.preventDefault();
  
  // ============================================
  // VALIDACIÓN 1: ¿El producto es válido?
  // ============================================
  if (!producto || !producto.stockid) {
    console.error('❌ Producto inválido:', producto);
    return;
  }

  console.log('🔵 [1] Iniciando selección de producto:', {
    stockid: producto.stockid,
    descripcion: producto.description,
    timestamp: Date.now()
  });

  // ============================================
  // VALIDACIÓN 2: Guardar respaldo por si la señal falla
  // ============================================
  if (isPlatformBrowser(this.platformId)) {
    sessionStorage.setItem('last_selected_product', JSON.stringify({
      producto,
      timestamp: Date.now()
    }));
  }

  // ============================================
  // ACCIÓN 1: Limpiar estado previo y setear nuevo producto
  // ============================================
  // Nota: No necesitas limpiar explícitamente porque setear uno nuevo
  // ya reemplaza el valor anterior en la señal
  this.managerState.currentProductCard.set(producto);
  
  // Verificación inmediata
  console.log('🔵 [2] Producto seteado en signal:', {
    signalActual: this.managerState.currentProductCard()?.stockid,
    coincide: this.managerState.currentProductCard()?.stockid === producto.stockid
  });

  // ============================================
  // ACCIÓN 2: Crear slug y actualizar URL/capa
  // ============================================
  const slug = this.slugify(`${producto.description}--${producto.stockid}`);
  
  console.log('🔵 [3] Push a LayerHistoryService:', {
    capa: 'producto',
    slug: slug,
    url: `/producto/${slug}`
  });
  
this.navService.push('producto');

  // ============================================
  // VERIFICACIÓN 3: Doble chequeo después del push
  // ============================================
  setTimeout(() => {
    const estadoFinal = this.managerState.currentProductCard();
    console.log('🔵 [4] Verificación post-push:', {
      productoPresente: !!estadoFinal,
      stockid: estadoFinal?.stockid,
      capaActual: this.navService.currentLayer()
    });

    // Si por alguna razón se perdió el producto, restaurarlo
    if (!estadoFinal || estadoFinal.stockid !== producto.stockid) {
      console.warn('⚠️ Producto perdido después del push, restaurando...');
      this.managerState.currentProductCard.set(producto);
    }
  }, 0);
}

copiarUrl() {
  if (typeof window === 'undefined') return;

  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    this.mostrarCopiado.set(true);
    setTimeout(() => this.mostrarCopiado.set(false), 1500);
  });
}

public slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

public getCategoriaDeModelo(modelo: Modelo): CategoriaBackend | null {
  const categorias = this.managerState.homeResource.value()?.categorias as CategoriaBackend[];
  if (!categorias) return null;

  const marcaSlug = this.slugify(modelo.marcadescrip);

  return categorias.find(cat =>
    cat.marcas?.some((m: MarcaBackend) => m.slug === marcaSlug)
  ) || null;
}

public getMarcaDeModelo(modelo: Modelo): MarcaBackend | null {
  const categoria = this.getCategoriaDeModelo(modelo);
  if (!categoria) return null;

  const marcaSlug = this.slugify(modelo.marcadescrip);

  return categoria.marcas.find((m: MarcaBackend) => m.slug === marcaSlug) || null;
}


  public clearSearch(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null },
      queryParamsHandling: 'merge'
    });
  }
}