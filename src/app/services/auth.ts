import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ManagerState } from './manager-state';
import { Router } from '@angular/router';
import { User } from '../models/transfer.model';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/login.php`;
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  private managerState = inject(ManagerState);
  private router = inject(Router);

  /**
   * MÉTODO CENTRALIZADOR: Procesa la identidad que viene en cualquier JSON del backend.
   * Invocado por el Interceptor y por el método login().
   */
  handleIdentityResponse(response: any): void {
    if (!isPlatformBrowser(this.platformId) || !response?.identidad) return;

    const { token, tipo, nombre } = response.identidad;

    // 1. Gestión de Cookie (30 días de duración)
    if (token) {
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
      this.document.cookie = `auth_token=${token}; Path=/; Max-Age=${thirtyDaysInSeconds}; SameSite=Lax`;
    }

    // 2. Gestión de Estado Global (Sincronización con Signals)
    if (tipo === 'usuario' && response.datos_usuario) {
      const userData: User = {
        realname: response.datos_usuario.username || nombre,
        defaultlocation: response.datos_usuario.defaultlocation,
        fullaccess: Number(response.datos_usuario.fullaccess || 0)
      };
      this.managerState.setUserData(userData);
    } else {
      // Si es visitante o visitante_nuevo, el usuario logueado debe ser null
      this.managerState.setUserData(null);
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, credentials).pipe(
      tap(response => {
        this.handleIdentityResponse(response);
        if (response.identidad?.tipo === 'usuario') {
          console.log('✅ Login exitoso:', response.identidad.nombre);
        }
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      // 1. Limpiar rastro de identidad previa
      this.document.cookie = `auth_token=; Path=/; Max-Age=0`;
      localStorage.removeItem('user_data');

      // 2. Resetear estado (Signals reaccionarán de inmediato)
      this.managerState.setUserData(null);

      // 3. Al navegar a /home, el interceptor capturará la nueva identidad de visitante
      this.router.navigate(['/home']);
    }
  }

  isLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return !!this.getCookie('auth_token');
  }

  private getCookie(name: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const match = this.document.cookie.match(new RegExp(`(?:^|;)\\s*${name}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : null;
  }
}