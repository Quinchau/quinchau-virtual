// src/app/services/terminos.service.ts
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { isPlatformServer } from '@angular/common';
import { Termino, CreateTerminoInput, UpdateTerminoInput, AliasItem, ApiResponse, Entidad } from '../models/terminos.model';

@Injectable({
  providedIn: 'root'
})
export class TerminosService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private get nodeBaseUrl() {
    return isPlatformServer(this.platformId)
      ? environment.apiUrlServer
      : environment.apiUrlBrowser;
  }

  // Obtener todos los términos
  getAll(soloActivos: boolean = false): Observable<Termino[]> {
    const params = soloActivos ? new HttpParams().set('activos', '1') : undefined;
    return this.http.get<{ terminos: Termino[]; conteo: number }>(
      `${this.nodeBaseUrl}/terminos`,
      { params, withCredentials: true }
    ).pipe(
      map(res => res.terminos),
      catchError(err => {
        console.error('Error al obtener términos:', err);
        return throwError(() => new Error('No se pudieron cargar los términos'));
      })
    );
  }

  // Obtener un término por ID
  getById(id: number): Observable<Termino> {
    return this.http.get<Termino>(
      `${this.nodeBaseUrl}/terminos/${id}`,
      { withCredentials: true }
    ).pipe(
      catchError(err => {
        console.error(`Error al obtener término ${id}:`, err);
        return throwError(() => new Error('Término no encontrado'));
      })
    );
  }

  // Crear nuevo término
  create(data: CreateTerminoInput): Observable<Termino> {
    return this.http.post<{ success: boolean; termino: Termino }>(
      `${this.nodeBaseUrl}/terminos`,
      data,
      { withCredentials: true }
    ).pipe(
      map(res => res.termino),
      catchError(err => {
        console.error('Error al crear término:', err);
        return throwError(() => new Error(err.error?.error || 'No se pudo crear el término'));
      })
    );
  }

  // Actualizar término
  update(id: number, data: UpdateTerminoInput): Observable<Termino> {
    return this.http.put<{ success: boolean; termino: Termino }>(
      `${this.nodeBaseUrl}/terminos/${id}`,
      data,
      { withCredentials: true }
    ).pipe(
      map(res => res.termino),
      catchError(err => {
        console.error(`Error al actualizar término ${id}:`, err);
        return throwError(() => new Error(err.error?.error || 'No se pudo actualizar el término'));
      })
    );
  }

  // Eliminar término
  delete(id: number): Observable<void> {
    return this.http.delete<{ success: boolean }>(
      `${this.nodeBaseUrl}/terminos/${id}`,
      { withCredentials: true }
    ).pipe(
      map(() => void 0),
      catchError(err => {
        console.error(`Error al eliminar término ${id}:`, err);
        return throwError(() => new Error(err.error?.error || 'No se pudo eliminar el término'));
      })
    );
  }

  // Alternar estado activo/inactivo
  toggleActivo(id: number): Observable<Termino> {
    return this.http.patch<{ success: boolean; termino: Termino }>(
      `${this.nodeBaseUrl}/terminos/${id}/toggle`,
      {},
      { withCredentials: true }
    ).pipe(
      map(res => res.termino),
      catchError(err => {
        console.error(`Error al cambiar estado del término ${id}:`, err);
        return throwError(() => new Error('No se pudo cambiar el estado'));
      })
    );
  }

  // Agregar alias a un término
  addAlias(terminoId: number, alias: string): Observable<AliasItem> {
    return this.http.post<{ success: boolean; alias: AliasItem }>(
      `${this.nodeBaseUrl}/terminos/${terminoId}/alias`,
      { alias },
      { withCredentials: true }
    ).pipe(
      map(res => res.alias),
      catchError(err => {
        console.error(`Error al agregar alias a término ${terminoId}:`, err);
        return throwError(() => new Error(err.error?.error || 'No se pudo agregar el alias'));
      })
    );
  }

  // Actualizar alias
  updateAlias(terminoId: number, aliasId: number, alias: string): Observable<AliasItem> {
    return this.http.put<{ success: boolean; alias: AliasItem }>(
      `${this.nodeBaseUrl}/terminos/${terminoId}/alias/${aliasId}`,
      { alias },
      { withCredentials: true }
    ).pipe(
      map(res => res.alias),
      catchError(err => {
        console.error(`Error al actualizar alias ${aliasId}:`, err);
        return throwError(() => new Error(err.error?.error || 'No se pudo actualizar el alias'));
      })
    );
  }

  // Eliminar alias
  deleteAlias(terminoId: number, aliasId: number): Observable<void> {
    return this.http.delete<{ success: boolean }>(
      `${this.nodeBaseUrl}/terminos/${terminoId}/alias/${aliasId}`,
      { withCredentials: true }
    ).pipe(
      map(() => void 0),
      catchError(err => {
        console.error(`Error al eliminar alias ${aliasId}:`, err);
        return throwError(() => new Error(err.error?.error || 'No se pudo eliminar el alias'));
      })
    );
  }

  getEntidades(): Observable<Entidad[]> {
  return this.http.get<Entidad[]>(
    `${this.nodeBaseUrl}/entidades`,
    { withCredentials: true }
  ).pipe(
    catchError(err => {
      console.error('Error al obtener entidades:', err);
      return throwError(() => new Error('No se pudieron cargar las entidades'));
    })
  );
}

}