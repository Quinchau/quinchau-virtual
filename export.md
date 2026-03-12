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
      company_config.model.ts
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
deploy_2026MAR05.tar.gz
deploy_2026MAR06.tar.gz
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

## src/app/components/header/header.html

```html
<header class="flex items-center justify-around bg-[#FB923C] px-1 py-3 shadow-md relative min-h-[75px]">
  
  <a [routerLink]="['/home']" 
     class="flex flex-col items-center min-w-[60px] text-white hover:bg-orange-600 rounded-xl transition-all p-1"
     title="inicio">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
      <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
    </svg>
    <span class="text-[10px] font-bold lowercase tracking-tighter">Inicio</span>
  </a>

  <a [routerLink]="['/category']" 
     class="flex flex-col items-center min-w-[60px] text-white hover:bg-orange-600 rounded-xl transition-all p-1"
     title="categorías">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
      <path fill-rule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z" clip-rule="evenodd" />
    </svg>
    <span class="text-[10px] font-bold lowercase tracking-tighter">Categorías</span>
  </a>

  <a [routerLink]="['/checkout']" 
   class="flex flex-col items-center min-w-[60px] text-white hover:bg-orange-600 rounded-xl transition-all p-1"
   title="carrito">
  
  <div class="relative flex items-center justify-center w-7 h-7">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
      <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.35l3.42 10.26a2.25 2.25 0 0 0 2.13 1.54h11.2a.75.75 0 0 0 0-1.5H9.15a.75.75 0 0 1-.71-.51L5.02 3.03A.75.75 0 0 0 4.31 2.25H2.25Z" />
      <path d="M7.5 21a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 21a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
    </svg>

    <span class="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white border-2 border-[#FB923C] z-10 shadow-sm">
      {{ state.cartCount() }}
    </span>
  </div>

  <span class="text-[10px] font-bold lowercase tracking-tighter mt-0.5">Carrito</span>
</a>

  @if (canSeeDashboard()) {
    <a [routerLink]="['/dashboard']" 
       class="flex flex-col items-center min-w-[60px] text-white hover:bg-orange-600 rounded-xl transition-all p-1"
       title="dashboard">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
        <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.035-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
      </svg>
      <span class="text-[10px] font-bold lowercase tracking-tighter">Dashboard</span>
    </a>
  }

  <!-- MENU HAMBURGUESA HEADER-->

  <div class="relative flex flex-col items-center">
  <button (click)="toggleMenu()" 
          class="flex flex-col items-center min-w-[60px] text-white hover:bg-orange-600 rounded-xl transition-all p-1 relative z-[110]"
          title="Abrir menú">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
    <span class="text-[10px] font-bold lowercase tracking-tighter">Menú</span>
  </button>

  <!--MENU CATALOGO-->

  @if (isMenuOpen()) {
    <div class="absolute right-0 top-[110%] w-60 bg-white rounded-xl shadow-2xl py-2 z-[120] border border-gray-100 overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-200">
      
      <button (click)="toggleCatalog(); $event.stopPropagation()" 
        class="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50 flex justify-between items-center group border-b border-gray-50">
  <div class="flex items-center gap-3">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-orange-500">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H18a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
    </svg>
    <span class="font-bold text-gray-800">Catálogo</span>
  </div>
  <svg [class.rotate-90]="isCatalogOpen()" class="w-4 h-4 transition-transform duration-200 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
</button>

<div [class.hidden]="!isCatalogOpen()" class="bg-gray-50/50 flex flex-col max-h-[70vh] overflow-y-auto">
  
  @for (cat of categoriasData(); track cat.nombre) {
    <button (click)="seleccionarCategoria(cat); $event.stopPropagation()"
            class="w-full text-left px-12 py-3 text-sm flex justify-between items-center border-l-4 transition-all"
            [class.border-orange-500]="categoriaActiva()?.nombre === cat.nombre"
            [class.bg-orange-50]="categoriaActiva()?.nombre === cat.nombre"
            [class.border-transparent]="categoriaActiva()?.nombre !== cat.nombre">
      <span [class.font-bold]="categoriaActiva()?.nombre === cat.nombre" class="text-gray-700">{{ cat.nombre }}</span>
    </button>

    @if (categoriaActiva()?.nombre === cat.nombre) {
      <div class="bg-white py-1 animate-in slide-in-from-left-1 duration-200">
        @for (marca of cat.marcas; track marca.nombre) {
          <button (click)="seleccionarMarca(marca); $event.stopPropagation()"
                  class="w-full text-left px-16 py-2.5 text-[13px] flex justify-between items-center group hover:bg-orange-50/30">
            <div class="flex items-center gap-2">
              @if (marca.img_url) {
                <img [src]="marca.img_url" [alt]="marca.nombre" class="w-5 h-5 object-contain grayscale group-hover:grayscale-0">
              }
              <span [class.text-orange-600]="marcaActiva()?.nombre === marca.nombre"
                    [class.font-semibold]="marcaActiva()?.nombre === marca.nombre"
                    class="text-gray-600">
                {{ marca.nombre }}
              </span>
            </div>
            <span class="text-[10px] text-gray-400 transition-transform" 
                  [class.rotate-90]="marcaActiva()?.nombre === marca.nombre">→</span>
          </button>

          @if (marcaActiva()?.nombre === marca.nombre) {
            <div class="flex flex-col py-1 pl-20 pr-4 bg-gray-50/50 animate-in fade-in duration-300">
              @for (modelo of marca.modelos; track modelo.idmodelo) {
                <a [routerLink]="['/categoria', modelo.url_app]"
                   (click)="isMenuOpen.set(false); isCatalogOpen.set(false)"
                   [title]="modelo.seo_note"
                   class="text-[11px] py-2.5 text-gray-500 hover:text-orange-600 border-b border-gray-100 last:border-0 transition-colors">
                  <span class="font-medium">{{ modelo.modeldescrip }}</span>
                </a>
              }
            </div>
          }
        }
      </div>
    }
  }
</div>

<!--FIN MENU CATALOGO-->
      <div class="border-t border-gray-100 my-1"></div>

      @if (isLogged()) {
        <div class="px-4 py-3 bg-gray-50/80 border-b border-gray-100 mb-1">
          <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Sesión Activa</p>
          <span class="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200 font-mono font-bold">
            Nivel {{ userLevelDisplay() }}
          </span>
          <p class="text-sm text-gray-800 truncate font-bold">{{ state.currentUser()?.realname }}</p>
        </div>
        
        <a [routerLink]="['/mis-datos']" (click)="isMenuOpen.set(false)" class="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">Mis Datos</a>
        <a [routerLink]="['/mis-pedidos']" (click)="isMenuOpen.set(false)" class="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">Mis Pedidos</a>
        
        <div class="border-t border-gray-100 mt-1 pt-1">
          <button (click)="onLogoutClick()" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">Cerrar Sesión</button>
        </div>
      } @else {
        <a [routerLink]="['/login']" (click)="isMenuOpen.set(false)" class="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-medium font-bold text-center">Iniciar Sesión</a>
      }
    </div>

    



    <div class="fixed inset-0 z-[105] bg-black/5" (click)="isMenuOpen.set(false)"></div>
  }
</div>
</header>
```

