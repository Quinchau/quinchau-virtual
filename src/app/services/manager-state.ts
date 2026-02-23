// src/app/services/manager-state.ts
import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { ManagerApis } from './manager-apis';
import { Transfer, TransferenciaDetalle, User, NewTransfer, ProductDetailData, DashboardResponse, HomeData } from '../models/transfer.model';
import { TransferButtonInfo, getTransferButtonInfo } from '../data/transfer-actions';
import { tap, catchError, of, throwError, finalize, map, fromEvent, merge, startWith, filter } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';


@Injectable({
  providedIn: 'root',
})
export class ManagerState {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public readonly productSearchTerm = toSignal(
  this.route.queryParams.pipe(map(params => params['q'] || '')),
  { initialValue: '' }
);

public readonly productIncludeStock = toSignal(
  this.route.queryParams.pipe(map(params => params['stock'] === 'true')),
  { initialValue: false }
);

public readonly productModelFilter = toSignal(
  this.route.queryParams.pipe(map(params => params['idmodelo'] || '')),
  { initialValue: '' }
);
public readonly productsResource = rxResource({
  params: () => ({
    query: this.productSearchTerm(),
    stock: this.productIncludeStock(),
    idmodelo: this.productModelFilter()
  }),
  stream: ({ params }) => {
    // Solo detenemos la petición si ambos están vacíos
    if (!params.query && !params.idmodelo) {
      return of([]);
    }

    return this.managerApis.getProducts(params.query, params.stock, params.idmodelo).pipe(
      catchError(err => {
        console.error('Error en el recurso:', err);
        return of([]);
      })
    );
  },
  defaultValue: []
});

  public readonly products = computed(() => this.productsResource.value() ?? []);
  public readonly newTransfer = signal<NewTransfer | null>(null);
  private platformId = inject(PLATFORM_ID);
  public readonly currentUser = signal<User | null>(null);
  public readonly userLocation = computed(() => this.currentUser()?.defaultlocation);
  private managerApis = inject(ManagerApis);
  private transfers = signal<Transfer[]>([]);
  public readonly envios = computed(() =>
    this.transfers().filter((t) => t.tipo === 'ship')
  );
  public readonly recepciones = computed(() =>
    this.transfers().filter((t) => t.tipo === 'rec')
  );
  private transferenciaDetalle = signal<TransferenciaDetalle | null>(null);
  public readonly transferenciaDetalle$ = this.transferenciaDetalle;
  public readonly transferButtonInfo$ = computed<TransferButtonInfo>(() => {
    const t = this.transferenciaDetalle$();
    if (!t) {
      return { label: '', action: null, disabled: true, nextStatus: null };
    }
    return getTransferButtonInfo(t);
  });
  public readonly currentProduct = signal<ProductDetailData | null>(null);
  public loadingProductDetail = signal<boolean>(false);
  public readonly loadingCreateTransfer = signal<boolean>(false);
  public readonly transferCompleted = signal<boolean>(false);
  public readonly newTransferType = signal<'ship' | 'rec' | null>(null);

  // --- HOME STATE ----

public readonly homeResource = rxResource<HomeData, unknown>({
  stream: () => this.managerApis.getHomeData().pipe(
    tap((response: any) => {
      
      if (!isPlatformBrowser(this.platformId)) return;
      
      if (response.identidad?.token && response.identidad?.tipo === 'visitante_nuevo') {
        console.log('🎯 Visitante NUEVO detectado - ID:', response.identidad.id);
        console.log('🎯 Token recibido:', response.identidad.token.substring(0, 20) + '...');
        
        const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
        document.cookie = `auth_token=${response.identidad.token}; Path=/; Max-Age=${thirtyDaysInSeconds}; SameSite=Lax; Secure`;
        
        // Verificar cookies DESPUÉS de implantar
        console.log('🍪 Cookies DESPUÉS de implantar:', document.cookie || '(vacías)');
        
        // También almacenar en sessionStorage como respaldo
        sessionStorage.setItem('auth_token', response.identidad.token);
      }
      
      // CASO 2: Visitante existente (token en response.identidad con tipo visitante)
      else if (response.identidad?.tipo === 'visitante') {
        console.log('👋 Visitante EXISTENTE - ID:', response.identidad.id);
      }
      
      // CASO 3: Usuario autenticado
      else if (response.identidad?.tipo === 'usuario') {
        console.log('👑 Usuario autenticado - ID:', response.identidad.id);
      }
      
      // CASO 4: No hay token en ninguna parte
      else {
        console.log('⚠️ NO SE ENCONTRÓ TOKEN en la respuesta');
        
      }
    }),
    map((response: any): HomeData => {
      // Construir objeto HomeData
      const homeData: HomeData = {
        banners: response.banners || [],
        modelos: response.modelos || [],
        identidad: response.identidad  // La identidad completa viene del backend
      };
      
      return homeData;
    }),
    catchError(err => {
      console.error('❌ Error cargando HomeData:', err);
      return of({ banners: [], modelos: [] } as HomeData);
    })
  ),
  defaultValue: { banners: [], modelos: [] } as HomeData
});

// Computed para acceder fácilmente al visitante
public readonly currentVisitante = computed(() => this.homeResource.value().visitante);


public readonly homeBanners = computed(() => this.homeResource.value().banners);
public readonly homeModelos = computed(() => this.homeResource.value().modelos);

public readonly modelosDestacados = computed(() => 
  this.homeModelos().filter(m => m.show_web === '1')
);

public readonly modelosSecundarios = computed(() => 
  this.homeModelos().filter(m => m.show_web === '0')
);

public readonly currentModel = computed(() => {
  const id = this.productModelFilter();
  if (!id) return null;

  // Intentamos buscar primero en destacados (lo más probable)
  let modelo = this.modelosDestacados().find(m => m.idmodelo === id);
  
  // Si no está ahí, buscamos en los secundarios
  if (!modelo) {
    modelo = this.modelosSecundarios().find(m => m.idmodelo === id);
  }

  return modelo || null;
});

