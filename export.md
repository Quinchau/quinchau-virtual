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
  manifest.webmanifest
src/
  app/
    components/
      header/
        header.html
        header.ts
    data/
      transfer-actions.ts
    guards/
      auth-guard.ts
    models/
      transfer.model.ts
    pages/
      dashboard/
        dashboard.html
        dashboard.ts
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
      transfer-detail/
        transfer-detail.html
        transfer-detail.ts
    services/
      auth.interceptor.ts
      auth.ts
      manager-apis.ts
      manager-state.ts
      search.service.ts
    app.config.server.ts
    app.config.ts
    app.css
    app.html
    app.routes.server.ts
    app.routes.ts
    app.ts
  index.html
  main.server.ts
  main.ts
  server.ts
  styles.css
.editorconfig
.gitignore
.nvmrc
angular.json
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
<header class="flex items-center justify-between bg-black px-4 py-3">
  <!-- Botón Home - Icono moderno -->
  <a [routerLink]="['/home']" class="p-2 text-white hover:text-blue-400 transition-colors duration-200">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
      <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
    </svg>
  </a>

  <!-- Input de Búsqueda -->
  <div class="flex-1 mx-4 relative max-w-md">
    <div class="relative">
      <input
        type="text"
        [(ngModel)]="searchTerm"
        (input)="onSearchChange()"
        placeholder="Buscar productos..."
        class="w-full px-4 py-2 pl-10 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-700 transition-colors"
      />
      
      <!-- Ícono de lupa fijo -->
      <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
          <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
        </svg>
      </div>
      
      <!-- Botón para limpiar búsqueda -->
      @if (searchTerm) {
        <button
          (click)="clearSearch()"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      }
    </div>
  </div>

  <!-- Botón Logout - Icono moderno -->
  <button (click)="onLogoutClick()" class="p-2 text-white hover:text-red-400 transition-colors duration-200 group">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
      <path fill-rule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clip-rule="evenodd" />
    </svg>
    <span class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
      Cerrar sesión
    </span>
  </button>
</header>
```

## src/app/components/header/header.ts

```ts
// header.ts
import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './header.html',
})
export class Header {
  private authService = inject(AuthService);
  private searchService = inject(SearchService); // Inyecta el servicio
  
  searchTerm: string = '';

  onLogoutClick(): void {
    this.authService.logout();
  }

  onSearchChange(): void {
    // Usa el servicio en lugar del output
    this.searchService.setSearchTerm(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchService.clearSearch();
  }
}
```

## src/app/pages/home/home.html

```html
<div class="container mx-auto px-4 py-8 relative">
  <div class="flex border-b border-gray-300 mb-6">
    <button
      (click)="selectTab('ship')"
      [class]="activeTab() === 'ship' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500'"
      class="px-4 py-2 focus:outline-none transition-colors"
    >
      📦 Por Enviar ({{ envios().length }})
    </button>
    <button
      (click)="selectTab('rec')"
      [class]="activeTab() === 'rec' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500'"
      class="px-4 py-2 focus:outline-none transition-colors"
    >
      📥 Por Recibir ({{ recepciones().length }})
    </button>
  </div>

  <h1 class="text-2xl font-bold text-gray-800 mb-6">
    @if (activeTab() === 'ship') {
      Transferencias por Enviar
    } @else {
      Transferencias por Recibir
    }
  </h1>

  <!-- Indicador de resultados de búsqueda -->
  @if (searchTerm()) {
    <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p class="text-sm text-blue-800">
        @if (filteredTransfers().length > 0) {
          Mostrando {{ filteredTransfers().length }} de {{ (activeTab() === 'ship' ? envios() : recepciones()).length }} transferencias
          para: "<strong>{{ searchTerm() }}</strong>"
        } @else {
          No se encontraron resultados para: "<strong>{{ searchTerm() }}</strong>"
        }
        <button 
          (click)="clearSearch()"
          class="ml-2 text-blue-600 hover:text-blue-800 underline text-xs"
        >
          Limpiar búsqueda
        </button>
      </p>
    </div>
  }

