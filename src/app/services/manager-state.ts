// src/app/services/manager-state.ts
import { Injectable, inject, signal, computed, PLATFORM_ID, linkedSignal } from '@angular/core';
import { ManagerApis } from './manager-apis';
import { Transfer, TransferenciaDetalle, User, NewTransfer, ProductDetailData, DashboardResponse, HomeData, Visitante, Product, OutgoingMessage, SentStats } from '../models/transfer.model';
import { TransferButtonInfo, getTransferButtonInfo } from '../data/transfer-actions';
import { tap, catchError, of, throwError, finalize, map, fromEvent, merge, startWith, filter, Observable, switchMap, distinctUntilChanged } from 'rxjs';
import { isPlatformBrowser, Location } from '@angular/common';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { CartResponse } from '../models/cart-checkout.models';
import { RegisterRequest, RegisterResponse } from '../models/register-models';


type ActionStatus = 'idle' | 'loading' | 'success' | 'error';

@Injectable({
  providedIn: 'root',
})
export class ManagerState {
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
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
    if (!params.query && !params.idmodelo) {
      return of([]);
    }

    return this.managerApis.getProducts(params.query, params.stock, params.idmodelo).pipe(
      map(response => response.productos),
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
  public readonly identidad = signal<Visitante | null>(null);
  public readonly cartCount = signal(0);
  public waitlist = signal<string[]>([]);
  public readonly featuredProducts = computed(() =>
  this.homeResource.value().featured_products ?? []
);
  public readonly cartData = computed(() => 
  this.cartResource.value() ?? this.defaultCartResponse
);

  // --- COMPANY CONFIG --- //

public readonly currentCoyCode = signal<number>(1);
public readonly configResource = rxResource({
  params: () => ({ coy: this.currentCoyCode() }),
  stream: ({ params }) => {
    return this.managerApis.getCompanyConfig(params.coy).pipe(
      catchError(err => {
        console.error('❌ Error en configResource:', err);
        return of(null);
      })
    );
  }
});

public readonly company = computed(() => this.configResource.value() ?? null);
public readonly whatsappNumber = computed(() => this.company()?.telephone ?? '');
public readonly companyName = computed(() => this.company()?.coyname ?? 'Cargando...');
public readonly globalTaxRate = computed(() => this.company()?.taxrate ?? 0);

  // --- HOME STATE ----

public readonly homeResource = rxResource<HomeData, unknown>({
  stream: () => this.managerApis.getHomeData().pipe(
    map((response: any): HomeData => {
      // Normalizamos los modelos para asegurar que img_url exista y sea consistente
      const modelosNormalizados = (response.modelos || []).map((m: any) => ({
        ...m,
        // Priorizamos img_url, pero buscamos alternativas si el backend varía el nombre
        img_url: m.img_url || m.image_url || m.url_img || ''
      }));

      const homeData: HomeData = {
        banners:           response.banners    || [],
        modelos:           modelosNormalizados,
        categorias:        response.categorias || [],
        marcas:            response.marcas     || [],
        identidad:         response.identidad,
        featured_products: response.featured_products || []
      };

      // Efecto secundario: Actualizar contador de mensajes pendientes
      if (typeof response.pendingWhatsappCount === 'number') {
        this.pendingWhatsappCount.set(response.pendingWhatsappCount);
      }

      return homeData;
    }),
    catchError(err => {
      console.error('❌ Error cargando HomeData:', err);
      // Retornamos un objeto válido para evitar que el resource quede en estado de error total
      return of({ banners: [], modelos: [], categorias: [], marcas: [], featured_products: [] } as HomeData);
    })
  ),
  defaultValue: { banners: [], modelos: [], categorias: [], marcas: [], featured_products: [] } as HomeData
});

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
  let modelo = this.modelosDestacados().find(m => m.idmodelo === id);
  
  if (!modelo) {
    modelo = this.modelosSecundarios().find(m => m.idmodelo === id);
  }
  return modelo || null;
});

 // --- GUEST USER ----

public guestId = rxResource<string | null, void>({
    stream: () => {
      if (!isPlatformBrowser(this.platformId)) {
        return of(null);
      }

      return merge(
        fromEvent(document, 'visibilitychange'),
        fromEvent(window, 'focus'),
        fromEvent(window, 'storage')
      ).pipe(
        startWith(null),
        map(() => {
          const match = document.cookie.match(/guest_id=([^;]+)/);
          return match ? decodeURIComponent(match[1]) : null;
        })
      );
    },
    defaultValue: null
  });

  public guestIdSignal = this.guestId.value;

  // -- CART PRODUCT --

private manualSlugToLoad = signal<string>('');
private readonly _currentCartProduct = signal<any | null>(null);
public readonly currentCartProduct = this._currentCartProduct.asReadonly();
public loadProductRemotely(slug: string): void {
  this.manualSlugToLoad.set(slug);
}

public readonly productCardResource = rxResource({
  params: () => ({ slug: this.manualSlugToLoad() }),
  stream: ({ params }) => {
    if (!params.slug) {
      return of(null);
    }
    return this.managerApis.getProductBySlug(params.slug).pipe(
      tap(producto => {
        if (producto) this.currentProductCard.set(producto);
      }),
      catchError(() => of(null))
    );
  },
  defaultValue: null
});

