import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  NewTransfer, Product, TransferenciaDetalle, 
  ProductDetailData, DashboardResponse, Banner, 
  HomeData
} from '../models/transfer.model';

@Injectable({
  providedIn: 'root',
})
export class ManagerApis {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

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
): Observable<Product[]> {
  let params = new HttpParams();

  if (searchTerm) params = params.set('search', searchTerm);
  if (includeStock) params = params.set('stock', '1');
  if (idmodelo) params = params.set('idmodelo', idmodelo);

  return this.http.get<Product[]>(`${this.baseUrl}/get-products.php`, { params });
}

  public getProductDetail(stockid: string): Observable<ProductDetailData> {
    return this.http.get<ProductDetailData>(`${this.baseUrl}/product-detail.php`, {
      params: new HttpParams().set('stockid', stockid)
    });
  }

  public getHomeData(): Observable<HomeData> {
  return this.http.get<HomeData>(`${this.baseUrl}/get_home_data.php`);

}
}