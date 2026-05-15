import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
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
import { BranchCatalogsResponse, CreateBranchPayload, CustomerDetailResult, CustomerSearchResult } from '../models/customer.model';
import { OnDemandListResponse } from '../models/on-demand-model';
import { StockAvailabilityResponse, WarehouseOption } from '../models/orders.models';

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

  public confirmPayment(idtransfer: string): Observable<any> {
  return this.http.patch(`${this.nodeBaseUrl}/transfers/status`, {
    idtransfer,
    action: 'confirm_payment'
  });
}

  public dispatchToCustomer(idtransfer: string): Observable<any> {
    return this.http.patch(`${this.nodeBaseUrl}/transfers/status`, {
      idtransfer,
      action: 'dispatch_to_customer'
    });
  }

  public confirmDelivery(idtransfer: string): Observable<any> {
    return this.http.patch(`${this.nodeBaseUrl}/transfers/status`, {
      idtransfer,
      action: 'confirm_delivery'
    });
  }

  public uploadVoucher(idtransfer: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.patch(`${this.nodeBaseUrl}/transfers/${idtransfer}/voucher`, formData);
  }

  public uploadShippingDoc(idtransfer: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.patch(`${this.nodeBaseUrl}/transfers/${idtransfer}/shipping-doc`, formData);
  }

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