public selectProductFromHome(product: Product): void {
  this.currentProductCard.set(product);
  
  const url = `/producto/${product.slug}`;
  history.pushState({ modal: true }, '', url);
}

public closeProductDetail(): void {
  this.currentProductCard.set(null);
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, '', '/home'); 
  }
}

public currentProductCard = signal<Product | null>(null);
public readonly loadingProductCard = this.productCardResource.isLoading;
public readonly productCardError = this.productCardResource.error;

// -- CART EDIT --

public setEditingProduct(product: any): void {
  this._currentCartProduct.set(product);
}

public clearCartSelection(): void {
  this._currentCartProduct.set(null);
}

public reloadCart(): void {
  // Esto dispara el rxResource del carrito automáticamente
  this.refreshCartTrigger.update(n => n + 1);
}

// -- ADD TO CART --

public addStatus = linkedSignal<string | undefined, ActionStatus>({
  source: () => this.currentProductCard()?.stockid,
  computation: () => 'idle'
});

public addCurrentProductToCart(registro?: any): Observable<any> {
  const p = this.currentProductCard();
  const currentTax = this.globalTaxRate(); // <--- Usamos el valor dinámico

  if (!p || p.qty_in_order < 1) {
    return throwError(() => new Error('No product or invalid quantity'));
  }

  this.addStatus.set('loading');
  
  const payload: any = {
    productos: [{
      stockid: p.stockid,
      cantidad: p.qty_in_order,
      precio: p.price_with_tax,
      taxrate: currentTax
    }],
    typeabbrev: "01"
  };
    if (registro) {
    payload.registro = registro;
  }

  return this.managerApis.addToCart(payload).pipe(
    switchMap((response) => {
      if (!response.exito) {
        this.addStatus.set('error');
        return throwError(() => ({
          requiere_registro: !!response.requiere_registro,
          mensaje: response.mensaje
        }));
      }

      this.addStatus.set('success');
      
  if (response.identidad?.token) {
  this.actualizarIdentidad(response.identidad.token, response.identidad);
}

      this.location.back();
      return of(response);
    }),
    catchError((err) => {
      this.addStatus.set('error');
      return throwError(() => err);
    })
  );
}

//---- CHECKOUT ----/ 

private readonly isCheckoutPath = toSignal(
  this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event: NavigationEnd) => {
      // Usamos el parseador oficial de Angular para limpiar la URL
      const urlTree = this.router.parseUrl(event.urlAfterRedirects);
      return urlTree.root.children['primary']?.segments[0]?.path === 'checkout';
    }),
    // distinctUntilChanged evita que la señal emita si el resultado sigue siendo 'true'
    distinctUntilChanged() 
  ),
  { initialValue: false }
);

public readonly cartResource = rxResource({
  params: () => ({
    onCheckout: this.isCheckoutPath(),
    refresh: this.refreshCartTrigger(),
    isBrowser: isPlatformBrowser(this.platformId)
  }),
  stream: ({ params }) => {
    if (!params.isBrowser) {
      return of(this.defaultCartResponse);
    }
    if (!params.onCheckout && params.refresh === 0) {
      return of(this.defaultCartResponse);
    }

    return this.managerApis.getCart().pipe(
      tap(response => {
        // Actualizamos el buffer solo cuando llega la respuesta real
        this._cartItems.set(response?.items ?? []);
      }),
      catchError(err => {
        console.error('Error recuperando carrito:', err);
        return of(this.defaultCartResponse);
      })
    );
  }
});

private readonly defaultCartResponse: CartResponse = {
    exito: false,
    cotizacion_id: 0,
    items: [],
    total: 0,
    cantidad_items: 0,
    identidad: null
  };

private _cartItems = signal<any[]>([]);
public readonly cartItems = this._cartItems.asReadonly();
public readonly cartTotal = computed(() => this.cartData()?.total ?? 0);
public readonly cartIsEmpty = computed(() => 
  !this.cartResource.isLoading() && this.cartItems().length === 0
);
public readonly cartIsLoading = this.cartResource.isLoading;
public readonly cartErrorMessage = computed(() => {
  return this.cartResource.error() ? 'No pudimos recuperar tu carrito.' : null;
});

public retryCartLoad(): void {
  this.cartResource.reload();
}
private refreshCartTrigger = signal(0);

public finishOrder() {
  const id = this.cartData().cotizacion_id;
  if (!id) return;

  return this.managerApis.executeCheckout(id).pipe(
    tap(res => {
      if (res.exito) {
        // Limpiamos el contador y disparamos el refresh para que el componente vea el carrito vacío
        this.cartCount.set(0); 
        this.refreshCartTrigger.update(n => n + 1);
        // Aquí podrías limpiar también datos temporales si fuera necesario
      }
    })
  );
}


//--- OTROS METODOS --- //

constructor() {
    this.loadUserDataFromLocalStorage();
  }

// --- IMPLANTAR TOKENS --- //

