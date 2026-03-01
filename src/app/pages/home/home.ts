import { Component, inject, effect, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SearchBox } from '../../components/search-box/search-box';
import { ManagerState } from '../../services/manager-state';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProductOrder } from '../product-order/product-order';
import { LayerHistoryService } from '../../services/LayerHistoryService';


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

constructor() {
  effect(() => {
    // Justificación: En lugar de mirar la "punta" de la pila (currentLayer),
    // miramos si la capa 'producto' todavía EXISTE en la torre.
    const estaProductoEnPila = this.navService.isLayerPresent('producto');
    const tieneProductoCargado = !!this.managerState.currentProductCard();

    // Justificación: Solo limpiamos si el estado dice que hay producto
    // pero la navegación dice que ya no debería estar ahí.
    if (!estaProductoEnPila && tieneProductoCargado) {
      console.log('🏠 Limpieza final: El producto ya no está en la pila');
      this.managerState.currentProductCard.set(null);
    }
  });
}

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

/**
 * Versión mejorada del slugify con manejo de errores
 */
private slugify(text: string): string {
  if (!text) return 'producto';
  
  try {
    return text.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
      .replace(/[^a-z0-9\s-]/g, "")    // Solo caracteres válidos
      .trim()
      .replace(/\s+/g, '-')             // Espacios a guiones
      .substring(0, 100);               // Limitar longitud
  } catch (error) {
    console.error('Error en slugify:', error);
    return 'producto-' + Date.now();
  }
}

  public clearSearch(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null },
      queryParamsHandling: 'merge'
    });
  }
}