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
import { CatalogsResponse, CompanyConfig } from '../models/company_config.model';
import { AddLinePayload, AddLineResponse, CreateOrderPayload, CreateOrderResponse, CustomerSearchResponse, ExecuteInvoicePayload, ExecuteInvoiceResponse, InvoicePreviewResponse, UpdateLinePayload, UpdateLineResponse, ValidateResponse } from '../models/invoice.models';

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

  public getCatalogs(): Observable<CatalogsResponse> {
    return this.http.get<{ exito: boolean; data: CatalogsResponse }>(
      `${this.nodeBaseUrl}/config/catalogs`
    ).pipe(
      map(res => res.data),
      catchError(err => {
        console.error('❌ Error en getCatalogs:', err);
        return of({ currencies: [], salesTypes: [], debtorTypes: [] });
      })
    );
  }

  public createCustomer(payload: any): Observable<any> {
    return this.http.post(`${this.nodeBaseUrl}/customers`, payload);
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

public searchCustomerByPhone(phone: string): Observable<CustomerSearchResponse> {
  return this.http.get<CustomerSearchResponse>(
    `${this.nodeBaseUrl}/customers/search/phone`,
    { params: new HttpParams().set('q', phone) }
  );
}
 
public createOrder(payload: CreateOrderPayload): Observable<CreateOrderResponse> {
  return this.http.post<CreateOrderResponse>(
    `${this.nodeBaseUrl}/orders-sales`,
    payload
  );
}
 
public deleteOrder(orderno: number): Observable<any> {
  return this.http.delete(`${this.nodeBaseUrl}/orders-sales/${orderno}`);
}
 
public addOrderLine(orderno: number, payload: AddLinePayload): Observable<AddLineResponse> {
  return this.http.post<AddLineResponse>(
    `${this.nodeBaseUrl}/orders-sales/${orderno}/lines`,
    payload
  );
}
 
public updateOrderLine(orderno: number, lineno: number, payload: UpdateLinePayload): Observable<UpdateLineResponse> {
  return this.http.put<UpdateLineResponse>(
    `${this.nodeBaseUrl}/orders-sales/${orderno}/lines/${lineno}`,
    payload
  );
}
 
public deleteOrderLine(orderno: number, lineno: number): Observable<any> {
  return this.http.delete(
    `${this.nodeBaseUrl}/orders-sales/${orderno}/lines/${lineno}`
  );
}
 
public getInvoicePreview(orderno: number): Observable<InvoicePreviewResponse> {
  return this.http.get<InvoicePreviewResponse>(
    `${this.nodeBaseUrl}/invoices/order/${orderno}/preview`
  );
}
 
public validateInvoiceConcurrency(orderno: number): Observable<ValidateResponse> {
  return this.http.get<ValidateResponse>(
    `${this.nodeBaseUrl}/invoices/order/${orderno}/validate`
  );
}
 
public executeInvoice(orderno: number, payload: ExecuteInvoicePayload): Observable<ExecuteInvoiceResponse> {
  return this.http.post<ExecuteInvoiceResponse>(
    `${this.nodeBaseUrl}/invoices/${orderno}/execute`,
    payload
  );
}

}