private actualizarIdentidad(token: string, identidad?: any) {
    if (!isPlatformBrowser(this.platformId)) return;
    const thirtyDays = 30 * 24 * 60 * 60;
    document.cookie = `auth_token=${token}; Path=/; Max-Age=${thirtyDays}; SameSite=Lax; Secure`;
}

public readonly currentProductInWaitlist = computed(() => {
  const stockid = this.currentProductCard()?.stockid;
  if (!stockid) return false;
  return this.waitlist().includes(stockid);
});

public setWaitlist(waitlist: string[]): void {
  if (!Array.isArray(waitlist)) return;

  this.waitlist.set(waitlist);
}

updateProductQuantity(newQuantity: number) {
  const currentProduct = this.currentProductCard();
  if (currentProduct) {
    this.currentProductCard.set({
      ...currentProduct,
      qty_in_order: newQuantity
    });
    }
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
        
        if (user && user.realname && user.defaultlocation) {
          this.currentUser.set(user);
        }
      } catch (error) {
        console.error('Error al parsear el usuario del localStorage', error);
        localStorage.removeItem('user_data');
      }
    }
  }
}

public loadTransfers(): void {
  this.managerApis.getTransfers().subscribe({
    next: (response: DashboardResponse) => {
      const transfers = response.transfers || [];
      const user = response.userData;
      this.transfers.set(transfers);
      this.currentUser.set(user);

      if (user && isPlatformBrowser(this.platformId)) {
        localStorage.setItem('user_data', JSON.stringify(user));
      }
      
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
  this.currentUser.set(data);
  
  if (isPlatformBrowser(this.platformId)) {
    if (data) {
      localStorage.setItem('user_data', JSON.stringify(data));
    } else {
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
  this.loadingProductDetail.set(true);
  
  this.managerApis.getProductDetail(stockid).pipe(
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
        this.transferCompleted.set(true);
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

public executeRegister(requestData: RegisterRequest): Observable<RegisterResponse> {
  return this.managerApis.registerUser(requestData).pipe(
    tap((res: RegisterResponse) => {
      // SI LA RESPUESTA ES EXITOSA:
      if (res.status === 'Success' && res.auth_token) {
        
        this.actualizarIdentidad(res.auth_token, res.user);

         if (res.user) {
          const userForState: User = {
          realname: res.user.name,
          defaultlocation: '', 
          fullaccess: res.user.access
        };
          this.setUserData(userForState);
        }

      }
    }),
    // 5. Manejo de errores para que el componente pueda reaccionar
    catchError((err) => {
      console.error('❌ Error en el proceso de registro:', err);
      return throwError(() => err);
    })
  );
}
updateCartCount(count: number): void {
    // Solo actualizamos si el valor es distinto para evitar ciclos de renderizado
    if (this.cartCount() !== count) {
      this.cartCount.set(count);
    }
  }

  public subscribeToWaitlist(stockid: string): Observable<any> {
  return this.managerApis.subscribeToProduct(stockid).pipe(
    tap(res => {
      if (res.exito && res.identidad?.waitlist) {
        this.setWaitlist(res.identidad.waitlist);
      }
    })
  );
}

// --- WHATSAPP MANUAL ---

public readonly pendingWhatsappCount = signal<number>(0);
public readonly sentStats            = signal<SentStats>({ today: 0, yesterday: 0, week: 0 });
public readonly sentTodayCount       = computed(() => this.sentStats().today);
public readonly pendingMessages      = signal<OutgoingMessage[]>([]);
public readonly whatsappIsLoading    = signal<boolean>(false);

public loadWhatsapp(): void {
  if (this.currentUser()?.fullaccess !== 8) return;
  this.whatsappIsLoading.set(true);

  this.managerApis.getPendingMessages().pipe(
    tap(res => {
      this.pendingWhatsappCount.set(res.total);
      this.sentStats.set(res.stats ?? { today: 0, yesterday: 0, week: 0 });
    }),
    map(res => res.messages),
    catchError(err => {
      console.error('❌ Error cargando mensajes WhatsApp:', err);
      return of([]);
    }),
    finalize(() => this.whatsappIsLoading.set(false))
  ).subscribe(messages => this.pendingMessages.set(messages));
}

public reloadWhatsapp(): void {
  this.loadWhatsapp();
}

public lockMessage(id: number): Observable<any> {
  return this.managerApis.lockMessage(id).pipe(
    tap(() => {
      this.pendingMessages.update(messages =>
        messages.map(m => m.id === id ? { ...m, status: 'wait' as const } : m)
      );
    }),
    catchError(err => {
      console.error('❌ Error al reservar mensaje:', err);
      return throwError(() => err);
    })
  );
}

public markMessageSent(id: number): Observable<any> {
  return this.managerApis.markMessageSent(id).pipe(
    tap(() => {
      this.pendingMessages.update(messages =>
        messages.filter(m => m.id !== id)
      );
      this.pendingWhatsappCount.update(n => Math.max(0, n - 1));
      this.sentStats.update(s => ({ ...s, today: s.today + 1 }));
    }),
    catchError(err => {
      console.error('❌ Error al marcar mensaje como enviado:', err);
      return throwError(() => err);
    })
  );
}

}