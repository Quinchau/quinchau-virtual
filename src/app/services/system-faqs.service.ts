// src/app/services/system-faqs.service.ts

import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { isPlatformServer } from '@angular/common';
import {
  SystemFaqListResponse,
  SystemFaqSingleResponse,
  SystemFaqDeleteResponse,
  SystemFaqCategoriasResponse,
  CreateSystemFaqDto,
  UpdateSystemFaqDto,
  ActivoFilter,
} from '../models/system-faqs.models';

@Injectable({ providedIn: 'root' })
export class SystemFaqsService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  // ✅ Usar la misma lógica que el resto de servicios
  private get baseUrl() {
    const apiUrl = isPlatformServer(this.platformId)
      ? environment.apiUrlServer
      : environment.apiUrlBrowser;
    return `${apiUrl}/system-faqs`;
  }

  // ── Lectura pública (sin auth) ──────────────────────────────────────────────
  listPublic(): Observable<SystemFaqListResponse> {
    return this.http.get<SystemFaqListResponse>(`${this.baseUrl}/public`);
  }

  // ── Administración ───────────────────────────────────────────────────────────
  listAll(categoria?: string | null, activo: ActivoFilter = 'all'): Observable<SystemFaqListResponse> {
    let params = new HttpParams();
    if (categoria) params = params.set('categoria', categoria);
    if (activo !== 'all') params = params.set('activo', activo);
    return this.http.get<SystemFaqListResponse>(this.baseUrl, { params });
  }

  listCategorias(): Observable<SystemFaqCategoriasResponse> {
    return this.http.get<SystemFaqCategoriasResponse>(`${this.baseUrl}/categorias`);
  }

  create(dto: CreateSystemFaqDto): Observable<SystemFaqSingleResponse> {
    return this.http.post<SystemFaqSingleResponse>(this.baseUrl, dto);
  }

  update(id: number, dto: UpdateSystemFaqDto): Observable<SystemFaqSingleResponse> {
    return this.http.put<SystemFaqSingleResponse>(`${this.baseUrl}/${id}`, dto);
  }

  toggleActivo(id: number): Observable<SystemFaqSingleResponse> {
    return this.http.patch<SystemFaqSingleResponse>(`${this.baseUrl}/${id}/toggle`, {});
  }

  remove(id: number): Observable<SystemFaqDeleteResponse> {
    return this.http.delete<SystemFaqDeleteResponse>(`${this.baseUrl}/${id}`);
  }
}