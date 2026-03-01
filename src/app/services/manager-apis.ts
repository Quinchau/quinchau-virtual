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

public executeCheckout(checkoutData: { 
  cotizacion_id: number, 
  nombre: string, 
  telefono: string,
  prefijo?: string 
}): Observable<any> {
  return this.http.post(`${this.baseUrl}/exe-checkout.php`, checkoutData, {
    withCredentials: true
  });
}


}