public subscribeToProduct(stockid: string, registro?: any): Observable<any> {
  const body: any = { stockid };
  if (registro) body.registro = registro;
  return this.http.post(`${this.nodeBaseUrl}/on-demand/subscribe`, body);
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

// Búsqueda unificada por nombre, RIF o teléfono
public searchCustomers(q: string): Observable<CustomerSearchResult> {
  return this.http.get<CustomerSearchResult>(
    `${this.nodeBaseUrl}/customers/search`,
    { params: new HttpParams().set('q', q) }
  );
}
 
// Detalle completo del cliente + sus branches con transactionCount
public getCustomer(debtorNo: string): Observable<CustomerDetailResult> {
  return this.http.get<CustomerDetailResult>(
    `${this.nodeBaseUrl}/customers/${debtorNo}`
  );
}
 
// Actualizar datos del cliente
public updateCustomer(debtorNo: string, payload: any): Observable<any> {
  return this.http.put(
    `${this.nodeBaseUrl}/customers/${debtorNo}`,
    payload
  );
}
 
// Catálogos exclusivos del formulario de branch (áreas + vendedores)
public getBranchCatalogs(): Observable<BranchCatalogsResponse> {
  return this.http.get<{ exito: boolean; data: BranchCatalogsResponse }>(
    `${this.nodeBaseUrl}/config/branch-catalogs`
  ).pipe(
    map(res => res.data),
    catchError(err => {
      console.error('❌ Error en getBranchCatalogs:', err);
      return of({ areas: [], salesman: [] });
    })
  );
}
 
// Listar branches de un cliente
public getBranches(debtorNo: string): Observable<any> {
  return this.http.get(
    `${this.nodeBaseUrl}/customers/${debtorNo}/branches`
  );
}
 
// Crear branch
public addBranch(debtorNo: string, payload: CreateBranchPayload): Observable<any> {
  return this.http.post(
    `${this.nodeBaseUrl}/customers/${debtorNo}/branches`,
    payload
  );
}
 
// Editar branch
public updateBranch(debtorNo: string, branchCode: string, payload: Partial<CreateBranchPayload>): Observable<any> {
  return this.http.put(
    `${this.nodeBaseUrl}/customers/${debtorNo}/branches/${branchCode}`,
    payload
  );
}
 
// Eliminar branch
public deleteBranch(debtorNo: string, branchCode: string): Observable<any> {
  return this.http.delete(
    `${this.nodeBaseUrl}/customers/${debtorNo}/branches/${branchCode}`
  );
}

public getOnDemandSubscriptions(): Observable<OnDemandListResponse> {
  return this.http.get<OnDemandListResponse>(
    `${this.nodeBaseUrl}/dashboard/on-demand`
  );
}
 
public updateOnDemandStatus(id: number, status: 'closed' | 'pending'): Observable<{ exito: boolean; mensaje: string }> {
  return this.http.patch<{ exito: boolean; mensaje: string }>(
    `${this.nodeBaseUrl}/dashboard/on-demand/${id}/status`,
    { status }
  );
}
 
public notifyOnDemand(id: number): Observable<{ exito: boolean; mensaje: string }> {
  return this.http.post<{ exito: boolean; mensaje: string }>(
    `${this.nodeBaseUrl}/dashboard/on-demand/${id}/notify`,
    {}
  );
}

public getShippers(): Observable<any> {
    return this.http.get(`${this.nodeBaseUrl}/transfers/shippers`, {
        withCredentials: true
    });
}

public dispatchGroup(transfer_group: string): Observable<any> {
  return this.http.patch(
    `${this.nodeBaseUrl}/transfers/group/${transfer_group}/dispatch`,
    {}
  );
}

public receiveGroup(transfer_group: string): Observable<any> {
  return this.http.post(
    `${this.nodeBaseUrl}/transfers/group/${transfer_group}/receive`,
    {}
  );
}

public getWarehouses(): Observable<{ exito: boolean; data: WarehouseOption[] }> {
    return this.http.get<{ exito: boolean; data: WarehouseOption[] }>(
        `${this.nodeBaseUrl}/config/warehouses`
    );
}

/**
 * Verifica disponibilidad de stock en shiploc antes de agregar una línea
 * GET /orders-sales/{orderno}/lines/stock-check
 */
public checkStockAvailability(
    orderno: number,
    stkcode: string,
    quantity: number
): Observable<StockAvailabilityResponse> {
    const params = new HttpParams()
        .set('stkcode', stkcode)
        .set('quantity', quantity.toString());
    return this.http.get<StockAvailabilityResponse>(
        `${this.nodeBaseUrl}/orders-sales/${orderno}/lines/stock-check`,
        { params }
    );
}

/**
 * Obtiene la lista de pedidos pendientes de facturación
 * GET /orders-sales/pending-for-invoice
 */
public getPendingOrdersForInvoice(): Observable<{ exito: boolean; data: any[] }> {
    return this.http.get<{ exito: boolean; data: any[] }>(
        `${this.nodeBaseUrl}/orders-sales/pending-for-invoice`
    );
}

/**
 * Obtiene la lista de pedidos pendientes de despacho (para exe-order)
 * GET /orders-sales/pending-for-dispatch?shiploc={loccode}
 */
public getPendingOrdersForDispatch(shiploc: string): Observable<{ exito: boolean; data: any[] }> {
    const params = new HttpParams().set('shiploc', shiploc);
    return this.http.get<{ exito: boolean; data: any[] }>(
        `${this.nodeBaseUrl}/orders-sales/pending-for-dispatch`,
        { params }
    );
}

/**
 * Marca un pedido como entregado (solo para el almacén shiploc)
 * POST /orders-sales/{orderno}/deliver
 */
public markOrderAsDelivered(orderno: number): Observable<{ exito: boolean; mensaje: string; data: any }> {
    return this.http.post<{ exito: boolean; mensaje: string; data: any }>(
        `${this.nodeBaseUrl}/orders-sales/${orderno}/deliver`,
        {}
    );
}

  public listOrders(): Observable<{ exito: boolean; data: any[] }> {
    return this.http.get<{ exito: boolean; data: any[] }>(
        `${this.nodeBaseUrl}/orders-sales`
    );
}

public pickLine(orderno: number, lineno: number): Observable<{ exito: boolean; mensaje: string; data: any }> {
    return this.http.patch<{ exito: boolean; mensaje: string; data: any }>(
        `${this.nodeBaseUrl}/orders-sales/${orderno}/lines/${lineno}/pick`,
        {}
    );
}

public getOrderDetail(orderno: number): Observable<{ exito: boolean; data: any }> {
    return this.http.get<{ exito: boolean; data: any }>(
        `${this.nodeBaseUrl}/orders-sales/${orderno}`
    );
}

  public unpickLine(orderno: number, lineno: number): Observable<{ exito: boolean; mensaje: string; data: any }> {
    return this.http.delete<{ exito: boolean; mensaje: string; data: any }>(
        `${this.nodeBaseUrl}/orders-sales/${orderno}/lines/${lineno}/pick`
    );
}

  public markOrderAsReady(orderno: number): Observable<{ exito: boolean; mensaje: string; data: any }> {
    return this.http.post<{ exito: boolean; mensaje: string; data: any }>(
        `${this.nodeBaseUrl}/orders-sales/${orderno}/ready-for-dispatch`,
        {}
    );
}

  uploadOrderVoucher(orderno: number, file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.patch<any>(
            `${this.nodeBaseUrl}/orders-sales/${orderno}/voucher`,
            formData
        );
    }
 
    uploadOrderShippingDoc(orderno: number, file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.patch<any>(
            `${this.nodeBaseUrl}/orders-sales/${orderno}/shipping-doc`,
            formData
        );
    }

}