# Project Structure

```
public/
  icons/
    icon-72x72.png
    icon-96x96.png
    icon-128x128.png
    icon-144x144.png
    icon-152x152.png
    icon-192x192.png
    icon-384x384.png
    icon-512x512.png
  favicon.ico
  googleca0fa02352c61ccd.html
  manifest.webmanifest
src/
  app/
    app/
    components/
      header/
        header.html
        header.ts
      search-box/
        search-box.html
        search-box.ts
      success-order/
        success-order.html
        success-order.ts
      whatsapp-button/
        whatsapp-button.html
        whatsapp-button.ts
    data/
      transfer-actions.ts
    guards/
      admin.guard.ts
      auth-guard.ts
    models/
      cart-checkout.models.ts
      transfer.model.ts
    pages/
      category/
        category.html
        category.ts
      checkout/
        checkout.html
        checkout.ts
      dashboard/
        dashboard.html
        dashboard.ts
      exe-order/
        exe-order.html
        exe-order.ts
      home/
        home.html
        home.ts
      login/
        login.html
        login.ts
      newtransfer/
        newtransfer.html
        newtransfer.ts
      product-detail/
        product-detail.html
        product-detail.ts
      product-order/
        product-order.html
        product-order.ts
      transfer-detail/
        transfer-detail.html
        transfer-detail.ts
      transfers/
        transfers.html
        transfers.ts
    services/
      auth.interceptor.ts
      auth.ts
      LayerHistoryService.ts
      manager-apis.ts
      manager-state.ts
      search.service.ts
      ssr-identity.interceptor.ts
    app.config.server.ts
    app.config.ts
    app.css
    app.html
    app.routes.server.ts
    app.routes.ts
    app.ts
  environments/
    environment.prod.ts
    environment.ts
  index.html
  main.server.ts
  main.ts
  server.ts
  styles.css
.editorconfig
.gitignore
.nvmrc
angular.json
datos.md
endpoints.md
export.md
ngsw-config.json
package-lock.json
package.json
postcss.config.js
README.md
tailwind.config.js
tsconfig.app.json
tsconfig.json
tsconfig.spec.json
```



# Selected Files Content

## src/app/components/whatsapp-button/whatsapp-button.html

```html
<a 
  [href]="whatsappUrl()" 
  target="_blank" 
  rel="noopener noreferrer"
  class="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] rounded-full shadow-2xl transition-transform duration-300 hover:scale-110 active:scale-95"
  aria-label="Contactar por WhatsApp"
>
  <svg 
    class="w-8 h-8 text-white fill-current" 
    viewBox="0 0 24 24"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.634 1.432h.006c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
</a>
```

## src/app/components/whatsapp-button/whatsapp-button.ts

```ts
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-whatsapp-button',
  // No necesitamos imports aquí si solo usamos HTML estándar y signals
  templateUrl: './whatsapp-button.html',
})
export class WhatsappButton {
  // Inputs requeridos siguiendo tu flujo de aprendizaje
  phoneNumber = input.required<string>();
  message = input<string>('Hola! Me gustaría realizar una consulta.');

  // Signal computada para la URL
  whatsappUrl = computed(() => {
    const url = 'https://wa.me/';
    return `${url}${this.phoneNumber()}?text=${encodeURIComponent(this.message())}`;
  });
}
```

## src/app/services/manager-apis.ts

