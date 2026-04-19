import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { isPlatformServer } from '@angular/common';
import { 
  NewTransfer, Product, TransferenciaDetalle, 
  ProductDetailData, DashboardResponse, HomeData,
  ProductListResponse,
  OutgoingMessage,
  SentStats,
  DashboardMetrics
} from '../models/transfer.model';
import { CompanyConfig } from '../models/company_config.model';

@Injectable({
  providedIn: 'root',
})
export class ManagerApis {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  // Centralizamos todo en nodeBaseUrl para la nueva API
  private get nodeBaseUrl() { 
    return isPlatformServer(this.platformId) 
      ? environment.apiUrlServer 
      : environment.apiUrlBrowser; 
  }

  // --- MÉTODOS DE TRANSFERENCIAS (MIGRADO A NODE) ---

  public getTransfers(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.nodeBaseUrl}/transfers`, {
      withCredentials: true
    });
  }

  public getTransferenciaDetalle(id: string): Observable<TransferenciaDetalle> {
    return this.http.get<TransferenciaDetalle>(`${this.nodeBaseUrl}/transfers/detail`, {
      params: new HttpParams().set('id', id)
    });
  }

  public updateTransferStatus(idtransfer: string, newStatus: string): Observable<any> {
    return this.http.patch(`${this.nodeBaseUrl}/transfers/status`, { idtransfer, newStatus });
  }

  public deleteTransfer(idtransfer: string): Observable<any> {
    // REST standard: el ID viaja en la URL
    return this.http.delete(`${this.nodeBaseUrl}/transfers/${idtransfer}`);
  }

  public executeTransfer(idtransfer: string): Observable<any> {
    return this.http.post(`${this.nodeBaseUrl}/transfers/execute`, { idtransfer });
  }

  public createTransfer(transferData: NewTransfer): Observable<any> {
    return this.http.post(`${this.nodeBaseUrl}/transfers`, transferData);
  }

  // --- MÉTODOS DE PRODUCTOS ---

  public getProducts(
    searchTerm: string = '', 
    includeStock: boolean = false, 
    idmodelo: string = ''
  ): Observable<{productos: Product[], identidad?: any}> {
    let params = new HttpParams();
    if (searchTerm) params = params.set('search', searchTerm);
    if (includeStock) params = params.set('stock', '1');
    if (idmodelo) params = params.set('idmodelo', idmodelo);

    return this.http.get<ProductListResponse>(`${this.nodeBaseUrl}/products`, { params }).pipe(
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
    return this.http.get<ProductDetailData>(`${this.nodeBaseUrl}/products/detail`, {
      params: new HttpParams().set('stockid', stockid)
    });
  }

  public getProductBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.nodeBaseUrl}/products`, {
      params: new HttpParams().set('slug', slug)
    });
  }

  // --- MÉTODOS DE CARRITO Y CHECKOUT ---

  public getHomeData(): Observable<HomeData> {
    return this.http.get<HomeData>(`${this.nodeBaseUrl}/home/data`);
  }

  public addToCart(orderData: { productos: any[], typeabbrev: string }): Observable<any> {
    return this.http.post(`${this.nodeBaseUrl}/orders`, orderData, {
      withCredentials: true
    });
  }

  public getCart(): Observable<any> {
    return this.http.get(`${this.nodeBaseUrl}/checkout`, {
      withCredentials: true
    });
  }

  public executeCheckout(cotizacion_id: number): Observable<any> {
    return this.http.post(`${this.nodeBaseUrl}/checkout/execute`, { cotizacion_id }, {
      withCredentials: true
    });
  }

  // --- CONFIGURACIÓN Y USUARIOS ---

  public getCompanyConfig(coycode: number): Observable<CompanyConfig | null> {
    const params = new HttpParams().set('coycode', coycode.toString());
    return this.http.get<CompanyConfig>(`${this.nodeBaseUrl}/config`, { params }).pipe(
      catchError(error => {
        console.error('❌ Error en getCompanyConfig:', error);
        return of(null);
      })
    );
  }

  public registerUser(userData: any): Observable<any> {
    return this.http.post(`${this.nodeBaseUrl}/auth/register`, userData);
  }

  public updateCartItem(payload: { item_id: number, cotizacion_id: number, quantity: number }): Observable<any> {
    return this.http.put(`${this.nodeBaseUrl}/checkout`, payload, {
      withCredentials: true
    });
  }

  public deleteCartItem(payload: { item_id: number, cotizacion_id: number }): Observable<any> {
    // Nota profesional: En Angular, para enviar un body en un DELETE se usa la propiedad 'body' en las opciones
    return this.http.delete(`${this.nodeBaseUrl}/checkout`, {
      body: payload,
      withCredentials: true
    });
  }

  downloadCategoryExcel(idCategoria: string): Observable<Blob> {
  const params = new HttpParams()
    .set('idcategoria', idCategoria)
    .set('format', 'xlsx')
    .set('stock', '1');

  return this.http.get(`${this.nodeBaseUrl}/products`, {
    params,
    responseType: 'blob'
  });
}

public getPendingMessages(): Observable<{ exito: boolean; total: number; messages: OutgoingMessage[]; stats: SentStats }> {
  return this.http.get<any>(`${this.nodeBaseUrl}/outgoing-messages/pending`);
}

public lockMessage(id: number): Observable<{ exito: boolean; message: string }> {
  return this.http.patch<any>(`${this.nodeBaseUrl}/outgoing-messages/${id}/lock`, {});
}

public markMessageSent(id: number): Observable<{ exito: boolean; message: string }> {
  return this.http.patch<any>(`${this.nodeBaseUrl}/outgoing-messages/${id}/sent`, {});
}

public subscribeToProduct(stockid: string): Observable<any> {
  // Ajustamos a la ruta real del dominio de demanda
  return this.http.post(`${this.nodeBaseUrl}/on-demand/subscribe`, { stockid });
}

public getDashboardMetrics(): Observable<DashboardMetrics> {
  return this.http.get<DashboardMetrics>(`${this.nodeBaseUrl}/dashboard/metrics`, {
    withCredentials: true
  });
}

}