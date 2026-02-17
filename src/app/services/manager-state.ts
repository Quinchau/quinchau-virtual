// src/app/services/manager-state.ts
import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { ManagerApis } from './manager-apis';
import { Transfer, TransferenciaDetalle, User, NewTransfer, Product, ProductDetailData, DashboardResponse, ProductFilter, HomeData } from '../models/transfer.model';
import { TransferButtonInfo, getTransferButtonInfo } from '../data/transfer-actions';
import { tap, catchError, of, throwError, finalize, map } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';


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

public readonly productsResource = rxResource({
  params: () => {
    const query = this.productSearchTerm();
    const stock = this.productIncludeStock();

    if (!query || query.trim().length === 0) {
      return undefined; 
    }

    return { query, stock };
  },
  stream: ({ params }) => this.managerApis.getProducts(params.query, params.stock).pipe(
    catchError(err => {
      console.error('Error en el recurso:', err);
      return of([]);
    })
  ),
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
    catchError(err => {
      console.error('Error cargando HomeData:', err);
      // Retornamos el objeto vacío pero con la estructura correcta
      return of({ banners: [], modelos: [] } as HomeData);
    })
  ),
  defaultValue: { banners: [], modelos: [] } as HomeData
});

// Ahora value() ya se reconoce como HomeData
public readonly homeBanners = computed(() => this.homeResource.value().banners);
public readonly homeModelos = computed(() => this.homeResource.value().modelos);

public readonly modelosDestacados = computed(() => 
  this.homeModelos().filter(m => m.show_web === '1')
);

  

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