 // --- GUEST USER ----

public guestId = rxResource<string | null, void>({
    stream: () => {
      // Si no estamos en navegador, retornamos observable de null
      if (!isPlatformBrowser(this.platformId)) {
        return of(null);
      }

      // Observable que emite el valor de la cookie cada vez que cambia
      return merge(
        fromEvent(document, 'visibilitychange'),
        fromEvent(window, 'focus'),
        fromEvent(window, 'storage')
      ).pipe(
        startWith(null), // Emisión inicial
        map(() => {
          const match = document.cookie.match(/guest_id=([^;]+)/);
          return match ? decodeURIComponent(match[1]) : null;
        })
      );
    },
    defaultValue: null
  });

  public guestIdSignal = this.guestId.value;

  // -- CARD PRODUCT --

public readonly productSlug = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        const urlTree = this.router.parseUrl(this.router.url);
        const segments = urlTree.root.children['primary']?.segments || [];
        const productoIndex = segments.findIndex(s => s.path === 'producto');
        
        if (productoIndex !== -1 && segments.length > productoIndex + 1) {
          return segments[productoIndex + 1].path;
        }
        return '';
      }),
    ),
    { initialValue: '' }
  );

public readonly productCardResource = rxResource({
  params: () => ({ slug: this.productSlug() }),
  stream: ({ params }) => {
    if (!params.slug) {
      return of(null);
    }
    return this.managerApis.getProductBySlug(params.slug).pipe(
      catchError(err => {
        console.error('❌ Error:', err);
        return of(null);
      })
    );
  },
  defaultValue: null
});

public readonly currentProductCard = this.productCardResource.value;
public readonly loadingProductCard = this.productCardResource.isLoading;
public readonly productCardError = this.productCardResource.error;
  constructor() {
    this.loadUserDataFromLocalStorage();
  }

public resetProductFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null, stock: null },
      queryParamsHandling: 'merge'
    });
  }
public searchProducts(term: string): void {
  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: { q: term || null },
    queryParamsHandling: 'merge'
  });
}

public toggleProductStock(include: boolean): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { stock: include ? 'true' : null },
      queryParamsHandling: 'merge'
    });
  }
private loadUserDataFromLocalStorage(): void {
  if (isPlatformBrowser(this.platformId)) {
    const savedData = localStorage.getItem('user_data');
    
    if (savedData) {
      try {
        const user: User = JSON.parse(savedData);
        
        // Verificamos que el objeto tenga las propiedades que necesitamos
        if (user && user.realname && user.defaultlocation) {
          this.currentUser.set(user);
        }
      } catch (error) {
        console.error('Error al parsear el usuario del localStorage', error);
        localStorage.removeItem('user_data'); // Limpiamos si hay datos corruptos
      }
    }
  }
}