```ts
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  NewTransfer, Product, TransferenciaDetalle, 
  ProductDetailData, DashboardResponse, Banner, 
  HomeData,
  ProductListResponse
} from '../models/transfer.model';
import { isPlatformServer } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ManagerApis {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private get baseUrl() { return isPlatformServer(this.platformId) ? environment.apiUrlServer : environment.apiUrlBrowser; }

  public getTransfers(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.baseUrl}/transfers.php`, {
      withCredentials: true
    });
  }

  public getTransferenciaDetalle(id: string): Observable<TransferenciaDetalle> {
    return this.http.get<TransferenciaDetalle>(`${this.baseUrl}/transfer-detail.php`, {
      params: new HttpParams().set('id', id)
    });
  }

  public updateTransferStatus(idtransfer: string, newStatus: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/transfer-status.php`, { idtransfer, newStatus });
  }

  public deleteTransfer(idtransfer: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/transfer-status.php`, {
      params: new HttpParams().set('idtransfer', idtransfer)
    });
  }

  public executeTransfer(idtransfer: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/transfer-exec.php`, { idtransfer });
  }

  public createTransfer(transferData: NewTransfer): Observable<any> {
    return this.http.post(`${this.baseUrl}/create-transfer.php`, transferData);
  }

  // --- MÉTODOS DE PRODUCTOS ---

public getProducts(
  searchTerm: string = '', 
  includeStock: boolean = false, 
  idmodelo: string = ''
): Observable<{productos: Product[], identidad?: any}> {  // ← Tipo modificado
  let params = new HttpParams();

  if (searchTerm) params = params.set('search', searchTerm);
  if (includeStock) params = params.set('stock', '1');
  if (idmodelo) params = params.set('idmodelo', idmodelo);

  return this.http.get<ProductListResponse>(`${this.baseUrl}/get-products.php`, { params }).pipe(
    map(res => ({
      productos: res?.productos ?? [],
      identidad: res?.identidad
    })),
    catchError(error => {
      console.error('Error recuperando productos:', error);
      return of({ productos: [], identidad: null });
    })
  );
}

  public getProductDetail(stockid: string): Observable<ProductDetailData> {
    return this.http.get<ProductDetailData>(`${this.baseUrl}/product-detail.php`, {
      params: new HttpParams().set('stockid', stockid)
    });
  }

  public getHomeData(): Observable<HomeData> {
  return this.http.get<HomeData>(`${this.baseUrl}/get_home_data.php`);

}


getProductBySlug(slug: string): Observable<Product> {
  return this.http.get<Product>(`${this.baseUrl}/get-products.php?slug=${slug}`);
}

public addToCart(orderData: { productos: any[], typeabbrev: string }): Observable<any> {
  return this.http.post(`${this.baseUrl}/create_order.php`, orderData, {
    withCredentials: true // Importante si usas cookies de sesión
  });
}

getCart(): Observable<any> {
  return this.http.get(`${this.baseUrl}/checkout.php`, {
    withCredentials: true
  });
}

//---CHECKOUT---//

public executeCheckout(cotizacion_id: number): Observable<any> {
  return this.http.post(`${this.baseUrl}/exe-checkout.php`, { cotizacion_id }, {
    withCredentials: true
  });
}


}
```

## src/app/services/manager-state.ts

```ts
// src/app/services/manager-state.ts
import { Injectable, inject, signal, computed, PLATFORM_ID, linkedSignal } from '@angular/core';
import { ManagerApis } from './manager-apis';
import { Transfer, TransferenciaDetalle, User, NewTransfer, ProductDetailData, DashboardResponse, HomeData, Visitante, Product } from '../models/transfer.model';
import { TransferButtonInfo, getTransferButtonInfo } from '../data/transfer-actions';
import { tap, catchError, of, throwError, finalize, map, fromEvent, merge, startWith, filter, Observable, switchMap } from 'rxjs';
import { isPlatformBrowser, Location } from '@angular/common';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { CartResponse } from '../models/cart-checkout.models';


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
      tap((response: {productos: Product[], identidad?: any}) => {
        if (response?.identidad?.cantidad_referencias !== undefined) {
          this.cartCount.set(response.identidad.cantidad_referencias);
        }
      }),
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
  public readonly cartData = computed(() => this.cartResource.value());

  // --- HOME STATE ----

public readonly homeResource = rxResource<HomeData, unknown>({
  stream: () => this.managerApis.getHomeData().pipe(
    tap((response: any) => {
      this.cartCount.set(response.identidad?.cantidad_referencias ?? 0);
      
      if (!isPlatformBrowser(this.platformId)) return;
      
      if (response.identidad?.token) {
    this.actualizarIdentidad(response.identidad.token, response.identidad);
  }
       else if (response.identidad?.tipo === 'visitante') {
        console.log('👋 Visitante EXISTENTE - ID:', response.identidad.id);
      }
      else if (response.identidad?.tipo === 'usuario') {
        console.log('👑 Usuario autenticado - ID:', response.identidad.id);
      }
      else {
        console.log('⚠️ NO SE ENCONTRÓ TOKEN en la respuesta');
        
      }
    }),
    map((response: any): HomeData => {
      const homeData: HomeData = {
        banners: response.banners || [],
        modelos: response.modelos || [],
        identidad: response.identidad
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

  // -- CARD PRODUCT --

private manualSlugToLoad = signal<string>('');

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

  // -- ADD TO CARD --

public addStatus = linkedSignal<string | undefined, ActionStatus>({
  source: () => this.currentProductCard()?.stockid,
  computation: () => 'idle'
});

public addCurrentProductToCart(registro?: any): Observable<any> {
  const p = this.currentProductCard();
  
  if (!p || p.qty_in_order < 1) {
    return throwError(() => new Error('No product or invalid quantity'));
  }
  
  this.addStatus.set('loading');
    const payload: any = {
    productos: [{
      stockid: p.stockid,
      cantidad: p.qty_in_order,
      precio: p.price_with_tax,
      taxrate: 0.16
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
    filter(event => event instanceof NavigationEnd),
    map((event: NavigationEnd) => event.urlAfterRedirects.includes('/checkout'))
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

    console.log('🛒 Disparando petición de carrito por navegación o refresco');
    return this.managerApis.getCart().pipe(
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

public readonly cartItems = computed(() => this.cartData()?.items ?? []);
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
    
    if (identidad?.cantidad_referencias !== undefined) {
      this.cartCount.set(identidad.cantidad_referencias);
    }
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


}
```