## src/app/components/header/header.ts

```ts
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { ManagerState } from '../../services/manager-state';
import { CategoriaNavegacion, MarcaConModelos, Modelo } from '../../models/transfer.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './header.html',
})
export class Header {
  public state = inject(ManagerState);
  private authService = inject(AuthService);

  private readonly ALLOWED_LEVELS = [8, 10];

  public isMenuOpen = signal(false);
  public isCatalogOpen = signal(false);

  readonly categoriasData = computed(() => this.state.homeResource.value()?.categorias ?? []);

  public isLogged = computed(() => !!this.state.currentUser());
  public userLevelDisplay = computed(() => this.state.currentUser()?.fullaccess ?? 'Invitado');
  public canSeeDashboard = computed(() => {
    const user = this.state.currentUser();
    return user ? this.ALLOWED_LEVELS.includes(user.fullaccess) : false;
  });

  // --- LÓGICA REACTIVA EN CASCADA ---

  // Categoría activa debe ser un signal normal
  public categoriaActiva = signal<CategoriaNavegacion | null>(null);

  // Marca activa depende de la categoría
  public marcaActiva = linkedSignal<CategoriaNavegacion | null, MarcaConModelos | null>({
    source: () => this.categoriaActiva(),
    computation: (categoria, previous) => {
      if (!categoria) return null;

      const marcaPrev = previous?.value;
      if (marcaPrev && !categoria.marcas.some(m => m.nombre === marcaPrev.nombre)) {
        return null;
      }

      return marcaPrev ?? null;
    }
  });

  // Modelo activo depende de la marca
  public modeloActivo = linkedSignal<MarcaConModelos | null, Modelo | null>({
    source: () => this.marcaActiva(),
    computation: (marca, previous) => marca ? previous?.value ?? null : null
  });

  // Lista derivada para el tercer nivel del menú
  public modelosDisponibles = computed(() => this.marcaActiva()?.modelos ?? []);

  // --- HANDLERS ---

  toggleMenu() { this.isMenuOpen.update(v => !v); }

  toggleCatalog() { this.isCatalogOpen.update(v => !v); }

  seleccionarCategoria(cat: CategoriaNavegacion) {
    this.categoriaActiva.update(actual =>
      actual?.nombre === cat.nombre ? null : cat
    );
  }

  seleccionarMarca(marca: MarcaConModelos) {
    this.marcaActiva.update(actual =>
      actual?.nombre === marca.nombre ? null : marca
    );
  }

  onLogoutClick() {
    this.isMenuOpen.set(false);
    this.authService.logout();
  }
}
```

## src/app/models/transfer.model.ts