public loadTransfers(): void {
  this.managerApis.getTransfers().subscribe({
    next: (response: DashboardResponse) => {
      // 1. Extraemos los datos según la nueva estructura del ng-state
      const transfers = response.transfers || [];
      const user = response.userData; // <--- Sincronizado con tu PHP

      // 2. Poblamos las Signals
      this.transfers.set(transfers);
      this.currentUser.set(user);

      // 3. Persistencia en navegador (solo si hay datos)
      if (user && isPlatformBrowser(this.platformId)) {
        localStorage.setItem('user_data', JSON.stringify(user));
      }
      
      //console.log('Estado actualizado con éxito:', { user, transfersCount: transfers.length });
    },
    error: (err) => {
      console.error('Error al hidratar el Dashboard:', err);
      this.transfers.set([]);
    }
  });
}

public loadTransferenciaDetalle(id: string): void {
    this.managerApis.getTransferenciaDetalle(id).subscribe({
      next: (data) => this.transferenciaDetalle.set(data),
      error: (err) => {
        console.error(`Error al cargar la transferencia ${id}`, err);
        this.transferenciaDetalle.set(null);
      },
    });
  }

  setUserData(data: User | null): void {
  // 1. Actualizamos el Signal (la reactividad del Header depende de esto)
  this.currentUser.set(data);
  
  if (isPlatformBrowser(this.platformId)) {
    if (data) {
      // Si hay datos, los guardamos
      localStorage.setItem('user_data', JSON.stringify(data));
    } else {
      // Si es null (logout), limpiamos el rastro
      localStorage.removeItem('user_data');
    }
  }
}

public updateTransferStatus(idtransfer: string, newStatus: string) {
  return this.managerApis.updateTransferStatus(idtransfer, newStatus).pipe(
    tap(() => {
      this.transfers.update(currentTransfers => {
        return currentTransfers.map(transfer => {
          if (transfer.idtransfer.toString() === idtransfer) {
            return { ...transfer, status: newStatus as Transfer['status'] };
          }
          return transfer;
        });
      });
      console.log('Estado de la transferencia actualizado localmente en la lista.');
    }),
  );
}

  public deleteTransfer(idtransfer: string) {
    return this.managerApis.deleteTransfer(idtransfer).pipe(
      tap(() => {
        this.transfers.update(currentTransfers => {
          return currentTransfers.filter(t => t.idtransfer !== Number(idtransfer));
        });
        console.log(`Transferencia ${idtransfer} eliminada del estado local.`);
      }),
      catchError(err => {
        console.error(`Error al eliminar la transferencia ${idtransfer}`, err);
        return throwError(() => new Error('No se pudo eliminar la transferencia.'));
      })
    );
  }

  public executeTransfer(idtransfer: string) {
    return this.managerApis.executeTransfer(idtransfer).pipe(
      tap(() => {
        this.transfers.update(currentTransfers => {
          return currentTransfers.filter(t => t.idtransfer.toString() !== idtransfer);
        });
        console.log(`Transferencia ${idtransfer} ejecutada y eliminada del estado local.`);
      }),
      catchError(err => {
        console.error(`Error al ejecutar la transferencia ${idtransfer}`, err);
        return throwError(() => new Error('No se pudo ejecutar la transferencia.'));
      })
    );
  }

  public loadProductDetail(stockid: string): void {
  // 1. Se activa la signal de carga al inicio del método
  this.loadingProductDetail.set(true);
  
  this.managerApis.getProductDetail(stockid).pipe(
   // 2. Finalize se ejecuta al completar o fallar
   finalize(() => this.loadingProductDetail.set(false))
  ).subscribe({
   next: (data) => {
    this.currentProduct.set(data);
   },
   error: (err) => {
    console.error('Error al cargar los productos', err);
    this.currentProduct.set(null);
   },
  });
 }
  
  public clearCurrentProduct(): void {
      this.currentProduct.set(null);
  }

  public setNewTransfer(transfer: NewTransfer): void {
    this.newTransfer.set(transfer);
  }

  public executeNewTransfer(): void {
  const transferData = this.newTransfer();

  if (transferData) {
    this.loadingCreateTransfer.set(true);

    this.managerApis.createTransfer(transferData).subscribe({
      next: (response) => {
        console.log('Transferencia creada exitosamente', response);
        this.loadingCreateTransfer.set(false);
        this.clearNewTransfer();
        this.currentProduct.set(null);
        this.transferCompleted.set(true); // ← Aquí se activa
      },
      error: (err) => {
        console.error('Error al crear la transferencia', err);
        this.loadingCreateTransfer.set(false);
      }
    });
  }
}

  public clearNewTransfer(): void {
  this.newTransfer.set(null);
 }

 public clearTransferCompleted(): void {
  this.transferCompleted.set(false);
}

 public setNewTransferType(type: 'ship' | 'rec'): void {
    this.newTransferType.set(type);
  } 

}