  @if (filteredTransfers().length > 0) {
    <div class="bg-white shadow-md rounded-lg overflow-hidden hidden md:block">
      <div class="overflow-x-auto">
        <table class="w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Producto</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            @for (transfer of filteredTransfers(); track transfer.idtransfer) {
              <tr 
                class="transfer-item hover:bg-gray-50 transition-colors cursor-pointer"
                (click)="openTransferDetail(transfer.idtransfer)">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-gray-900">{{ transfer.stockid }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-700">{{ transfer.description }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-600 font-mono">{{ transfer.shipqty }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    [ngClass]="{
                      'bg-gray-100 text-gray-800': transfer.status === 'Pendiente',
                      'bg-orange-100 text-orange-800': transfer.status === 'Recogido',
                      'bg-green-100 text-green-800': transfer.status === 'Entregado'
                    }"
                  >
                    {{ transfer.status }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="block md:hidden">
      <div class="grid gap-4">
        @for (transfer of filteredTransfers(); track transfer.idtransfer) {
          <div
            class="transfer-item bg-white p-4 rounded-lg shadow-md cursor-pointer"
            (click)="openTransferDetail(transfer.idtransfer)">
            <p class="text-xs text-gray-400 mb-1">
              @if (activeTab() === 'ship') {
                <span class="font-medium text-gray-700">Enviar a:</span>
              } @else {
                <span class="font-medium text-gray-700">Viene de:</span>
              }
              <span class="font-bold text-gray-900">{{ transfer.location_name }}</span>
            </p>
            <p class="text-sm text-gray-500">
              <span class="font-medium text-gray-700">ID:</span> {{ transfer.stockid }}
            </p>
            <p class="text-lg font-bold text-gray-900">
              <span class="font-medium text-gray-700">Descripción:</span> {{ transfer.description }}
            </p>
            <p class="text-sm text-gray-600">
              <span class="font-medium text-gray-700">Cantidad:</span> {{ transfer.shipqty }}
            </p>
            <p class="mt-1 text-sm text-gray-600">
              <span class="font-medium text-gray-700">Estado:</span>
              <span
                class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                [ngClass]="{
                  'bg-gray-100 text-gray-800': transfer.status === 'Pendiente',
                  'bg-orange-100 text-orange-800': transfer.status === 'Recogido',
                  'bg-green-100 text-green-800': transfer.status === 'Entregado'
                }"
              >
                {{ transfer.status }}
              </span>
            </p>
          </div>
        }
      </div>
    </div>
  } @else {
    <div class="text-center py-12">
      <div class="text-gray-400 text-6xl mb-4">📦</div>
      <h2 class="text-lg font-medium text-gray-600 mb-2">
        @if (searchTerm()) {
          No se encontraron resultados
        } @else {
          @if (activeTab() === 'ship') {
            No hay transferencias pendientes por enviar
          } @else {
            No hay transferencias pendientes por recibir
          }
        }
      </h2>
      <p class="text-gray-500">
        @if (searchTerm()) {
          No se encontraron transferencias que coincidan con tu búsqueda.
        } @else {
          No se encontraron transferencias pendientes para tu ubicación.
        }
      </p>
      @if (searchTerm()) {
        <button 
          (click)="clearSearch()"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Limpiar búsqueda
        </button>
      }
    </div>
  }

  <button 
    (click)="createNewTransfer()"
    class="fixed bottom-6 right-6 p-4 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-10">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-7 h-7">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  </button>
</div>

<router-outlet />
```

## src/app/pages/home/home.ts

```ts
import { Component, OnInit, inject, signal, computed, effect, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ManagerState } from '../../services/manager-state';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { Transfer } from '../../models/transfer.model';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private managerState = inject(ManagerState);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchService = inject(SearchService);
  private isBrowser: boolean;
  
  public readonly envios = this.managerState.envios;
  public readonly recepciones = this.managerState.recepciones;
  
  public activeTab = signal<'ship' | 'rec'>('ship');
  public searchTerm = this.searchService.searchTerm;

  public filteredTransfers = computed<Transfer[]>(() => {
    const transfers = this.activeTab() === 'ship' ? this.envios() : this.recepciones();
    const term = this.searchTerm().toLowerCase().trim();
    
    if (!term) return transfers;
    
    return transfers.filter(transfer => 
      transfer.idtransfer.toString().includes(term) ||
      transfer.stockid?.toLowerCase().includes(term) ||
      transfer.description?.toLowerCase().includes(term) ||
      transfer.location_name?.toLowerCase().includes(term) ||
      transfer.status?.toLowerCase().includes(term) ||
      transfer.shipqty?.toString().includes(term)
    );
  });

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Effect SOLO en cliente - no en SSR
    if (this.isBrowser) {
      effect(() => {
        const term = this.searchTerm();
        if (term && this.filteredTransfers().length > 0) {
          setTimeout(() => this.scrollToFirstMatch(), 100);
        }
      });
    }
  }

  ngOnInit(): void {
    this.managerState.loadTransfers();
  }

  public selectTab(tab: 'ship' | 'rec'): void {
    this.activeTab.set(tab);
  }

  public openTransferDetail(idtransfer: number): void {
    this.router.navigate(['detail', idtransfer], { relativeTo: this.route });
  }

  public createNewTransfer(): void {
    const transferType = this.activeTab();
    this.managerState.setNewTransferType(transferType);
    this.router.navigate(['/new-transfer']);
  }

  public clearSearch(): void {
    this.searchService.clearSearch();
  }

  private scrollToFirstMatch(): void {
    if (!this.isBrowser) return;
    
    const firstMatch = document.querySelector('.transfer-item:first-child');
    if (firstMatch) {
      firstMatch.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      this.highlightElement(firstMatch);
    }
  }

  private highlightElement(element: Element): void {
    if (!this.isBrowser) return;
    
    element.classList.add('bg-yellow-100', 'border', 'border-yellow-400');
    setTimeout(() => {
      element.classList.remove('bg-yellow-100', 'border', 'border-yellow-400');
    }, 2000);
  }
}
```

## src/app/services/search.service.ts

```ts
// services/search.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  public searchTerm = signal<string>('');
  
  setSearchTerm(term: string) {
    this.searchTerm.set(term);
  }
  
  clearSearch() {
    this.searchTerm.set('');
  }
}
```