```ts
// src/app/models/transfer.model.ts
export interface Transfer {
  idtransfer: number;
  stockid: string;
  description: string;
  shipqty: number;
  status: string;
  tipo: 'ship' | 'rec';
  location_name: string;
}

export interface TransferenciaDetalle {
  idtransfer: number;
  reference: number;
  stockid: string;
  shipqty: number;
  recqty: number;
  shipdate: string;
  recdate: string;
  status: 'Pendiente' | 'Recogido' | 'Entregado' | 'Devuelto' ;
  longdescription: string;
  units: string;
  shiploc_name: string;
  recloc_name: string;
  shiploc_qty: number;
  shiplocation: string;
  recloc_qty: number | null;
  reclocation: string;
  user_name: string;
  tipo: 'ship' | 'rec' | 'unknown';
  imagenes: string[];
}

export interface NewTransfer {
  stockid: string;
  shipqty: number;
  shiploc: string;
  recloc: string;
  user: string;
}

export interface User {
  realname: string;
  defaultlocation: string;
  fullaccess: number;
}

export interface NewTransfer {
  stockid: string;
  shipqty: number;
  shiploc: string;
  recloc: string;
  user: string;
}

export interface Product {
  stockid: string;
  description: string;
  longdescription: string;
  units: string;
  price_with_tax: number;
  total_quantity: number;
  idmodelo: number;
  tags: string | null;
  latest_trandate: string;
  cover_image_id: string;
  all_image_ids: string | null;
  url: string;
  modelo_ids: number[];
  modelos: string[];
  qty_in_order: number;
  slug: string;
}

export interface ProductListResponse {
  productos: Product[];
  identidad?: Visitante;
}

export interface ProductDetailResponse extends Product {
  identidad: Visitante;
}

export interface AvailableLocation {
  loccode: string;
  locationname: string;
  qty: number;
}

export interface ProductDetailData {
  stockid: string;
  longdescription: string;
  units: string;
  idmodelo: string | null;
  tags: string | null;
  latest_trandate: string | null;
  cover_image_id: string | null;
  all_image_ids: string[] | null;
  available_locations: AvailableLocation[] | null;
}
export interface DashboardResponse {
  userData: User;          
  transfers: Transfer[];
}

export interface ProductFilter {
  query: string;
  stock: boolean;
}

export interface Visitante {
  id: number;
  tipo: 'visitante' | 'visitante_nuevo' | 'usuario';
  cantidad_referencias?: number;
  token?: string;
  nuevo?: boolean | number;
  payload?: any;
  session_key?: string;
}

export interface HomeData {
  banners: Banner[];
  modelos: Modelo[];
  visitante?: Visitante;
  identidad?: Visitante;
  categorias?: CategoriaNavegacion[];
  marcas?: MarcaConModelos[];
  _debug?: any;
}

export interface CategoriaNavegacion {
  nombre: string;
  slug: string;
  url: string;
  marcas: MarcaConModelos[];
}

export interface MarcaConModelos {
  nombre: string;
  slug: string;
  url_seo: string;
  img_url?: string;
  modelos: Modelo[];
}

export interface Banner {
  idbanner: string;
  titulo: string;
  descripcion: string;
  img_url: string;
  link_url: string;
}

export interface Modelo {
  idmodelo: string;
  idmarca: string;
  modeldescrip: string;
  marcadescrip: string;
  categorydescription: string;
  img_url: string;
  show_web: string;
  url_app: string;
  seo_note: string;
  alt_text: string;
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
        categorias: response.categorias || [], 
        marcas: response.marcas || [],
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

## src/app/app.routes.ts

```ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Home } from './pages/home/home';
import { TransferDetailComponent } from './pages/transfer-detail/transfer-detail';
import { authGuard } from './guards/auth-guard';
import { NewTransferComponent } from './pages/newtransfer/newtransfer';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Transfers } from './pages/transfers/transfers';
import { adminGuard } from './guards/admin.guard';
import { ProductOrder } from './pages/product-order/product-order';
import { CartComponent } from './pages/checkout/checkout';

export const routes: Routes = [
{ path: 'producto/:slugId', component: ProductOrder },
{ path: 'login', component: LoginComponent },
{ path: 'home', component: Home },
{ path: 'category', 
    loadComponent: () => import('./pages/category/category').then(m => m.Category) 
  },
{ path: 'checkout', component: CartComponent },
{
  path: 'success/:id',
  loadComponent: () =>
    import('./components/success-order/success-order').then(m => m.SuccessOrder)
},

{ path: 'dashboard',
  component: Dashboard,canActivate: [adminGuard] },
{ path: 'new-transfer', component: NewTransferComponent, canActivate: [authGuard],
  children: [
      {
        path: 'product/:id',
        component: ProductDetail, canActivate: [authGuard]
      }
  
    ]
 },
{
    path: 'transfers',
    component: Transfers,
    canActivate: [authGuard],
    children: [
      {
        path: 'detail/:id',
        component: TransferDetailComponent, canActivate: [authGuard]
      }
  
    ]
  },
  { path: '', redirectTo: '/home', pathMatch: 'full'},

];
```

